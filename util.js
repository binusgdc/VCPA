const dateFormat = require("dateformat");

function processSessionPart3(session) {
	let uniqueIds = [];
	session.events.forEach((event) => { if (!uniqueIds.includes(event.uid)) uniqueIds.push(event.uid); });

	let attendees = [];
	uniqueIds.forEach((uid) => { attendees.push({ id: uid, duration: 0, events: [] }); });

	session.events.forEach((event) => {
		let attendee = attendees.find((attendee) => { return attendee.id === event.uid; });
		attendee.events.push(event);
	});

	attendees.forEach((attendee) => {
		attendee.events.forEach((event) => {
			attendee.duration += (event.time.getTime() - session.start.getTime()) * ((event.type === "join") ? -1 : 1);
		});
	});

	let sessionDuration = session.end.getTime() - session.start.getTime();

	let output = "id,perc,status,duration\n";
	attendees.forEach((attendee) => {
		output += attendee.id + ",";
		output += (attendee.duration / sessionDuration) + ",";
		output += (((attendee.duration / sessionDuration) > 0.8) ? "pass" : "fail") + ",";
		output += attendee.duration + "\n";
	});

	return output;
}

module.exports = {
	formatDate: (date, style) => {
		switch (style) {
			case "verbose": {
				return dateFormat(date, "UTC:d mmmm yyyy HH:MM:ss.l \"UTC\"");
			} break;

			case "std": {
				return date.toISOString();
			} break;

			case "date": {
				return dateFormat(date, "UTC:yyyy-mm-dd");
			} break;

			case "time": {
				return dateFormat(date, "UTC:HH:MM");
			} break;

			case "excel": {
				const year = date.getUTCFullYear();
				const month = date.getUTCMonth();
				const day = date.getUTCDay();
				const hour = date.getUTCHours();
				const mins = date.getUTCMinutes();
				const secs = date.getUTCSeconds();
				const msecs = date.getUTCMilliseconds();

				return dateFormat(date, `${year}-${month}-${day} ${hour}:${mins}:${secs}.${msecs}`);
			} break;
		}
	},

	formatPeriod: (msecs, style) => {
		switch (style) {
			case "minutes": {
				return `${msecs / 1000 / 60}`;
			} break;

			case "verbose": {
				const secs = Math.floor(msecs / 1000);
				const mins = Math.floor(secs / 60);
				const hrs = Math.floor(mins / 60);

				return `${hrs} hours, ${mins % 60} minutes, ${secs % 60}.${msecs % 1000} seconds`;
			} break;
		}
	},

	processSession: (session) => {
		let output1 = "date,owner,start,duration\n";
		output1 += module.exports.formatDate(session.start, "date") + ",";
		output1 += `<@${session.owner}>` + ",";
		output1 += module.exports.formatDate(session.start, "time") + ",";
		output1 += module.exports.formatPeriod(session.end.getTime() - session.start.getTime(), "minutes") + "\n";

		let output2 = "tbd\n";

		let output3 = processSessionPart3(session) + "\n";

		return [output1, output2, output3];
	}
};
