import { ChatInputCommandInteraction, Client, GuildMember } from "discord.js";

import { AbstractCommandHandler } from "./commandsHandlers/abstractCommandHandler";
import { ServiceLocation } from "./structures";

export type MasterCommandHandlerOptions = {
	client: Client;
	commandHandlers: AbstractCommandHandler[];
	serviceLocations: ServiceLocation[];
};

export class MasterCommandHandler {
	private commandHandlers: AbstractCommandHandler[];
	private serviceLocations: ServiceLocation[];

	public constructor(options: MasterCommandHandlerOptions) {
		this.commandHandlers = options.commandHandlers;
		this.serviceLocations = options.serviceLocations;
	}

	public registerCommandHandlers(commands: AbstractCommandHandler[]) {
		for (const command of commands) {
			this.commandHandlers.push(command);
		}
	}

	public registerServiceLocations(serviceLocations: ServiceLocation[]) {
		for (const serviceLocation of serviceLocations) {
			this.serviceLocations.push(serviceLocation);
		}
	}

	public async finalizeCommandHandlersRegistration(discordClient: Client) {
		for (const serviceLocation of this.serviceLocations) {
			// For every guild we plan to serve
			const guild = await discordClient.guilds.fetch(serviceLocation.guildId);

			// Start fresh
			guild.commands.set([]);

			// Add all the commands
			for (const commandHandler of this.commandHandlers) {
				await guild.commands.create(commandHandler.getSignature());
			}
		}
	}

	public async handle(interaction: ChatInputCommandInteraction) {
		if (!interaction.command) return;

		const executor = interaction.member as GuildMember;

		const executorGuild = interaction.guild;

		// Check if the command was issued from a location we service
		const requiredGuild = this.serviceLocations.filter((serviceLocation) => serviceLocation.guildId === executorGuild?.id);

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

		for (let i = 0; i < this.commandHandlers.length; i++) {
			if (executorCommand === this.commandHandlers[i].getSignature().name) {
				await this.commandHandlers[i].exec(interaction);
				return;
			}
		}
	}
};
