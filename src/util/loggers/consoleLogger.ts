import { AbstractLogger } from "./abstractLogger";
import { LoggingLevel } from "../logger";
import * as ctf from "../consoleTextFormatter";

export class ConsoleLogger extends AbstractLogger {
	constructor(level?: LoggingLevel) {
		super(level ?? LoggingLevel.Debug)
	}

	override async _debug(message: string): Promise<void> {
		console.debug(`DEBUG: ${message}`)
	}

	override async _info(message: string): Promise<void> {
		console.info(`INFO: ${message}`);
	}

	override async _warn(message: string): Promise<void> {
		console.warn(`${ctf.yellow()}WARN:${ctf.reset()} ${message}`);
	}

	override async _error(message: string): Promise<void> {
		console.error(`${ctf.red()}ERROR:${ctf.reset()} ${message}`);
	}

	override async _fatal(message: string): Promise<void> {
		console.error(`${ctf.brightRed() + ctf.underline()}FATAL:${ctf.reset()} ${message}`);
	}
}
