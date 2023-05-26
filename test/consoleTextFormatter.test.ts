import { LoggingLevel } from "../src/util/logger";
import { ConsoleLogger } from "../src/util/loggers/consoleLogger";

test("consoleTextFormatter", async () => {
	const logger = new ConsoleLogger(LoggingLevel.Debug);
	const msg = "Lorem ipsum dolor sit amet";

	console.log("Color Test Start");

	await logger.warn(msg);
	await logger.error(msg);
	await logger.fatal(msg);

	console.log("Color Test End");
});
