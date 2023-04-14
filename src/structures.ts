import { Snowflake, MessageEmbed } from "discord.js";
import { DateTime } from "luxon";

import * as Util from "./util";

type ServiceLocation = {
	guildId: Snowflake;
	ioChannelId: Snowflake;
	commandAccessRoleIds: Snowflake[];
}

type BGDCData = {
	msSessionsSheetId: string;
	msSessionsSubjectRanges: {
		PROGA: string;
		PROGB: string;
		DESG: string;
		A2D: string;
		A3D: string;
		SND: string;
	};

	attdetCsvGdriveFolderId: string;
	procdetCsvGdriveFolderId: string;
}

export type PushLogTargetConfig = PushLogTargetHttpJson

export interface PushLogTargetHttpJson {
	type: "http-json"
	endpoint: string;
}

export type ConfigFile = {
	token: Snowflake;
	serviceLocationWhiteList: ServiceLocation[];
	bgdc: BGDCData;
	pushLogTarget: PushLogTargetConfig | undefined;
}

type EventType = "JOIN" | "LEAVE";

export class Event {
	type: EventType;
	uid: Snowflake;
	time: DateTime;

	constructor(type : EventType, uid: Snowflake, time: DateTime) {
		this.type = type;
		this.uid = uid;
		this.time = time;
	}
}

export class Session {
	owner: Snowflake;
	guild: Snowflake;
	channel: Snowflake;
	startTime: DateTime | undefined;
	endTime: DateTime | undefined;
	timeoutID: ReturnType<typeof setTimeout> | undefined;
	events: Event[];

	constructor(owner : Snowflake, channel : Snowflake) {
		this.owner = owner;
		this.channel = channel;
		this.startTime = undefined;
		this.endTime = undefined;
		this.events = [];
	}

	start() {
		this.startTime = Util.dtnow();
	}

	end() {
		this.endTime = Util.dtnow();
	}

	log(type : EventType, uid : Snowflake, time : DateTime = Util.dtnow()) {
		this.events[this.events.length] = new Event(type, uid, time);
	}
}

export type SessionOutput = {
	sesinfo: string,
	attdet: string,
	procdet: string,
	embed: MessageEmbed
}
