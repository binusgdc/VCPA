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

	const target = (argv.getChannel("channel") ?? executor.voice.channel) as VoiceChannel;

	if (target === null) {
		console.log(`>>> Failed to stop session: ${executor.id} tried to stop a session without specifying which!`);
		await interaction.reply(`>>> Failed to stop session: <@${executor.id}> tried to stop a session without specifying which!`);
		return;
	}

	if (!target.isVoice()) {
		console.log(`>>> Failed to stop session: ${executor.id} tried to stop a session somewhere it couldn't be in anyway!`);
		await interaction.reply(`>>> Failed to stop session: <@${executor.id}> tried to stop a session somewhere it couldn't be in anyway!`);
	}

	for (let i = 0; i < global.maxSessionCount; i++) {
		if (global.sessions[i] !== undefined) {
			if (global.sessions[i].channel === target.id) {
				global.sessions[i].end();
				if(global.sessions[i].timeoutID){
					// Clear session timeoutID if still exist (*stoping before duration)
					clearTimeout(global.sessions[i].timeoutID);
				}

				const leftovers = target.members;
				leftovers.forEach((leftover) => {
					// Pretend everyone left at the same time as the session ends

					global.sessions[i].log("LEAVE", leftover.id, global.sessions[i].endTime);
				});

				const outputs = Util.generateSessionOutput(global.sessions[i]);

				const fileBaseName = Util.formatDate(global.sessions[i].endTime, "STD");
				fs.writeFileSync(`${fileBaseName}-sesinfo.csv`, outputs.sesinfo);
				fs.writeFileSync(`${fileBaseName}-attdet.csv`, outputs.attdet);
				fs.writeFileSync(`${fileBaseName}-procdet.csv`, outputs.procdet);

				console.log(`>>> ${executor.id} stopped a session in ${target.id}!`);
				await interaction.reply(`>>> <@${executor.id}> stopped a session in <#${target.id}>!`);

				await interaction.followUp({
					embeds: [outputs.embed],
					files: [
						`${fileBaseName}-sesinfo.csv`,
						`${fileBaseName}-attdet.csv`,
						`${fileBaseName}-procdet.csv`
					]
				});

				global.sessions[i] = undefined;

				return;
			}
		}

		if (i === (global.maxSessionCount-1)) {
			console.log(`>>> Failed to stop session: ${executor.id} tried to stop a non-existent session!`);
			await interaction.reply(`>>> Failed to stop session: <@${executor.id}> tried to stop a non-existent session!`);
		}
	}
}
