import { Snowflake, SnowflakeUtil } from "discord.js";
import * as fs from "fs";
import { DateTime } from "luxon";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { CompletedSession, JoinedChannelEvent, LeftChannelEvent, SessionEvent, SessionLog, SessionLogId } from "../src/session/session";
import { LazyConnectionProvider, SqliteSessionLogStore } from "../src/sessionLogStore/sqliteSessionLogStore";
import { SessionLogStore } from "../src/sessionLogStore/sessionLogStore";
import { DateTimeProvider, getRandomInteger } from "../src/util";

const dbName = "sessions-test.db";
const dbConfig = { filename: dbName, driver: sqlite3.Database, mode: sqlite3.OPEN_READWRITE }
let sut: SessionLogStore;
const dateTimeProviderMock: DateTimeProvider = {
	now: jest.fn().mockReturnValue(DateTime.now())
}

async function setupDatabase() {
	fs.writeFileSync(dbName, "");
	const connection = await open(dbConfig);
	await connection.migrate({
		migrationsPath: "./data"
	});
	connection.close();
	sut = new SqliteSessionLogStore(new LazyConnectionProvider(dbConfig), dateTimeProviderMock);
}

function deleteDatabase() {
	if (fs.existsSync(dbName)) fs.rmSync(dbName);
}

function generateCompletedSession(lengthOfSessionMinutes: number = 10, numberOfUsers: number = 1, maxIntermediateEventsPerUser: number = 0): CompletedSession {

	lengthOfSessionMinutes = Math.max(10, lengthOfSessionMinutes);
	numberOfUsers = Math.max(0, numberOfUsers);
	maxIntermediateEventsPerUser = Math.max(0, maxIntermediateEventsPerUser);

	const startTime = DateTime.now();
	const endTime = startTime.plus({
		minutes: lengthOfSessionMinutes
	});

	return {
		ownerId: SnowflakeUtil.generate().toString(),
		guildId: SnowflakeUtil.generate().toString(),
		channelId: SnowflakeUtil.generate().toString(),
		timeStarted: startTime,
		timeEnded: endTime,
		// sorted by user then time
		events: [...Array(numberOfUsers).keys()]
			.map(_ => SnowflakeUtil.generate())
			.flatMap(userId => generateEventsForUserId(userId.toString(), startTime, endTime, getRandomInteger(0, maxIntermediateEventsPerUser)))
	}
}

function generateEventsForUserId(userId: Snowflake, startTime: DateTime, endTime: DateTime, quantity: number): SessionEvent[] {

	function floorToEven(number: number): number {
		const i = Math.floor(number);
		return i % 2 == 0 || i == 0 ? i : i - 1;
	}

	const numberOfIntermediateEvents = floorToEven(Math.max(0, quantity - 2));
	const durationMilliseconds = Math.max(0, endTime.toMillis() - startTime.toMillis());

	const intermediateEvents: SessionEvent[] = [...Array(numberOfIntermediateEvents).keys()]
		.map(_ => Math.random())
		.sort()
		.map(portion => Math.floor(portion * durationMilliseconds))
		.map((timeStampMilliseconds, index) => {
			const count = index + 2;
			return count % 2 == 0
				? {
					type: "Leave",
					userId: userId,
					timeOccurred: startTime.plus(timeStampMilliseconds)
				}
				: {
					type: "Join",
					userId: userId,
					timeOccurred: startTime.plus(timeStampMilliseconds)
				}
		});

	const startEvent: JoinedChannelEvent = {
		type: "Join",
		userId: userId,
		timeOccurred: startTime
	};

	const endEvent: LeftChannelEvent = {
		type: "Leave",
		userId: userId,
		timeOccurred: endTime
	};

	return [startEvent, ...intermediateEvents, endEvent];
}

beforeEach(() => { return setupDatabase(); });
afterEach(() => { deleteDatabase(); });

