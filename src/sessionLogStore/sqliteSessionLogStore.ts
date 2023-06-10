import { SnowflakeUtil } from "discord.js";
import { DateTime } from "luxon";
import { ISqlite, Database, open } from "sqlite";
import sqlite3 from "sqlite3";
import { z } from "zod";

import { SessionLogStore } from "./sessionLogStore";
import { DateTimeProvider } from "../util/date";
import { SessionLog, CompletedSession, SessionLogId, SessionEvent } from "../session/session";
import { dtnow } from "../util";

const sessionEventSchemaSqlite = z.object({
	event_code: z.literal("JOIN").or(z.literal("LEAVE")),
	user_id: z.string(),
	time_occurred: z.string().datetime({
		offset: true
	})
});

const sessionLogSchemaSqlite = z.object({
	id: z.string(),
	owner_id: z.string(),
	guild_id: z.string(),
	channel_id: z.string(),
	time_started: z.string().datetime({
		offset: true
	}),
	time_ended: z.string().datetime({
		offset: true
	}),
	events: sessionEventSchemaSqlite.array(),
	time_stored: z.string().datetime({
		offset: true
	}),
	time_pushed: z.union([z.string(), z.undefined(), z.null()])
});

export class SqliteSessionLogStore implements SessionLogStore {
	private readonly connectionProvider: SqliteDbConnectionProvider;
	private readonly dateTimeProvider: DateTimeProvider;

	constructor(
		connectionProvider: SqliteDbConnectionProvider,
		dateTimeProvider: DateTimeProvider | undefined = undefined
	) {
		this.connectionProvider = connectionProvider;
		this.dateTimeProvider = dateTimeProvider ?? {
			now() {
				return dtnow();
			}
		};
	}

	public async latestUnpushed(): Promise<SessionLog | undefined> {
		const db = await this.connectionProvider.getConnection();
		try {
			const sessionResult = await db.get(
				"SELECT `id`, `owner_id`, `guild_id`, `channel_id`, `time_started`, `time_ended`, `time_stored`, `time_pushed` \
                FROM `session` \
                WHERE `time_pushed` IS NULL \
                ORDER BY `time_stored` DESC \
                LIMIT 1"
			);
			if (sessionResult == undefined) return undefined;
			const sessionId = sessionResult["id"];
			const eventsResult: [] = await db.all(
				"SELECT `time_occurred`, `event_code`, `user_id` \
                FROM `event` \
                WHERE `session_id`=:session_id \
                ORDER BY count",
				{
					":session_id": sessionId.toString()
				}
			);
			return this.mapSessionLog(
				sessionLogSchemaSqlite.parse({
					...sessionResult,
					events: eventsResult
				})
			);
		} catch (error) {
			return undefined;
		} finally {
			db.close();
		}
	}

	public async store(completedSession: CompletedSession): Promise<SessionLogId | undefined> {
		const db = await this.connectionProvider.getConnection();
		const nextId: SessionLogId = SnowflakeUtil.generate().toString();
		try {
			await db.run(
				"INSERT INTO `session`(`id`, `owner_id`, `guild_id`, `channel_id`, `time_started`, `time_ended`, `time_stored`) VALUES (:id, :owner_id, :guild_id, :channel_id, :time_started, :time_ended, :time_stored)",
				{
					":id": nextId.toString(),
					":owner_id": completedSession.ownerId.toString(),
					":guild_id": completedSession.guildId.toString(),
					":channel_id": completedSession.channelId.toString(),
					":time_started": completedSession.timeStarted.toISO(),
					":time_ended": completedSession.timeEnded.toISO(),
					":time_stored": this.dateTimeProvider.now().toISO()
				}
			);
			for (let index = 0; index < completedSession.events.length; index++) {
				const sessionEvent = completedSession.events[index];
				await db.run(
					"INSERT INTO `event`(`count`, `session_id`, `time_occurred`, `event_code`, `user_id`) VALUES (:count, :session_id, :time_occurred, :event_code, :user_id)",
					{
						":count": index + 1,
						":session_id": nextId.toString(),
						":time_occurred": sessionEvent.timeOccurred.toISO(),
						":event_code": sessionEvent.type.toUpperCase(),
						":user_id": sessionEvent.userId
					}
				);
			}
			return nextId;
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
				"SELECT `id`, `owner_id`, `guild_id`, `channel_id`, `time_started`, `time_ended`, `time_stored`, `time_pushed` \
                FROM `session` \
                WHERE `id`=:id",
				{
					":id": id.toString()
				}
			);
			if (sessionResult == undefined) return undefined;
			const eventsResult: [] = await db.all(
				"SELECT `time_occurred`, `event_code`, `user_id` \
                FROM `event` \
                WHERE `session_id`=:session_id \
                ORDER BY count",
				{
					":session_id": id.toString()
				}
			);
			const parsed = sessionLogSchemaSqlite.parse({
				...sessionResult,
				events: eventsResult
			});
			return this.mapSessionLog(parsed);
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
				"SELECT `id`, `owner_id`, `guild_id`, `channel_id`, `time_started`, `time_ended`, `time_stored`, `time_pushed` \
                FROM `session`"
			);
			const sessions: SessionLog[] = [];
			for (const sessionResult of sessionsResult) {
				const eventsResult = await db.all(
					"SELECT `time_occurred`, `event_code`, `user_id` \
                    FROM `event` \
                    WHERE `session_id` = :session_id",
					{
						":session_id": sessionResult["id"]
					}
				);
				sessions.push(
					this.mapSessionLog(
						sessionLogSchemaSqlite.parse({
							...sessionResult,
							events: eventsResult
						})
					)
				);
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
                WHERE `session_id`=:session_id",
				{
					":session_id": id.toString()
				}
			);
			await db.run(
				"DELETE \
                FROM `session` \
                WHERE `id`=:id",
				{
					":id": id.toString()
				}
			);
		} catch (error) {
			return;
		} finally {
			db.close();
		}
	}

	public async setLogPushed(id: string): Promise<void> {
		const db = await this.connectionProvider.getConnection();
		try {
			await db.run(
				"UPDATE `session` \
                SET `time_pushed`=:time_pushed \
                WHERE `id`=:id",
				{
					":id": id,
					":time_pushed": this.dateTimeProvider.now().toISODate()
				}
			);
		} finally {
			db.close();
		}
	}

	/** @throws Errors */
	private mapSessionLog(parsed: z.infer<typeof sessionLogSchemaSqlite>): SessionLog {
		function mapEvent(eventParsed: z.infer<typeof sessionEventSchemaSqlite>): SessionEvent {
			let type: "Join" | "Leave" | undefined = undefined;
			switch (eventParsed.event_code) {
				case "JOIN":
					type = "Join";
					break;
				case "LEAVE":
					type = "Leave";
					break;
			}
			return {
				type: type,
				userId: eventParsed.user_id,
				timeOccurred: DateTime.fromISO(eventParsed.time_occurred)
			};
		}

		return {
			id: parsed.id,
			ownerId: parsed.owner_id,
			guildId: parsed.guild_id,
			channelId: parsed.channel_id,
			timeStarted: DateTime.fromISO(parsed.time_started),
			events: parsed.events.map(mapEvent),
			timeStored: DateTime.fromISO(parsed.time_stored),
			timePushed:
				parsed.time_pushed != null && parsed.time_pushed != undefined
					? DateTime.fromISO(parsed.time_pushed)
					: undefined,
			timeEnded: DateTime.fromISO(parsed.time_ended)
		};
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
