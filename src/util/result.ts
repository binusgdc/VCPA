export interface Ok<T> {
    ok: true;
    value: T;
}

export interface Error<E> {
    ok: false;
    error: E;
}

export type Result<T, E = undefined> = Ok<T> | Error<E>;

export function error<E, T = undefined>(error: E): Result<T, E> {
    return {
        ok: false,
        error: error
    };
}

export function ok<T, E = undefined>(value: T): Result<T, E> {
    return {
        ok: true,
        value: value
    };
}