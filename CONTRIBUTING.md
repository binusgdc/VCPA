# Contributing Guide

New contributers are encouraged to read about the general structure of a discord.js bot before proceeding. Once you are
familiar with the execution flow of such a bot, the execution flow of this codebase will hopefully be easier to follow.

After getting familiar with this codebase, you are encouraged to check for open issues to tackle. **Please create a new
branch to house your contributions.**

Before pushing code to this repository, it would be beneficial for future maintainers to follow the established code
style.

## Code Style

This is an informal code style documentation in lieu of an actual style document such as `.prettierrc`, `.eslintrc`,
`.editorconfig`, etc.

At the time of writing of this document, the general code style used in this repository:

- Uses tab characters (ASCII code `0x09`) for indentations instead of space characters (ASCII code `0x20`)
	- Each tab character is equivalent to 4 space characters in width.
- Uses `LF` line endings (ASCII byte sequence `0x0A`) on all platforms, including Windows, which usually uses `CRLF`
(byte sequence `0x0D 0x0A`)
- Uses a single trailing empty line
- Mostly uses [the OTBS variant of K&R style braces](https://en.wikipedia.org/wiki/Indentation_style#OTBS)
- Mostly uses [the Java naming convention](https://en.wikipedia.org/wiki/Naming_convention_(programming)#Java)
	- Class, enum, and type names use `PascalCaase`
	- Function, variable, and file names use `camelCase`
- Categorizes and sorts `import`s:
	- Categorizes by source:
		- Top-level: `import { MessageEmbed } from "discord.js";`
		- User-defined: `import { formatPeriod } from "../util";`
	- Sorts ASCII-betically

As informal and incomplete this document may be, it hopefully still helps ensure a somewhat consistent code style.
