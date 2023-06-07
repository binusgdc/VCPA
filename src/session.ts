import { Snowflake } from "discord.js";
import { DateTime } from "luxon";

export type SessionLogId = Snowflake
export type SessionEvent = JoinedChannelEvent | LeftChannelEvent

export interface JoinedChannelEvent {
	type: "Join";
	userId: Snowflake;
	timeOccurred: DateTime;
}

export interface LeftChannelEvent {
	type: "Leave";
	userId: Snowflake;
	timeOccurred: DateTime;
}

export interface OngoingSession {
	ownerId: Snowflake;
	guildId: Snowflake;
	channelId: Snowflake;
	timeStarted: DateTime;
	events: SessionEvent[];
}

export interface CompletedSession extends OngoingSession {
	timeEnded: DateTime;
}

export interface SessionLog extends CompletedSession {
	id: SessionLogId;
	timeStored: DateTime;
	timePushed: DateTime | undefined;
}