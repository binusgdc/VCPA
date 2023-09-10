import { Snowflake } from "discord.js"
import { Duration } from "luxon"

import { SessionLog, SessionLogId } from "./session"
import { PushlogData, PushlogTarget } from "../pushlogTarget/pushlogTarget"
import { SessionLogStore } from "../sessionLogStore/sessionLogStore"
import { Result, error, ok } from "../util/result"

type PushLogError = LogNotFound | NoUnpushed | PushUnsuccessful

type LogNotFound = {
    type: "LogNotFound"
}

type NoUnpushed = {
    type: "NoUnpushed"
}

type PushUnsuccessful = {
    type: "PushUnsuccessful"
}

export class PushlogService {
    private readonly sessionLogStore: SessionLogStore
    private readonly pushlogTarget: PushlogTarget

    public constructor(sessionLogStore: SessionLogStore, pushLogTarget: PushlogTarget) {
        this.sessionLogStore = sessionLogStore
        this.pushlogTarget = pushLogTarget
    }

    public async pushSessionLog(
        topicId: string,
        documentatorName: string,
        mentorIds: Snowflake[],
        sessionLogId: SessionLogId | undefined
    ): Promise<Result<undefined, PushLogError>> {
        const logToPush =
            sessionLogId === undefined
                ? await this.sessionLogStore.latestUnpushed()
                : await this.sessionLogStore.retrieve(sessionLogId)

        if (logToPush === undefined) {
            return sessionLogId === undefined
                ? error({ type: "NoUnpushed" })
                : error({ type: "LogNotFound" })
        }

        const pushData = this.toPushData(logToPush, topicId, documentatorName, mentorIds)
        const pushResult = await this.pushlogTarget.push(pushData)
        if (pushResult === "FAILURE") {
            return error({ type: "PushUnsuccessful" })
        }
        await this.sessionLogStore.setLogPushed(logToPush.id)
        return ok(undefined)
    }

    private toPushData(
        sessionLog: SessionLog,
        topicId: string,
        recorderName: string,
        mentorDiscordUserIds: Snowflake[]
    ): PushlogData {
        return {
            topicId: topicId,
            sessionDateTime: sessionLog.timeStarted,
            sessionDuration: Duration.fromMillis(
                sessionLog.timeEnded.toMillis() - sessionLog.timeStarted.toMillis()
            ),
            recorderName: recorderName,
            mentorDiscordUserIds: mentorDiscordUserIds,
            attendees: Array.from(
                this.arrayGroupBy(sessionLog.events, (event) => event.userId).entries()
            ).map(([userId, events]) => {
                return {
                    discordUserId: userId,
                    attendanceDuration: Duration.fromMillis(
                        events.reduce(
                            (duration, event) =>
                                duration +
                                (event.timeOccurred.toMillis() -
                                    sessionLog.timeStarted.toMillis()) *
                                    (event.type === "Join" ? -1 : 1),
                            0
                        )
                    ),
                }
            }),
        }
    }

    private arrayGroupBy<T>(array: Array<T>, grouper: (value: T) => string): Map<string, Array<T>> {
        const result = new Map<string, Array<T>>()
        for (const value of array) {
            const key = grouper(value)
            if (!result.has(key)) {
                result.set(key, [])
            }
            result.get(key)?.push(value)
        }
        return result
    }
}
