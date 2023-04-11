import { ApplicationCommandData, CommandInteraction } from "discord.js";

import { SessionLog } from "../sessionLog";
import { PushLogData } from "../pushlogTarget";
import { DateTime } from "luxon";

export const signature: ApplicationCommandData = {
	name: "pushlogtarget",
	description: "Pushes the specified session's logs to an external archive",
	options: [

		{
			name: "topic-id",
			description: "Topic of the session according to the curriculum",
			type: "STRING",
			required: true
		},

		{
			name: "mentors",
			description: "Mentor Discord ID(s) (e.g.: \"@mentor1,@mentor2\")",
			type: "STRING",
			required: true
		},

		{
			name: "documentator",
			description: "Class documentator's IRL name",
			type: "STRING",
			required: true
		},

		{
			name: "session-id",
			description: "The ID of the session to push",
			type: "STRING",
			required: false
		}


	]
};

export async function exec(interaction: CommandInteraction) {
	await interaction.deferReply();

	const argv = interaction.options;

	const sessionIdToPush = argv.getString("session-id");

	const logToPush = sessionIdToPush == undefined
		? await global.sessionLogStore.latest()
		: await global.sessionLogStore.retrieve(sessionIdToPush);

	if (logToPush == undefined) {
		await interaction.editReply(">>> Session log not found.");
		return;
	}

	const data = toPushData(logToPush, argv.getString("topic-id")!, argv.getString("documentator")!, argv.getString("mentors")!);

	const pushResult = await global.pushlogTarget.push(data);

	await interaction.editReply(`>>> Attempted to push to archive. Result: ${pushResult}`);
}

function toPushData(sessionLog: SessionLog, topicId: string, recorderName: string, mentorDiscordUserIdsInput: string): PushLogData {
	return {
		topicId: topicId,
		sessionDateISO: sessionLog.timeStarted.toUTC().toISO(),
		sessionTimeISO: sessionLog.timeStarted.toUTC().toISOTime(),
		durationISO: DateTime.fromMillis(sessionLog.timeEnded.toMillis() - sessionLog.timeStarted.toMillis()).toUTC().toISOTime(),
		recorderName: recorderName,
		mentorDiscordUserIds: mentorDiscordUserIdsInput.split(",").map(id => id.replace("<@!", "").replace(">", ""))
	}
}
