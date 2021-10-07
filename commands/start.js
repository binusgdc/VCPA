const Structures = require("../structures");

module.exports = {
	signature: /^.start(?: <@!\d+>)?$/g,
	exec: (msg) => {
		let args = msg.content.split(" ");
		args.shift();

		let target = (args[0] === undefined) ? msg.author.id : args[0].match(/\d+/g)[0];

		if (!msg.guild.members.cache.has(target)) {
			console.log(`>>> Failed to start session: ${msg.author.id} tried to start a session for ${target}, who isn't a server member!`);
			global.clientChannel.send(`<@${msg.author.id}> tried to start a session for <@${target}>, who isn't a server member!`);
			return;
		}

		if (msg.guild.members.cache.get(target).voice.channelId === null) {
			console.log(`>>> Failed to start session: ${msg.author.id} tried to start a session for ${target}, but they're not in a voice chat channel!`);
			global.clientChannel.send(`<@${msg.author.id}> tried to start a session for <@${target}>, but they're not in a voice chat channel!`);
			return;
		}

		for (let i = 0; i < global.maxSessionCount; i++) {
			if (global.sessions[i] === undefined) {
				global.sessions[i] = new Structures.Session(target, msg.guild.members.cache.get(target).voice.channelId);
				console.log(`>>> ${msg.author.id} started a session for ${msg.guild.members.cache.get(target).id} in ${msg.guild.members.cache.get(target).voice.channelId}!`);
				global.clientChannel.send(`<@${msg.author.id}> started a session for <@${msg.guild.members.cache.get(target).id}> in <#${msg.guild.members.cache.get(target).voice.channelId}>!`);

				const members = global.clientGuild.channels.cache.get(global.sessions[i].channel).members;
				members.forEach((member) => {
					global.sessions[i].log("join", member.id, new Date());
				});

				break;
			} else {
				if (global.sessions[i].owner === target) {
					console.log(`>>> Failed to start session: ${target} already has a session in ${global.sessions[i].channel}!`);
					global.clientChannel.send(`<@${target}> already has a session in <#${global.sessions[i].channel}>!`);
					break;
				}

				if (i == (global.maxSessionCount-1)) {
					console.log(`>>> Failed to start session: ${msg.author.id} failed to start a session for ${target}, no free sessions left!`);
					global.clientChannel.send(`<@${msg.author.id}> failed to start a session for <@${target}>, no free sessions left!`);
				}
			}
		}
	}
};
