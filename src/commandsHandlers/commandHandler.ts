import { ChatInputCommandInteraction } from "discord.js";

export interface CommandHandler {
	handle(command: ChatInputCommandInteraction): Promise<void>;
}
