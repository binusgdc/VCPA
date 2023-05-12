import { z } from "zod";

const schema = z.object({
	BOT_TOKEN: z.string(),
	AIRTABLE_KEY: z.string().or(z.undefined())
}).required();

export type Env = {
	BOT_TOKEN: string
	AIRTABLE_KEY: string | undefined
}

export function loadEnv(): Env | undefined {
	const result = schema.safeParse({
		BOT_TOKEN: process.env.BOT_TOKEN,
		AIRTABLE_KEY: process.env.AIRTABLE_KEY
	});
	if (result.success) {
		return {
			BOT_TOKEN: result.data.BOT_TOKEN,
			AIRTABLE_KEY: result.data.AIRTABLE_KEY
		};
	}
	else return undefined;
}
