import type { Component } from "@mariozechner/pi-tui";
import { Key, matchesKey, truncateToWidth } from "@mariozechner/pi-tui";
import { bold, cyan, gray, yellow } from "../ansi.js";
import type { State as StateType } from "../state.js";
import { State } from "../state.js";

export class Feed implements Component {
	maxLines = 20;
	focused = false;
	/** Scroll offset from the bottom. 0 = pinned to newest. */
	private scrollOffset = 0;

	constructor(private state: StateType) {}

	invalidate(): void {}

	get canScroll(): boolean {
		return this.state.feed.length > this.maxLines;
	}

	render(width: number): string[] {
		const { feed } = this.state;
		const scrollHint = this.canScroll && this.focused ? `${gray("[↑↓:scroll]")} ` : "";
		const title = this.focused ? cyan(bold("▸ Feed")) : bold("Feed");
		const lines: string[] = [truncateToWidth(` ${scrollHint}${title} (${feed.length})`, width)];

		if (feed.length === 0) {
			lines.push(truncateToWidth(gray("  No events yet"), width));
		} else {
			const maxOffset = Math.max(0, feed.length - this.maxLines);
			this.scrollOffset = Math.min(this.scrollOffset, maxOffset);
			const end = feed.length - this.scrollOffset;
			const start = Math.max(0, end - this.maxLines);
			const slice = feed.slice(start, end);
			for (const f of slice) {
				const dir = f.direction === "in" ? cyan("◀ IN ") : yellow("▶ OUT");
				const ts = (f.ts || "").slice(11, 19);
				const pk = State.shortPk(f.peer);
				const text = (f.text || "").replace(/\n/g, " ");
				lines.push(truncateToWidth(` ${ts} ${dir} [${pk}] ${text}`, width));
			}
			if (this.scrollOffset > 0) {
				lines.push(truncateToWidth(gray(`  ↓ ${this.scrollOffset} more`), width));
			}
		}
		return lines;
	}

	handleInput(data: string): void {
		if (!this.canScroll) return;
		const maxOffset = Math.max(0, this.state.feed.length - this.maxLines);
		if (matchesKey(data, Key.up)) {
			this.scrollOffset = Math.min(this.scrollOffset + 1, maxOffset);
		} else if (matchesKey(data, Key.down)) {
			this.scrollOffset = Math.max(this.scrollOffset - 1, 0);
		}
	}

	/** Reset scroll to bottom (newest) */
	resetScroll(): void {
		this.scrollOffset = 0;
	}
}
