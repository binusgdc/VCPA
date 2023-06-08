import { SnowflakeUtil, Snowflake } from "discord.js";
import { SessionService } from "../src/session/sessionService";
import { OngoingSessionStore } from "../src/ongoingSessionStore/ongoingSessionStore";
import { SessionEvent, VoiceChannel } from "../src/session/session"
import { DateTimeProvider, dtnow } from "../src/util";
import { mock, instance, when, verify, anything, capture } from "ts-mockito"
import { SessionLogStore } from "../src/sessionLogStore/sessionLogStore";

const ongoingSessionStoreMock = mock<OngoingSessionStore>();
const sessionLogStoreMock = mock<SessionLogStore>();
const dateTimeProviderMock = mock<DateTimeProvider>();
const now = dtnow();

function generateStartSessionRequest(n_members?: number): { ownerId: Snowflake, channel: VoiceChannel } {
	return {
		ownerId: SnowflakeUtil.generate().toString(),
		channel: {
			id: SnowflakeUtil.generate().toString(),
			guildId: SnowflakeUtil.generate().toString(),
			memberUserIds: n_members !== undefined
				? Array(n_members).map(() => SnowflakeUtil.generate().toString())
				: []
		}
	}
}

test("startSessionInChannelWithOngoingSessionFails", async () => {
	const { ownerId, channel } = generateStartSessionRequest();
	when(ongoingSessionStoreMock.has(channel.guildId, channel.id)).thenResolve(true);

	const sut = new SessionService(instance(ongoingSessionStoreMock), instance(sessionLogStoreMock), instance(dateTimeProviderMock));

	const result = await sut.startSession(ownerId, channel)
	expect(result.ok).toBeFalsy();
	if (!result.ok) {
		expect(result.error).toEqual("SessionOngoing");
	}
})

test("startSessionStoresAnOngoingSession", async () => {
	const { ownerId, channel } = generateStartSessionRequest();
	when(ongoingSessionStoreMock.has(channel.guildId, channel.id)).thenResolve(false);
	when(dateTimeProviderMock.now()).thenReturn(now);
	const sut = new SessionService(instance(ongoingSessionStoreMock), instance(sessionLogStoreMock), instance(dateTimeProviderMock));

	await sut.startSession(ownerId, channel);

	verify(ongoingSessionStoreMock.put(anything())).once();
	const [storedSession] = capture(ongoingSessionStoreMock.put).last();
	expect(storedSession.ownerId).toEqual(ownerId);
	expect(storedSession.channelId).toEqual(channel.id);
	expect(storedSession.guildId).toEqual(channel.guildId);
	expect(storedSession.events).toEqual([]);
})

test("startSessionStoresOngoingSessionWithInitialJoinEvents", async () => {
	const ownerId = SnowflakeUtil.generate().toString();
	const channelId = SnowflakeUtil.generate().toString();
	const guildId = SnowflakeUtil.generate().toString();
	const members = Array.from(Array(5)).map(() => SnowflakeUtil.generate().toString());
	when(ongoingSessionStoreMock.has(guildId, channelId)).thenResolve(false);
	when(dateTimeProviderMock.now()).thenReturn(now);
	const sut = new SessionService(instance(ongoingSessionStoreMock), instance(sessionLogStoreMock), instance(dateTimeProviderMock));

	await sut.startSession(ownerId, {
		id: channelId,
		guildId: guildId,
		memberUserIds: members
	});

	const expected = members.map<SessionEvent>(member => ({ type: "Join", userId: member, timeOccurred: now }));
	const [storedSession] = capture(ongoingSessionStoreMock.put).last();
	expect(storedSession.events).toEqual(expected);
})

test("stopSessionInChannelWithNoOngoingSessionFails", async () => {
	const { channel } = generateStartSessionRequest();
	when(ongoingSessionStoreMock.get(anything(), anything())).thenResolve(undefined);
	when(dateTimeProviderMock.now()).thenReturn(now);

	const sut = new SessionService(instance(ongoingSessionStoreMock), instance(sessionLogStoreMock), instance(dateTimeProviderMock));

	const result = await sut.stopSession(channel);

	expect(result.ok).toBeFalsy();
	if (!result.ok) {
		expect(result.error.type).toEqual("SessionNotFound");
	}
})
