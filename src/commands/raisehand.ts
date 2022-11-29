import { CommandInteraction, GuildMember, VoiceChannel } from "discord.js";

export const signature = {
	name: "raisehand",
	description: "Raise your hand to get the host's attention",
	options: []
};

export async function exec(interaction : CommandInteraction) {
	const executor = interaction.member as GuildMember;
	const targetChannel = executor.voice.channel as VoiceChannel;

	if (targetChannel === null || !targetChannel.isVoice()) {
		console.log(`>>> Failed to raise hand: ${executor.id} is not in a voice channel!`);
		await interaction.reply({
			content: `Failed to raise hand: You're not in a voice channel!`,
			ephemeral: true
		});

		return;
	}

	const username = executor.nickname ?? executor.user.username;

	if (username.startsWith("![✋] ")) {
		console.log(`>>> Failed to raise hand: ${executor.id}'s hand is already raised!`);
		await interaction.reply({
			content: "Failed to raise hand: Your hand is already raised!",
			ephemeral: true
		});

		return;
	}

	executor.setNickname("![✋] " + username);
	console.log(`>>> User ${executor.id} raised their hand!`);
	await interaction.reply({
		content: "Raised hand!",
		ephemeral: true
	});
}
