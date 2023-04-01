import { Snowflake, SnowflakeUtil } from "discord.js";
import * as fs from "fs";
import { DateTime } from "luxon";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { SqliteSessionRecordStore, SingleConnectionProvider, SessionRecord, SessionRecordId, SessionRecordStore, SessionEvent, JoinedChannelEvent, LeftChannelEvent } from "../src/sessionRecord"
import { getRandomInteger } from "../src/util";

const dbName = "sessions-test.db";
const dbConfig = { filename: dbName, driver: sqlite3.Database, mode: sqlite3.OPEN_READWRITE }
let sut: SessionRecordStore;

async function setupDatabase() {
    fs.writeFileSync(dbName, "");
    const connection = await open(dbConfig);
    await connection.migrate({
        migrationsPath: "./data"
    });
    connection.close();
    sut = new SqliteSessionRecordStore(new SingleConnectionProvider(dbConfig));
}

function deleteDatabase() {
    if (fs.existsSync(dbName)) fs.rmSync(dbName);
}

function generateSessionRecordWithoutEvents(lengthOfSessionMinutes: number = 10): SessionRecord {
    return {
        ownerId: SnowflakeUtil.generate(),
        guildId: SnowflakeUtil.generate(),
        channelId: SnowflakeUtil.generate(),
        startTime: DateTime.now(),
        endTime: DateTime.now().plus({
            minutes: lengthOfSessionMinutes
        }),
        events: []
    }
}

function generateSessionRecord(lengthOfSessionMinutes: number = 10, numberOfUsers: number = 1, maxIntermediateEventsPerUser: number = 0): SessionRecord {
    
    lengthOfSessionMinutes = Math.max(10, lengthOfSessionMinutes);
    numberOfUsers = Math.max(0, numberOfUsers);
    maxIntermediateEventsPerUser = Math.max(0, maxIntermediateEventsPerUser);
    
    const events = [...Array(numberOfUsers).keys()].map(_ => SnowflakeUtil.generate());
    const startTime = DateTime.now();
    const endTime = startTime.plus({
        minutes: lengthOfSessionMinutes
    });

    return {
        ownerId: SnowflakeUtil.generate(),
        guildId: SnowflakeUtil.generate(),
        channelId: SnowflakeUtil.generate(),
        startTime: startTime,
        endTime: endTime,
        // not sorted by time
        events: [...Array(numberOfUsers).keys()]
            .map(_ => SnowflakeUtil.generate())
            .flatMap(userId => generateEventsForUserId(userId, startTime, endTime, getRandomInteger(0, maxIntermediateEventsPerUser)))
    }
}

function generateEventsForUserId(userId: Snowflake, startTime: DateTime, endTime: DateTime, quantity: number): SessionEvent[] {
    
    function floorToEven(number: number) : number
    {
        const i = Math.floor(number);
        return i % 2 == 0 || i == 0 ? i : i - 1;
    }
    
    const numberOfIntermediateEvents = floorToEven(Math.max(0, quantity-2));
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
                time: startTime.plus(timeStampMilliseconds)
            }
            : {
                type: "Join",
                userId: userId,
                time: startTime.plus(timeStampMilliseconds)
            }
        });

    const startEvent: JoinedChannelEvent = {
        type: "Join",
        userId: userId,
        time: startTime
    };

    const endEvent: LeftChannelEvent = {
        type: "Leave",
        userId: userId,
        time: endTime
    };

    return [startEvent, ...intermediateEvents, endEvent];
}

beforeEach(() => { return setupDatabase(); });
afterEach(() => { deleteDatabase(); });

test("Generated session record's events are properly ordered for a single user", () => {
    const tries = 50;
    for (let iTry = 0; iTry < tries; iTry++) {
        const record = generateSessionRecord(30, 1, 10);
        for (let iEvent = 0; iEvent < record.events.length - 1; iEvent++) {
            const event = record.events[iEvent];
            const next = record.events[iEvent + 1];
            expect(event.time.toMillis()).toBeLessThan(next.time.toMillis());
            if (event.type == "Join")
                expect(next.type).toEqual("Leave");
            else 
                expect(next.type).toEqual("Join");
        }
    }
})

test('Storing session with no events should return appropriate id', async () => {
    const expected: SessionRecord = {
        ownerId: SnowflakeUtil.generate(),
        guildId: SnowflakeUtil.generate(),
        channelId: SnowflakeUtil.generate(),
        startTime: DateTime.now(),
        endTime: DateTime.now().plus({
            minutes: 10
        }),
        events: []
    }
    const id = await sut.store(expected);
    expect(id).toEqual<SessionRecordId>({ guildId: expected.guildId, channelId: expected.channelId });
});

test('Inserted session with no events should be retrievable', async () => {
    const expected = generateSessionRecordWithoutEvents();
    const id = await sut.store(expected);
    const actual = await sut.retrieve(id as SessionRecordId);
    expect(actual).toEqual<SessionRecord>(expected);
});

test('Trying to store the same session with no events twice should return undefined', async () => {
    const expected = generateSessionRecordWithoutEvents();
    await sut.store(expected);
    const secondTry = await sut.store(expected);
    expect(secondTry).toBeUndefined();
});

test('Trying to retrieve a session after deleting it should return undefined', async () => {
    const expected = generateSessionRecordWithoutEvents();
    const id = (await sut.store(expected)) as SessionRecordId;
    await sut.delete(id);
    const attempt = await sut.retrieve(id);
    expect(attempt).toBeUndefined();
});

test('Retrieving all sessions without events returns all inserted sessions', async () => {
    const expected = [...Array(10).keys()]
        .map(_ => generateSessionRecordWithoutEvents())
        .reduce((dict, next) => dict.set(next.guildId + "-" + next.channelId, next), new Map<string, SessionRecord>());

    for (const session of expected.values()) {
        await sut.store(session);
    }

    const actual = ((await sut.retrieveAll()) as SessionRecord[])
        .reduce((dict, next) => dict.set(next.guildId + "-" + next.channelId, next), new Map<string, SessionRecord>());

    for (const id of expected.keys()) {
        expect(actual.get(id)).toEqual(expected.get(id))
    }
});

test('Retrieving all sessions with events returns all inserted sessions', async () => {
    const expected = [...Array(10).keys()]
        .map(_ => generateSessionRecord(10, 3, 6))
        .reduce((dict, next) => dict.set(next.guildId + "-" + next.channelId, next), new Map<string, SessionRecord>());

    for (const session of expected.values()) {
        await sut.store(session);
    }

    const actual = ((await sut.retrieveAll()) as SessionRecord[])
        .reduce((dict, next) => dict.set(next.guildId + "-" + next.channelId, next), new Map<string, SessionRecord>());

    for (const id of expected.keys()) {
        expect(actual.get(id)).toEqual(expected.get(id))
    }
});