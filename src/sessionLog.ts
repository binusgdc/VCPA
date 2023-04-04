import { Snowflake } from "discord.js";
import { DateTime } from "luxon";
import { Database, ISqlite, open } from "sqlite";
import sqlite3 from "sqlite3";
import { DateTimeProvider } from "./util";

export type SessionLogId = {
    guildId: Snowflake;
    channelId: Snowflake;
}
export type SessionEvent = JoinedChannelEvent | LeftChannelEvent

export interface JoinedChannelEvent {
    type: "Join";
    userId: Snowflake;
    timeOccurred: DateTime;
}

export interface LeftChannelEvent {
    type: "Leave";
    userId: Snowflake;
    timeOccurred: DateTime;
}

export interface CompletedSession {
    ownerId: Snowflake;
    guildId: Snowflake;
    channelId: Snowflake;
    timeStarted: DateTime;
    timeEnded: DateTime;
    events: SessionEvent[];
}

export interface SessionLog extends CompletedSession {
    timeStored: DateTime
}

export interface SessionLogStore {
    store(completedSession: CompletedSession): Promise<SessionLogId | undefined>;
    retrieve(id: SessionLogId): Promise<SessionLog | undefined>;
    retrieveAll(): Promise<SessionLog[] | undefined>;
    delete(id: SessionLogId): Promise<void>;
}

export class SqliteSessionLogStore implements SessionLogStore {

    private readonly connectionProvider: SqliteDbConnectionProvider;
    private readonly dateTimeProvider: DateTimeProvider;

    constructor(connectionProvider: SqliteDbConnectionProvider, dateTimeProvider: DateTimeProvider | undefined = undefined) {
        this.connectionProvider = connectionProvider;
        this.dateTimeProvider = dateTimeProvider ?? {
            now() {
                return DateTime.now();
            },
        };
    }

