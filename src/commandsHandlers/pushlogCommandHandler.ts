import {
    ApplicationCommandData,
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
} from "discord.js"

import { AbstractCommandHandler } from "./abstractCommandHandler"
import { PushlogService } from "../session/pushlogService"

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
                    name: "topic-id",
                    description: "Topic of the session according to the curriculum",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: "mentors",
                    description: 'Mentor Discord ID(s) (e.g.: "@mentor1 @mentor2")',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: "documentator",
                    description: "Class documentator's IRL name",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: "session-id",
                    description: "The ID of the session to push",
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

        const [topicId, documentatorName, mentorIdsInput] = [
            argv.getString("topic-id"),
            argv.getString("documentator"),
            argv.getString("mentors"),
        ]

        if (topicId === null || documentatorName === null || mentorIdsInput === null) {
            return
        }

        const mentorIds = mentorIdsInput
            .split(" ")
            .map((id) => id.replace("<@", "").replace(">", ""))

        const pushResult = await this.pushlogService.pushSessionLog(
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
}
