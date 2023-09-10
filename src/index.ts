import { REST } from "@discordjs/rest"
import Airtable from "airtable"
import { ApplicationCommandData, Client, GatewayIntentBits, Snowflake } from "discord.js"
import * as fs from "fs"
import { ISqlite, open } from "sqlite"
import sqlite3 from "sqlite3"

import { AbstractCommandHandler } from "./commandsHandlers/abstractCommandHandler"
import { LowerHandCommandHandler } from "./commandsHandlers/lowerHandCommandHandler"
import { PushlogCommandHandler } from "./commandsHandlers/pushlogCommandHandler"
import { RaiseHandCommandHandler } from "./commandsHandlers/raiseHandCommandHandler"
import { StartCommandHandler } from "./commandsHandlers/startCommandHandler"
import { StatusCommandHandler } from "./commandsHandlers/statusCommandHandler"
import { StopCommandHandler } from "./commandsHandlers/stopCommandHandler"
import { InMemoryOngoingSessionStore } from "./ongoingSessionStore/ongoingSessionStore"
import { PushlogAirtable } from "./pushlogTarget/pushlogAirtable"
import { PushlogHttp } from "./pushlogTarget/pushlogHttp"
import { PushlogTarget } from "./pushlogTarget/pushlogTarget"
import { RoutingCommandHandler } from "./router"
import { PushlogService } from "./session/pushlogService"
import { SessionService } from "./session/sessionService"
import { InMemoryBufferSessionLogStore } from "./sessionLogStore/inMemoryBufferSessionLogStore"
import { SessionLogStore } from "./sessionLogStore/sessionLogStore"
import { LoggerConfig, SessionLogStoreConfig, loadAndParseConfig } from "./util/config"
import { DateTimeProvider, dtnow } from "./util/date"
import { loadEnv } from "./util/env"
import { CompositeLogger } from "./util/loggers/compositeLogger"
import { ConsoleLogger } from "./util/loggers/consoleLogger"
import { DiscordChannelLogger } from "./util/loggers/discordChannelLogger"
import { Logger } from "./util/loggers/logger"

async function main() {
    const envLoaded = loadEnv()
    if (!envLoaded.success) {
        console.error(envLoaded.error)
        throw new Error("❌ invalid environment variables")
    }
    const env = envLoaded.data
    const botToken = env.DISCORD_BOT_TOKEN
    const configResult = loadAndParseConfig(env)

    if (!configResult.ok) {
        throw configResult.error
    }

    const config = configResult.value

    let pushlogTarget: PushlogTarget | undefined

    const botClient = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildVoiceStates,
        ],
    })

    const restClient = new REST({
        version: "10",
    }).setToken(botToken)

    if (config.pushLogTarget?.type === "http-json") {
        pushlogTarget = new PushlogHttp(config.pushLogTarget.endpoint)
    } else if (config.pushLogTarget?.type === "airtable") {
        const airtableApiKey = env.AIRTABLE_API_KEY
        if (!airtableApiKey) {
            throw Error("❌ push log target is set to airtable, but AIRTABLE_KEY is not set")
        }

        pushlogTarget = new PushlogAirtable(
            new Airtable({ apiKey: airtableApiKey }).base(config.pushLogTarget.baseId),
            { ...config.pushLogTarget },
            new CompositeLogger(
                config.loggers?.map((conf) => initLogger(conf, restClient)) ?? [new ConsoleLogger()]
            )
        )
    }

    if (!pushlogTarget)
        console.error("⚠️ WARNING: Push log target is not configured in config.json")

    const dateTimeProvider: DateTimeProvider = {
        now: () => dtnow(),
    }
    const ongoingSessions = new InMemoryOngoingSessionStore()
    const sessionLogStore = initSessionLogStore(config.sessionLogStore, dateTimeProvider)
    const sessionService = new SessionService(ongoingSessions, sessionLogStore, dateTimeProvider)
    const pushlogService =
        pushlogTarget !== undefined ? new PushlogService(sessionLogStore, pushlogTarget) : undefined

    const commands: AbstractCommandHandler[] = [
        new StartCommandHandler(sessionService),
        new StatusCommandHandler(),
        new StopCommandHandler(sessionService),
        new RaiseHandCommandHandler(),
        new LowerHandCommandHandler(),
        ...(pushlogService ? [new PushlogCommandHandler(pushlogService)] : []),
    ]

    const router = new RoutingCommandHandler(
        commands.map((c) => {
            return { route: c.getSignature().name, handler: c }
        })
    )

    const masterHandler = router

    if (!fs.existsSync("./run")) fs.mkdirSync("./run/")

    botClient.on("ready", async () => {
        await reRegisterCommands(
            botClient,
            config.servicedGuildIds,
            commands.map((cmd) => cmd.getSignature())
        )

        if (!botClient.user) {
            console.log(">>> Something went wrong :(")
            return
        }

        console.log(`>>> Logged in as ${botClient.user.tag}`)
        console.log(">>> Bonjour!")
    })

    botClient.on("interactionCreate", async (interaction) => {
        if (!interaction.isChatInputCommand()) return
        await masterHandler.handle(interaction)
    })

    botClient.on("voiceStateUpdate", async (oldState, newState) => {
        const person = newState.id
        const oldGuild = oldState.guild.id
        const oldChannel = oldState.channelId
        const newGuild = newState.guild.id
        const newChannel = newState.channelId

        if (oldChannel === null && newChannel !== null) {
            // User was not in a voice channel, and now joined our voice channel
            await sessionService.handleJoinedChannel(person, newGuild, newChannel)
        } else if (oldChannel !== null && newChannel === null) {
            // User was in our voice channel, and now isn't in a voice channel
            await sessionService.handleLeftChannel(person, oldGuild, oldChannel)
        } else if (oldChannel !== null && newChannel !== null) {
            // User was in a different voice channel, and now is in our voice channel
            await sessionService.handleLeftChannel(person, oldGuild, oldChannel)
            await sessionService.handleJoinedChannel(person, newGuild, newChannel)
        }
    })

    botClient.login(botToken).catch((err) => console.error(err))
}

function initLogger(config: LoggerConfig, restClient: REST): Logger {
    switch (config.type) {
        case "discordChannel":
            return new DiscordChannelLogger(restClient, config.channelId)
        case "console":
            return new ConsoleLogger()
    }
}

function initSessionLogStore(
    config: SessionLogStoreConfig,
    dateTimeProvider: DateTimeProvider
): SessionLogStore {
    switch (config.type) {
        case "memory":
            return new InMemoryBufferSessionLogStore(10, dateTimeProvider)
    }
}

async function reRegisterCommands(
    client: Client,
    guildIds: Snowflake[],
    commands: ApplicationCommandData[]
) {
    for (const guildId of guildIds) {
        // For every guild we plan to serve
        const guild = await client.guilds.fetch(guildId)

        // Start fresh
        await guild.commands.set([])

        // Add all the commands
        for (const command of commands) {
            await guild.commands.create(command)
        }
    }
}

main()
