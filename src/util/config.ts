import { Snowflake } from "discord.js";

import { Env } from "./env";
import { Result } from "./result";

export type ServiceLocation = {
	guildId: Snowflake;
	ioChannelId: Snowflake;
	commandAccessRoleIds: Snowflake[];
};

export type PushlogTargetConfig = PushLogTargetHttpJson | PushLogTargetAirtable;

type PushLogTargetHttpJson = {
	type: "http-json";
	endpoint: string;
};

type PushLogTargetAirtable = {
	type: "airtable";
	baseId: string;
	topicsTableId: string;
	sessionsTableId: string;
	attendanceTableId: string;
	membersTableId: string;
};

export type LoggerConfig = LoggerDiscordChannel | LoggerConsole;

type LoggerDiscordChannel = {
	type: "discordChannel";
	channelId: string;
};

type LoggerConsole = {
	type: "console";
};

export type SessionLogStoreConfig = SessionLogStoreSqlite | SessionLogStoreInMemory;

type SessionLogStoreSqlite = {
	type: "sqlite";
};

type SessionLogStoreInMemory = {
	type: "memory";
};

export type VcpaConfig = {
	servicedGuildIds: Snowflake[];
	sessionLogStore: SessionLogStoreConfig;
	pushLogTarget: PushlogTargetConfig;
	loggers: LoggerConfig[];
};

export function loadAndParseConfig(env: Env): Result<VcpaConfig, Error> {
	const parsePushlogTargetConfig = parsePushlogTarget(env);
	if (!parsePushlogTargetConfig.ok) {
		return { ok: false, error: parsePushlogTargetConfig.error };
	}
	const pushlogTargetConfig = parsePushlogTargetConfig.value;

	const loggerConfigs: LoggerConfig[] = [];
	if (env.CONSOLE_LOGGING === "true") {
		loggerConfigs.push({ type: "console" });
	}
	if (env.DISCORD_LOGS_CHANNEL_ID_OVERRIDE) {
		loggerConfigs.push({ type: "discordChannel", channelId: env.DISCORD_LOGS_CHANNEL_ID_OVERRIDE });
	}

	const parseSessionLogStoreConfig = parseSessionLogStore(env);
	if (!parseSessionLogStoreConfig.ok) {
		return { ok: false, error: parseSessionLogStoreConfig.error };
	}
	const sessionLogStoreConfig = parseSessionLogStoreConfig.value;

	return {
		ok: true,
		value: {
			servicedGuildIds: [env.GUILD_ID_OVERRIDE],
			sessionLogStore: sessionLogStoreConfig,
			pushLogTarget: pushlogTargetConfig,
			loggers: loggerConfigs,
		},
	};
}

function parsePushlogTarget(env: Env): Result<PushlogTargetConfig, Error> {
	switch (env.PUSHLOG_TARGET) {
		case "http":
			if (!env.PUSHLOG_ENDPOINT) {
				return { ok: false, error: new Error("PUSHLOG_ENDPOINT is not set") };
			}
			return {
				ok: true,
				value: {
					type: "http-json",
					endpoint: env.PUSHLOG_ENDPOINT,
				},
			};
		case "airtable":
			if (
				!env.AIRTABLE_BASE_ID ||
				!env.AIRTABLE_TOPICS_TABLE_ID ||
				!env.AIRTABLE_SESSIONS_TABLE_ID ||
				!env.AIRTABLE_ATTENDANCE_TABLE_ID ||
				!env.AIRTABLE_MEMBERS_TABLE_ID
			) {
				return {
					ok: false,
					error: new Error(
						"Airtable base details missing: AIRTABLE_BASE_ID, AIRTABLE_TOPICS_TABLE_ID, AIRTABLE_SESSIONS_TABLE_ID, AIRTABLE_ATTENDANCE_TABLE_ID, or AIRTABLE_MEMBERS_TABLE_ID is not set"
					),
				};
			}
			return {
				ok: true,
				value: {
					type: "airtable",
					baseId: env.AIRTABLE_BASE_ID,
					topicsTableId: env.AIRTABLE_TOPICS_TABLE_ID,
					sessionsTableId: env.AIRTABLE_SESSIONS_TABLE_ID,
					attendanceTableId: env.AIRTABLE_ATTENDANCE_TABLE_ID,
					membersTableId: env.AIRTABLE_MEMBERS_TABLE_ID,
				},
			};
	}
}

function parseSessionLogStore(env: Env): Result<SessionLogStoreConfig, Error> {
	switch (env.SESSION_LOGS_DATA) {
		case "memory":
			return { ok: true, value: { type: "memory" } };
		case "sqlite":
			return { ok: true, value: { type: "sqlite" } };
	}
}