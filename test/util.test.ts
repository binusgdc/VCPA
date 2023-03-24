import { SnowflakeUtil } from 'discord.js';
import 'ts-jest';
import { Session } from '../src/structures';
import * as util from '../src/util';

test('formatPeriodMinutes', () => {
    const milliSeconds = 1800000; 
    const minutes = 30;
    expect(util.formatPeriod(milliSeconds, "MINUTES")).toBe(minutes.toString());
})

test('formatPeriodVerbose', () => {
    const milliSeconds = 1800000; 
    const expected = "0 hours, 30 minutes, 0.0 seconds";
    expect(util.formatPeriod(milliSeconds, "VERBOSE")).toBe(expected);
})

test('generateSessionOutput produces expected session info format', () => {
    const expectedHeaderColumns = ['date', 'owner', 'start', 'duration']
    const owner = SnowflakeUtil.generate(0)
    const channel = SnowflakeUtil.generate(1)
    const session = new Session(owner, channel)
    session.start()
    session.end()
    const report = util.generateSessionOutput(session)
    const headerColumns = report.sesinfo.split('\n')[0].split(',')
    for (let index = 0; index < expectedHeaderColumns.length; index++) {
        expect(headerColumns[index]).toBe(expectedHeaderColumns[index])
    }
})

test('generateSessionOutput produces expected attendance info format', () => {
    const expectedHeaderColumns = ['sessionId', 'id', 'type', 'time']
    const owner = SnowflakeUtil.generate(0)
    const channel = SnowflakeUtil.generate(1)
    const session = new Session(owner, channel)
    session.start()
    session.end()
    const report = util.generateSessionOutput(session)
    const headerColumns = report.attdet.split('\n')[0].split(',')
    for (let index = 0; index < expectedHeaderColumns.length; index++) {
        expect(headerColumns[index]).toBe(expectedHeaderColumns[index])
    }
})