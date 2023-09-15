import { z } from "zod"

const schema = z.object({
    // Required
    DISCORD_BOT_TOKEN: z.string(),

    // Session Logs
    SESSION_LOGS_DATA: z.enum(["memory"]).default("memory"),

    // Pushlog Target
    PUSHLOG_TARGET: z.enum(["http", "airtable"]).default("airtable"),
    PUSHLOG_ENDPOINT: z.string().or(z.undefined()),
    AIRTABLE_API_KEY: z.string().or(z.undefined()),
    AIRTABLE_BASE_ID: z.string().or(z.undefined()),
    AIRTABLE_CLASSES_TABLE_ID: z.string().or(z.undefined()),
    AIRTABLE_TOPICS_TABLE_ID: z.string().or(z.undefined()),
    AIRTABLE_SESSIONS_TABLE_ID: z.string().or(z.undefined()),
    AIRTABLE_ATTENDANCE_TABLE_ID: z.string().or(z.undefined()),
    AIRTABLE_MENTORS_TABLE_ID: z.string().or(z.undefined()),
    AIRTABLE_STUDENTS_TABLE_ID: z.string().or(z.undefined()),

    // Overrides
    GUILD_ID_OVERRIDE: z.string(), // required until we have a db plan for complex configs
    CONSOLE_LOGGING: z.enum(["true", "false"]).default("true"),
    CONSOLE_LOGGING_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("debug"),
    DISCORD_LOGS_CHANNEL_ID_OVERRIDE: z.string().or(z.undefined()),
})

export type Env = z.infer<typeof schema>

export function loadEnv(): z.SafeParseReturnType<z.input<typeof schema>, Env> {
    return schema.safeParse({
        ...process.env,
    })
}
