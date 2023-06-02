import CommandHandler from "./commandsHandlers/commandHandler";
import { ServiceLocation } from "./structures"

export interface Filter {
    apply(handler: CommandHandler): CommandHandler
}

export class ServiceLocationsFilter implements Filter {

    private readonly serviceLocations: Map<string, ServiceLocation>

    constructor(serviceLocations: ServiceLocation[]) {
        this.serviceLocations = new Map();
        for (const location of serviceLocations) {
            this.serviceLocations.set(location.guildId, location)
        }
    }

    apply(handler: CommandHandler): CommandHandler {
        const serviceLocations = this.serviceLocations;
        return {
            async handle(command) {
                if (command.guild === null) return;
                const serviceLocation = serviceLocations.get(command.guild.id);
                if (serviceLocation === undefined) {
                    console.log(`>>> ${command.user.id} tried to issue commands from without being in a serviced guild!`);
                    await command.reply(`<@${command.user.id}> tried to issue commands without being in a serviced guild!`);
                    return;
                }
                const executorAsMember = await command.guild.members.fetch(command.user.id);
                if (!executorAsMember.roles.cache.hasAny(...serviceLocation.commandAccessRoleIds)) {
                    console.log(`>>> ${command.user.id} tried to issue commands without having the appropriate permission!`);
                    await command.reply(`<@${command.user.id}> tried to issue commands without having the appropriate permission!`);
                    return;
                }
                await handler.handle(command);
            }
        }
    }
}