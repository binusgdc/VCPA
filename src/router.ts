import { ChatInputCommandInteraction, CacheType } from "discord.js";
import CommandHandler from "./commandsHandlers/commandHandler";

export default class RoutingCommandHandler implements CommandHandler {

    private handlers: Map<string, CommandHandler>
    private noRouteHandler: CommandHandler

    constructor(commands: { route: string, handler: CommandHandler }[], noRouteHandler: CommandHandler | undefined) {
        this.handlers = new Map();
        for (const { route, handler } of commands) {
            this.handlers.set(route, handler);
        }
        this.noRouteHandler = noRouteHandler ?? {
            async handle(interaction: ChatInputCommandInteraction) {
                await interaction.reply("Unknown command!");
            }
        };
    }
    async handle(command: ChatInputCommandInteraction): Promise<void> {
        const target = this.handlers.get(command.commandName);
        if (target === undefined) {
            await this.noRouteHandler.handle(command);
            return;
        }
        await target.handle(command);
    }
}