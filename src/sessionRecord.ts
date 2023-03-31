import { Snowflake } from "discord.js";
import { DateTime } from "luxon";
import { Database, ISqlite, open } from "sqlite";
import sqlite3 from "sqlite3";

export type SessionRecordId = {
    guildId: Snowflake;
    channelId: Snowflake;
}
export type SessionEvent = JoinedChannelEvent | LeftChannelEvent

export interface JoinedChannelEvent {
    type: "Join";
    userId: Snowflake;
    time: DateTime;
}

export interface LeftChannelEvent {
    type: "Leave";
    userId: Snowflake;
    time: DateTime;
}

export interface SessionRecord {
    ownerId: Snowflake;
    guildId: Snowflake;
    channelId: Snowflake;
    startTime: DateTime;
    endTime: DateTime;
    events: SessionEvent[];
}

export interface SessionRecordStore {
    store(sessionRecord: SessionRecord): Promise<SessionRecordId | undefined>;
    retrieve(id: SessionRecordId): Promise<SessionRecord | undefined>;
    retrieveAll(): Promise<SessionRecord[] | undefined>;
    delete(id: SessionRecordId): Promise<void>;
}

export class SqliteSessionRecordStore implements SessionRecordStore {

    private connectionProvider: SqliteDbConnectionProvider;

    constructor(connectionProvider: SqliteDbConnectionProvider) {
        this.connectionProvider = connectionProvider;
    }

    public async store(sessionRecord: SessionRecord): Promise<SessionRecordId> {
        const id: SessionRecordId = {
            guildId: sessionRecord.guildId,
            channelId: sessionRecord.channelId
        }
        const db = await this.connectionProvider.getConnection();
        try {
            await db.run(
                "INSERT INTO `session`(`owner_id`, `guild_id`, `channel_id`, `start_time`, `end_time`) VALUES (:owner_id, :guild_id, :channel_id, :start_time, :end_time)", {
                ':owner_id': sessionRecord.ownerId.toString(),
                ':guild_id': id.guildId.toString(),
                ':channel_id': id.channelId.toString(),
                ':start_time': sessionRecord.startTime.toISO(),
                ':end_time': sessionRecord.endTime.toISO()
            });
            for (let index = 0; index < sessionRecord.events.length; index++) {
                const sessionEvent = sessionRecord.events[index];
                await db.run("INSERT INTO `event`(`count`, `session_guild_id`, `session_channel_id`, `time_occurred`, `event_code`, `user_id`) VALUES (:count, :session_guild_id, :session_channel_id, :time_occurred, :event_code, :user_id)", {
                    ':count': index + 1,
                    ':session_guild_id': id.guildId.toString(),
                    ':session_channel_id': id.channelId.toString(),
                    ':time_occurred': sessionEvent.time.toISO(),
                    ':event_code': sessionEvent.type.toUpperCase(),
                    ':user_id': sessionEvent.userId
                });
            }
            return id;  
        } catch (error) {
            return undefined;
        }
    }
    public async retrieve(id: SessionRecordId): Promise<SessionRecord> {
        try {
            const db = await this.connectionProvider.getConnection();
            const sessionResult = await db.get(
                "SELECT `owner_id`, `guild_id`, `channel_id`, `start_time`, `end_time` \
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
        }
    }
    public async retrieveAll(): Promise<SessionRecord[]> {
        try {
            const db = await this.connectionProvider.getConnection();
            const sessionsResult = await db.all(
                "SELECT `owner_id`, `guild_id`, `channel_id`, `start_time`, `end_time` \
                FROM `session`");
            const sessions: SessionRecord[] = []
            for (const sessionResult of sessionsResult) {
                const eventsResult = await db.all(
                    "SELECT `session_guild_id`, `session_channel_id`, `time_occurred`, `event_code`, `user_id`\
                    FROM `event`\
                    WHERE `session_guild_id` = :guild_id\
                    AND `session_channel_id` = :channel_id", {
                    'guild_id': sessionResult['guild_id'],
                    'channel_id': sessionResult['channel_id']
                }
                );
                sessions.push(this.convertResultToSession(sessionResult, eventsResult.map(this.convertResultToEvent)))
            }
            return sessions;
        } catch (error) {
            return undefined;
        }
    }
    public async delete(id: SessionRecordId): Promise<void> {
        try {
            const db = await this.connectionProvider.getConnection();
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
        }
    }

    private convertResultToSession(obj: Object, events: SessionEvent[]): SessionRecord {
        return {
            ownerId: obj['owner_id'] as string,
            guildId: obj['guild_id'] as string,
            channelId: obj['channel_id'] as string,
            startTime: DateTime.fromISO(obj['start_time'] as string) as DateTime,
            endTime: DateTime.fromISO(obj['end_time'] as string) as DateTime,
            events: events
        };
    }

    private convertResultToEvent(obj: Object): SessionEvent {
        switch (obj['event_code']) {
            case "JOIN":
                return {
                    type: "Join",
                    userId: obj['user_id'] as string,
                    time: DateTime.fromISO(obj['time_occurred'] as string) as DateTime
                };
            default:
                return {
                    type: "Leave",
                    userId: obj['user_id'] as string,
                    time: DateTime.fromISO(obj['time_occurred'] as string) as DateTime
                };
        }
    }
}

export interface SqliteDbConnectionProvider {
    getConnection(): Promise<Database<sqlite3.Database, sqlite3.Statement>>;
}

export class SingleConnectionProvider implements SqliteDbConnectionProvider {

    private readonly config: ISqlite.Config;
    private connection: Database<sqlite3.Database, sqlite3.Statement> | undefined

    constructor(config: ISqlite.Config) {
        this.config = config;
    }

    async getConnection(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
        if (this.connection == undefined) {
            this.connection = await open(this.config);
        }
        return this.connection;
    }

}