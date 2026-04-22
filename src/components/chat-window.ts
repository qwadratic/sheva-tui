import type { Component } from "@mariozechner/pi-tui";
import { truncateToWidth } from "@mariozechner/pi-tui";
import { bold, cyan, gray, magenta, red, yellow } from "../ansi.js";
import type { State as StateType } from "../state.js";
import { State } from "../state.js";

export class ChatWindow implements Component {
	maxLines = 15;

	constructor(private state: StateType) {}

	invalidate(): void {}

	render(width: number): string[] {
		const { chatPeer, chatMessages } = this.state;
		const sep = gray("─".repeat(width));
		const label = chatPeer
			? ` ${bold(magenta("Chat"))} with ${cyan(State.shortPk(chatPeer))}`
			: ` ${bold(magenta("Chat"))} — select a peer`;
		const lines: string[] = [sep, truncateToWidth(label, width)];

		if (!chatPeer) {
			lines.push(truncateToWidth(gray("  Press Enter on a peer to open chat"), width));
			return lines;
		}

		const msgs = chatMessages.slice(-this.maxLines);
		for (const m of msgs) {
			const dir = m.direction === "in" ? cyan("◀ ") : yellow("▶ ");
			const ts = (m.ts || "").slice(11, 19);
			const flag = m.flagged ? red(" [FLAGGED]") : "";
			const textLines = (m.text || "").split("\n");
			lines.push(truncateToWidth(`${dir}${ts}${flag} ${textLines[0]}`, width));
			for (let i = 1; i < Math.min(textLines.length, 4); i++) {
				lines.push(truncateToWidth(`    ${textLines[i]}`, width));
			}
		}
		return lines;
	}
}
