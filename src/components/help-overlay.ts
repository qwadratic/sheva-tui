import type { Component } from "@mariozechner/pi-tui";
import { Key, matchesKey, truncateToWidth } from "@mariozechner/pi-tui";
import { bold, cyan, gray, magenta, yellow } from "../ansi.js";

const HELP_LINES = [
	`${bold(yellow("⟁ Sheva TUI"))} — Terminal UI for sheva-node`,
	"",
	`${bold("Navigation")}`,
	`  ${cyan("Tab")}          Cycle: Peers → Pending → Chat → Peers`,
	`  ${cyan("↑ / ↓")}        Navigate peer list or pending list`,
	`  ${cyan("Enter")}        Open chat / approve pending / send message`,
	`  ${cyan("Esc")}          Close overlay or cancel input`,
	"",
	`${bold("Actions")}`,
	`  ${cyan("c")}            Connect to a peer by public key`,
	`  ${cyan("r")}            Join a room by shared code`,
	`  ${cyan("d")}            Toggle discoverable mode`,
	`  ${cyan("a")}            Approve/deny pending (selected or first)`,
	`  ${cyan("x")}            Close current chat`,
	`  ${cyan("n")}            Change node URL (connect to different node)`,
	`  ${cyan("h")}            Show this help`,
	`  ${cyan("q / Ctrl-C")}   Quit`,
	"",
	`${bold("How it works")}`,
	`  ${magenta("Rooms")} discover peers via DHT — join the same room code`,
	`  to find each other. ${magenta("Chat")} is direct peer-to-peer, encrypted`,
	"  and signed. No servers involved.",
	"",
	`${bold("Links")}`,
	`  ${cyan("GitHub")}   https://github.com/qwadratic/sheva-tui`,
	`  ${cyan("Issues")}   https://github.com/qwadratic/sheva-tui/issues`,
	`  ${cyan("PRs")}      https://github.com/qwadratic/sheva-tui/pulls`,
	"",
	`  ${yellow("⭐ Star us on GitHub if you find this useful!")}`,
	"",
	gray("  Press Esc or h to close"),
];

export class HelpOverlay implements Component {
	constructor(private onClose: () => void) {}

	invalidate(): void {}

	render(width: number): string[] {
		const w = Math.min(width - 4, 68);
		const border = "─".repeat(w);
		const lines: string[] = ["", `  ${yellow(`┌${border}┐`)}`];

		for (const line of HELP_LINES) {
			const padded = truncateToWidth(line, w - 2);
			lines.push(truncateToWidth(`  ${yellow("│")} ${padded}`, width));
		}

		lines.push(`  ${yellow(`└${border}┘`)}`);
		return lines;
	}

	handleInput(data: string): void {
		if (matchesKey(data, Key.escape) || data === "h" || matchesKey(data, Key.enter)) {
			this.onClose();
		}
	}
}
