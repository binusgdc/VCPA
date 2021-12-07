import { ApplicationCommandData, CommandInteraction, GuildMember, VoiceChannel } from "discord.js";
import * as fs from "fs";

import * as Util from "../util";

export const signature : ApplicationCommandData = {
	name: "stop",
	description: "Stops a session",
	options: [
		{
			name: "channel",
			description: "The voice channel that hosts the session to be stopped",
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
		console.log(`>>> Failed to stop session: ${executor.id} tried to stop a session without specifying which!`);
		await interaction.reply(`>>> Failed to stop session: <@${executor.id}> tried to stop a session without specifying which!`);
		return;
	}

	if (!targetChannel.isVoice()) {
		console.log(`>>> Failed to stop session: ${executor.id} tried to stop a session somewhere it couldn't be in anyway!`);
		await interaction.reply(`>>> Failed to stop session: <@${executor.id}> tried to stop a session somewhere it couldn't be in anyway!`);
	}

	const session = global.sessions.get(`${targetGuild}-${targetChannel.id}`);
	if (session === undefined) {
		console.log(`>>> Failed to stop session: ${executor.id} tried to stop a non-existent session!`);
		await interaction.reply(`>>> Failed to stop session: <@${executor.id}> tried to stop a non-existent session!`);
		return;
	}

	session.end();

	const leftovers = targetChannel.members;
	leftovers.forEach((leftover) => {
		// Pretend everyone left at the same time as the session ends

		session.log("LEAVE", leftover.id, session.endTime);
	});

	const outputs = Util.generateSessionOutput(session);
	const fileBaseName = Util.formatDate(session.endTime, "STD");
	fs.writeFileSync(`${fileBaseName}-sesinfo.csv`, outputs.sesinfo);
	fs.writeFileSync(`${fileBaseName}-attdet.csv`, outputs.attdet);
	fs.writeFileSync(`${fileBaseName}-procdet.csv`, outputs.procdet);

	console.log(`>>> ${executor.id} stopped a session in ${targetChannel.id}!`);
	await interaction.reply(`>>> <@${executor.id}> stopped a session in <#${targetChannel.id}>!`);
	await interaction.followUp({
		embeds: [outputs.embed],
		files: [
			`${fileBaseName}-sesinfo.csv`,
			`${fileBaseName}-attdet.csv`,
			`${fileBaseName}-procdet.csv`
		]
	});

	global.sessions.delete(`${targetGuild}-${targetChannel.id}`);
}
