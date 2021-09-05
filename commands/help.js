module.exports = {
	signature: /^.help$/g,
	exec: (msg) => {
		console.log(`UID ${msg.author.id} requested help info!`);

		let str = "These are the available commands:\n";
		str += ".start [@user] - Start a session for yourself or someone else\n";
		str += ".stop [@user] - Stops a session for yourself or someone else\n";
		str += ".sessions - Lists information about current sessions\n";
		str += ".setMaxSession {count} - Sets the maximum amount of simulataneous sessions\n";
		str += ".help - Lists the available commands\n";
		clientChannel.send(str);
	}
};
