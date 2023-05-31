import { ApplicationCommandData, ChatInputCommandInteraction } from "discord.js";

export abstract class AbstractCommandHandler {
	public abstract getSignature(): ApplicationCommandData;
	public abstract exec(interaction: ChatInputCommandInteraction): Promise<void>;
};
