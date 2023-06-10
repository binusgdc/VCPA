import { SnowflakeUtil } from "discord.js";
import { CompletedSession, generateSessionOutput } from "../src/session/session";
import { DateTime } from "luxon";

const now = DateTime.utc();

test("generateSessionOutput produces expected session info headers", () => {
	const expectedHeaderColumns = ["date", "owner", "start", "duration"];
	const owner = SnowflakeUtil.generate({ timestamp: 0 }).toString();
	const guild = SnowflakeUtil.generate({ timestamp: 2 }).toString();
	const channel = SnowflakeUtil.generate({ timestamp: 1 }).toString();
	const session: CompletedSession = {
		ownerId: owner,
		guildId: guild,
		channelId: channel,
		timeStarted: now,
		timeEnded: now.plus({ minutes: 5 }),
		events: []
	}
	const report = generateSessionOutput(session);
	const headerColumns = report.sesinfo.split("\n")[0].split(",");
	for (let index = 0; index < expectedHeaderColumns.length; index++) {
		expect(headerColumns[index]).toBe(expectedHeaderColumns[index]);
	}
});

test("generateSessionOutput produces expected attendance info headers", () => {
	const expectedHeaderColumns = ["sessionId", "id", "type", "time"];
	const owner = SnowflakeUtil.generate({ timestamp: 0 }).toString();
	const guild = SnowflakeUtil.generate({ timestamp: 2 }).toString();
	const channel = SnowflakeUtil.generate({ timestamp: 1 }).toString();
	const session: CompletedSession = {
		ownerId: owner,
		guildId: guild,
		channelId: channel,
		timeStarted: now,
		timeEnded: now.plus({ minutes: 5 }),
		events: []
	}
	const report = generateSessionOutput(session);
	const headerColumns = report.attdet.split("\n")[0].split(",");
	for (let index = 0; index < expectedHeaderColumns.length; index++) {
		expect(headerColumns[index]).toBe(expectedHeaderColumns[index]);
	}
});

test("generateSessionOutput produces expected procdet headers", () => {
	const expectedHeaderColumns = ["id", "perc", "status", "duration"];
	const owner = SnowflakeUtil.generate({ timestamp: 0 }).toString();
	const guild = SnowflakeUtil.generate({ timestamp: 2 }).toString();
	const channel = SnowflakeUtil.generate({ timestamp: 1 }).toString();
	const session: CompletedSession = {
		ownerId: owner,
		guildId: guild,
		channelId: channel,
		timeStarted: now,
		timeEnded: now.plus({ minutes: 5 }),
		events: []
	}
	const report = generateSessionOutput(session);
	const headerColumns = report.procdet.split("\n")[0].split(",");
	for (let index = 0; index < expectedHeaderColumns.length; index++) {
		expect(headerColumns[index]).toBe(expectedHeaderColumns[index]);
	}
});
