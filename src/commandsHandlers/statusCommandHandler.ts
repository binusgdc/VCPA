import {
    ApplicationCommandData,
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from "discord.js"

import { AbstractCommandHandler } from "./abstractCommandHandler"
import * as Date from "../util/date"
import * as Random from "../util/random"

export class StatusCommandHandler extends AbstractCommandHandler {
    public override getSignature(): ApplicationCommandData {
        return {
            name: "status",
            description: "Queries the bot's status",
            options: [
                {
                    name: "gift",
                    description: "A gift for me??? UwU",
                    type: ApplicationCommandOptionType.Boolean,
                    required: false,
                },
            ],
        }
    }

    public override async handle(interaction: ChatInputCommandInteraction) {
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(Random.getRandomColor())
                    .setTitle("*Bot Status*")
                    .addFields([
                        {
                            name: "Online",
                            value: "Yes! No... Maybe?",
                        },

                        {
                            name: "Time",
                            value: `It _was_ ${Date.dtnow().toString()}... This ain't instant messaging, though!`,
                        },

                        {
                            name: "Emotion",
                            value: interaction.options.getBoolean("gift")
                                ? "OMG GIFT!!! :Yeee:"
                                : ":sad:",
                        },
                    ]),
            ],
        })
    }
}
