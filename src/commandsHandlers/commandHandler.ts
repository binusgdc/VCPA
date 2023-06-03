import { ChatInputCommandInteraction } from "discord.js";

export default interface CommandHandler {
	handle(command: ChatInputCommandInteraction): Promise<void>
}
