const Discord = require("discord.js");
const fs = require("fs");
const Util = require("../util");

module.exports = {
	signature: /^.stop(?: <@!\d+>)?$/g,
	exec: (msg) => {
		if (msg.content === ".stop") {
			for (let i = 0; i < global.maxSessionCount; i++) {
				if (global.sessions[i] !== undefined) {
					if (global.sessions[i].owner === msg.author.id) {
						global.sessions[i].end = new Date();

						console.log(`>>> Session in ${global.sessions[i].channel} by ${global.sessions[i].owner} was stopped!`);
						clientChannel.send(`Session stopped by <@${global.sessions[i].owner}>`);

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
								console.log("Failed to write event log!");
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
					console.log(`>>> UID ${msg.author.id} tried to stop a non-existent session`);
					clientChannel.send(`UID <@${msg.author.id}> has no running sessions!`);
				}
			}
		} else {
			let res = msg.content.match(/^.stop <@![0-9]+>$/g);
			if ((res !== undefined) && (res !== null) && (res.length === 1) && (res[0] === msg.content)) {
				let tid = msg.content.match(/[0-9]+/g)[0];
				if (!msg.guild.members.cache.has(tid)) {
					console.log(`>>> Failed to stop session: ${msg.author.id} tried to stop ${tid}'s session, who isn't a server member!`);
					clientChannel.send(`UID <@${msg.author.id}> tried to stop <@${tid}>'s session, who isn't a server member!`);
					return;
				}

				for (let i = 0; i < global.maxSessionCount; i++) {
					if (global.sessions[i] !== undefined) {
						if (global.sessions[i].owner === tid) {
							global.sessions[i].end = new Date();

							console.log(`>>> Session in ${global.sessions[i].channel} by ${global.sessions[i].owner} was stopped by ${msg.author.id}!`);
							clientChannel.send(`<@${global.sessions[i].owner}>'s session was stopped by <@${msg.author.id}>!`);

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
									console.log("Failed to write event log!");
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
						console.log(`>>> Failed to stop session: ${msg.author.id} tried to stop ${tid}'s non-existent session!`);
						clientChannel.send(`UID <@${msg.author.id}> tried to stop <@${tid}>'s non-existent session!`);
					}
				}
			}
		}
	}
};
