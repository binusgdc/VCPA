import { SessionRecordStore } from "../sessionRecord";
import { ConfigFile, Session } from "../structures"

declare global {
	var config: ConfigFile;

	var ongoingSessions: Map<string, Session>;
	var sessionRecordStore: SessionRecordStore;
	var lastSession: Session;

	var BASE_DIR: string;
}
