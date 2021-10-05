const jsonfile = require("jsonfile");
global.config = jsonfile.readFileSync("./config.json");

const Discord = require("discord.js");
const client = new Discord.Client({
	intents: [
		Discord.Intents.FLAGS.GUILDS,
		Discord.Intents.FLAGS.GUILD_MESSAGES,
		Discord.Intents.FLAGS.GUILD_VOICE_STATES
	]
});

global.clientGuild = undefined;
global.clientChannel = undefined;
global.clientCommandAccessRole = undefined;

const clientGuildId = global.config.clientGuildId;
const clientChannelId = global.config.clientChannelId;
const clientCommandAccessRoleId = global.config.clientCommandAccessRoleId;

global.sessions = [];
global.maxSessionCount = 3;

client.on("ready", async () => {
	console.log(`>>> Logged in as ${client.user.tag}`);
	console.log(">>> Bonjour!");

	clientGuild = client.guilds.cache.get(clientGuildId);
	clientChannel = client.channels.cache.get(clientChannelId);
	clientCommandAccessRole = clientGuild.roles.cache.get(clientCommandAccessRoleId);
});

const commandHandler = require("./commandHandler");

client.on("messageCreate", (msg) => {
	// console.log(`>>> Message from ${msg.author.tag}: ${msg.content}`);

	if (msg.channel !== clientChannel) return;
	if (!msg.member.roles.cache.has(clientCommandAccessRoleId)) return;

	commandHandler(msg);
	return;
});

client.on("voiceStateUpdate", (oldState, newState) => {
	let person = newState.id;
	let oldChannel = oldState.channelId;
	let newChannel = newState.channelId;
	let time = new Date();

	if ((oldChannel === null) && (newChannel !== null)) {
		for (let i = 0; i < global.maxSessionCount; i++) {
			if (global.sessions[i] !== undefined) {
				if (global.sessions[i].channel === newChannel) {
					global.sessions[i].log("join", person, time);
				}
			}
		}
	} else if ((oldChannel !== null) && (newChannel === null)) {
		for (let i = 0; i < global.maxSessionCount; i++) {
			if (global.sessions[i] !== undefined) {
				if (global.sessions[i].channel === oldChannel) {
					global.sessions[i].log("leave", person, time);
				}
			}
		}
	} else if ((oldChannel !== null) && (newChannel !== null)) {
		for (let i = 0; i < global.maxSessionCount; i++) {
			if (global.sessions[i] !== undefined) {
				if (global.sessions[i].channel === oldChannel) {
					global.sessions[i].log("leave", person, time);
				}

				if (global.sessions[i].channel === newChannel) {
					global.sessions[i].log("join", person, time);
				}
			}
		}
	}
});

client.login(global.config.token);
