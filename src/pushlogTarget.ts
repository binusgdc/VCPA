import { Snowflake } from "discord.js";
import axios from "axios";
import { AirtableBase } from "airtable/lib/airtable_base";
import { DateTime, Duration } from "luxon";

export type PushlogResponse = "SUCCESS" | "FAILURE"

export type AttendanceDetail = {
    discordUserId: Snowflake,
    attendanceDurationISO: string
}

export type PushlogData = {
    topicId: string,
    sessionDateTimeISO: string,
    durationISO: string,
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
        const payload = JSON.stringify(logData);
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
    private readonly createChunkSize: number = 10;
    private readonly base: AirtableBase;
    private readonly topicsTableId: string;
    private readonly sessionsTableId: string;
    private readonly attendanceTableId: string;
    private readonly membersTableId: string;

    constructor(base: AirtableBase, config: AirtableRoutes) {
        this.base = base;
        this.topicsTableId = config.topicsTableId;
        this.sessionsTableId = config.sessionsTableId;
        this.attendanceTableId = config.attendanceTableId;
        this.membersTableId = config.membersTableId;
    }

    public async push(logData: PushlogData): Promise<PushlogResponse> {
        try {
            const topicRecordResult = await this.base(this.topicsTableId).select({
                filterByFormula: `{Topic ID} = '${logData.topicId}'`,
                maxRecords: 1,
            }).all();

            if (topicRecordResult.length != 1) {
                return "FAILURE";
            }

            const topicRecordId = topicRecordResult[0].id;

            const sessionRecordResult = await this.base(this.sessionsTableId).create([
                {
                    "fields": {
                        "Topic ID": [topicRecordId],
                        "Session Date": logData.sessionDateTimeISO,
                        "Session Duration": Duration.fromISO(logData.durationISO).as('seconds')
                    }
                }
            ]);

            if (sessionRecordResult.length != 1) {
                return "FAILURE";
            }

            const sessionRecordId = sessionRecordResult[0].id;

            for (let i = 0; i < logData.attendees.length; i += this.createChunkSize) {
                const chunk = logData.attendees.slice(i, i + this.createChunkSize)
                const memberRecordsResults = (await Promise.allSettled(chunk.map(async (attendance: AttendanceDetail): Promise<[AttendanceDetail, string]> => {
                    const memberResult = await this.base(this.membersTableId).select({
                        filterByFormula: `{Discord UID} = ${attendance.discordUserId}`,
                        maxRecords: 1
                    }).all();
                    if (memberResult.length != 1) throw new Error(`Discord ID ${attendance.discordUserId} not found in members`);
                    return [attendance, memberResult[0].id];
                })))

                const payloadArr = []
                for (const finishedResult of memberRecordsResults) {
                    if (finishedResult.status == "rejected") continue;
                    const [attendance, memberRecordId] = finishedResult.value;
                    payloadArr.push({
                        "fields": {
                            "Session ID": [sessionRecordId],
                            "Student (Discord UID)": [memberRecordId],
                            "Attend Duration": Duration.fromISO(attendance.attendanceDurationISO).as('seconds')
                        }
                    });
                }

                await this.base(this.attendanceTableId).create(payloadArr)
            }
            return "SUCCESS";
        } catch (error) {
            return "FAILURE";
        }
    }
}
