import { Snowflake } from "discord.js"
import { DateTime, Duration } from "luxon"
import { NonEmptyArray } from "../util/array"

export type PushlogResponse = "SUCCESS" | "FAILURE"

export type AttendanceDetail = {
    discordUserId: Snowflake
    attendanceDuration: Duration
}

export type PushlogData = {
    classId: string
    topicId: string
    sessionDateTime: DateTime
    sessionDuration: Duration
    recorderName: string
    mentorDiscordUserIds: NonEmptyArray<Snowflake>
    attendees: Array<AttendanceDetail>
}

export interface PushlogTarget {
    push(logData: PushlogData): Promise<PushlogResponse>
}
