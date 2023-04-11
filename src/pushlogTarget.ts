import { Snowflake } from "discord.js";
import axios from "axios";

export type PushlogResponse = "SUCCESS" | "FAILURE"

export type PushLogData = {
    topicId: string,
    sessionDateISO: string,
    sessionTimeISO: string,
    durationISO: string,
    recorderName: string,
    mentorDiscordUserIds: Array<Snowflake>
}

export interface PushlogTarget {
    push(logData: PushLogData): Promise<PushlogResponse>;
}

export class PushLogHttp implements PushlogTarget {

    private readonly endpoint: string;

    constructor(endpoint: string) {
        this.endpoint = endpoint;
    }

    public async push(logData: PushLogData): Promise<PushlogResponse> {
        const payload = JSON.stringify(logData);
        try {
            const response = await axios.post(this.endpoint, payload);
            return response.status === 200 ? "SUCCESS" : "FAILURE";    
        } catch (error) {
            return "FAILURE";
        }
    }

}
