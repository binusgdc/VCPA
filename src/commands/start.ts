import { ApplicationCommandData, CommandInteraction, GuildMember, VoiceChannel } from "discord.js";
import * as fs from "fs";

import { Session } from "../structures";
import * as Util from "../util";


async function stop(interaction: CommandInteraction, channel: VoiceChannel, session: Session){
	const executor = interaction.member as GuildMember;
	session.end();
	channel.members.forEach((member) => {
		session.log("LEAVE", member.id, session.endTime);
	});

	const outputs = Util.generateSessionOutput(session);

	const fileBaseName = Util.formatDate(session.endTime, "STD");
	fs.writeFileSync(`${fileBaseName}-sesinfo.csv`, outputs.sesinfo);
	fs.writeFileSync(`${fileBaseName}-attdet.csv`, outputs.attdet);
	fs.writeFileSync(`${fileBaseName}-procdet.csv`, outputs.procdet);
	console.log(`>>> stopping a session in ${channel.id}!`);

	await interaction.followUp(`>>> Stopping <@${executor.id}> session's in <#${channel.id}>!`);
	await interaction.followUp({
		embeds: [outputs.embed],
		files: [
			`${fileBaseName}-sesinfo.csv`,
			`${fileBaseName}-attdet.csv`,
			`${fileBaseName}-procdet.csv`
		]
	});
	return;
}


export const signature : ApplicationCommandData = {
	name: "start",
	description: "Starts a session",
	options: [
		{
			name: "duration",
			description: "The duration of the session (in minutes)",
			type: "NUMBER",
			required: false
		},
		{
			name: "channel",
			description: "The voice channel to start the session in",
			type: "CHANNEL",
			required: false
		}
	]
};

export async function exec(interaction : CommandInteraction) {
	const executor = interaction.member as GuildMember;
	const argv = interaction.options;

	const targetGuild = interaction.guildId;
	const targetChannel = (argv.getChannel("channel") ?? executor.voice.channel) as VoiceChannel;

	if (targetChannel === null) {
		console.log(`>>> Failed to start session: ${executor.id} tried to start a session but they're not in a voice channel!`);
		await interaction.reply(`>>> Failed to start session: <@${executor.id}> tried to start a session but they're not in a voice channel!`);
		return;
	}

	if (!targetChannel.isVoice()) {
		console.log(`>>> Failed to start session: ${executor.id} tried to start a session somewhere not a voice channel!`);
		await interaction.reply(`>>> Failed to start session: <@${executor.id}> tried to start a session somewhere not a voice channel!`);
		return
	};

	const session = global.sessions.get(`${targetGuild}-${targetChannel.id}`);
	if (session !== undefined) {
		console.log(`>>> Failed to start session: ${executor.id} tried to start a session in ${targetChannel.id} but a session is already running there!`);
		await interaction.reply(`>>> Failed to start a session: <@${executor.id}> tried to start a session <#${targetChannel.id}> but a session is already running there!`);
		return;
	}

	global.sessions.set(`${targetGuild}-${targetChannel.id}`, new Session(executor.id, targetChannel.id));
	const s = global.sessions.get(`${targetGuild}-${targetChannel.id}`);
	s.start();

	console.log(`>>> ${executor.id} started a session in ${targetChannel.id}!`);
	await interaction.reply(`>>> <@${executor.id}> started a session in <#${targetChannel.id}>!`);

	const members = targetChannel.members;
	members.forEach((member) => {
		// Pretend everyone joined at the same time as the session starts

		s.log("JOIN", member.id, s.startTime);
	});
}
