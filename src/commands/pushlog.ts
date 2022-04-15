import * as gdrive from "@googleapis/drive";
import * as gsheet from "@googleapis/sheets";
import { ApplicationCommandData, CommandInteraction, GuildMember } from "discord.js";
import * as fs from "fs";

import * as Util from "../util";

type PushData = {
	subject: string
	topic: string
	date: string
	tutor: string
	time: string
	duration: string
	documentator: string
}

async function pushData(data : PushData) {
	const auth = new gsheet.auth.GoogleAuth({
		keyFile: "gcreds.json",
		scopes: [ "https://www.googleapis.com/auth/spreadsheets" ]
	});

	const gs = gsheet.sheets({ version: "v4", auth });

	/* Where should we put the data? Find the range based on the subject. */

	const valRangeRes = await gs.spreadsheets.values.get({
		spreadsheetId: global.config.bgdc.msSessionsSheetId,
		range: global.config.bgdc.msSessionsSubjectRanges[data.subject],
		valueRenderOption: "FORMULA"
	});

	const valRange = valRangeRes.data.values;

	/* Find the row on which to place the data. */

	const ind = valRange.findIndex((val) => val[2] === data.topic);

	/* Fill in the new data */

	let newVals = valRange;
	newVals[ind][5] = '\'' + data.date;
	newVals[ind][6] = data.tutor;
	newVals[ind][7] = '\'' + data.time;
	newVals[ind][8] = data.duration;
	newVals[ind][9] = data.documentator;

	/* Push the new data back to the sheet. */

	const valUpdateRes = await gs.spreadsheets.values.update({
		spreadsheetId: global.config.bgdc.msSessionsSheetId,
		range: global.config.bgdc.msSessionsSubjectRanges[data.subject],
		valueInputOption: "USER_ENTERED",
		requestBody: { values: newVals }
	});

	return valUpdateRes;
}

async function pushCsv(data : PushData) {
	const auth = new gdrive.auth.GoogleAuth({
		keyFile: "gcreds.json",
		scopes: [ "https://www.googleapis.com/auth/drive" ]
	});

	const ds = gdrive.drive({ version:"v3", auth });

	const fileBaseName = Util.formatDate(global.lastSession.endTime, "STD");

	const attdet = await ds.files.create({
		requestBody: {
			name: `${data.subject}-${fileBaseName}-attdet.csv`,
			parents: [ global.config.bgdc.attdetCsvGdriveFolderId ]
		},

		media: {
			mimeType: "text/csv",
			body: fs.createReadStream(`./run/${fileBaseName}-attdet.csv`)
		}
	});

	const procdet = await ds.files.create({
		requestBody: {
			name: `${data.subject}-${fileBaseName}-procdet.csv`,
			parents: [ global.config.bgdc.procdetCsvGdriveFolderId ]
		},

		media: {
			mimeType: "text/csv",
			body: fs.createReadStream(`./run/${fileBaseName}-procdet.csv`)
		}
	});

	return [attdet, procdet];
}

export const signature : ApplicationCommandData = {
	name: "pushlog",
	description: "Pushes the specified session's logs to the archive",
	options: [
		{
			name: "subject",
			description: "Class subject",
			type: "STRING",
			required: true,
			choices: [
				{ name: "Game Programming A", value: "PROGA" },
				{ name: "Game Programming B", value: "PROGB" },
				{ name: "Game Programming C", value: "PROGC" },
				{ name: "Game Design", value: "DESG"},
				{ name: "2D Art", value: "A2D" },
				{ name: "3D Art", value: "A3D" },
				{ name: "Sound Engineering", value: "SND" }
			]
		},

		{
			name: "topic",
			description: "Class topic",
			type: "STRING",
			required: true
		},

		{
			name: "tutor",
			description: "Tutor Discord ID(s) (e.g.: \"@tutor1,@tutor2\")",
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
	const argv = interaction.options;

	const data = {
		subject: argv.getString("subject"),
		topic: argv.getString("topic"),
		date: Util.formatDate(global.lastSession.startTime, "DATE"),
		tutor: argv.getString("tutor"),
		time: Util.formatDate(global.lastSession.startTime, "TME"),
		duration: Util.formatPeriod(global.lastSession.endTime.toMillis() - global.lastSession.startTime.toMillis(), "MINUTES"),
		documentator: argv.getString("documentator")
	}

	// TODO: Sort out this mess and properly handle errors individually instead of a blanket catch
	try {
		const dataPushRes = await pushData(data);
		const [attdet, procdet] = await pushCsv(data);

		const lastSessionName = Util.formatDate(global.lastSession.endTime, "STD");

		console.log(`>>> ${executor.id} attempted to push session ${lastSessionName}'s logs:`);
		console.log((dataPushRes.status === 200) ? ">>> data: success" : (">>> data: failed\n" + dataPushRes));
		console.log((attdet.status === 200) ? ">>> attdet: success" : (">>> attdet: failed\n" + attdet));
		console.log((procdet.status === 200) ? ">>> procdet: success" : (">>> procdet: failed\n" + procdet));
		console.log(`>>> Push overall ${(attdet && procdet) ? "successful" : "failed"}`);

		let reply = `<@${executor.id}> attempted to push last session's data:\n`;
		reply += ((dataPushRes.status === 200) ? "Pushed data successfully" : "Failed to push data") + '\n';
		reply += ((attdet.status === 200) ? "Pushed attdet.csv successfully" : "Failed to push attdet.csv") + '\n';
		reply += ((procdet.status === 200) ? "Pushed procdet.csv successfully" : "Failed to push procdet.csv");

		interaction.editReply(reply);
	} catch (err) {
		const lastSessionName = Util.formatDate(global.lastSession.endTime, "STD");

		console.log(`>>> ${executor.id} attempted to push session ${lastSessionName}'s logs:`);
		console.log(">>> Push failed for some reason:");
		console.log(">>> data:");
		console.log(data);
		console.log(">>> Error:");
		console.log(err);

		let reply = `<@${executor.id}> attempted to push last session's data:\n`;
		reply += "Push failed for some reason, please submit form manually :(";
		interaction.editReply(reply);
	}
}
