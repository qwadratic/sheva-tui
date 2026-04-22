const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

function fg(code: number, text: string): string {
	return `\x1b[${code}m${text}${RESET}`;
}

export const green = (t: string): string => fg(32, t);
export const red = (t: string): string => fg(31, t);
export const yellow = (t: string): string => fg(33, t);
export const cyan = (t: string): string => fg(36, t);
export const magenta = (t: string): string => fg(35, t);
export const gray = (t: string): string => fg(90, t);
export const bold = (t: string): string => `${BOLD}${t}${RESET}`;
export const bgBlue = (t: string): string => `\x1b[44;37m${t}${RESET}`;
