import { ApplicationCommandData, ApplicationCommandOptionType, ChannelType, ChatInputCommandInteraction, GuildMember, VoiceChannel } from "discord.js";
import * as fs from "fs";

import { AbstractCommandHandler } from "./abstractCommandHandler";
import { SessionEvent } from "../sessionLog";
import * as Util from "../util";

export class StopCommandHandler extends AbstractCommandHandler {
	public getSignature(): ApplicationCommandData {
		return {
			name: "stop",
			description: "Stops a session",
			options: [
				{
					name: "channel",
					description: "The voice channel that hosts the session to be stopped",
					type: ApplicationCommandOptionType.Channel,
					required: false
				}
			]
		};
	}

	public async exec(interaction: ChatInputCommandInteraction): Promise<void> {
		const executor = interaction.member as GuildMember;
		const argv = interaction.options;

		const targetGuildId = interaction.guildId;
		const targetChannel = (argv.getChannel("channel") ?? executor.voice.channel) as VoiceChannel;

		if (targetChannel === null) {
			console.log(`>>> Failed to stop session: ${executor.id} tried to stop a session without specifying which!`);
			await interaction.reply(`>>> Failed to stop session: <@${executor.id}> tried to stop a session without specifying which!`);
			return;
		}

		if (targetChannel.type !== ChannelType.GuildVoice) {
			console.log(`>>> Failed to stop session: ${executor.id} tried to stop a session somewhere it couldn't be in anyway!`);
			await interaction.reply(`>>> Failed to stop session: <@${executor.id}> tried to stop a session somewhere it couldn't be in anyway!`);
			return;
		}

		const session = global.ongoingSessions.get(`${targetGuildId}-${targetChannel.id}`);
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
		const fileBaseName = Util.formatDate(session.endTime!, "STD");
		fs.writeFileSync(`./run/${fileBaseName}-sesinfo.csv`, outputs.sesinfo);
		fs.writeFileSync(`./run/${fileBaseName}-attdet.csv`, outputs.attdet);
		fs.writeFileSync(`./run/${fileBaseName}-procdet.csv`, outputs.procdet);

		console.log(`>>> ${executor.id} stopped a session in ${targetChannel.id}!`);
		const storedLogId = await global.sessionLogStore.store({
			ownerId: session.owner,
			guildId: targetGuildId!,
			channelId: session.channel,
			timeStarted: session.startTime!,
			timeEnded: session.endTime!,
			events: session.events.map<SessionEvent>(e => {
				return {
					type: e.type == "JOIN" ? "Join" : "Leave",
					userId: e.uid,
					timeOccurred: e.time
				}
			})
		})

		const responseMessage = storedLogId == undefined
			? `FAILED to store the session log! Please push data before the next session.`
			: `<@${executor.id}> stopped a session in <#${targetChannel.id}>! Session Log stored as: ${storedLogId}`

		console.log(`>>> ` + responseMessage);

		await interaction.reply(`>>> ` + responseMessage);
		await interaction.followUp({
			embeds: [outputs.embed],
			files: [
				`./run/${fileBaseName}-sesinfo.csv`,
				`./run/${fileBaseName}-attdet.csv`,
				`./run/${fileBaseName}-procdet.csv`
			]
		});

		global.lastSession = session;

		global.ongoingSessions.delete(`${targetGuildId}-${targetChannel.id}`);
	}
};
