import {
    ApplicationCommandData,
    ChannelType,
    ChatInputCommandInteraction,
    GuildMember,
    VoiceChannel,
} from "discord.js"

import { AbstractCommandHandler } from "./abstractCommandHandler"

export class LowerHandCommandHandler extends AbstractCommandHandler {
    public getSignature(): ApplicationCommandData {
        return {
            name: "lowerhand",
            description: "Lower your hand after you're satisfied with the host's response",
            options: [],
        }
    }

    public async handle(interaction: ChatInputCommandInteraction): Promise<void> {
        const executor = interaction.member as GuildMember
        const targetChannel = executor.voice.channel as VoiceChannel

        if (targetChannel === null || targetChannel.type !== ChannelType.GuildVoice) {
            console.log(`>>> Failed to lower hand: ${executor.id} is not in a voice channel!`)
            await interaction.reply({
                content: `Failed to lower hand: You're not in a voice channel!`,
                ephemeral: true,
            })

            return
        }

        const username = executor.nickname ?? executor.user.username

        if (!username.startsWith("![✋] ")) {
            console.log(`>>> Failed to lower hand: ${executor.id}'s hand is already lowered!`)
            await interaction.reply({
                content: "Failed to lower hand: Your hand is already lowered!",
                ephemeral: true,
            })

            return
        }

        await executor.setNickname(username.substring(5))
        console.log(`>>> User ${executor.id} lowered their hand!`)
        await interaction.reply({
            content: "Lowered hand!",
            ephemeral: true,
        })
    }
}
