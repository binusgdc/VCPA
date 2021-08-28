const Discord = require("discord.js");
const fs = require("fs");
const Util = require("../util");

module.exports = {
	signature: /^.stop(?: <@!\d+>)?$/g,
	exec: (msg) => {
		let args = msg.content.split(" ");
		args.shift();

		let target = (args[0] === undefined) ? msg.author.id : args[0].match(/\d+/g)[0];

		if (!msg.guild.members.cache.has(target)) {
			console.log(`>>> Failed to stop session: ${msg.author.id} tried to stop ${target}'s session, who isn't a server member!`);
			clientChannel.send(`<@${msg.author.id}> tried to stop <@${target}>'s session, who isn't a server member!`);
			return;
		}

		for (let i = 0; i < global.maxSessionCount; i++) {
			if (global.sessions[i] !== undefined) {
				if (global.sessions[i].owner === target) {
					global.sessions[i].end = new Date();

					console.log(`>>> ${global.sessions[i].owner}'s session in ${global.sessions[i].channel} was stopped by ${msg.author.id}!`);
					clientChannel.send(`<@${global.sessions[i].owner}>'s session in <#${global.sessions[i].channel}> was stopped by <@${msg.author.id}>!`);

					let embed = new Discord.MessageEmbed()
						.setColor("#d548b0")
						.setTitle("Session Stats")
						.addFields(
							{ name: "Channel Name", value: `<#${global.sessions[i].channel}>` },
							{ name: "Start Time", value: Util.formatDate(global.sessions[i].start, "verbose") },
							{ name: "End Time", value: Util.formatDate(global.sessions[i].end, "verbose") },
							{ name: "Duration", value: Util.formatPeriod(global.sessions[i].end.getTime() - global.sessions[i].start.getTime()) }
						);
					clientChannel.send({ embeds: [embed] });

					let str = "uid,type,time\n";
					for (let j = 0; j < global.sessions[i].events.length; j++) {
						str += `<@${global.sessions[i].events[j].uid}>,${global.sessions[i].events[j].type},${Util.formatDate(global.sessions[i].events[j].time, "excel")}\n`;
					}

					let fname = `${new Date().toISOString()}.csv`;
					fs.writeFile(fname, str, (err) => {
						if (err) {
							console.log(">>> Failed to write event log!");
							console.log(err);
							return;
						}

						clientChannel.send({ content: "Session event log:", files: [fname] });
					});

					global.sessions[i] = undefined;

					break;
				}
			}

			if (i === (global.maxSessionCount-1)) {
				console.log(`>>> ${msg.author.id} tried to stop a non-existent session`);
				clientChannel.send(`<@${msg.author.id}> has no running sessions!`);
			}
		}
	}
};
