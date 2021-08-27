module.exports = {
	signature: /^.setMaxSessions \d+$/g,
	exec: (msg) => {
		let res = msg.content.match(/^.setMaxSessions [0-9]+$/g);
		if ((res !== undefined) && (res !== null) && (res.length === 1) && (res[0] === msg.content)) {
			let oldval = global.maxSessionCount;
			let newval = Math.floor(msg.content.match(/(-?|\+?)\d+/g)[0]);

			if (newval >= 0) {
				global.maxSessionCount = newval;
				console.log(`>>> Set global.maxSessionCount to ${newval} (was previously ${oldval})!`);
				clientChannel.send(`Set global.maxSessionCount to ${newval} (was previously ${oldval})!`);
			} else {
				console.log(`>>> Failed to set global.maxSessionCount to ${newval}, value cannot be negative!`);
				clientChannel.send(`Failed to set global.maxSessionCount to ${newval}, value cannot be negative!`);
			}
		}
	}
};
