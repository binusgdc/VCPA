const Structures = require("../structures");
const stop = require("./stop")

module.exports = {
	signature: /^.start(:? \d+)?$/g,
	exec: (msg) => {
		const target = msg.author.id;
		let args = msg.content.split(" ")
		args.shift()
		let time = (args[0] === undefined) ? 100 : parseInt(args[0])
		if(time <= 0 || time >= Number.MAX_SAFE_INTEGER){
			return global.clientChannel.send(
				`Invalid time value`
			)
		}
		let ms = time * 60000

		if (msg.guild.members.cache.get(target).voice.channelId === null) {
			console.log(`>>> Failed to start session: ${msg.author.id} tried to start a session, but they're not in a voice chat channel!`);
			global.clientChannel.send(`<@${msg.author.id}> tried to start a session, but they're not in a voice chat channel!`);
			return;
		}

		for (let i = 0; i < global.maxSessionCount; i++) {
			if (global.sessions[i] === undefined) {
				global.sessions[i] = new Structures.Session(target, msg.guild.members.cache.get(target).voice.channelId);
				console.log(`>>> ${msg.author.id} started a session in ${msg.guild.members.cache.get(target).voice.channelId}!`);
				global.clientChannel.send(`<@${msg.author.id}> started in <#${msg.guild.members.cache.get(target).voice.channelId}>!`);

				const members = global.clientGuild.channels.cache.get(global.sessions[i].channel).members;
				const startTime = new Date()
				members.forEach((member) => {
					global.sessions[i].log("join", member.id, startTime);
				});

				if( ms > 0){
					let tID = setTimeout(() => {
						msg.content = `.stop`  // Modify content for stop method parsing
						stop.exec(msg);
					}, ms);
					global.sessions[i].timeoutID = tID
					global.clientChannel.send(`Session will stop automaticaly after ${time} minute(s)`)
				}

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
