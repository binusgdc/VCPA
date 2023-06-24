export interface Logger {
	debug(message: string): Promise<void>;
	info(message: string): Promise<void>;
	warn(message: string): Promise<void>;
	error(message: string): Promise<void>;
	fatal(message: string): Promise<void>;
}

export enum LoggingLevel {
	Debug = 0,
	Info = 1,
	Warn = 2,
	Error = 3,
	Fatal = 4,
	None = 5,
}
