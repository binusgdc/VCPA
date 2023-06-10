import { CommandHandler } from "../commandsHandlers/commandHandler";

export interface Filter {
	apply(handler: CommandHandler): CommandHandler;
}

export function pipe(first: Filter, ...rest: Filter[]): Filter {
	switch (rest.length) {
		case 0:
			return first;
		default:
			return [first, ...rest].reduce((prev, next) => {
				return {
					apply(handler) {
						return prev.apply(next.apply(handler))
					},
				}
			});
	}
}
