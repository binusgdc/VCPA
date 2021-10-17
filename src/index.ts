import * as jsonfile from "jsonfile";
import { Client, Intents } from "discord.js";

import * as commandHandler from "./commandHandler";

global.config = jsonfile.readFileSync("./config.json");

global.sessions = [];
global.maxSessionCount = 3;

const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_VOICE_STATES
	]
});

client.on("ready", async () => {
	await commandHandler.register(client);

	console.log(`>>> Logged in as ${client.user.tag}`);
	console.log(`>>> Bonjour!`);
});

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isCommand()) return;
	await commandHandler.handle(interaction);
});

client.on("voiceStateUpdate", (oldState, newState) => {
	const person = newState.id;
	const oldChannel = oldState.channelId;
	const newChannel = newState.channelId;

	if ((oldChannel === null) && (newChannel !== null)) {
		// User was not in a voice channel, and now joined our voice channel

		for (let i = 0; i < global.maxSessionCount; i++) {
			if (global.sessions[i] !== undefined) {
				if (global.sessions[i].channel === newChannel) {
					global.sessions[i].log("JOIN", person);
				}
			}
		}
	} else if ((oldChannel !== null) && (newChannel === null)) {
		// User was in our voice channel, and now isn't in a voice channel

		for (let i = 0; i < global.maxSessionCount; i++) {
			if (global.sessions[i] !== undefined) {
				if (global.sessions[i].channel === oldChannel) {
					global.sessions[i].log("LEAVE", person);
				}
			}
		}
	} else if ((oldChannel !== null) && (newChannel !== null)) {
		// User was in a different voice channel, and now is in our voice channel

		for (let i = 0; i < global.maxSessionCount; i++) {
			if (global.sessions[i] !== undefined) {
				if (global.sessions[i].channel === newChannel) {
					global.sessions[i].log("JOIN", person);
				}

				if (global.sessions[i].channel === oldChannel) {
					global.sessions[i].log("LEAVE", person);
				}
			}
		}
	}
})

client.login(global.config.token);
