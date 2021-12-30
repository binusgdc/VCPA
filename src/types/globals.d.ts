import { ConfigFile, Session } from "../structures"

declare global {
	var config: ConfigFile;

	var sessions: Map<string, Session>;
	var lastSession: string;

	var BASE_DIR: string;
}
