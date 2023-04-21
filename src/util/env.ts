import { z } from "zod";

const schema = z.object({
	BOT_TOKEN: z.string()
}).required();

export type Env = {
	BOT_TOKEN: string
}

export function loadEnv(): Env | undefined {
	const env: Env = {
		BOT_TOKEN: process.env.BOT_TOKEN
	};
	const result = schema.safeParse(env);
	if (result.success && result.data.BOT_TOKEN != null) {
		return {
			BOT_TOKEN: result.data.BOT_TOKEN
		};
	}
	else return undefined;
}
