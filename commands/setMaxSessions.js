module.exports = {
	signature: /^.setMaxSessions \d+$/g,
	exec: (msg) => {
		let oldval = global.maxSessionCount;
		let newval = Math.floor(msg.content.match(/\d+/g)[0]);

		if (newval >= 0) {
			global.maxSessionCount = newval;
			console.log(`>>> ${msg.author.id} set global.maxSessionCount to ${newval} (was previously ${oldval})!`);
			clientChannel.send(`<@${msg.author.id}> set global.maxSessionCount to ${newval} (was previously ${oldval})!`);
		} else {
			console.log(`>>> Failed to set global.maxSessionCount: ${msg.author.id} tried to set global.maxSessionCount to an illegal value of ${newval}!`);
			clientChannel.send(`Failed to set global.maxSessionCount: <@${msg.author.id}> tried to set global.maxSessionCount to an illegal value of ${newval}!`);
		}
	}
};