test("Generated session log's events are properly ordered for a single user", () => {
	const tries = 50;
	for (let iTry = 0; iTry < tries; iTry++) {
		const log = generateCompletedSession(30, 1, 10);
		for (let iEvent = 0; iEvent < log.events.length - 1; iEvent++) {
			const event = log.events[iEvent];
			const next = log.events[iEvent + 1];
			expect(event.timeOccurred.toMillis()).toBeLessThan(next.timeOccurred.toMillis());
			if (event.type == "Join")
				expect(next.type).toEqual("Leave");
			else
				expect(next.type).toEqual("Join");
		}
	}
})

test('Inserted session should be retrievable', async () => {
	const expected = generateCompletedSession();
	const id = await sut.store(expected);
	const actual = await sut.retrieve(id as SessionLogId);

	expectSessionsToEqual(actual!, expected);
});

test('Session just inserted should have undefined time pushed', async () => {
	const expected = generateCompletedSession();
	const id = await sut.store(expected);
	const actual = await sut.retrieve(id as SessionLogId);

	expect(actual?.timePushed).toBeUndefined();
});

test('Session set to pushed should have expected date pushed', async () => {
	const now = DateTime.now();
	const sut = new SqliteSessionLogStore(new LazyConnectionProvider(dbConfig), {
		now: () => now
	});

	const expected = generateCompletedSession();
	const id = await sut.store(expected);
	await sut.setLogPushed(id as SessionLogId);
	const actual = await sut.retrieve(id as SessionLogId);

	expect(actual?.timePushed?.toISODate()).toEqual(now.toISODate());
});

test('Latest returns the most recent by time stored', async () => {

	const sut = new SqliteSessionLogStore(new LazyConnectionProvider(dbConfig), {
		now: DateTime.now
	});

	const previousSessions = [...Array(10).keys()].map(_ => generateCompletedSession());
	for (const completedSession of previousSessions) {
		await sut.store(completedSession);
	}
	const expectedLater = generateCompletedSession();
	await sut.store(expectedLater);
	const actual = await sut.latestUnpushed();

	expectSessionsToEqual(actual!, expectedLater);
});

test('Trying to store the same session twice should return undefined', async () => {
	const expected = generateCompletedSession();
	await sut.store(expected);
	const secondTry = await sut.store(expected);
	expect(secondTry).toBeUndefined();
});

test('Trying to retrieve a session after deleting it should return undefined', async () => {
	const expectedFirst = generateCompletedSession();
	const id = (await sut.store(expectedFirst)) as SessionLogId;
	await sut.delete(id);
	const attempt = await sut.retrieve(id);
	expect(attempt).toBeUndefined();
});

test('Retrieving all sessions with events returns all inserted sessions', async () => {
	const expected = [...Array(10).keys()]
		.map(_ => generateCompletedSession(10, 3, 6))
		.reduce((dict, next) => dict.set(next.guildId + "-" + next.channelId, next), new Map<string, CompletedSession>());

	for (const session of expected.values()) {
		await sut.store(session);
	}

	const actual = ((await sut.retrieveAll()) as SessionLog[])
		.reduce((dict, next) => dict.set(next.guildId + "-" + next.channelId, next), new Map<string, SessionLog>());

	for (const id of expected.keys()) {
		expectSessionsToEqual(actual.get(id)!, expected.get(id)!)
	}
});

test('Storing session creates a log with the current time', async () => {
	const expected = generateCompletedSession();
	const id = await sut.store(expected);
	const actual = await sut.retrieve(id as SessionLogId);
	expect(actual!.timeStored).toEqual(dateTimeProviderMock.now());
});

function expectSessionsToEqual(actual: CompletedSession, expected: CompletedSession) {
	expect(actual).toBeDefined();
	expect(actual.channelId).toEqual(expected.channelId);
	expect(actual.guildId).toEqual(expected.guildId);
	expect(actual.ownerId).toEqual(expected.ownerId);
	expect(actual.timeStarted).toEqual(expected.timeStarted);
	expect(actual.timeEnded).toEqual(expected.timeEnded);
	const actualEvents = [...actual!.events].sort()
	const expectedEvents = [...expected.events].sort()
	for (let index = 0; index < actualEvents.length; index++) {
		expect(actualEvents[index]).toEqual(expectedEvents[index])
	}
}
