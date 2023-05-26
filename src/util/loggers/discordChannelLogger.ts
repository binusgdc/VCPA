import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";

import { AbstractLogger } from "./abstractLogger";
import { LoggingLevel } from "../logger";

export class DiscordChannelLogger extends AbstractLogger {
	private readonly client: REST
	private readonly channelId: string

	constructor(client: REST, channelId: string, level?: LoggingLevel | undefined) {
		super(level ?? LoggingLevel.Info)
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
