import { ChatInputCommandInteraction } from "discord.js"
import * as Filter from "../src/filters/filter"

test("pipeAppliesFiltersInExpectedOrder", async () => {
    const resultArr: number[] = []

    const first: Filter.Filter = {
        apply: (handler) => ({
            async handle(cmd) {
                resultArr.push(1)
                await handler.handle(cmd)
                resultArr.push(6)
            },
        }),
    }
    const second: Filter.Filter = {
        apply: (handler) => ({
            async handle(cmd) {
                resultArr.push(2)
                await handler.handle(cmd)
                resultArr.push(5)
            },
        }),
    }
    const third: Filter.Filter = {
        apply: (handler) => ({
            async handle(cmd) {
                resultArr.push(3)
                await handler.handle(cmd)
                resultArr.push(4)
            },
        }),
    }

    const piped = Filter.pipe(first, second, third)

    const handler = piped.apply({
        handle: (_) => Promise.resolve(),
    })

    await handler.handle({} as ChatInputCommandInteraction)

    const expected = [1, 2, 3, 4, 5, 6]
    expect(resultArr).toEqual(expected)
})
