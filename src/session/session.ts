import { Snowflake } from "discord.js";
import { DateTime } from "luxon";

import { formatDate, formatPeriod } from "../util/date";

export type SessionLogId = Snowflake;
export type SessionEvent = JoinedChannelEvent | LeftChannelEvent;

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

export interface OngoingSession {
	ownerId: Snowflake;
	guildId: Snowflake;
	channelId: Snowflake;
	timeStarted: DateTime;
	events: SessionEvent[];
}

export interface CompletedSession extends OngoingSession {
	timeEnded: DateTime;
}

export interface SessionLog extends CompletedSession {
	id: SessionLogId;
	timeStored: DateTime;
	timePushed: DateTime | undefined;
}

export type VoiceChannel = {
	id: Snowflake;
	guildId: Snowflake;
	memberUserIds: Snowflake[];
};

export type SessionOutput = {
	sesinfo: string;
	attdet: string;
	procdet: string;
};

export function generateSessionOutput(session: CompletedSession): SessionOutput {
	/* Generate csv string of session general information */

	let sesinfo = "date,owner,start,duration\n";
	sesinfo += `${formatDate(session.timeStarted, "DATE")},`;
	sesinfo += `${session.ownerId}` + ",";
	sesinfo += `${formatDate(session.timeStarted, "TME")},`;
	sesinfo += `${formatPeriod(session.timeEnded.toMillis() - session.timeStarted.toMillis(), "MINUTES")}\n`;

	/* Generate csv string of join/leave events in the session */

	let attdet = "sessionId,id,type,time\n";
	for (let i = 0; i < session.events.length; i++) {
		attdet += "stub-id" + ",";
		attdet += `${session.events[i].userId}` + ",";
		attdet += `${session.events[i].type}` + ",";
		attdet += `${formatDate(session.events[i].timeOccurred, "EXCEL")}\n`;
	}

	/* Generate csv string of attendance verdicts for the session's attendees */
	// TODO: Rediscover how this dark magic works

	const uniqueIds: Snowflake[] = [];
	session.events.forEach((event) => {
		if (!uniqueIds.includes(event.userId)) uniqueIds.push(event.userId);
	});

	const attendees: { id: Snowflake; duration: number; events: SessionEvent[] }[] = [];
	uniqueIds.forEach((uid) => {
		attendees.push({ id: uid, duration: 0, events: [] });
	});

	session.events.forEach((event) => {
		const attendee = attendees.find((attendee) => attendee.id === event.userId);
		attendee?.events.push(event);
	});

	attendees.forEach((attendee) => {
		attendee.events.forEach((event) => {
			attendee.duration +=
				(event.timeOccurred.toMillis() - session.timeStarted.toMillis()) * (event.type === "Join" ? -1 : 1);
		});
	});

	const sessionDuration = session.timeEnded.toMillis() - session.timeStarted.toMillis();

	let procdet = "id,perc,status,duration\n";
	attendees.forEach((attendee) => {
		procdet += `${attendee.id}` + ",";
		procdet += `${attendee.duration / sessionDuration},`;
		procdet += `${attendee.duration / sessionDuration > 0.8 ? "Hadir" : "Absen"},`;
		procdet += `${formatPeriod(attendee.duration, "MINUTES")}\n`;
	});

	/* Return the generated outputs */

	return { sesinfo, attdet, procdet };
}
