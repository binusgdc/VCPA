import { Snowflake } from "discord.js";

export type ServiceLocation = {
	guildId: Snowflake;
	ioChannelId: Snowflake;
	commandAccessRoleIds: Snowflake[];
};

export type PushLogTargetConfig = PushLogTargetHttpJson | PushLogTargetAirtable;

export interface PushLogTargetHttpJson {
	type: "http-json";
	endpoint: string;
}

export interface PushLogTargetAirtable {
	type: "airtable";
	baseId: string;
	topicsTableId: string;
	sessionsTableId: string;
	attendanceTableId: string;
	membersTableId: string;
}

export interface LoggerDiscordChannel {
	type: "discordChannel";
	channelId: string;
}

export interface LoggerConsole {
	type: "console";
}

export type LoggerConfig = LoggerDiscordChannel | LoggerConsole;

export type BGDCData = {
	pushLogTarget: PushLogTargetConfig;
};

export type ConfigFile = {
	discordBotToken: string | undefined;
	airtableApiKey: string | undefined;
	serviceLocationWhiteList: ServiceLocation[];
	pushLogTarget: PushLogTargetConfig;
	loggers: LoggerConfig[];
};