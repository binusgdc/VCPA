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

export function composeLoggers(loggers: Logger[]) {
	return new ComposeLogger(loggers);
}

class NoOpLogger implements Logger {
	public async debug(message: string): Promise<void> {}
	public async info(message: string): Promise<void> {}
	public async warn(message: string): Promise<void> {}
	public async error(message: string): Promise<void> {}
	public async fatal(message: string): Promise<void> {}
}

class ComposeLogger implements Logger {
	
	private readonly loggers: Logger[]
	
	constructor(loggers: Logger[]) {
		this.loggers = loggers;
	}
	public async debug(message: string): Promise<void> {
		this.loggers.forEach(l => l.debug(message));
	}
	public async info(message: string): Promise<void> {
		this.loggers.forEach(l => l.info(message));
	}
	public async warn(message: string): Promise<void> {
		this.loggers.forEach(l => l.warn(message));
	}
	public async error(message: string): Promise<void> {
		this.loggers.forEach(l => l.error(message));
	}
	public async fatal(message: string): Promise<void> {
		this.loggers.forEach(l => l.fatal(message));
	}
}

export class DiscordChannelLogger implements Logger {

	private readonly client: REST
	private readonly channelId: string

	constructor(client: REST, channelId: string) {
		this.client = client;
		this.channelId = channelId;
	}

	public async debug(message: string): Promise<void> {
		await this.sendMessageToLogChannel(`DEBUG: ${message}`);
	}
	public async info(message: string): Promise<void> {
		await this.sendMessageToLogChannel(`INFO: ${message}`);
	}
	public async warn(message: string): Promise<void> {
		await this.sendMessageToLogChannel(`WARN: ${message}`);
	}
	public async error(message: string): Promise<void> {
		await this.sendMessageToLogChannel(`ERROR: ${message}`);
	}
	public async fatal(message: string): Promise<void> {
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
