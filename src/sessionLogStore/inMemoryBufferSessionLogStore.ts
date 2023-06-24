import { SnowflakeUtil } from "discord.js";

import { SessionLogStore } from "./sessionLogStore";
import { CompletedSession, SessionLog } from "../session/session";
import { DateTimeProvider } from "../util/date";

export class InMemorySessionLogStore implements SessionLogStore {
	private readonly maxSize: number;
	private readonly memory: SessionLog[] = [];
	private readonly dateTimeProvider: DateTimeProvider;

	public constructor(maxSize: number, dateTimeProvider: DateTimeProvider) {
		this.maxSize = Math.floor(maxSize);
		this.dateTimeProvider = dateTimeProvider;
	}
	public store(completedSession: CompletedSession): Promise<string | undefined> {
		const now = this.dateTimeProvider.now().toUTC();
		const sessionLog: SessionLog = {
			...completedSession,
			id: SnowflakeUtil.generate({ timestamp: now.toMillis() }).toString(),
			timeStored: now,
			timePushed: undefined,
		};
		this.memory.push(sessionLog);
		if (this.memory.length > this.maxSize) {
			this.memory.shift();
		}
		return Promise.resolve(sessionLog.id);
	}
	public retrieve(_id: string): Promise<SessionLog | undefined> {
		return Promise.resolve(this.memory.filter((log) => log.id === _id).at(0));
	}
	public retrieveAll(): Promise<SessionLog[] | undefined> {
		return Promise.resolve(this.memory.slice());
	}
	public delete(id: string): Promise<void> {
		const indexFound = this.memory.findIndex((log) => log.id === id);
		if (indexFound === -1) {
			return Promise.resolve();
		}
		this.memory.splice(indexFound, 1);
		return Promise.resolve();
	}
	public latestUnpushed(): Promise<SessionLog | undefined> {
		return this.memory.length > 0
			? Promise.resolve(this.memory[this.memory.length - 1])
			: Promise.resolve(undefined);
	}
	public setLogPushed(id: string): Promise<void> {
		void this.delete(id);
		return Promise.resolve();
	}
}
