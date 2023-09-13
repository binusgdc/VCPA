import { AirtableBase } from "airtable/lib/airtable_base"
import { z } from "zod"
import { DateTime, Duration } from "luxon"

import { AttendanceDetail, PushlogData, PushlogResponse, PushlogTarget } from "./pushlogTarget"
import { Logger } from "../util/loggers/logger"
import { Result, error, ok } from "../util/result"
import { NonEmptyArray } from "../util/array"

export type AirtableRoutes = {
    classesTableId: string
    topicsTableId: string
    sessionsTableId: string
    attendanceTableId: string
    mentorsTableId: string
    studentsTableId: string
}

type Student = {
    recordId: string
    discordUid: string
    name: string
    nim: string
}

type StudentAttendanceDetail = AttendanceDetail & Student

type Mentor = {
    recordId: string
    discordUid: string
    name: string
    nim: string
}

export class PushlogAirtable implements PushlogTarget {
    private readonly createBatchSize: number = 10
    private readonly base: AirtableBase
    private readonly classesTableId: string
    private readonly topicsTableId: string
    private readonly sessionsTableId: string
    private readonly attendanceTableId: string
    private readonly mentorsTableId: string
    private readonly studentsTableId: string
    private readonly logger: Logger

    public constructor(base: AirtableBase, config: AirtableRoutes, logger: Logger) {
        this.base = base
        this.classesTableId = config.classesTableId
        this.topicsTableId = config.topicsTableId
        this.sessionsTableId = config.sessionsTableId
        this.attendanceTableId = config.attendanceTableId
        this.mentorsTableId = config.mentorsTableId
        this.studentsTableId = config.studentsTableId
        this.logger = logger
    }

