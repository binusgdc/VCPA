import { SnowflakeUtil } from "discord.js";
import { Session } from "../src/structures";
import * as util from "../src/util";
import { CompletedSession } from "../src/session/session";

test("formatPeriodMinutes", () => {
	const milliSeconds = 1800000;
	const minutes = 30;
	expect(util.formatPeriod(milliSeconds, "MINUTES")).toBe(minutes.toString());
});

test("formatPeriodVerbose", () => {
	const milliSeconds = 1800000;
	const expected = "0 hours, 30 minutes, 0.0 seconds";
	expect(util.formatPeriod(milliSeconds, "VERBOSE")).toBe(expected);
});

test("generateSessionOutput produces expected session info headers", () => {
	const expectedHeaderColumns = ["date", "owner", "start", "duration"];
	const owner = SnowflakeUtil.generate({ timestamp: 0 }).toString();
	const channel = SnowflakeUtil.generate({ timestamp: 1 }).toString();
	const session = new Session(owner, channel);
	session.start();
	session.end();
	const report = util.generateSessionOutput(mapToCompletedSession(session));
	const headerColumns = report.sesinfo.split("\n")[0].split(",");
	for (let index = 0; index < expectedHeaderColumns.length; index++) {
		expect(headerColumns[index]).toBe(expectedHeaderColumns[index]);
	}
});

test("generateSessionOutput produces expected attendance info headers", () => {
	const expectedHeaderColumns = ["sessionId", "id", "type", "time"];
	const owner = SnowflakeUtil.generate({ timestamp: 0 }).toString();
	const channel = SnowflakeUtil.generate({ timestamp: 1 }).toString();
	const session = new Session(owner, channel);
	session.start();
	session.end();
	const report = util.generateSessionOutput(mapToCompletedSession(session));
	const headerColumns = report.attdet.split("\n")[0].split(",");
	for (let index = 0; index < expectedHeaderColumns.length; index++) {
		expect(headerColumns[index]).toBe(expectedHeaderColumns[index]);
	}
});

test("generateSessionOutput produces expected procdet headers", () => {
	const expectedHeaderColumns = ["id", "perc", "status", "duration"];
	const owner = SnowflakeUtil.generate({ timestamp: 0 }).toString();
	const channel = SnowflakeUtil.generate({ timestamp: 1 }).toString();
	const session = new Session(owner, channel);
	session.start();
	session.end();
	const report = util.generateSessionOutput(mapToCompletedSession(session));
	const headerColumns = report.procdet.split("\n")[0].split(",");
	for (let index = 0; index < expectedHeaderColumns.length; index++) {
		expect(headerColumns[index]).toBe(expectedHeaderColumns[index]);
	}
});

test("generateSessionOutput produces expected embed fields", () => {
	const expectedFieldNames = [
		"Date",
		"Tutor ID",
		"Start Time",
		"Duration (minutes)",
		"Attendance Form",
	];
	const owner = SnowflakeUtil.generate({ timestamp: 0 }).toString();
	const channel = SnowflakeUtil.generate({ timestamp: 1 }).toString();
	const session = new Session(owner, channel);
	session.start();
	session.end();
	util
		.generateSessionOutput(mapToCompletedSession(session))
		.embed.data.fields?.map((field) => field.name)
		.forEach((fieldName, index) =>
			expect(fieldName).toBe(expectedFieldNames[index])
		);
});

function mapToCompletedSession(session: Session): CompletedSession {
	return {
		ownerId: session.owner,
		timeStarted: session.startTime!,
		timeEnded: session.endTime!,
		events: session.events.map(e => ({
			type: e.type === "JOIN" ? "Join" : "Leave",
			userId: e.uid,
			timeOccurred: e.time!
		})),
		channelId: session.channel,
		guildId: ""
	}
}