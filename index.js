require("dotenv").config();

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

const clientGuildId = process.env.GUILD_ID;
const clientChannelId = process.env.CHANNEL_ID;
const clientCommandAccessRoleId = process.env.COMMAND_ACCESS_ROLE_ID;

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
		//console.log(`uid ${person} joined channel ${newChannel} on ${stamp}`);
		//clientChannel.send(`uid <@${person}> joined channel <#${newChannel}> on ${stamp}`);

		for (let i = 0; i < global.maxSessionCount; i++) {
			if (global.sessions[i] !== undefined) {
				if (global.sessions[i].channel === newChannel) {
					//if (global.sessions[i].owner !== person) {
						global.sessions[i].log("join", person, time);
					//}
				}
			}
		}
	} else if ((oldChannel !== null) && (newChannel === null)) {
		//console.log(`uid ${person} left channel ${oldChannel} on ${stamp}`);
		//clientChannel.send(`uid <@${person}> left channel <#${oldChannel}> on ${stamp}`);

		for (let i = 0; i < global.maxSessionCount; i++) {
			if (global.sessions[i] !== undefined) {
				if (global.sessions[i].channel === oldChannel) {
					//if (global.sessions[i].owner !== person) {
						global.sessions[i].log("leave", person, time);
					//}
				}
			}
		}
	} else if ((oldChannel !== null) && (newChannel !== null)) {
		//console.log(`uid ${person} moved from ${oldChannel} to ${newChannel} on ${stamp}`);
		//clientChannel.send(`uid <@${person}> moved from <#${oldChannel}> to <#${newChannel}> on ${stamp}`);

		for (let i = 0; i < global.maxSessionCount; i++) {
			if (global.sessions[i] !== undefined) {
				if (global.sessions[i].channel === oldChannel) {
					//if (global.sessions[i].owner !== person) {
						global.sessions[i].log("leave", person, time);
					//}
				}

				if (global.sessions[i].channel === newChannel) {
					//if (global.sessions[i].owner !== person) {
						global.sessions[i].log("join", person, time);
					//}
				}
			}
		}
	}
});

client.login(process.env.TOKEN);
