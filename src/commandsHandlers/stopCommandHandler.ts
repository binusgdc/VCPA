import { ApplicationCommandData, ApplicationCommandOptionType, ChannelType, ChatInputCommandInteraction, EmbedBuilder, VoiceChannel } from "discord.js";

import { AbstractCommandHandler } from "./abstractCommandHandler";
import { CompletedSession } from "../session/session";
import { SessionService } from "../session/sessionService";
import * as Util from "../util";

export class StopCommandHandler extends AbstractCommandHandler {
	public constructor(private readonly sessionService: SessionService) {
		super();
	}
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
	public async handle(interaction: ChatInputCommandInteraction): Promise<void> {

		if (interaction.guild === null) {
			return;
		}

		const targetChannel = interaction.options.getChannel("channel") ?? (await interaction.guild.members.fetch(interaction.user.id)).voice.channel;

		if (targetChannel === null) {
			console.log(`>>> Failed to stop session: ${interaction.user.id} tried to stop a session without specifying which!`);
			await interaction.reply(`>>> Failed to stop session: <@${interaction.user.id}> tried to stop a session without specifying which!`);
			return;
		}

		if (targetChannel.type !== ChannelType.GuildVoice) {
			console.log(`>>> Failed to stop session: ${interaction.user.id} tried to stop a session somewhere it couldn't be in anyway!`);
			await interaction.reply(`>>> Failed to stop session: <@${interaction.user.id}> tried to stop a session somewhere it couldn't be in anyway!`);
			return;
		}

		const stopSessionResult = await this.sessionService.stopSession({
			id: targetChannel.id,
			guildId: interaction.guild.id,
			memberUserIds: [...(targetChannel as VoiceChannel).members.mapValues(m => m.id).values()]
		})

		if (!stopSessionResult.ok) {
			if (stopSessionResult.error.type === "SessionNotFound") {
				console.log(`>>> Failed to stop session: ${interaction.user.id} tried to stop a non-existent session!`);
				await interaction.reply(`>>> Failed to stop session: <@${interaction.user.id}> tried to stop a non-existent session!`);
			}
			if (stopSessionResult.error.type === "LogNotStored") {
				console.log(`>>> FAILED to store the session log!`);
				await interaction.reply(`>>> FAILED to store the session log!`);
				const { sessionData, fileOutputPaths } = stopSessionResult.error.sessionOutput;
				await interaction.followUp({
					embeds: [this.buildEmbedFromSessionDetails(sessionData)],
					files: fileOutputPaths
				});
			}
			return;
		}

		const { sessionLog, fileOutputPaths } = stopSessionResult.value

		console.log(`${interaction.user.id} stopped a session in ${targetChannel.id}! Session Log stored as: ${sessionLog.id}`);
		await interaction.reply(`<@${interaction.user.id}> stopped a session in <#${targetChannel.id}>! Session Log stored as: ${sessionLog.id}`);
		await interaction.followUp({
			embeds: [this.buildEmbedFromSessionDetails(sessionLog)],
			files: fileOutputPaths
		})
	}

	private buildEmbedFromSessionDetails(session: CompletedSession): EmbedBuilder {
		return new EmbedBuilder()
			.setColor(Util.getRandomColor())
			.setTitle("Session Stats")
			.addFields(
				{ name: "Date", value: Util.formatDate(session.timeStarted, "DATE") },
				{ name: "Tutor ID", value: `${session.ownerId}` },
				{ name: "Start Time", value: Util.formatDate(session.timeStarted, "TME") },
				{ name: "Duration (minutes)", value: Util.formatPeriod(session.timeEnded.toMillis() - session.timeStarted.toMillis(), "MINUTES") },
				{ name: "Attendance Form", value: "[Google Form](https://docs.google.com/forms/d/e/1FAIpQLSdGjYqEQS9R4xK95_rwQHT-idPE0SBmbpD6g6ChBX4WFV_dCg/viewform?usp=sf_link)" }
			);
	}
}
