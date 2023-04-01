import { SnowflakeUtil } from "discord.js";
import * as fs from "fs";
import { DateTime } from "luxon";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { SqliteSessionRecordStore, SingleConnectionProvider, SessionRecord, SessionRecordId, SessionRecordStore } from "../src/sessionRecord"

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

beforeEach(() => { return setupDatabase(); });
afterEach(() => { deleteDatabase(); });

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
    const actual = await sut.retrieve(id as SessionRecordId);
    expect(actual).toEqual<SessionRecord>(expected);
});

test('Trying to store the same session with no events twice should return undefined', async () => {
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
    await sut.store(expected);
    const secondTry = await sut.store(expected);
    expect(secondTry).toBeUndefined();
});

test('Trying to retrieve a session after deleting it should return undefined', async () => {
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
    const id = (await sut.store(expected)) as SessionRecordId;
    await sut.delete(id);
    const attempt = await sut.retrieve(id);
    expect(attempt).toBeUndefined();
});

test('Retrieving all sessions returns all inserted sessions', async () => {
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