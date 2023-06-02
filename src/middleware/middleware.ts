import CommandHandler from "../commandsHandlers/commandHandler";

export default interface Middleware {
    apply(handler: CommandHandler): CommandHandler
}