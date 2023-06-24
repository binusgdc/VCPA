import { Logger } from "./logger";

export class CompositeLogger implements Logger {
	private readonly loggers: Logger[];

	public constructor(loggers: Logger[]) {
		this.loggers = loggers;
	}

	public async debug(message: string): Promise<void> {
		await Promise.allSettled(this.loggers.map((l) => l.debug(message)));
	}

	public async info(message: string): Promise<void> {
		await Promise.allSettled(this.loggers.map((l) => l.info(message)));
	}

	public async warn(message: string): Promise<void> {
		await Promise.allSettled(this.loggers.map((l) => l.warn(message)));
	}

	public async error(message: string): Promise<void> {
		await Promise.allSettled(this.loggers.map((l) => l.error(message)));
	}

	public async fatal(message: string): Promise<void> {
		await Promise.allSettled(this.loggers.map((l) => l.fatal(message)));
	}
}
