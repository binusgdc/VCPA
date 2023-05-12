import { Snowflake } from "discord.js";
import axios from "axios";
import { AirtableBase } from "airtable/lib/airtable_base";
import { DateTime, Duration } from "luxon";

export type PushlogResponse = "SUCCESS" | "FAILURE"

export type PushlogData = {
    topicId: string,
    sessionDateTimeISO: string,
    durationISO: string,
    recorderName: string,
    mentorDiscordUserIds: Array<Snowflake>
    attendees: Array<{
        discordUserId: Snowflake,
        attendanceDurationISO: string
    }>
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

export class PushlogAirtable implements PushlogTarget {
    private readonly createChunkSize: number = 10; 
    private readonly base: AirtableBase;
    private readonly topicsTableId: string;
    private readonly sessionsTableId: string;
    private readonly attendanceTableId: string;

    constructor(base: AirtableBase, topicsTableId: string, sessionsTableId: string, attendanceTableId: string) {
        this.base = base;
        this.topicsTableId = topicsTableId;
        this.sessionsTableId = sessionsTableId;
        this.attendanceTableId = attendanceTableId;
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
                const query = logData.attendees.slice(i, i + this.createChunkSize).map((attendee) => ({
                    "fields": {
                        "Session ID": [sessionRecordId],
                        "Student (Discord UID)": attendee.discordUserId,
                        "Attend Duration": Duration.fromISO(attendee.attendanceDurationISO).as('seconds')  
                    }
                }));
                await this.base(this.attendanceTableId).create(query);
            }
    
            return "SUCCESS";
        } catch (error) {
            return "FAILURE";
        }
    }
}
