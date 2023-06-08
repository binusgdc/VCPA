import { Channel, ChannelType, Snowflake } from "discord.js";
import { DateTime } from "luxon";
import { Result, error, ok } from "../util/result";

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

export type VoiceChannel = {
	id: Snowflake;
	guildId: Snowflake;
	memberUserIds: Snowflake[];
}

export type ParseVoiceChannelError = "ChannelNotVoice"

export function parseChannel(channel: Channel): Result<VoiceChannel, ParseVoiceChannelError> {
	if (channel.type !== ChannelType.GuildVoice) {
		return error("ChannelNotVoice")
	}
	return ok({
		id: channel.id,
		guildId: channel.guild.id,
		memberUserIds: channel.members.map((member) => member.id)
	})
}