import { ChatInputCommandInteraction } from "discord.js";
import CommandHandler from "./commandsHandlers/commandHandler";

export default class RoutingCommandHandler implements CommandHandler {
	private handlers: Map<string, CommandHandler>

	public constructor(commands: { route: string, handler: CommandHandler }[]) {
		this.handlers = new Map();

		for (const { route, handler } of commands) {
			this.handlers.set(route, handler);
		}
	}

	public async handle(command: ChatInputCommandInteraction): Promise<void> {
		const target = this.handlers.get(command.commandName);
		if (target === undefined) return;
		await target.handle(command);
	}
}
