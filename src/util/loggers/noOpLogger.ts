import { AbstractLogger } from "./abstractLogger"

export class NoOpLogger extends AbstractLogger {
	protected override async _debug(message: string) {}
	protected override async _info(message: string) {}
	protected override async _warn(message: string) {}
	protected override async _fatal(message: string) {}
	protected override async _error(message: string) {}
}
