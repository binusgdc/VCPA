import axios from "axios";
import { PushlogData, PushlogResponse, PushlogTarget } from "./pushlogTarget";

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
