const Structures = require("../structures");

module.exports = {
	signature: /^.start(?: <@!\d+>)?$/g,
	exec: (msg) => {
		if (msg.content === ".start") {
			if (msg.member.voice.channelId === null) {
				console.log(`>>> Failed to start session: uid ${msg.author.id} is not in a voice chat channel!`);
				clientChannel.send(`UID <@${msg.author.id}> is not in a voice chat channel!`);
				return;
			}

			for (let i = 0; i < global.maxSessionCount; i++) {
				if (global.sessions[i] === undefined) {
					global.sessions[i] = new Structures.Session(msg.author.id, msg.member.voice.channelId);
					console.log(`>>> Session started by uid ${msg.author.id} in channel ${msg.member.voice.channelId}`);
					clientChannel.send(`Session started by <@${msg.author.id}> in <#${msg.member.voice.channelId}>`);
					break;
				} else {
					if (global.sessions[i].owner === msg.author.id) {
						console.log(`>>> Failed to start session: uid ${msg.author.id} already has a session in channel ${msg.member.voice.channelId}!`);
						clientChannel.send(`UID <@${msg.author.id}> already has a session in <#${msg.member.voice.channelId}>!`);
						break;
					}

					if (i == (global.maxSessionCount-1)) {
						console.log(`>>> Failed to start session: uid ${msg.author.id} failed to start a session, no free sessions left!`);
						clientChannel.send("Too many sessions!");
					}
				}
			}
		} else {
			let res = msg.content.match(/^.start <@![0-9]+>$/g);
			if ((res !== undefined) && (res !== null) && (res.length === 1) && (res[0] === msg.content)) {
				let tid = msg.content.match(/[0-9]+/g)[0];
				if (!msg.guild.members.cache.has(tid)) {
					console.log(`>>> Failed to start session: ${msg.author.id} tried to start a session for ${tid}, who isn't a server member!`);
					clientChannel.send(`UID <@${msg.author.id}> tried to start a session for UID <@${tid}>, who isn't a server member!`);
					return;
				}

				if (msg.guild.members.cache.get(tid).voice.channelId === null) {
					console.log(`>>> Failed to start session: UID <@${msg.author.id}> tried to start a session for UID <@${tid}> but they're not in a voice chat channel!`);
					clientChannel.send(`UID <@${msg.author.id}> tried to start a session for UID <@${tid}>, but they're not in a voice chat channel!`);
					return;
				}

				for (let i = 0; i < global.maxSessionCount; i++) {
					if (global.sessions[i] === undefined) {
						global.sessions[i] = new Structures.Session(tid, msg.guild.members.cache.get(tid).voice.channelId);
						console.log(`>>> Session started by uid ${msg.author.id} for uid ${msg.guild.members.cache.get(tid).id} in channel ${msg.guild.members.cache.get(tid).voice.channelId}`);
						clientChannel.send(`Session started by <@${msg.author.id}> for UID <@${msg.guild.members.cache.get(tid).id}> in <#${msg.guild.members.cache.get(tid).voice.channelId}>`);
						break;
					} else {
						if (global.sessions[i].owner === tid) {
							console.log(`>>> Failed to start session: uid ${tid} already has a session in channel ${global.sessions[i].channel}!`);
							clientChannel.send(`UID <@${tid}> already has a session in <#${global.sessions[i].channel}>!`);
							break;
						}

						if (i == (global.maxSessionCount-1)) {
							console.log(`>>> Failed to start session: uid ${tid} failed to start a session, no free sessions left!`);
							clientChannel.send("Too many sessions!");
						}
					}
				}
			}
		}
	}
};
