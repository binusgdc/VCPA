import { AbstractLogger } from "./abstractLogger";
import { LoggingLevel } from "../logger";

export class ConsoleLogger extends AbstractLogger {
	// Color codes obtained from MS docs
	// https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences

	constructor(level?: LoggingLevel) {
		super(level ?? LoggingLevel.Debug)
	}

	override async _debug(message: string): Promise<void> {
		console.log(`DEBUG: ${message}`)
	}

	override async _info(message: string): Promise<void> {
		console.log(`INFO: ${message}`);
	}

	override async _warn(message: string): Promise<void> {
		console.log(`\x1B[33mWARN:\x1B[0m ${message}`);
	}

	override async _error(message: string): Promise<void> {
		console.error(`\x1B[31mERROR:\x1B[0m ${message}`);
	}

	override async _fatal(message: string): Promise<void> {
		console.error(`\x1B[91m\x1B[4mFATAL:\x1B[0m ${message}`);
	}
}
