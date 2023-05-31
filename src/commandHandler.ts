import { ChatInputCommandInteraction, Client, GuildMember } from "discord.js";

import * as command_start from "./commands/start";
import * as command_status from "./commands/status";
import * as command_stop from "./commands/stop";
import * as command_raisehand from "./commands/raisehand";
import * as command_lowerhand from "./commands/lowerhand";
import * as command_pushlog from "./commands/pushlog";
import { ServiceLocation } from "./structures";

const commands = [
	command_start,
	command_status,
	command_stop,
	command_raisehand,
	command_lowerhand,
	command_pushlog
];

export async function register(client : Client, serviceLocations: ServiceLocation[]) {
	for (const serviceLocation of serviceLocations) {
		// For every guild we plan to serve
		const guild = await client.guilds.fetch(serviceLocation.guildId);

		// Start fresh
		guild.commands.set([]);

		// Add all the commands
		for (const command of commands) {
			await guild.commands.create(command.signature);
		}
	}
}

export async function handle(interaction : ChatInputCommandInteraction, serviceLocations: ServiceLocation[]) {
	if (!interaction.command) return;

	const executor = interaction.member as GuildMember;

	const executorGuild = interaction.guild;

	// Check if the command was issued from a location we service
	const requiredGuild = serviceLocations.filter((serviceLocation) => serviceLocation.guildId === executorGuild?.id);

	if (requiredGuild.length <= 0) {
		console.log(`>>> ${executor.id} tried to issue commands from without being in a serviced guild!`);
		await interaction.reply(`<@${executor.id}> tried to issue commands without being in a serviced guild!`);
		return;
	}

	// Check if the command executor has at least one of the roles allowed to use the bot
	const executorRoles = executor.roles;
	const authorizedRoles = requiredGuild[0].commandAccessRoleIds;

	if (!executorRoles.cache.hasAny(...authorizedRoles)) {
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
