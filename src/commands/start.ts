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

	const target = (argv.getChannel("channel") ?? executor.voice.channel) as VoiceChannel;
	const duration = argv.getNumber("duration") * 60000;

	if (target === null) {
		console.log(`>>> Failed to start session: ${executor.id} tried to start a session but they're not in a voice channel!`);
		await interaction.reply(`>>> Failed to start session: <@${executor.id}> tried to start a session but they're not in a voice channel!`);
		return;
	}

	if (!target.isVoice()) {
		console.log(`>>> Failed to start session: ${executor.id} tried to start a session somewhere not a voice channel!`);
		await interaction.reply(`>>> Failed to start session: <@${executor.id}> tried to start a session somewhere not a voice channel!`);
		return
	};

	for (let i = 0; i < global.maxSessionCount; i++) {
		if (global.sessions[i]?.channel === target.id) {
			console.log(`>>> Failed to start session: ${executor.id} tried to start a session in ${target.id} but a session is already running there!`);
			await interaction.reply(`>>> Failed to start a session: <@${executor.id}> tried to start a session <#${target.id}> but a session is already running there!`);
			return;
		}
	}

	if (duration < 0 || duration >= Number.MAX_SAFE_INTEGER){
		return await interaction.reply("Invalid duration value");
	}

	for (let i = 0; i < global.maxSessionCount; i++) {
		if (global.sessions[i] === undefined) {
			global.sessions[i] = new Session(executor.id, target.id);
			global.sessions[i].start();

			console.log(`>>> ${executor.id} started a session in ${target.id}!`);
			if(duration == 0){
				await interaction.reply(`>>> <@${executor.id}> started a session in <#${target.id}>!`);
			} else {
				await interaction.reply(`>>> <@${executor.id}> started a session for ${duration / 60000} minute(s) in <#${target.id}>!`);
			}

			const members = target.members;
			members.forEach((member) => {
				// Pretend everyone joined at the same time as the session starts
				global.sessions[i].log("JOIN", member.id, global.sessions[i].startTime);
			});

			if(duration > 0){
				global.sessions[i].timeoutID = setTimeout(async () => {
					await stop(interaction, target, global.sessions[i]);
					global.sessions[i] = undefined;
				}, duration);
			}

			return;
		}

		if (i === (global.maxSessionCount-1)) {
			console.log(`>>> Failed to start a session: ${executor.id} failed to start a session, no free sessions left!`);
			await interaction.reply(`>>> Failed to start a session: <@${executor.id}> failed to start a session, no free sessions left!`)
		}
	}
}
