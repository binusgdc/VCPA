import { AirtableBase } from "airtable/lib/airtable_base";
import { Logger } from "../util/logger";
import { AttendanceDetail, PushlogData, PushlogResponse, PushlogTarget } from "./pushlogTarget";

export type AirtableRoutes = {
    topicsTableId: string;
    sessionsTableId: string;
    attendanceTableId: string;
    membersTableId: string;
}

type MemberDetailRecord = {
    recordId: string,
    name: string,
    nim: string
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

            this.logger.debug(`Retrieving topic: ${logData.topicId} from base...`)

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

            const sessionRecordPayload = [{
                "fields": {
                    "Topic ID": [topicRecordId],
                    "Session Date": logData.sessionDateTime.toISO(),
                    "Session Duration": Math.max(Math.trunc(logData.sessionDuration.as('seconds')), 60),
                    "Recorder (Name String)": logData.recorderName,
                    "Mentor (Discord UID)": logData.mentorDiscordUserIds.length != 0
                        ? logData.mentorDiscordUserIds.reduce((prev, next) => `${prev}, ${next}`)
                        : ""
                }
            }]

            this.logger.debug(`Creating session record in base, payload: ${sessionRecordPayload}`)

            const sessionRecordResult = await this.base(this.sessionsTableId).create(sessionRecordPayload);

            if (sessionRecordResult.length != 1) {
                this.logger.fatal(`Couldn't create the session! Cancelling push.`);
                return "FAILURE";
            }

            const sessionRecordId = sessionRecordResult[0].id;

            this.logger.info(`Created session record in airtable base with ID: ${sessionRecordId}`);

            this.logger.debug(`Starting attendance record processing. Batch size: ${this.createBatchSize}. Batches: ${Math.ceil(logData.attendees.length / this.createBatchSize)}`)

            for (let i = 0; i < logData.attendees.length; i += this.createBatchSize) {

                const batch = logData.attendees.slice(i, i + this.createBatchSize);

                this.logger.info(`Processing attendance: Batch ${i / this.createBatchSize + 1} (${batch.length})`);

                const memberRecordsResults = await Promise.allSettled(batch.map(async (attendance: AttendanceDetail): Promise<[AttendanceDetail, MemberDetailRecord | null]> => {
                    const memberResult = await this.base(this.membersTableId).select({
                        filterByFormula: `{Discord UID} = ${attendance.discordUserId}`,
                        maxRecords: 1
                    }).all();
                    if (memberResult.length != 1) return [attendance, null];
                    const [recordId, nameResult, nimResult] = [memberResult[0].id, memberResult[0].get('Name'), memberResult[0].get('NIM')]
                    let nameParsed: string
                    let nimParsed: string
                    try {
                        nameParsed = (nameResult as any).toString()
                        nimParsed = (nimResult as any).toString()
                    } catch (error) {
                        throw new Error(`Unexpected result from airtable. Fields "Name" and "NIM" are expected to be interpretable as strings. Instead got: Name - ${typeof nameResult}, NIM - ${typeof nimResult}`);
                    }
                    return [attendance, {
                        recordId: recordId,
                        name: nameParsed,
                        nim: nimParsed
                    }];
                }));

                const attendanceBatchPayload = []
                for (const finishedResult of memberRecordsResults) {
                    if (finishedResult.status === "rejected") {
                        this.logger.fatal(`Unexpected error in finding member: "${finishedResult.reason}". Continuing...`);
                        continue;
                    }
                    const [attendance, memberDetails] = finishedResult.value;
                    if (memberDetails === null) {
                        this.logger.error(`Discord ID <@${attendance.discordUserId}> not found in members`);
                        continue;
                    }
                    this.logger.info(`Found member: ${memberDetails.name} ${memberDetails.nim}`)
                    attendanceBatchPayload.push({
                        "fields": {
                            "Session ID": [sessionRecordId],
                            "Student ID": [memberDetails.recordId],
                            "Attend Duration": Math.max(Math.trunc(attendance.attendanceDuration.as('seconds')), 60)
                        }
                    });
                }

                this.logger.debug(`Creating attendance records, payload: ${attendanceBatchPayload}`)

                await this.base(this.attendanceTableId).create(attendanceBatchPayload);
                if (batch.length - attendanceBatchPayload.length == 0)
                    this.logger.info(`Completed batch successfully`);
                else {
                    this.logger.warn(`Completed batch insertion with ${batch.length - attendanceBatchPayload.length} failed entries.`)
                }
            }
            this.logger.info("Push finished");
            return "SUCCESS";
        } catch (error) {
            this.logger.fatal(`A fatal error occurred: ${error}`);
            return "FAILURE";
        }
    }
}
