import { CompletedSession, SessionLogId, SessionLog } from "../session";

export interface SessionLogStore {
    store(completedSession: CompletedSession): Promise<SessionLogId | undefined>;
    retrieve(id: SessionLogId): Promise<SessionLog | undefined>;
    retrieveAll(): Promise<SessionLog[] | undefined>;
    delete(id: SessionLogId): Promise<void>;
    latestUnpushed(): Promise<SessionLog | undefined>;
    setLogPushed(id: SessionLogId): Promise<void>;
}
