import { REST } from "@discordjs/rest";
import Airtable from "airtable";
import { ApplicationCommandData, Client, GatewayIntentBits, Snowflake } from "discord.js";
import * as fs from "fs";
import * as jsonfile from "jsonfile";
import { ISqlite, open } from "sqlite";
import sqlite3 from "sqlite3";

import { AbstractCommandHandler } from "./commandsHandlers/abstractCommandHandler";
import { LowerHandCommandHandler } from "./commandsHandlers/lowerHandCommandHandler";
import { PushlogCommandHandler } from "./commandsHandlers/pushlogCommandHandler";
import { RaiseHandCommandHandler } from "./commandsHandlers/raiseHandCommandHandler";
import { StartCommandHandler } from "./commandsHandlers/startCommandHandler";
import { StatusCommandHandler } from "./commandsHandlers/statusCommandHandler";
import { StopCommandHandler } from "./commandsHandlers/stopCommandHandler";
import { ServiceLocationsFilter } from "./filters/serviceLocationsFilter";
import { InMemoryOngoingSessionStore } from "./ongoingSessionStore/ongoingSessionStore";
import { PushlogAirtable } from "./pushlogTarget/pushlogAirtable";
import { PushlogHttp } from "./pushlogTarget/pushlogHttp";
import { PushlogTarget } from "./pushlogTarget/pushlogTarget";
import { RoutingCommandHandler } from "./router";
import { PushlogService } from "./session/pushlogService";
import { SessionService } from "./session/sessionService";
import { LazyConnectionProvider, SqliteSessionLogStore } from "./sessionLogStore/sqliteSessionLogStore";
import { ConfigFile, LoggerConfig } from "./util/config";
import { DateTimeProvider, dtnow } from "./util/date";
import { loadEnv } from "./util/env";
import { Logger } from "./util/loggers/logger";
import { CompositeLogger } from "./util/loggers/compositeLogger";
import { ConsoleLogger } from "./util/loggers/consoleLogger";
import { DiscordChannelLogger } from "./util/loggers/discordChannelLogger";

const dbFile = "data/session-logs.db";
const dbConfig = { filename: dbFile, driver: sqlite3.Database, mode: sqlite3.OPEN_READWRITE };

const envLoaded = loadEnv();
if (!envLoaded) throw Error("❌ invalid environment variables");
const env = envLoaded;
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const config: ConfigFile = jsonfile.readFileSync("./config.json");
const botToken = env.DISCORD_BOT_TOKEN ?? config.discordBotToken;
if (botToken === undefined) throw Error("❌ invalid configuration. Discord bot token is not set.");

let pushlogTarget: PushlogTarget | undefined;

const botClient = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildVoiceStates
	]
});

const restClient = new REST({
	version: "10"
}).setToken(botToken);

if (config.pushLogTarget?.type === "http-json") {
	pushlogTarget = new PushlogHttp(config.pushLogTarget.endpoint);
} else if (config.pushLogTarget?.type === "airtable") {
	const airtableApiKey = env.AIRTABLE_API_KEY ?? config.airtableApiKey;
	if (!airtableApiKey) {
		throw Error("❌ push log target is set to airtable, but AIRTABLE_KEY is not set");
	}

	pushlogTarget = new PushlogAirtable(
		new Airtable({ apiKey: airtableApiKey }).base(config.pushLogTarget.baseId),
		{ ...config.pushLogTarget },
		new CompositeLogger(config.loggers?.map(initLogger) ?? [new ConsoleLogger()])
	);
}

if (!pushlogTarget) console.error("⚠️ WARNING: Push log target is not configured in config.json");

const ongoingSessions = new InMemoryOngoingSessionStore();
const sessionLogStore = new SqliteSessionLogStore(new LazyConnectionProvider(dbConfig));
const dateTimeProvider: DateTimeProvider = {
	now: () => dtnow(),
};
const sessionService = new SessionService(ongoingSessions, sessionLogStore, dateTimeProvider);
const pushlogService = pushlogTarget !== undefined ? new PushlogService(sessionLogStore, pushlogTarget) : undefined;

const commands: AbstractCommandHandler[] = [
	new StartCommandHandler(sessionService),
	new StatusCommandHandler(),
	new StopCommandHandler(sessionService),
	new RaiseHandCommandHandler(),
	new LowerHandCommandHandler(),
	...(pushlogService ? [new PushlogCommandHandler(pushlogService)] : [])
];

const router = new RoutingCommandHandler(commands.map((c) => {
	return { route: c.getSignature().name, handler: c };
}));

const masterHandler = new ServiceLocationsFilter(config.serviceLocationWhiteList).apply(router);

if (!fs.existsSync("./run")) fs.mkdirSync("./run/");

botClient.on("ready", async () => {
	if (!fs.existsSync(dbFile)) {
		fs.writeFileSync(dbFile, "");
		await performMigrations(dbConfig, "./data");
	}

	await reRegisterCommands(
		botClient,
		config.serviceLocationWhiteList.map(s => s.guildId),
		commands.map(cmd => cmd.getSignature())
	);

	if (!botClient.user) {
		console.log(">>> Something went wrong :(");
		return;
	}

	console.log(`>>> Logged in as ${botClient.user.tag}`);
	console.log(">>> Bonjour!");
});

botClient.on("interactionCreate", async (interaction) => {
	if (!interaction.isChatInputCommand()) return;
	await masterHandler.handle(interaction);
});

botClient.on("voiceStateUpdate", async (oldState, newState) => {
	const person = newState.id;
	const oldGuild = oldState.guild.id;
	const oldChannel = oldState.channelId;
	const newGuild = newState.guild.id;
	const newChannel = newState.channelId;

	if ((oldChannel === null) && (newChannel !== null)) {
		// User was not in a voice channel, and now joined our voice channel
		await sessionService.handleJoinedChannel(person, newGuild, newChannel);
	} else if ((oldChannel !== null) && (newChannel === null)) {
		// User was in our voice channel, and now isn't in a voice channel
		await sessionService.handleLeftChannel(person, oldGuild, oldChannel);
	} else if ((oldChannel !== null) && (newChannel !== null)) {
		// User was in a different voice channel, and now is in our voice channel
		await sessionService.handleLeftChannel(person, oldGuild, oldChannel);
		await sessionService.handleJoinedChannel(person, newGuild, newChannel);
	}
});

(async () => { await botClient.login(botToken); })();

async function performMigrations(config: ISqlite.Config, migrationsPath: string) {
	const connection = await open(config);
	await connection.migrate({
		migrationsPath: migrationsPath
	});
	await connection.close();
}

function initLogger(config: LoggerConfig): Logger {
	switch (config.type) {
		case "discordChannel": return new DiscordChannelLogger(restClient, config.channelId);
		case "console": return new ConsoleLogger();
	}
}

async function reRegisterCommands(client: Client, guildIds: Snowflake[], commands: ApplicationCommandData[]) {
	for (const guildId of guildIds) {
		// For every guild we plan to serve
		const guild = await client.guilds.fetch(guildId);

		// Start fresh
		await guild.commands.set([]);

		// Add all the commands
		for (const command of commands) {
			await guild.commands.create(command);
		}
	}
}
