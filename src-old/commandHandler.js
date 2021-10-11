const commands = [
	require("./commands/start"),
	require("./commands/stop"),
	require("./commands/sessions"),
	require("./commands/help"),
	require("./commands/setMaxSessions")
];

module.exports = (msg) => {
	for (let i = 0; i < commands.length; i++) {
		if (msg.content.match(commands[i].signature)) {
			commands[i].exec(msg);
			break;
		}
	}
};
