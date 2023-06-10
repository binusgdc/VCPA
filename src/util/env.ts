import { z } from "zod";

const schema = z.object({
	DISCORD_BOT_TOKEN: z.string().or(z.undefined()),
	AIRTABLE_API_KEY: z.string().or(z.undefined())
});

export type Env = z.infer<typeof schema>

export function loadEnv(): Env | undefined {
	const result = schema.safeParse({
		DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
		AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY
	});

	if (result.success) {
		return {
			DISCORD_BOT_TOKEN: result.data.DISCORD_BOT_TOKEN,
			AIRTABLE_API_KEY: result.data.AIRTABLE_API_KEY
		};
	} else {
		return undefined;
	}
}
