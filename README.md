# VCPA

`VCPA` is a Discord bot that records voice call participants' attendance.

# Development Setup

It is recommended to install `nvm` to ease Node version management:

```shell
$ curl https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh > install.sh
$ chmod +x ./install.sh
$ ./install.sh
```

After running the script, close the current terminal and open a new one. Verify
the installation by running:

```shell
$ command -v nvm
nvm
```

Install `node` and verify it is the correct version:

```shell
$ nvm install 16.7.0
$ node --version
v16.7.0
```

Clone the repository and install the required packages:

```shell
$ git clone https://github.com/binusgdc/VCPA.git
$ cd ./VCPA
$ npm install
```

Create a `config.json` file to store secrets and IDs:

```shell
$ touch config.json
```

```json
{
	"token": "",
	"clientGuildId": "",
	"clientChannelId": "",
	"clientCommandAccessRoleId": ""
}

```

The bot is now ready to run:

```shell
$ node index.js
```

# Slash Commands + Typescript Migration

The bot is currently undergoing migration to replace prefix based commands with
slash commands. Additonally, it is also being rewritten in Typescript, which
means the source code must be "compiled" prior to running the bot.

As of the writing of this document, all migration work is being done on the
`mig` branch:

```shell
$ git switch mig
```

This project's `package.json` file does not include a Typescript compiler, and
therefore it must be installed first. Afterwards, compiling is simple thanks to
the provided `tsconfig.json` file (note: ensure all operations are being done
from the root of the project!).

```shell
$ npm install -g typescript
$ tsc
```

A new `build/` folder should be created next to the `src` folder. This folder
contains the final runnables:

```shell
$ node build/index.js
```