    public async push({
        classId,
        topicId,
        sessionDateTime,
        sessionDuration,
        recorderName,
        mentorDiscordUserIds,
        attendees,
    }: PushlogData): Promise<PushlogResponse> {
        try {
            void this.logger.debug(`Retrieving class: ${classId} from base ...`)
            const fetchClassRecordIdResult = await this.fetchClassRecordIdByClassId(classId)
            if (!fetchClassRecordIdResult.ok) {
                void this.logger.fatal(`Unable to retrieve class: ${classId}. Aborting...`)
                return "FAILURE"
            }
            const classRecordId = fetchClassRecordIdResult.value
            void this.logger.info(`Retrieved class: ${classId}`)

            void this.logger.debug(`Retrieving topic: ${topicId} from base...`)
            const fetchTopicRecordIdResult = await this.fetchTopicRecordIdByTopicId(topicId)
            if (!fetchTopicRecordIdResult.ok) {
                void this.logger.fatal(`Unable to retrieve topic: ${topicId}. Aborting...`)
                return "FAILURE"
            }
            const topicRecordId = fetchTopicRecordIdResult.value

            void this.logger.info(`Retrieved Topic: ${topicId}`)
            void this.logger.debug(
                `Retrieving ${mentorDiscordUserIds.tail.length === 0 ? "mentor" : "mentors"}`
            )

            const fetchMentorsResult = await this.fetchMentorsByDiscordUid(mentorDiscordUserIds)
            if (!fetchMentorsResult.ok) {
                const errTxt = `Error in retrieving mentors: `
                switch (fetchMentorsResult.error) {
                    case "ParseError":
                        void this.logger.error(errTxt + "Could not parse mentor data")
                        break
                    default:
                        void this.logger.error(errTxt + "Unknown, probably a network error")
                        break
                }

                return "FAILURE"
            }
            const mentorsData = fetchMentorsResult.value

            const missingMentorDiscordUids = [
                mentorDiscordUserIds.head,
                ...mentorDiscordUserIds.tail,
            ].filter((e) => !mentorsData.has(e))
            if (missingMentorDiscordUids.length !== 0) {
                void this.logger.error(
                    `Unable to retrieve all mentors. Missing: ${missingMentorDiscordUids
                        .map((e) => `<@${e}>`)
                        .join(" | ")}`
                )
                return "FAILURE"
            }

            void this.logger.info(
                `Found mentors: ${[...mentorsData.values()]
                    .map((e) => `${e.nim} ${e.name}`)
                    .join(" | ")}`
            )

            const createSessionResult = await this.createSessionRecord({
                classRecordId,
                topicRecordId,
                sessionDateTime,
                sessionDuration,
                recorderName,
                mentorRecordIds: [...mentorsData.values()].map((e) => e.recordId),
            })
            if (!createSessionResult.ok) {
                void this.logger.fatal(`Couldn't create the session! Aborting...`)
                return "FAILURE"
            }
            const sessionRecordId = createSessionResult.value

            void this.logger.info(
                `Created session record in airtable base with ID: ${sessionRecordId}`
            )

            void this.logger.debug(
                `Starting attendance record processing. Batch size: ${
                    this.createBatchSize
                }. Batches: ${Math.ceil(attendees.length / this.createBatchSize)}`
            )

            for (let i = 0; i < attendees.length; i += this.createBatchSize) {
                const batch = attendees.slice(i, i + this.createBatchSize)

                void this.logger.info(
                    `Processing attendance: Batch ${i / this.createBatchSize + 1} (${batch.length})`
                )

                const fetchStudentBatchResult = await this.fetchStudentsByDiscordId({
                    head: batch[0].discordUserId,
                    tail: batch.slice(1).map((e) => e.discordUserId),
                })
                if (!fetchStudentBatchResult.ok) {
                    const errTxt = `Error in retrieving mentors: `
                    switch (fetchStudentBatchResult.error) {
                        case "ParseError":
                            void this.logger.error(errTxt + "Could not parse student data")
                            break
                        default:
                            void this.logger.error(errTxt + "Unknown, probably a network error")
                            break
                    }

                    return "FAILURE"
                }
                const studentsData = fetchStudentBatchResult.value

                const mergeStudentDataResult = batch.map<StudentAttendanceDetail | string>((e) => {
                    const retrieved = studentsData.get(e.discordUserId)
                    if (retrieved === undefined) {
                        return e.discordUserId
                    }
                    return {
                        ...e,
                        ...retrieved,
                    }
                })
                const missingStudentDiscordUids = mergeStudentDataResult.filter(
                    (e) => typeof e === "string"
                ) as string[]
                const mergedStudentData = mergeStudentDataResult.filter(
                    (e) => typeof e !== "string"
                ) as StudentAttendanceDetail[]

                if (missingStudentDiscordUids.length !== 0) {
                    void this.logger.warn(
                        `Unable to retrieve all students. Missing: ${missingStudentDiscordUids
                            .map((e) => `<@${e}>`)
                            .join(" | ")}`
                    )
                }

                if (mergedStudentData.length === 0) {
                    void this.logger.warn(
                        `No students found for this batch. Moving on to next batch...`
                    )
                    continue
                }

                const createAttendancesResult = await this.createAttendanceRecords(
                    sessionRecordId,
                    mergedStudentData
                )
                if (!createAttendancesResult.ok) {
                    void this.logger.fatal(`Unable to create attendance records. Aborting...`)
                    return "FAILURE"
                }

                if (missingStudentDiscordUids.length === 0)
                    void this.logger.info(`Completed batch successfully`)
                else {
                    void this.logger.warn(
                        `Completed batch insertion with ${missingStudentDiscordUids.length} missing entries.`
                    )
                }
            }
            void this.logger.info("Push finished")
            return "SUCCESS"
        } catch (error) {
            void this.logger.fatal(
                `A fatal error occurred: ${
                    error instanceof Error ? error.message : "UNKNOWN ERROR"
                }`
            )
            return "FAILURE"
        }
    }

    private async fetchClassRecordIdByClassId(classId: string): Promise<Result<string>> {
        try {
            const classRecordResult = await this.base(this.classesTableId)
                .select({
                    filterByFormula: `{ID} = ${classId}`,
                    maxRecords: 1,
                })
                .all()

            const classRecordId = z.string().parse(classRecordResult[0]?.id)

            return ok(classRecordId)
        } catch (_e) {
            return error(undefined)
        }
    }

    private async fetchTopicRecordIdByTopicId(topicId: string): Promise<Result<string>> {
        try {
            const topicRecordResult = await this.base(this.topicsTableId)
                .select({
                    filterByFormula: `{TopicID} = '${topicId}'`,
                    maxRecords: 1,
                })
                .all()

            const topicRecordId = z.string().parse(topicRecordResult[0]?.id)

            return ok(topicRecordId)
        } catch (_e) {
            return error(undefined)
        }
    }

