const dateFormat = require("dateformat");

module.exports = {
	formatDate: (date, style) => {
		switch (style) {
			case "verbose": {
				return dateFormat(date, "UTC:d mmmm yyyy HH:MM:ss.l \"UTC\"");
			} break;

			case "std": {
				return date.toISOString();
			} break;

			case "excel": {
				const year = date.getUTCFullYear();
				const month = date.getUTCMonth();
				const day = date.getUTCDay();
				const hour = date.getUTCHours();
				const mins = date.getUTCMinutes();
				const secs = date.getUTCSeconds();
				const msecs = date.getUTCMilliseconds();

				return dateFormat(date, `${year}-${month}-${day} ${hour}:${mins}:${secs}.${msecs}`);
			} break;
		}
	},

	formatPeriod: (msecs) => {
		const secs = Math.floor(msecs / 1000);
		const mins = Math.floor(secs / 60);
		const hrs = Math.floor(mins / 60);

		return `${hrs} hours, ${mins % 60} minutes, ${secs % 60}.${msecs % 1000} seconds`;
	}
};
