import { ApplicationCommandData, ApplicationCommandOptionType, ChannelType, ChatInputCommandInteraction, GuildMember, VoiceChannel } from "discord.js";

import { Session } from "../structures";

export const signature : ApplicationCommandData = {
	name: "start",
	description: "Starts a session",
	options: [
		{
			name: "channel",
			description: "The voice channel to start the session in",
			type: ApplicationCommandOptionType.Channel,
			required: false
		}
	]
};

export async function exec(interaction : ChatInputCommandInteraction) {
	const executor = interaction.member as GuildMember;
	const argv = interaction.options;

	const targetGuild = interaction.guildId;
	const targetChannel = (argv.getChannel("channel") ?? executor.voice.channel) as VoiceChannel;

	if (targetChannel === null) {
		console.log(`>>> Failed to start session: ${executor.id} tried to start a session but they're not in a voice channel!`);
		await interaction.reply(`>>> Failed to start session: <@${executor.id}> tried to start a session but they're not in a voice channel!`);
		return;
	}

	if (targetChannel.type !== ChannelType.GuildVoice) {
		console.log(`>>> Failed to start session: ${executor.id} tried to start a session somewhere not a voice channel!`);
		await interaction.reply(`>>> Failed to start session: <@${executor.id}> tried to start a session somewhere not a voice channel!`);
		return
	};

	const session = global.ongoingSessions.get(`${targetGuild}-${targetChannel.id}`);
	if (session !== undefined) {
		console.log(`>>> Failed to start session: ${executor.id} tried to start a session in ${targetChannel.id} but a session is already running there!`);
		await interaction.reply(`>>> Failed to start a session: <@${executor.id}> tried to start a session <#${targetChannel.id}> but a session is already running there!`);
		return;
	}

	global.ongoingSessions.set(`${targetGuild}-${targetChannel.id}`, new Session(executor.id, targetChannel.id));
	const s = global.ongoingSessions.get(`${targetGuild}-${targetChannel.id}`)!;
	s.start();

	console.log(`>>> ${executor.id} started a session in ${targetChannel.id}!`);
	await interaction.reply(`>>> <@${executor.id}> started a session in <#${targetChannel.id}>!`);

	const members = targetChannel.members;
	members.forEach((member) => {
		// Pretend everyone joined at the same time as the session starts

		s.log("JOIN", member.id, s.startTime);
	});
}