    private async fetchMentorsByDiscordUid(
        mentorDiscordUserIds: NonEmptyArray<string>
    ): Promise<Result<Map<string, Mentor>, "ParseError" | "UnknownError">> {
        try {
            const selectMentorsComposedFormula = `OR(${[
                mentorDiscordUserIds.head,
                ...mentorDiscordUserIds.tail,
            ]
                .map((id) => `{DiscordUID} = ${id}`)
                .reduce((accum, next) => `${accum}, ${next}`)})`
            const mentorRecords = await this.base(this.mentorsTableId)
                .select({
                    filterByFormula: selectMentorsComposedFormula,
                })
                .all()

            const mentorDataParseResult = z
                .array(
                    z.object({
                        recordId: z.string().nonempty(),
                        discordUid: z.string().nonempty(),
                        name: z.string().nonempty(),
                        nim: z.string().nonempty(),
                    })
                )
                .safeParse([
                    ...mentorRecords.map((e) => ({
                        recordId: e.id,
                        discordUid: e.get("DiscordUID")?.toString(),
                        name: e.get("Name")?.toString(),
                        nim: e.get("NIM")?.toString(),
                    })),
                ])
            if (!mentorDataParseResult.success) {
                return error("ParseError")
            }
            const mentorsData = mentorDataParseResult.data

            const result = new Map<string, Mentor>()
            for (const entry of mentorsData) {
                result.set(entry.discordUid, entry)
            }
            return ok(result)
        } catch (_e) {
            return error("UnknownError")
        }
    }

    private async fetchStudentsByDiscordId(
        studentDiscordUserIds: NonEmptyArray<string>
    ): Promise<Result<Map<string, Student>, "ParseError" | "UnknownError">> {
        try {
            const studentDiscordUidsAsArray = [
                studentDiscordUserIds.head,
                ...studentDiscordUserIds.tail,
            ]

            const getStudentsFormula = `OR(${studentDiscordUidsAsArray
                .map((id) => `{DiscordUID} = ${id}`)
                .reduce((accum, next) => `${accum}, ${next}`)})`
            const studentRecordsResult = await this.base(this.studentsTableId)
                .select({
                    filterByFormula: getStudentsFormula,
                })
                .all()

            const studentRecordsParseResult = z
                .array(
                    z.object({
                        recordId: z.string().nonempty(),
                        discordUid: z.string().nonempty(),
                        name: z.string().nonempty(),
                        nim: z.string().nonempty(),
                    })
                )
                .safeParse([
                    ...studentRecordsResult.map((e) => ({
                        recordId: e.id,
                        discordUid: e.get("DiscordUID")?.toString(),
                        name: e.get("Name")?.toString(),
                        nim: e.get("NIM")?.toString(),
                    })),
                ])
            if (!studentRecordsParseResult.success) {
                return error("ParseError")
            }
            const studentsData = studentRecordsParseResult.data

            const result = new Map<string, Student>()
            for (const entry of studentsData) {
                result.set(entry.discordUid, entry)
            }
            return ok(result)
        } catch (_e) {
            return error("UnknownError")
        }
    }

    private async createSessionRecord({
        classRecordId,
        topicRecordId,
        mentorRecordIds,
        sessionDateTime,
        sessionDuration,
        recorderName,
    }: {
        classRecordId: string
        topicRecordId: string
        mentorRecordIds: string[]
        sessionDateTime: DateTime
        sessionDuration: Duration
        recorderName: string
    }): Promise<Result<string>> {
        const payload = [
            {
                fields: {
                    ClassId: [classRecordId],
                    TopicID: [topicRecordId],
                    SessionAttendance: [],
                    SessionDate: sessionDateTime.toISO(),
                    SessionDuration: Math.max(Math.trunc(sessionDuration.as("seconds")), 60),
                    "Recorder (Name String)": recorderName,
                    "Mentor (Discord UID)": mentorRecordIds,
                },
            },
        ]

        const createSessionRecordResult = await this.base(this.sessionsTableId).create(payload)
        const createdSessionIdParseResult = z
            .string()
            .nonempty()
            .safeParse(createSessionRecordResult[0]?.id)
        if (!createdSessionIdParseResult.success) {
            void this.logger.fatal(`Couldn't create the session! Aborting...`)
            return error(undefined)
        }

        return ok(createdSessionIdParseResult.data)
    }

    private async createAttendanceRecords(
        sessionRecordId: string,
        attendances: StudentAttendanceDetail[]
    ): Promise<Result<undefined>> {
        try {
            const payload = attendances.map((e) => ({
                fields: {
                    SessionID: [sessionRecordId],
                    StudentID: [e.recordId],
                    AttendDuration: Math.max(Math.trunc(e.attendanceDuration.as("seconds")), 60),
                },
            }))

            void this.logger.debug(`Creating attendance records, payload: ${payload.toString()}`)

            await this.base(this.attendanceTableId).create(payload)
            return ok(undefined)
        } catch (_e) {
            return error(undefined)
        }
    }
}
