import * as gdrive from "@googleapis/drive";
import { ApplicationCommandData, CommandInteraction, GuildMember } from "discord.js";
import * as fs from "fs";

export const signature : ApplicationCommandData = {
	name: "pushlog",
	description: "Pushes the specified session's logs to the archive",
	options: [
		{
			name: "email",
			description: "Tutor's email",
			type: "STRING",
			required: true
		},

		{
			name: "subject",
			description: "Class subject",
			type: "STRING",
			required: true,
			choices: [
				{ name: "Game Programming A", value: "Game Programming A" },
				{ name: "Game Programming B", value: "Game Programming B" },
				{ name: "Game Design", value: "Game Design"},
				{ name: "2D Art", value: "2D Art" },
				{ name: "3D Art", value: "3D Art" },
				{ name: "Sound Engineering", value: "Sound Engineering" }
			]
		},

		{
			name: "topic",
			description: "Class topic",
			type: "STRING",
			required: true
		},

		{
			name: "documentator",
			description: "Class documentator's IRL name",
			type: "STRING",
			required: true
		}
	]
};

export async function exec(interaction : CommandInteraction) {
	await interaction.deferReply();

	const executor = interaction.member as GuildMember;

	const auth = new gdrive.auth.GoogleAuth({
		keyFile: "gdrivecreds.json",
		scopes: [ "https://www.googleapis.com/auth/drive" ]
	});

	const ds = gdrive.drive({version:"v3", auth});

	let reply = `<@${executor.id}> attempted to push last session's logs:\n`;

	const attdet = await ds.files.create({
		requestBody: {
			name: `${global.lastSession}-attdet.csv`,
			parents: [ global.config.attdetCsvGdriveFolderId ]
		},

		media: {
			mimeType: "text/csv",
			body: fs.createReadStream(`./run/${global.lastSession}-attdet.csv`)
		}
	});

	reply += ((attdet.status === 200) ? "Pushed attdet.csv successfully" : "Failed to push attdet.csv") + '\n';

	const procdet = await ds.files.create({
		requestBody: {
			name: `${global.lastSession}-procdet.csv`,
			parents: [ global.config.procdetCsvGdriveFolderId ]
		},

		media: {
			mimeType: "text/csv",
			body: fs.createReadStream(`./run/${global.lastSession}-procdet.csv`)
		}
	});

	reply += ((procdet.status === 200) ? "Pushed procdet.csv successfully" : "Failed to push procdet.csv");

	console.log(`>>> ${executor.id} attempted to push session ${global.lastSession}'s logs:`);
	console.log((attdet.status === 200) ? ">>> attdet: success" : (">>> attdet: failed\n" + attdet));
	console.log((procdet.status === 200) ? ">>> procdet: success" : (">>> procdet: failed\n" + procdet));
	console.log(`>>> Push overall ${(attdet && procdet) ? "successful" : "failed"}`);

	interaction.editReply(reply);
}