    public async store(completedSession: CompletedSession): Promise<SessionLogId | undefined> {
        const id: SessionLogId = {
            guildId: completedSession.guildId,
            channelId: completedSession.channelId
        }
        const db = await this.connectionProvider.getConnection();
        try {
            await db.run(
                "INSERT INTO `session`(`owner_id`, `guild_id`, `channel_id`, `time_started`, `time_ended`, `time_stored`) VALUES (:owner_id, :guild_id, :channel_id, :time_started, :time_ended, :time_stored)", {
                ':owner_id': completedSession.ownerId.toString(),
                ':guild_id': id.guildId.toString(),
                ':channel_id': id.channelId.toString(),
                ':time_started': completedSession.timeStarted.toISO(),
                ':time_ended': completedSession.timeEnded.toISO(),
                ':time_stored': this.dateTimeProvider.now().toISO()
            });
            for (let index = 0; index < completedSession.events.length; index++) {
                const sessionEvent = completedSession.events[index];
                await db.run("INSERT INTO `event`(`count`, `session_guild_id`, `session_channel_id`, `time_occurred`, `event_code`, `user_id`) VALUES (:count, :session_guild_id, :session_channel_id, :time_occurred, :event_code, :user_id)", {
                    ':count': index + 1,
                    ':session_guild_id': id.guildId.toString(),
                    ':session_channel_id': id.channelId.toString(),
                    ':time_occurred': sessionEvent.timeOccurred.toISO(),
                    ':event_code': sessionEvent.type.toUpperCase(),
                    ':user_id': sessionEvent.userId
                });
            }
            return id;  
        } catch (error) {
            return undefined;
        } finally {
            db.close();
        }
    }
    public async retrieve(id: SessionLogId): Promise<SessionLog | undefined> {
        const db = await this.connectionProvider.getConnection();
        try {
            const sessionResult = await db.get(
                "SELECT `owner_id`, `guild_id`, `channel_id`, `time_started`, `time_ended`, `time_stored` \
                FROM `session` \
                WHERE `guild_id`=:guild_id \
                AND `channel_id`=:channel_id", {
                ':guild_id': id.guildId,
                ':channel_id': id.channelId
            });
            if (sessionResult == undefined) return undefined;
            const eventsResult: [] = await db.all(
                "SELECT `session_guild_id`, `session_channel_id`, `time_occurred`, `event_code`, `user_id` \
                FROM `event` \
                WHERE `session_guild_id`=:guild_id \
                AND `session_channel_id`=:channel_id \
                ORDER BY count", {
                ':guild_id': id.guildId,
                ':channel_id': id.channelId
            })
            return this.convertResultToSession(sessionResult, eventsResult.map(this.convertResultToEvent));
        } catch (error) {
            return undefined;
        } finally {
            db.close();
        }
    }
    public async retrieveAll(): Promise<SessionLog[] | undefined> {
        const db = await this.connectionProvider.getConnection();
        try {
            const sessionsResult = await db.all(
                "SELECT `owner_id`, `guild_id`, `channel_id`, `time_started`, `time_ended` \
                FROM `session`");
            const sessions: SessionLog[] = []
            for (const sessionResult of sessionsResult) {
                const eventsResult = await db.all(
                    "SELECT `session_guild_id`, `session_channel_id`, `time_occurred`, `event_code`, `user_id`\
                    FROM `event`\
                    WHERE `session_guild_id` = :guild_id\
                    AND `session_channel_id` = :channel_id", {
                    ':guild_id': sessionResult['guild_id'],
                    ':channel_id': sessionResult['channel_id']
                }
                );
                sessions.push(this.convertResultToSession(sessionResult, eventsResult.map(this.convertResultToEvent)))
            }
            return sessions;
        } catch (error) {
            return undefined;
        } finally {
            db.close();
        }
    }
    public async delete(id: SessionLogId): Promise<void> {
        const db = await this.connectionProvider.getConnection();
        try {
            await db.run(
                "DELETE \
                FROM `event` \
                WHERE `session_guild_id`=:guild_id \
                AND `session_channel_id`=:channel_id", {
                ':guild_id': id.guildId,
                ':channel_id': id.channelId
            }  
            );
            await db.run(
                "DELETE \
                FROM `session` \
                WHERE `guild_id`=:guild_id \
                AND `channel_id`=:channel_id", {
                ':guild_id': id.guildId,
                ':channel_id': id.channelId
            });
        } catch (error) {
            return;
        } finally {
            db.close();
        }
    }

    private convertResultToSession(obj: Object, events: SessionEvent[]): SessionLog {
        return {
            ownerId: obj['owner_id'] as string,
            guildId: obj['guild_id'] as string,
            channelId: obj['channel_id'] as string,
            timeStarted: DateTime.fromISO(obj['time_started'] as string) as DateTime,
            timeEnded: DateTime.fromISO(obj['time_ended'] as string) as DateTime,
            events: events,
            timeStored: DateTime.fromISO(obj['time_stored']) as DateTime
        };
    }

    private convertResultToEvent(obj: Object): SessionEvent {
        switch (obj['event_code']) {
            case "JOIN":
                return {
                    type: "Join",
                    userId: obj['user_id'] as string,
                    timeOccurred: DateTime.fromISO(obj['time_occurred'] as string) as DateTime
                };
            default:
                return {
                    type: "Leave",
                    userId: obj['user_id'] as string,
                    timeOccurred: DateTime.fromISO(obj['time_occurred'] as string) as DateTime
                };
        }
    }
}

export interface SqliteDbConnectionProvider {
    getConnection(): Promise<Database<sqlite3.Database, sqlite3.Statement>>;
}

export class LazyConnectionProvider implements SqliteDbConnectionProvider {

    private readonly config: ISqlite.Config;

    constructor(config: ISqlite.Config) {
        this.config = config;
    }

    async getConnection(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
        return await open(this.config);
    }

}