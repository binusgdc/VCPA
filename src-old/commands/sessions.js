const Structures = require("../structures");

module.exports = {
	signature: /^.sessions$/g,
	exec: (msg) => {
		if (msg.content === ".sessions") {
			let str = "[\n";
			for (let i = 0; i < global.maxSessionCount; i++) {
				str += "{\n";

				if (global.sessions[i] !== undefined) {
					str += `"owner": "${global.sessions[i].owner}",\n`
					str += `"channel": "${global.sessions[i].channel}",\n`;
					str += `"start": "${global.sessions[i].start.toISOString()}",\n`;
					str += `"end": "${(global.sessions[i].end === undefined) ? "undefined" : global.sessions[i].end.toISOString()}",\n`;
					str += "\"events\": [\n";
					for (let j = 0; j < global.sessions[i].events.length; j++) {
						str += "{\n";
						str += `"type": "${global.sessions[i].events[j].type}",\n`;
						str += `"uid": "${global.sessions[i].events[j].uid}",\n`;
						str += `"time": "${global.sessions[i].events[j].time}"\n`;
						str += "},\n";
					}
					str += "]\n";
				}

				str += "},\n";
			}
			str += "]\n";
			global.clientChannel.send(str);
		}
	}
};
