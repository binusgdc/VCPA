import { SessionLogStore } from "../sessionLog";
import { ConfigFile, Session } from "../structures"
import { Env } from "../util/env"

declare global {
	var env: Env;
	var config: ConfigFile;

	var ongoingSessions: Map<string, Session>;
	var sessionLogStore: SessionLogStore;
	var lastSession: Session | undefined;

	var BASE_DIR: string;
	var pushlogTarget: PushlogTarget | undefined;
}
