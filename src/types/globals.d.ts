import { SessionLogStore } from "../sessionLog";
import { Session } from "../structures"
import { Env } from "../util/env"

declare global {
	var env: Env;

	var sessionLogStore: SessionLogStore;
	var lastSession: Session | undefined;

	var BASE_DIR: string;
	var pushlogTarget: PushlogTarget | undefined;
}
