import {
    ApplicationCommandData,
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
    Snowflake,
} from "discord.js"

import { AbstractCommandHandler } from "./abstractCommandHandler"
import { PushlogService } from "../session/pushlogService"
import { NonEmptyArray } from "../util/array"

export class PushlogCommandHandler extends AbstractCommandHandler {
    private readonly pushlogService: PushlogService

    public constructor(pushlogService: PushlogService) {
        super()

        this.pushlogService = pushlogService
    }

    public getSignature(): ApplicationCommandData {
        return {
            name: "pushlog",
            description:
                "[EXPERIMENTAL] Pushes the specified session's logs to an external archive",
            options: [
                {
                    name: "class-id",
                    description: "Class ID (example: DSG-A)",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: "topic-id",
                    description: "Topic ID (example: DSG-1)",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: "documentator",
                    description: "Class documentator's name",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: "mentors",
                    description:
                        'Mentor Discord ID(s) (e.g.: "@mentor1 @mentor2"). If not set, defaults to command user.',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: "session-id",
                    description:
                        "The ID of the session to push. If not set, defaults to the most recent session.",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
            ],
        }
    }

    public async handle(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply()

        const argv = interaction.options

        const sessionIdToPush = argv.getString("session-id") ?? undefined

        const [classId, topicId, documentatorName, mentorIdsInput] = [
            argv.getString("class-id"),
            argv.getString("topic-id"),
            argv.getString("documentator"),
            argv.getString("mentors"),
        ]

        if (classId === null || topicId === null || documentatorName === null) {
            interaction.editReply("Unexpected error: Missing expected parameters.")
            return
        }

        const mentorIds: NonEmptyArray<Snowflake> | undefined =
            mentorIdsInput === null
                ? { head: interaction.user.id, tail: [] }
                : this.parseMentorIds(mentorIdsInput)

        if (mentorIds === undefined) {
            interaction.editReply("Unable to parse mentor IDs")
            return
        }

        const pushResult = await this.pushlogService.pushSessionLog(
            classId,
            topicId,
            documentatorName,
            mentorIds,
            sessionIdToPush
        )

        if (!pushResult.ok) {
            let errorMessage: string
            switch (pushResult.error.type) {
                case "LogNotFound":
                    errorMessage = "The specified log ID was not found."
                    break
                case "NoUnpushed":
                    errorMessage =
                        "No unpushed session logs were found. Specify a log by its ID to push it again."
                    break
                case "PushUnsuccessful":
                    errorMessage = "Something went wrong while pushing the log"
                    break
            }
            await interaction.editReply(`>>> Attempted to push to archive. Result: ${errorMessage}`)
            return
        }

        await interaction.editReply(`>>> Attempted to push to archive. Result: SUCCESS`)
    }

    private parseMentorIds(raw_input: string): NonEmptyArray<Snowflake> | undefined {
        const result = raw_input.split(" ").map((id) => id.replace("<@", "").replace(">", ""))
        return result.length !== 0 ? { head: result[0], tail: [...result.slice(1)] } : undefined
    }
}
