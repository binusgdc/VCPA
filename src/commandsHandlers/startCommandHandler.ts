import {
    ApplicationCommandData,
    ApplicationCommandOptionType,
    ChannelType,
    ChatInputCommandInteraction,
    VoiceChannel,
} from "discord.js"

import { AbstractCommandHandler } from "./abstractCommandHandler"
import { SessionService } from "../session/sessionService"

export class StartCommandHandler extends AbstractCommandHandler {
    private readonly sessionService: SessionService

    public constructor(sessionService: SessionService) {
        super()
        this.sessionService = sessionService
    }

    public getSignature(): ApplicationCommandData {
        return {
            name: "start",
            description: "Starts a session",
            options: [
                {
                    name: "channel",
                    description: "The voice channel to start the session in",
                    type: ApplicationCommandOptionType.Channel,
                    required: false,
                },
            ],
        }
    }

    public async handle(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply()

        if (interaction.guild === null) {
            return
        }

        const targetChannel =
            interaction.options.getChannel("channel") ??
            (await interaction.guild.members.fetch(interaction.user.id)).voice.channel

        if (targetChannel === null) {
            console.log(
                `>>> Failed to start session: ${interaction.user.id} tried to start a session but they're not in a voice channel!`
            )
            await interaction.editReply(
                `>>> Failed to start session: <@${interaction.user.id}> tried to start a session but they're not in a voice channel!`
            )
            return
        }

        if (targetChannel.type !== ChannelType.GuildVoice) {
            console.log(
                `>>> Failed to start session: ${interaction.user.id} tried to start a session somewhere not a voice channel!`
            )
            await interaction.editReply(
                `>>> Failed to start session: <@${interaction.user.id}> tried to start a session somewhere not a voice channel!`
            )
            return
        }

        const startSessionResult = await this.sessionService.startSession(interaction.user.id, {
            id: targetChannel.id,
            guildId: interaction.guild.id,
            memberUserIds: [
                ...(targetChannel as VoiceChannel).members.mapValues((m) => m.id).values(),
            ],
        })

        if (!startSessionResult.ok) {
            if (startSessionResult.error === "SessionOngoing") {
                console.log(
                    `>>> Failed to start session: ${interaction.user.id} tried to start a session in ${targetChannel.id} but a session is already running there!`
                )
                await interaction.editReply(
                    `>>> Failed to start a session: <@${interaction.user.id}> tried to start a session <#${targetChannel.id}> but a session is already running there!`
                )
            }
            return
        }

        console.log(`>>> ${interaction.user.id} started a session in ${targetChannel.id}!`)
        await interaction.editReply(
            `>>> <@${interaction.user.id}> started a session in <#${targetChannel.id}>!`
        )
    }
}
