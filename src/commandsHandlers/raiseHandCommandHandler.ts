import {
	ApplicationCommandData,
	ChannelType,
	ChatInputCommandInteraction,
	GuildMember,
	VoiceChannel,
} from "discord.js";

import { AbstractCommandHandler } from "./abstractCommandHandler";

export class RaiseHandCommandHandler extends AbstractCommandHandler {
	public getSignature(): ApplicationCommandData {
		return {
			name: "raisehand",
			description: "Raise your hand to get the host's attention",
			options: [],
		};
	}

	public async handle(interaction: ChatInputCommandInteraction): Promise<void> {
		const executor = interaction.member as GuildMember;
		const targetChannel = executor.voice.channel as VoiceChannel;

		if (targetChannel === null || targetChannel.type !== ChannelType.GuildVoice) {
			console.log(`>>> Failed to raise hand: ${executor.id} is not in a voice channel!`);
			await interaction.reply({
				content: `Failed to raise hand: You're not in a voice channel!`,
				ephemeral: true,
			});

			return;
		}

		const username = executor.nickname ?? executor.user.username;

		if (username.startsWith("![✋] ")) {
			console.log(`>>> Failed to raise hand: ${executor.id}'s hand is already raised!`);
			await interaction.reply({
				content: "Failed to raise hand: Your hand is already raised!",
				ephemeral: true,
			});

			return;
		}

		await executor.setNickname(`![✋] ${username}`);
		console.log(`>>> User ${executor.id} raised their hand!`);
		await interaction.reply({
			content: "Raised hand!",
			ephemeral: true,
		});
	}
}
