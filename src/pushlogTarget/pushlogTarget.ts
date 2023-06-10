import { Snowflake } from "discord.js";
import { DateTime, Duration } from "luxon";

export type PushlogResponse = "SUCCESS" | "FAILURE"

export type AttendanceDetail = {
    discordUserId: Snowflake;
    attendanceDuration: Duration;
}

export type PushlogData = {
    topicId: string;
    sessionDateTime: DateTime;
    sessionDuration: Duration;
    recorderName: string;
    mentorDiscordUserIds: Array<Snowflake>;
    attendees: Array<AttendanceDetail>;
}

export interface PushlogTarget {
    push(logData: PushlogData): Promise<PushlogResponse>;
}
