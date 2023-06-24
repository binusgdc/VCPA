import { Snowflake } from "discord.js";
import * as fs from "fs";

import {
	CompletedSession,
	OngoingSession,
	SessionEvent,
	SessionLog,
	VoiceChannel,
	generateSessionOutput,
} from "./session";
import { OngoingSessionStore } from "../ongoingSessionStore/ongoingSessionStore";
import { SessionLogStore } from "../sessionLogStore/sessionLogStore";
import { DateTimeProvider, formatDate } from "../util/date";
import { Result, error, ok } from "../util/result";

export type StartSessionError = "SessionOngoing";
export type StopSessionError = SessionNotFound | LogNotStored;

type SessionNotFound = {
	type: "SessionNotFound";
};

type LogNotStored = {
	type: "LogNotStored";
	sessionOutput: {
		sessionData: CompletedSession;
		fileOutputPaths: string[];
	};
};

type StopSessionOutput = {
	sessionLog: SessionLog;
	fileOutputPaths: string[];
};

export class SessionService {
	public constructor(
		private readonly ongoingSessionStore: OngoingSessionStore,
		private readonly sessionLogStore: SessionLogStore,
		private readonly dateTimeProvider: DateTimeProvider
	) {}
	public async handleJoinedChannel(userId: Snowflake, guildId: Snowflake, channelId: Snowflake) {
		const sessionAtChannel = await this.ongoingSessionStore.get(guildId, channelId);
		if (sessionAtChannel === undefined) return;
		sessionAtChannel.events.push({
			type: "Join",
			userId: userId,
			timeOccurred: this.dateTimeProvider.now(),
		});
	}
	public async handleLeftChannel(userId: Snowflake, guildId: Snowflake, channelId: Snowflake) {
		const sessionAtChannel = await this.ongoingSessionStore.get(guildId, channelId);
		if (sessionAtChannel === undefined) return;
		sessionAtChannel.events.push({
			type: "Leave",
			userId: userId,
			timeOccurred: this.dateTimeProvider.now(),
		});
	}
	public async startSession(
		ownerId: Snowflake,
		channel: VoiceChannel
	): Promise<Result<OngoingSession, StartSessionError>> {
		if (await this.ongoingSessionStore.has(channel.guildId, channel.id)) {
			return error("SessionOngoing");
		}
		const timeStarted = this.dateTimeProvider.now();
		const startJoinEvents = channel.memberUserIds.map<SessionEvent>((userId) => {
			return {
				type: "Join",
				userId: userId,
				timeOccurred: timeStarted,
			};
		});
		const createdSession = await this.ongoingSessionStore.put({
			ownerId: ownerId,
			guildId: channel.guildId,
			channelId: channel.id,
			timeStarted: timeStarted,
			events: startJoinEvents,
		});
		return ok(createdSession);
	}
	public async stopSession(channel: VoiceChannel): Promise<Result<StopSessionOutput, StopSessionError>> {
		const session = await this.ongoingSessionStore.get(channel.guildId, channel.id);
		if (session === undefined) {
			return error({ type: "SessionNotFound" });
		}
		const timeEnded = this.dateTimeProvider.now();
		const remainingLeaveEvents = channel.memberUserIds.map<SessionEvent>((userId) => {
			return {
				type: "Leave",
				userId: userId,
				timeOccurred: timeEnded,
			};
		});
		session.events.push(...remainingLeaveEvents);
		const completedSession: CompletedSession = {
			...session,
			timeEnded: timeEnded,
		};

		const { sesinfo, attdet, procdet } = generateSessionOutput(completedSession);
		const fileBaseName = formatDate(completedSession.timeEnded, "STD");
		const sesinfoFilePath = `./run/${fileBaseName}-sesinfo.csv`;
		const attdetFilePath = `./run/${fileBaseName}-attdet.csv`;
		const procdetFilePath = `./run/${fileBaseName}-procdet.csv`;
		const fileOutputPaths = [sesinfoFilePath, attdetFilePath, procdetFilePath];
		fs.writeFileSync(sesinfoFilePath, sesinfo);
		fs.writeFileSync(attdetFilePath, attdet);
		fs.writeFileSync(procdetFilePath, procdet);

		await this.ongoingSessionStore.delete(channel.guildId, channel.id);
		const sessionLogId = await this.sessionLogStore.store(completedSession);
		if (sessionLogId !== undefined) {
			const storedLog = await this.sessionLogStore.retrieve(sessionLogId);
			if (storedLog !== undefined) {
				return ok({
					sessionLog: storedLog,
					fileOutputPaths: fileOutputPaths,
				});
			}
		}
		return error({
			type: "LogNotStored",
			sessionOutput: {
				sessionData: completedSession,
				fileOutputPaths: fileOutputPaths,
			},
		});
	}
}
