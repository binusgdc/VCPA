import { MessageEmbed, Snowflake } from "discord.js";
import { DateTime, Duration } from "luxon";
import { Event, Session, SessionOutput } from "./structures";

export function getRandomColor() {
	// Evenly distributed random javascript integer
	// https://stackoverflow.com/a/1527820

	return Math.floor(Math.random() * (2**24-1 - 0 + 1) + 0);
}

export function getRandomInteger(min: number, max: number) : number {
	// Evenly distributed random javascript integer
	// https://stackoverflow.com/a/1527820
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface DateTimeProvider {
	now(): DateTime
}

export function dtnow() {
	// Date Time Now UTC

	return DateTime.utc();
}

type FormatDateStyle = "VERBOSE" | "STD" | "DATE" | "TME" | "EXCEL" ;

export function formatDate(date : DateTime, style : FormatDateStyle) {
	switch (style) {
		case "VERBOSE": return date.setZone("UTC+7").toFormat("d MMMM yyyy HH:mm:ss.SSS 'UTC'Z");
		case "STD": return date.toString();
		case "DATE": return date.setZone("UTC+7").toFormat("yyyy-MM-dd");
		case "TME": return date.setZone("UTC+7").toFormat("HH:mm");
		case "EXCEL": return date.setZone("UTC+7").toFormat("yyyy-MM-dd HH:mm:ss.SSS");
	}
}

type FormatPeriodStyle = "MINUTES" | "VERBOSE";

export function formatPeriod(msecs : number, style : FormatPeriodStyle) {
	switch (style) {
		case "MINUTES": {
			return `${msecs / 1000 / 60}`;
		} break;

		case "VERBOSE": {
			const period = Duration.fromMillis(msecs);
			return period.toFormat("h 'hours,' m 'minutes,' s'.'S 'seconds");
		} break;
	}
}

export function generateSessionOutput(session: Session) : SessionOutput {
	/* Don't handle unfinished sessions */

	if (session.startTime === undefined) throw new Error("Session unconcluded");
	if (session.endTime === undefined) throw new Error("Session unconcluded");

	/* Generate csv string of session general information */

	let sesinfo = "date,owner,start,duration\n";
	sesinfo += formatDate(session.startTime, "DATE") + ',';
	sesinfo += `${session.owner}` + ',';
	sesinfo += formatDate(session.startTime, "TME") + ',';
	sesinfo += formatPeriod(session.endTime.toMillis() - session.startTime.toMillis(), "MINUTES") + '\n';

	/* Generate csv string of join/leave events in the session */

	let attdet = "sessionId,id,type,time\n";
	for (let i = 0; i < session.events.length; i++) {
		attdet += "stub-id" + ',';
		attdet += `${session.events[i].uid}` + ',';
		attdet += `${session.events[i].type}` + ',';
		attdet += formatDate(session.events[i].time, "EXCEL") + '\n';
	}

	/* Generate csv string of attendance verdicts for the session's attendees */
	// TODO: Rediscover how this dark magic works

	let uniqueIds : Snowflake[] = [];
	session.events.forEach((event) => { if (!uniqueIds.includes(event.uid)) uniqueIds.push(event.uid); });

	let attendees : {id:Snowflake, duration:number, events:Event[]}[] = [];
	uniqueIds.forEach((uid) => { attendees.push({ id: uid, duration: 0, events: [] }); });

	session.events.forEach((event) => {
		let attendee = attendees.find((attendee) => { return attendee.id === event.uid; });
		attendee?.events.push(event);
	});

	attendees.forEach((attendee) => {
		attendee.events.forEach((event) => {
			attendee.duration += (event.time.toMillis() - session.startTime!.toMillis()) * ((event.type === "JOIN") ? -1 : 1);
		});
	});

	const sessionDuration = session.endTime.toMillis() - session.startTime.toMillis();

	let procdet = "id,perc,status,duration\n";
	attendees.forEach((attendee) => {
		procdet += `${attendee.id}` + ',';
		procdet += (attendee.duration / sessionDuration) + ',';
		procdet += (((attendee.duration / sessionDuration) > 0.8) ? "Hadir" : "Absen") + ',';
		procdet += formatPeriod(attendee.duration, "MINUTES") + '\n';
	});

	/* Generate session info embed for the session */

	const embed = new MessageEmbed()
		.setColor(getRandomColor())
		.setTitle("Session Stats")
		.addFields(
			{ name: "Date", value: formatDate(session.startTime, "DATE") },
			{ name: "Tutor ID", value: `${session.owner}` },
			{ name: "Start Time", value: formatDate(session.startTime, "TME") },
			{ name: "Duration (minutes)", value: formatPeriod(sessionDuration, "MINUTES") },
			{ name: "Attendance Form", value: "[Google Form](https://docs.google.com/forms/d/e/1FAIpQLSdGjYqEQS9R4xK95_rwQHT-idPE0SBmbpD6g6ChBX4WFV_dCg/viewform?usp=sf_link)" }
		);

	/* Return the generated outputs */

	return { sesinfo, attdet, procdet, embed };
}
