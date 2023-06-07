import { CommandHandler } from "../commandsHandlers/commandHandler";

export interface Filter {
	apply(handler: CommandHandler): CommandHandler
}

