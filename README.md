# 0x69420af

`0x69420af` is a Discord bot that records voice call participants' attendance.

# Development Setup

Setup on *nix or Windows WSL involves installing `nvm`using the provided
install script:

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

Installing `node` itself and verifying it is the correct version:

```shell
$ nvm install 16.7.0
$ node --version
v16.7.0
```