import { AbstractLogger } from "./abstractLogger";
import * as ctf from "../consoleTextFormatter";
import { LoggingLevel } from "./logger";

export class ConsoleLogger extends AbstractLogger {
	public constructor(level?: LoggingLevel) {
		super(level ?? LoggingLevel.Debug);
	}

	protected override _debug(message: string): Promise<void> {
		console.debug(`DEBUG: ${message}`)
		return Promise.resolve();
	}

	protected override _info(message: string): Promise<void> {
		console.info(`INFO: ${message}`);
		return Promise.resolve();
	}

	protected override _warn(message: string): Promise<void> {
		console.warn(`${ctf.yellow()}WARN:${ctf.reset()} ${message}`);
		return Promise.resolve();
	}

	protected override _error(message: string): Promise<void> {
		console.error(`${ctf.red()}ERROR:${ctf.reset()} ${message}`);
		return Promise.resolve();
	}

	protected override _fatal(message: string): Promise<void> {
		console.error(`${ctf.brightRed() + ctf.underline()}FATAL:${ctf.reset()} ${message}`);
		return Promise.resolve();
	}
}
