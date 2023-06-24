import { z } from "zod";

const schema = z.object({
	// Required
	DISCORD_BOT_TOKEN: z.string(),

	// Session Logs
	SESSION_LOGS_DATA: z.enum(["sqlite", "memory"]).default("memory"),

	// Pushlog Target
	PUSHLOG_TARGET: z.enum(["http", "airtable"]).default("airtable"),
	PUSHLOG_ENDPOINT: z.string().or(z.undefined()),
	AIRTABLE_API_KEY: z.string().or(z.undefined()),
	AIRTABLE_BASE_ID: z.string().or(z.undefined()),
	AIRTABLE_TOPICS_TABLE_ID: z.string().or(z.undefined()),
	AIRTABLE_SESSIONS_TABLE_ID: z.string().or(z.undefined()),
	AIRTABLE_ATTENDANCE_TABLE_ID: z.string().or(z.undefined()),
	AIRTABLE_MEMBERS_TABLE_ID: z.string().or(z.undefined()),

	// Overrides
	GUILD_ID_OVERRIDE: z.string(), // required until we have a db plan for complex configs
	CONSOLE_LOGGING: z.enum(["true", "false"]).default("true"),
	CONSOLE_LOGGING_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("debug"),
	DISCORD_LOGS_CHANNEL_ID_OVERRIDE: z.string().or(z.undefined()),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(): z.SafeParseReturnType<z.input<typeof schema>, Env> {
	return schema.safeParse({
		DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
		SESSION_LOGS_DATA: process.env.SESSION_LOGS_DATA,
		PUSHLOG_TARGET: process.env.PUSHLOG_TARGET,
		PUSHLOG_ENDPOINT: process.env.PUSHLOG_ENDPOINT,
		AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
		AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
		AIRTABLE_TOPICS_TABLE_ID: process.env.AIRTABLE_TOPICS_TABLE_ID,
		AIRTABLE_SESSIONS_TABLE_ID: process.env.AIRTABLE_SESSIONS_TABLE_ID,
		AIRTABLE_ATTENDANCE_TABLE_ID: process.env.AIRTABLE_ATTENDANCE_TABLE_ID,
		AIRTABLE_MEMBERS_TABLE_ID: process.env.AIRTABLE_MEMBERS_TABLE_ID,
		GUILD_ID_OVERRIDE: process.env.GUILD_ID_OVERRIDE,
		CONSOLE_LOGGING: process.env.CONSOLE_LOGGING,
		CONSOLE_LOGGING_LEVEL: process.env.CONSOLE_LOGGING_LEVEL,
		DISCORD_LOGS_CHANNEL_ID_OVERRIDE: process.env.DISCORD_LOGS_CHANNEL_ID_OVERRIDE,
	});
}
