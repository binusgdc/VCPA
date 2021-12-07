import { ConfigFile, Session } from "../structures"

declare global {
	var config: ConfigFile;

	var sessions: Map<string, Session>;

	var BASE_DIR: string;
}
