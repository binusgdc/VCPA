import { ApplicationCommandData, CommandInteraction, GuildMember, VoiceChannel } from "discord.js";
import { Session } from "../structures";

export const signature : ApplicationCommandData = {
	name: "start",
	description: "Starts a session",
	options: [
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

	if (target === null) {
		console.log(`>>> Failed to start session: ${executor.id} tried to start a session but they're not in a voice channel!`);
		await interaction.reply(`>>> Failed to start session: <@${executor.id}> tried to start a session but they're not in a voice channel!`);
		return;
	}

	for (let i = 0; i < global.maxSessionCount; i++) {
		if (global.sessions[i]?.channel === target.id) {
			console.log(`>>> Failed to start session: ${executor.id} tried to start a session in ${target.id} but a session is already running there!`);
			await interaction.reply(`>>> Failed to start a session: <@${executor.id}> tried to start a session <#${target.id}> but a session is already running there!`);
			return;
		}
	}

	for (let i = 0; i < global.maxSessionCount; i++) {
		if (global.sessions[i] === undefined) {
			global.sessions[i] = new Session(executor.id, target.id);
			global.sessions[i].start();

			console.log(`>>> ${executor.id} started a session in ${target.id}!`);
			await interaction.reply(`>>> <@${executor.id}> started a session in <#${target.id}>!`);

			const members = target.members;
			members.forEach((member) => {
				global.sessions[i].log("JOIN", member.id);
			});

			return;
		}

		if (i === (global.maxSessionCount-1)) {
			console.log(`>>> Failed to start a session: ${executor.id} failed to start a session, no free sessions left!`);
			await interaction.reply(`>>> Failed to start a session: <@${executor.id}> failed to start a session, no free sessions left!`)
		}
	}
}
