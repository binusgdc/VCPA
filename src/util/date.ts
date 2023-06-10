import { DateTime, Duration } from "luxon";

export interface DateTimeProvider {
	now(): DateTime;
}

export function dtnow() {
	return DateTime.utc();
}

type FormatDateStyle = "VERBOSE" | "STD" | "DATE" | "TME" | "EXCEL";

export function formatDate(date: DateTime, style: FormatDateStyle) {
	switch (style) {
		case "VERBOSE":
			return date.setZone("UTC+7").toFormat("d MMMM yyyy HH:mm:ss.SSS 'UTC'Z");
		case "STD":
			return date.toString();
		case "DATE":
			return date.setZone("UTC+7").toFormat("yyyy-MM-dd");
		case "TME":
			return date.setZone("UTC+7").toFormat("HH:mm");
		case "EXCEL":
			return date.setZone("UTC+7").toFormat("yyyy-MM-dd HH:mm:ss.SSS");
	}
}

type FormatPeriodStyle = "MINUTES" | "VERBOSE";

export function formatPeriod(msecs: number, style: FormatPeriodStyle) {
	switch (style) {
		case "MINUTES": {
			return `${msecs / 1000 / 60}`;
		}
		case "VERBOSE": {
			const period = Duration.fromMillis(msecs);
			return period.toFormat("h 'hours,' m 'minutes,' s'.'S 'seconds");
		}
	}
}
