import { ConfigFile, Session } from "../structures"

declare global {
	var config: ConfigFile;

	var sessions: Session[];
	var maxSessionCount: number;

	var BASE_DIR: string;
}
