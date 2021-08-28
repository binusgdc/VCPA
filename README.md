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
$ git clone https://github.com/500-internal-server-error/VCPA.git
$ cd ./VCPA
$ npm install
```

Create a `.env` file to store secrets and IDs:

```shell
$ touch .env
```

```
TOKEN=
GUILD_ID=
CHANNEL_ID=
COMMAND_ACCESS_ROLE_ID=
```

The bot is now ready to run:

```shell
$ node index.js
```
