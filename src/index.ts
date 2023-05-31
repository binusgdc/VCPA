import { REST } from "@discordjs/rest";
import Airtable from "airtable";
import { Client, GatewayIntentBits } from "discord.js";
import * as fs from "fs";
import * as jsonfile from "jsonfile";
import { ISqlite, open } from "sqlite";
import sqlite3 from "sqlite3";

import * as masterCommandHandler from "./masterCommandHandler";
import { PushlogAirtable, PushlogHttp } from "./pushlogTarget";
import { LazyConnectionProvider, SqliteSessionLogStore } from "./sessionLog";
import { ConfigFile, LoggerConfig, Session } from "./structures";
import { loadEnv } from "./util/env";
import { Logger } from "./util/logger";
import { CompositeLogger } from "./util/loggers/compositeLogger";
import { ConsoleLogger } from "./util/loggers/consoleLogger";
import { DiscordChannelLogger } from "./util/loggers/discordChannelLogger";

const dbFile = "data/session-logs.db";
const dbConfig = { filename: dbFile, driver: sqlite3.Database, mode: sqlite3.OPEN_READWRITE };

const envLoaded = loadEnv();
if (envLoaded == undefined) throw Error("❌ invalid environment variables");

global.env = envLoaded
const config: ConfigFile = jsonfile.readFileSync("./config.json");
const ongoingSessions = new Map<string, Session>();

const botClient = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildVoiceStates
	]
});

const restClient = new REST({
	version: '10'
}).setToken(global.env.BOT_TOKEN);

if (config.pushLogTarget?.type === "http-json") {
	global.pushlogTarget = new PushlogHttp(config.pushLogTarget.endpoint);
} else if (config.pushLogTarget?.type === "airtable") {
	if (!global.env.AIRTABLE_KEY) {
		throw Error("❌ push log target is set to airtable, but AIRTABLE_KEY is not set");
	}

	global.pushlogTarget = new PushlogAirtable(
		new Airtable({ apiKey: global.env.AIRTABLE_KEY }).base(config.pushLogTarget.baseId),
		{ ...config.pushLogTarget },
		new CompositeLogger(config.loggers?.map(initLogger) ?? [new ConsoleLogger()])
	);
}

if (!global.pushlogTarget) console.error("⚠️ WARNING: Push log target is not configured in config.json");

if (!fs.existsSync(`./run`)) fs.mkdirSync(`./run/`);

botClient.on("ready", async () => {
	if (!fs.existsSync(dbFile)) {
		fs.writeFileSync(dbFile, "");
		await performMigrations(dbConfig, "./data");
	}

	await masterCommandHandler.register(botClient, config.serviceLocationWhiteList);
	global.sessionLogStore = new SqliteSessionLogStore(new LazyConnectionProvider(dbConfig));

	console.log(`>>> Logged in as ${botClient.user!.tag}`);
	console.log(`>>> Bonjour!`);
});

botClient.on("interactionCreate", async (interaction) => {
	if (!interaction.isChatInputCommand()) return;
	await masterCommandHandler.handle(interaction, config.serviceLocationWhiteList);
});

botClient.on("voiceStateUpdate", (oldState, newState) => {
	const person = newState.id;
	const oldGuild = oldState.guild.id;
	const oldChannel = oldState.channelId;
	const newGuild = newState.guild.id;
	const newChannel = newState.channelId;

	if ((oldChannel === null) && (newChannel !== null)) {
		// User was not in a voice channel, and now joined our voice channel

		const session = ongoingSessions.get(`${newGuild}-${newChannel}`);
		if (session !== undefined) session.log("JOIN", person);
	} else if ((oldChannel !== null) && (newChannel === null)) {
		// User was in our voice channel, and now isn't in a voice channel

		const session = ongoingSessions.get(`${oldGuild}-${oldChannel}`);
		if (session !== undefined) session.log("LEAVE", person);
	} else if ((oldChannel !== null) && (newChannel !== null)) {
		// User was in a different voice channel, and now is in our voice channel

		const newSession = ongoingSessions.get(`${newGuild}-${newChannel}`);
		if (newSession !== undefined) newSession.log("JOIN", person);

		const oldSession = ongoingSessions.get(`${oldGuild}-${oldChannel}`);
		if (oldSession !== undefined) oldSession.log("LEAVE", person);
	}
})

botClient.login(global.env.BOT_TOKEN);

async function performMigrations(config: ISqlite.Config, migrationsPath: string) {
	const connection = await open(config);
	await connection.migrate({
		migrationsPath: migrationsPath
	});
	await connection.close();
}

function initLogger(config: LoggerConfig): Logger {
	switch (config.type) {
		case "discordChannel": return new DiscordChannelLogger(restClient, config.channelId)
		case "console": return new ConsoleLogger()
	}
}
