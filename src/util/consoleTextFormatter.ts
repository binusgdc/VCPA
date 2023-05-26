// Color codes obtained from MS docs
// https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences

export function brightRed() {
	return "\x1B[91m";
}

export function red() {
	return "\x1B[31m";
}

export function yellow() {
	return "\x1B[33m";
}

export function underline() {
	return "\x1B[4m";
}

export function reset() {
	return "\x1B[0m";
}
