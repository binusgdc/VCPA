import * as Date from "../src/util/date"

test("formatPeriodMinutes", () => {
    const milliSeconds = 1800000
    const minutes = 30
    expect(Date.formatPeriod(milliSeconds, "MINUTES")).toBe(minutes.toString())
})

test("formatPeriodVerbose", () => {
    const milliSeconds = 1800000
    const expected = "0 hours, 30 minutes, 0.0 seconds"
    expect(Date.formatPeriod(milliSeconds, "VERBOSE")).toBe(expected)
})
