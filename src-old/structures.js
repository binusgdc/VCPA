module.exports = {
	Event: class {
		constructor(type, uid, time) {
			this.type = type;
			this.uid = uid;
			this.time = time;
		}
	},

	Session: class {
		constructor(owner, channel) {
			this.owner = owner;
			this.channel = channel;
			this.start = new Date();
			this.end = undefined;
			this.events = [];
		}

		log(type, uid, time) {
			this.events[this.events.length] = new module.exports.Event(type, uid, time);
		}
	}
};
