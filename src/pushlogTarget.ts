import { Snowflake } from "discord.js";
import axios from "axios";
import { AirtableBase } from "airtable/lib/airtable_base";
import { DateTime, Duration } from "luxon";
import { Logger } from "./util/logger";

export type PushlogResponse = "SUCCESS" | "FAILURE"

export type AttendanceDetail = {
    discordUserId: Snowflake,
    attendanceDuration: Duration
}

export type PushlogData = {
    topicId: string,
    sessionDateTime: DateTime,
    sessionDuration: Duration,
    recorderName: string,
    mentorDiscordUserIds: Array<Snowflake>
    attendees: Array<AttendanceDetail>
}

export interface PushlogTarget {
    push(logData: PushlogData): Promise<PushlogResponse>;
}

export class PushlogHttp implements PushlogTarget {

    private readonly endpoint: string;

    constructor(endpoint: string) {
        this.endpoint = endpoint;
    }

    public async push(logData: PushlogData): Promise<PushlogResponse> {
        const payload = JSON.stringify({
            ...logData,
            sessionDateTime: logData.sessionDateTime.toUTC().toISO(),
            sessionDuration: logData.sessionDuration.toISO(),
            attendees: logData.attendees.map((attendee) => ({
                ...attendee,
                attendanceDuration: attendee.attendanceDuration.toISO()
            }))
        });
        try {
            const response = await axios.post(this.endpoint, payload);
            return response.status === 200 ? "SUCCESS" : "FAILURE";
        } catch (error) {
            return "FAILURE";
        }
    }

}

export type AirtableRoutes = {
    topicsTableId: string;
    sessionsTableId: string;
    attendanceTableId: string;
    membersTableId: string;
}

export class PushlogAirtable implements PushlogTarget {
    private readonly createBatchSize: number = 10;
    private readonly base: AirtableBase;
    private readonly topicsTableId: string;
    private readonly sessionsTableId: string;
    private readonly attendanceTableId: string;
    private readonly membersTableId: string;
    private readonly logger: Logger;

    constructor(base: AirtableBase, config: AirtableRoutes, logger: Logger) {
        this.base = base;
        this.topicsTableId = config.topicsTableId;
        this.sessionsTableId = config.sessionsTableId;
        this.attendanceTableId = config.attendanceTableId;
        this.membersTableId = config.membersTableId;
        this.logger = logger;
    }

    public async push(logData: PushlogData): Promise<PushlogResponse> {
        try {
            const topicRecordResult = await this.base(this.topicsTableId).select({
                filterByFormula: `{Topic ID} = '${logData.topicId}'`,
                maxRecords: 1,
            }).all();

            if (topicRecordResult.length != 1) {
                this.logger.fatal(`TOPIC ID: ${logData.topicId} not found.`);
                return "FAILURE";
            }

            const topicRecordId = topicRecordResult[0].id;

            this.logger.info(`Retrieved Topic: ${logData.topicId}`)

            const sessionRecordResult = await this.base(this.sessionsTableId).create([
                {
                    "fields": {
                        "Topic ID": [topicRecordId],
                        "Session Date": logData.sessionDateTime.toISO(),
                        "Session Duration": Math.max(Math.trunc(logData.sessionDuration.as('seconds')), 60),
                        "Recorder (Name String)": logData.recorderName,
                        "Mentor (Discord UID)": logData.mentorDiscordUserIds.length != 0 
                            ? logData.mentorDiscordUserIds.reduce((prev, next) => `${prev}, ${next}`) 
                            : ""
                    }
                }
            ]);

            if (sessionRecordResult.length != 1) {
                this.logger.fatal(`Couldn't create the session! Cancelling push.`);
                return "FAILURE";
            }

            const sessionRecordId = sessionRecordResult[0].id;

            this.logger.info(`Created session record in airtable base with ID: ${sessionRecordId}`);

            for (let i = 0; i < logData.attendees.length; i += this.createBatchSize) {

                const batch = logData.attendees.slice(i, i + this.createBatchSize);

                this.logger.info(`Processing attendance: Batch ${i / this.createBatchSize + 1} (${batch.length})`);

                const memberRecordsResults = await Promise.allSettled(batch.map(async (attendance: AttendanceDetail): Promise<[AttendanceDetail, string]> => {
                    const memberResult = await this.base(this.membersTableId).select({
                        filterByFormula: `{Discord UID} = ${attendance.discordUserId}`,
                        maxRecords: 1
                    }).all();
                    if (memberResult.length != 1) throw new Error(`Discord ID ${attendance.discordUserId} not found in members`);
                    this.logger.info(`Retrieved member: ${memberResult[0].get('Name')} ${memberResult[0].get('NIM')}`)
                    return [attendance, memberResult[0].id];
                }));

                const payloadArr = []
                for (const finishedResult of memberRecordsResults) {
                    if (finishedResult.status == "rejected") {
                        this.logger.error(`Could not retrieve member: ${finishedResult.reason}. Continuing.`);
                        continue;
                    }
                    const [attendance, memberRecordId] = finishedResult.value;
                    payloadArr.push({
                        "fields": {
                            "Session ID": [sessionRecordId],
                            "Student ID": [memberRecordId],
                            "Attend Duration": Math.max(Math.trunc(attendance.attendanceDuration.as('seconds')), 60)  
                        }
                    });
                }

                await this.base(this.attendanceTableId).create(payloadArr);
                if (batch.length - payloadArr.length == 0)
                    this.logger.info(`Completed batch successfully`);
                else {
                    this.logger.warn(`Completed batch insertion with ${batch.length - payloadArr.length} failed entries.`)
                }
            }
            this.logger.info("Push finished");
            return "SUCCESS";
        } catch (error) {
            this.logger.fatal("A fatal error occurred");
            console.log(error);
            return "FAILURE";
        }
    }
}
