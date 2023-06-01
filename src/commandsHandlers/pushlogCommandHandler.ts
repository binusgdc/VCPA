import { ApplicationCommandData, ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import { Duration } from "luxon";

import { AbstractCommandHandler } from "./abstractCommandHandler";
import { PushlogData } from "../pushlogTarget";
import { SessionLog, SessionLogStore } from "../sessionLog";

export class PushlogCommandHandler extends AbstractCommandHandler {
	private sessionLogStore: SessionLogStore

	public constructor(sessionLogStore: SessionLogStore) {
		super();

		this.sessionLogStore = sessionLogStore;
	}

	public getSignature(): ApplicationCommandData {
		return {
			name: "pushlog",
			description: "[EXPERIMENTAL] Pushes the specified session's logs to an external archive",
			options: [
				{
					name: "topic-id",
					description: "Topic of the session according to the curriculum",
					type: ApplicationCommandOptionType.String,
					required: true
				},
				{
					name: "mentors",
					description: "Mentor Discord ID(s) (e.g.: \"@mentor1 @mentor2\")",
					type: ApplicationCommandOptionType.String,
					required: true
				},
				{
					name: "documentator",
					description: "Class documentator's IRL name",
					type: ApplicationCommandOptionType.String,
					required: true
				},
				{
					name: "session-id",
					description: "The ID of the session to push",
					type: ApplicationCommandOptionType.String,
					required: false
				}
			]
		};
	}

	public async exec(interaction: ChatInputCommandInteraction): Promise<void> {
		if (global.pushlogTarget == undefined) {
			await interaction.reply("Error: push target is not configured.");
			return;
		}

		await interaction.deferReply();

		const argv = interaction.options;

		const sessionIdToPush = argv.getString("session-id");

		const logToPush = sessionIdToPush == undefined
			? await this.sessionLogStore.latestUnpushed()
			: await this.sessionLogStore.retrieve(sessionIdToPush);

		if (logToPush == undefined) {
			await interaction.editReply(">>> Session log not found.");
			return;
		}

		const data = toPushData(logToPush, argv.getString("topic-id")!, argv.getString("documentator")!, argv.getString("mentors")!);

		const pushResult = await global.pushlogTarget?.push(data);
		if (pushResult === "SUCCESS") {
			await this.sessionLogStore.setLogPushed(logToPush.id);
		}
		await interaction.editReply(`>>> Attempted to push to archive. Result: ${pushResult}`);
	}
};

function toPushData(sessionLog: SessionLog, topicId: string, recorderName: string, mentorDiscordUserIdsInput: string): PushlogData {
	return {
		topicId: topicId,
		sessionDateTime: sessionLog.timeStarted,
		sessionDuration: Duration.fromMillis(sessionLog.timeEnded.toMillis() - sessionLog.timeStarted.toMillis()),
		recorderName: recorderName,
		mentorDiscordUserIds: mentorDiscordUserIdsInput.split(" ").map(id => id.replace("<@", "").replace(">", "")),
		attendees: Array.from(arrayGroupBy(sessionLog.events, (event) => event.userId).entries()).map(([userId, events]) => {
			return {
				discordUserId: userId,
				attendanceDuration: Duration.fromMillis(
					events.reduce(
						(duration, event) => duration + ((event.timeOccurred.toMillis() - sessionLog.timeStarted.toMillis()) * (event.type === "Join" ? -1 : 1)), 0))
			}
		})
	}
}

function arrayGroupBy<T>(array: Array<T>, grouper: (value: T) => string): Map<string, Array<T>> {
	const result = new Map<string, Array<T>>();
	for (const value of array) {
		const key = grouper(value);
		if (!result.has(key)) {
			result.set(key, []);
		}
		result.get(key)!.push(value);
	}
	return result;
}
