import { ApplicationCommandData, ChatInputCommandInteraction } from "discord.js";

import { CommandHandler } from "./commandHandler";

export abstract class AbstractCommandHandler implements CommandHandler {
	public abstract getSignature(): ApplicationCommandData;
	public abstract handle(command: ChatInputCommandInteraction): Promise<void>;
}
