import { Logger, LoggingLevel } from "./logger";

export abstract class AbstractLogger implements Logger {
	protected level: LoggingLevel

	protected constructor(level?: LoggingLevel | undefined) {
		this.level = level ?? LoggingLevel.Debug
	}

	public async debug(message: string): Promise<void> {
		if (this.level > LoggingLevel.Debug) return;
		await this._debug(message);
	}

	public async info(message: string): Promise<void> {
		if (this.level > LoggingLevel.Info) return;
		await this._info(message);
	}

	public async warn(message: string): Promise<void> {
		if (this.level > LoggingLevel.Warn) return;
		await this._warn(message);
	}

	public async error(message: string): Promise<void> {
		if (this.level > LoggingLevel.Error) return;
		await this._error(message);
	}

	public async fatal(message: string): Promise<void> {
		if (this.level > LoggingLevel.Fatal) return;
		await this._fatal(message);
	}

	protected abstract _debug(message: string): Promise<void>;
	protected abstract _info(message: string): Promise<void>;
	protected abstract _warn(message: string): Promise<void>;
	protected abstract _error(message: string): Promise<void>;
	protected abstract _fatal(message: string): Promise<void>;

}
