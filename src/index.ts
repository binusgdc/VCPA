import { Client, Intents } from "discord.js";
import * as jsonfile from "jsonfile";

import * as commandHandler from "./commandHandler";
import { LazyConnectionProvider, SqliteSessionLogStore } from "./sessionLog";
import { Session } from "./structures";
import sqlite3 from "sqlite3";
import { ISqlite, open } from "sqlite";
import * as fs from "fs";
import { PushlogHttp } from "./pushlogTarget";
import { loadEnv } from "./util/env";

const dbFile = "data/session-logs.db";
const dbConfig = { filename: dbFile, driver: sqlite3.Database, mode: sqlite3.OPEN_READWRITE }

const envLoaded = loadEnv()
if (envLoaded == undefined) {
	throw Error("❌ invalid environment variables")
}
global.env = envLoaded
global.config = jsonfile.readFileSync("./config.json");
global.ongoingSessions = new Map<string, Session>();

if (global.config.pushLogTarget?.type === "http-json") {
	global.pushlogTarget = new PushlogHttp(global.config.pushLogTarget.endpoint);
}

if (global.pushlogTarget == undefined) {
	console.error("⚠️ WARNING: Push log target is not configured in config.json");
}

if (!fs.existsSync(`./run`)) {
	fs.mkdirSync(`./run/`)
}

const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_VOICE_STATES
	]
});

client.on("ready", async () => {
	if (!fs.existsSync(dbFile)) {
		fs.writeFileSync(dbFile, "");
		await performMigrations(dbConfig, "./data");
	}
	await commandHandler.register(client);
	global.sessionLogStore = new SqliteSessionLogStore(new LazyConnectionProvider(dbConfig));
	console.log(`>>> Logged in as ${client.user!.tag}`);
	console.log(`>>> Bonjour!`);
});

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isCommand()) return;
	await commandHandler.handle(interaction);
});

client.on("voiceStateUpdate", (oldState, newState) => {
	const person = newState.id;
	const oldGuild = oldState.guild.id;
	const oldChannel = oldState.channelId;
	const newGuild = newState.guild.id;
	const newChannel = newState.channelId;

	if ((oldChannel === null) && (newChannel !== null)) {
		// User was not in a voice channel, and now joined our voice channel

		const session = global.ongoingSessions.get(`${newGuild}-${newChannel}`);
		if (session !== undefined) session.log("JOIN", person);
	} else if ((oldChannel !== null) && (newChannel === null)) {
		// User was in our voice channel, and now isn't in a voice channel

		const session = global.ongoingSessions.get(`${oldGuild}-${oldChannel}`);
		if (session !== undefined) session.log("LEAVE", person);
	} else if ((oldChannel !== null) && (newChannel !== null)) {
		// User was in a different voice channel, and now is in our voice channel

		const newSession = global.ongoingSessions.get(`${newGuild}-${newChannel}`);
		if (newSession !== undefined) newSession.log("JOIN", person);

		const oldSession = global.ongoingSessions.get(`${oldGuild}-${oldChannel}`);
		if (oldSession !== undefined) oldSession.log("LEAVE", person);
	}
})

client.login(global.env.BOT_TOKEN);

async function performMigrations(config: ISqlite.Config, migrationsPath: string) {
	const connection = await open(config);
	await connection.migrate({
		migrationsPath: migrationsPath
	});
	await connection.close();
}
