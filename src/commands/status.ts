import { ApplicationCommandData, CommandInteraction, MessageEmbed } from "discord.js";
import * as Util from "../util";

export const signature : ApplicationCommandData = {
	name: "status",
	description: "Queries the bot's status",
	options: [
		{
			name: "gift",
			description: "A gift for me??? UwU",
			type: "BOOLEAN",
			required: false
		}
	]
};

export async function exec(interaction : CommandInteraction) {
	await interaction.reply({
		embeds: [
			new MessageEmbed()
				.setColor(Util.getRandomColor())
				.setTitle("*Bot Status*")
				.addFields([
					{
						name: "Online",
						value: "Yes! No... Maybe?"
					},

					{
						name: "Time",
						value: `It _was_ ${Util.dtnow().toString()}... This ain't instant messaging, though!`
					},

					{
						name: "Emotion",
						value: (interaction.options.getBoolean("gift") ? "OMG GIFT!!! :Yeee:" : ":sad:")
					}
				])
		]
	});
};
