import { Client, CommandInteraction, GuildMember } from "discord.js";

import * as command_start from "./commands/start";
import * as command_status from "./commands/status";
import * as command_stop from "./commands/stop";

const commands = [
	command_start,
	command_status,
	command_stop
];

export async function register(client : Client) {
	const clientGuild = client.guilds.cache.get(global.config.clientGuildId);

	clientGuild.commands.set([]);

	commands.forEach(async (command) => {
		await clientGuild.commands.create(command.signature);
	});
}

export async function handle(interaction : CommandInteraction) {
	const executor = interaction.member as GuildMember;

	const executorGuild = interaction.guild.id;
	const requiredGuild = global.config.clientGuildId;

	if (executorGuild !== requiredGuild) {
		console.log(`>>> ${executor.id} tried to issue commands without being in the appropriate guild!`);
		await interaction.reply(`<@${executor.id}> tried to issue commands without being in the appropriate guild!`);
		return;
	}

	const executorRoles = executor.roles;
	const requiredRole = global.config.clientCommandAccessRoleId;

	if (!executorRoles.cache.has(requiredRole)) {
		console.log(`>>> ${executor.id} tried to issue commands without having the appropriate permission!`);
		await interaction.reply(`<@${executor.id}> tried to issue commands without having the appropriate permission!`);
		return;
	}

	const executorCommand = interaction.command.name;

	for (let i = 0; i < commands.length; i++) {
		if (executorCommand === commands[i].signature.name) {
			await commands[i].exec(interaction);
			return;
		}
	}
};
