import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";

export interface Logger {
	debug(message:string): Promise<void>;
	info(message: string): Promise<void>;
	warn(message: string): Promise<void>;
	error(message: string): Promise<void>;
	fatal(message: string): Promise<void>;
}

export function noOp(): Logger {
	return new NoOpLogger();
}

export function composite(loggers: Logger[]): Logger {
	return new CompositeLogger(loggers);
}

class NoOpLogger implements Logger {
	public async debug(_message: string): Promise<void> {}
	public async info(_message: string): Promise<void> {}
	public async warn(_message: string): Promise<void> {}
	public async error(_message: string): Promise<void> {}
	public async fatal(_message: string): Promise<void> {}
}

class CompositeLogger implements Logger {
	
	private readonly loggers: Logger[]
	
	constructor(loggers: Logger[]) {
		this.loggers = loggers;
	}
	public async debug(message: string): Promise<void> {
		await Promise.allSettled(this.loggers.map(l => l.debug(message)));
	}
	public async info(message: string): Promise<void> {
		await Promise.allSettled(this.loggers.map(l => l.info(message)));
	}
	public async warn(message: string): Promise<void> {
		await Promise.allSettled(this.loggers.map(l => l.warn(message)));
	}
	public async error(message: string): Promise<void> {
		await Promise.allSettled(this.loggers.map(l => l.error(message)));
	}
	public async fatal(message: string): Promise<void> {
		await Promise.allSettled(this.loggers.map(l => l.fatal(message)));
	}
}

export type LoggingLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL" | "NONE"

abstract class AbstractLogger implements Logger {

	protected level: LoggingLevel

	constructor(level?: LoggingLevel | undefined) {
		this.level = level ?? "DEBUG"
	}

	async debug(message: string): Promise<void> {
		if (this.level != "DEBUG") return;
		await this._debug(message);
	}
	async info(message: string): Promise<void> {
		if (this.level != "DEBUG" && this.level != "INFO") return;
		await this._info(message);
	}
	async warn(message: string): Promise<void> {
		if (this.level != "DEBUG" && this.level != "INFO" && this.level != "WARN") return;
		await this._warn(message);
	}
	async error(message: string): Promise<void> {
		if (this.level != "DEBUG" && this.level != "INFO" && this.level != "WARN" && this.level != "ERROR") return;
		await this._error(message);
	}
	async fatal(message: string): Promise<void> {
		if (this.level != "DEBUG" && this.level != "INFO"  && this.level != "WARN" && this.level != "ERROR" && this.level != "FATAL") return;
		await this._fatal(message);
	}

	protected abstract _debug(message: string): Promise<void>;
	protected abstract _info(message: string): Promise<void>;
	protected abstract _warn(message: string): Promise<void>;
	protected abstract _error(message: string): Promise<void>;
	protected abstract _fatal(message: string): Promise<void>;

}

export class ConsoleLogger extends AbstractLogger {

	constructor(level?: LoggingLevel) {
		super(level ?? "DEBUG")
	}

	override async _debug(message: string): Promise<void> {
		console.log(`DEBUG: ${message}`)
	}
	override async _info(message: string): Promise<void> {
		console.log(`INFO: ${message}`);
	}
	override async _warn(message: string): Promise<void> {
		console.log(`WARN: ${message}`);
	}
	override async _error(message: string): Promise<void> {
		console.error(`ERROR: ${message}`);
	}
	override async _fatal(message: string): Promise<void> {
		console.error(`FATAL: ${message}`);
	}
}

export class DiscordChannelLogger extends AbstractLogger {

	private readonly client: REST
	private readonly channelId: string

	constructor(client: REST, channelId: string, level?: LoggingLevel | undefined) {
		super(level ?? "INFO")
		this.client = client;
		this.channelId = channelId;
	}

	override async _debug(message: string): Promise<void> {
		await this.sendMessageToLogChannel(`DEBUG: ${message}`);
	}
	override async _info(message: string): Promise<void> {
		await this.sendMessageToLogChannel(`INFO: ${message}`);
	}
	override async _warn(message: string): Promise<void> {
		await this.sendMessageToLogChannel(`WARN: ${message}`);
	}
	override async _error(message: string): Promise<void> {
		await this.sendMessageToLogChannel(`ERROR: ${message}`);
	}
	override async _fatal(message: string): Promise<void> {
		await this.sendMessageToLogChannel(`FATAL: ${message}`);
	}

	private async sendMessageToLogChannel(message: string): Promise<void> {
		await this.client.post(Routes.channelMessages(this.channelId), {
			body: {
				content: message
			}	
		})
	}
}
