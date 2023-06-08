import { Snowflake } from "discord.js";
import { CompletedSession, OngoingSession, SessionEvent, VoiceChannel } from "./session";
import { DateTimeProvider, generateSessionOutput } from "../util";
import { Result, error, ok } from "../util/result";
import { OngoingSessionStore } from "../ongoingSessionStore/ongoingSessionStore";
import { SessionOutput } from "../structures";

export type StartSessionError = "SessionOngoing";
export type StopSessionError = "SessionNotFound" | "LogNotStored";

export class SessionService {
    private readonly ongoingSessionStore: OngoingSessionStore;
    private readonly dateTimeProvider: DateTimeProvider;

    constructor(ongoingSessionStore: OngoingSessionStore, dateTimeProvider: DateTimeProvider) {
        this.ongoingSessionStore = ongoingSessionStore;
        this.dateTimeProvider = dateTimeProvider;
    }
    async handleJoinedChannel(userId: Snowflake, guildId: Snowflake, channelId: Snowflake) {
        const sessionAtChannel = await this.ongoingSessionStore.get(guildId, channelId);
        if (sessionAtChannel === undefined) return;
        sessionAtChannel.events.push({
            type: "Join",
            userId: userId,
            timeOccurred: this.dateTimeProvider.now()
        });
    }
    async handleLeftChannel(userId: Snowflake, guildId: Snowflake, channelId: Snowflake) {
        const sessionAtChannel = await this.ongoingSessionStore.get(guildId, channelId);
        if (sessionAtChannel === undefined) return;
        sessionAtChannel.events.push({
            type: "Leave",
            userId: userId,
            timeOccurred: this.dateTimeProvider.now()
        });
    }
    async startSession(ownerId: Snowflake, channel: VoiceChannel): Promise<Result<OngoingSession, StartSessionError>> {
        if (await this.ongoingSessionStore.has(channel.guildId, channel.id)) {
            return error("SessionOngoing");
        }
        const timeStarted = this.dateTimeProvider.now();
        const startJoinEvents = channel.memberUserIds.map<SessionEvent>((userId) => ({
            type: "Join",
            userId: userId,
            timeOccurred: timeStarted
        }));
        const createdSession = await this.ongoingSessionStore.put({
            ownerId: ownerId,
            guildId: channel.guildId,
            channelId: channel.id,
            timeStarted: timeStarted,
            events: startJoinEvents
        });
        return ok(createdSession);
    }
    async stopSession(channel: VoiceChannel): Promise<Result<[CompletedSession, SessionOutput], StopSessionError>> {
        const session = await this.ongoingSessionStore.get(channel.guildId, channel.id);
        if (session === undefined) {
            return error("SessionNotFound");
        }
        const timeEnded = this.dateTimeProvider.now();
        const remainingLeaveEvents = channel.memberUserIds.map<SessionEvent>((userId) => ({
            type: "Leave",
            userId: userId,
            timeOccurred: timeEnded
        }));
        session.events.push(...remainingLeaveEvents);
        const completedSession: CompletedSession = {
            ...session,
            timeEnded: timeEnded
        };
        const sessionOutput = generateSessionOutput(completedSession);
        await this.ongoingSessionStore.delete(channel.guildId, channel.id);
        return ok([completedSession, sessionOutput]);
    }
}
