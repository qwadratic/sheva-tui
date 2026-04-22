import type { Component } from "@mariozechner/pi-tui";
import { Key, matchesKey, truncateToWidth } from "@mariozechner/pi-tui";
import { bold, cyan, gray, magenta, red, yellow } from "../ansi.js";
import type { State as StateType } from "../state.js";
import { State } from "../state.js";
import { wrapToWidth } from "../wrap.js";

export class ChatWindow implements Component {
	maxLines = 15;
	focused = false;
	private scrollOffset = 0;

	constructor(private state: StateType) {}

	invalidate(): void {}

	private renderAllMessages(width: number): string[] {
		const rendered: string[] = [];
		for (const m of this.state.chatMessages) {
			const dir = m.direction === "in" ? cyan("◀ ") : yellow("▶ ");
			const ts = (m.ts || "").slice(11, 19);
			const flag = m.flagged ? red(" [FLAGGED]") : "";
			for (const [i, line] of (m.text || "").split("\n").entries()) {
				const prefix = i === 0 ? `${dir}${ts}${flag} ` : "    ";
				rendered.push(...wrapToWidth(`${prefix}${line}`, width));
			}
		}
		return rendered;
	}

	render(width: number): string[] {
		const { chatPeer } = this.state;
		const sep = gray("─".repeat(width));
		const chatTitle = this.focused ? cyan(bold("▸ Chat")) : bold(magenta("Chat"));

		if (!chatPeer) {
			const label = ` ${chatTitle} — select a peer`;
			return [
				sep,
				truncateToWidth(label, width),
				truncateToWidth(gray("  Press Enter on a peer to open chat"), width),
				truncateToWidth(gray("  Rooms discover peers; chat is peer-to-peer"), width),
			];
		}

		const allRendered = this.renderAllMessages(width);
		const viewport = this.maxLines;
		const maxOffset = Math.max(0, allRendered.length - viewport);
		this.scrollOffset = Math.min(this.scrollOffset, maxOffset);

		const scrollable = allRendered.length > viewport;
		const scrollHint = scrollable && this.focused ? `${gray("[↑↓:scroll]")} ` : "";
		const closeHint = this.focused ? `${gray("[x:close]")} ` : "";
		const label = ` ${scrollHint}${closeHint}${chatTitle} with ${cyan(State.shortPk(chatPeer))}`;
		const lines: string[] = [sep, truncateToWidth(label, width)];

		const end = allRendered.length - this.scrollOffset;
		const start = Math.max(0, end - viewport);
		lines.push(...allRendered.slice(start, end));

		if (this.scrollOffset > 0) {
			lines.push(truncateToWidth(gray(`  ↓ ${this.scrollOffset} more`), width));
		}

		return lines;
	}

	handleInput(data: string): void {
		const maxOffset = Math.max(0, this.state.chatMessages.length * 20 - this.maxLines);
		if (matchesKey(data, Key.up)) {
			this.scrollOffset = Math.min(this.scrollOffset + 1, maxOffset);
		} else if (matchesKey(data, Key.down)) {
			this.scrollOffset = Math.max(this.scrollOffset - 1, 0);
		}
	}

	resetScroll(): void {
		this.scrollOffset = 0;
	}
}
