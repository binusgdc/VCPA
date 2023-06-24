import { Snowflake } from "discord.js";
import { DateTime } from "luxon";

import { OngoingSession, SessionEvent } from "../session/session";

type SessionDetails = {
	ownerId: Snowflake;
	guildId: Snowflake;
	channelId: Snowflake;
	timeStarted: DateTime;
	events: SessionEvent[];
};

export interface OngoingSessionStore {
	has(guildId: Snowflake, channelId: Snowflake): Promise<boolean>;
	get(guildId: Snowflake, channelId: Snowflake): Promise<OngoingSession | undefined>;
	put(details: SessionDetails): Promise<OngoingSession>;
	delete(guildId: Snowflake, channelId: Snowflake): Promise<OngoingSession | undefined>;
}

export class InMemoryOngoingSessionStore implements OngoingSessionStore {
	private map: Map<string, OngoingSession> = new Map();

	public has(guildId: string, channelId: string): Promise<boolean> {
		return Promise.resolve(this.map.has(this.composeKey(guildId, channelId)));
	}
	public get(guildId: string, channelId: string): Promise<OngoingSession | undefined> {
		return Promise.resolve(this.map.get(this.composeKey(guildId, channelId)));
	}
	public put({ ownerId, guildId, channelId, timeStarted, events }: SessionDetails): Promise<OngoingSession> {
		const newSession: OngoingSession = {
			ownerId: ownerId,
			guildId: guildId,
			channelId: channelId,
			timeStarted: timeStarted,
			events: events,
		};
		this.map.set(this.composeKey(newSession.guildId, newSession.channelId), newSession);
		return Promise.resolve(newSession);
	}
	public delete(guildId: string, channelId: string): Promise<OngoingSession | undefined> {
		const existingSession = this.map.get(this.composeKey(guildId, channelId));
		if (existingSession === undefined) {
			return Promise.resolve(undefined);
		}
		this.map.delete(this.composeKey(guildId, channelId));
		return Promise.resolve(existingSession);
	}
	private composeKey(guildId: string, channelId: string): string {
		return `${guildId}-${channelId}`;
	}
}
