const Discord = require("discord.js");
const fs = require("fs");
const Util = require("../util");

module.exports = {
	signature: /^.stop(?: <@!\d+>)?$/g,
	exec: async (msg) => {
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

					let outputs = Util.processSession(global.sessions[i]);

					const fnameBase = global.sessions[i].end.toISOString();
					const fname = [
						`${fnameBase}-0.csv`,
						`${fnameBase}-1.csv`,
						`${fnameBase}-2.csv`
					];

					fs.writeFileSync(fname[0], outputs[0], (err) => {
						console.log(">>> Failed to write outputs[0]!");
						global.clientChannel.send(">>> Failed to write output 1!");

						console.log(err);
					});

					fs.writeFileSync(fname[1], outputs[1], (err) => {
						console.log(">>> Failed to write outputs[1]!");
						global.clientChannel.send(">>> Failed to write output 2!");

						console.log(err);
					});

					fs.writeFileSync(fname[2], outputs[2], (err) => {
						console.log(">>> Failed to write outputs[2]!");
						global.clientChannel.send(">>> Failed to write output 3!");

						console.log(err);
					});

					await global.clientChannel.send({
						content: "Session Data:",
						files: [ fname[0], fname[1], fname[2] ]
					});

					let embed = new Discord.MessageEmbed()
						.setColor("#d548b0")
						.setTitle("Session Stats")
						.addFields(
							{ name: "Channel Name", value: `<#${global.sessions[i].channel}>` },
							{ name: "Start Time", value: Util.formatDate(global.sessions[i].start, "verbose") },
							{ name: "End Time", value: Util.formatDate(global.sessions[i].end, "verbose") },
							{ name: "Duration", value: Util.formatPeriod(global.sessions[i].end.getTime() - global.sessions[i].start.getTime(), "verbose") }
						);
					clientChannel.send({ embeds: [embed] });

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
