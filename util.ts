const dateFormat = require("dateformat");

module.exports = {
	formatDate: (date : Date, style : "verbose" | "std" | "excel") : string => {
		switch (style) {
			case "verbose": {
				return dateFormat(date, "UTC:d mmmm yyyy HH:MM:ss.l \"UTC\"");
			} break;

			case "std": {
				return date.toISOString();
			} break;

			case "excel": {
				const year : number = date.getUTCFullYear();
				const month : number = date.getUTCMonth();
				const day : number = date.getUTCDay();
				const hour : number = date.getUTCHours();
				const mins : number = date.getUTCMinutes();
				const secs : number = date.getUTCSeconds();
				const msecs : number = date.getUTCMilliseconds();

				return dateFormat(date, `${year}-${month}-${day} ${hour}:${mins}:${secs}.${msecs}`);
			} break;
		}
	},

	formatPeriod: (msecs : number) : string => {
		const secs : number = Math.floor(msecs / 1000);
		const mins : number = Math.floor(secs / 60);
		const hrs : number = Math.floor(mins / 60);

		return `${hrs} hours, ${mins % 60} minutes, ${secs % 60}.${msecs % 1000} seconds`;
	}
};
