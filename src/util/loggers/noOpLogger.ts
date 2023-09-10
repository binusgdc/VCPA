import { AbstractLogger } from "./abstractLogger"

export class NoOpLogger extends AbstractLogger {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected override _debug(_message: string) {
        return Promise.resolve()
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected override _info(_message: string) {
        return Promise.resolve()
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected override _warn(_message: string) {
        return Promise.resolve()
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected override _fatal(_message: string) {
        return Promise.resolve()
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected override _error(_message: string) {
        return Promise.resolve()
    }
}
