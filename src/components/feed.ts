import type { Component } from "@mariozechner/pi-tui";
import { truncateToWidth } from "@mariozechner/pi-tui";
import { bold, cyan, gray, yellow } from "../ansi.js";
import type { State as StateType } from "../state.js";
import { State } from "../state.js";

export class Feed implements Component {
	maxLines = 20;

	constructor(private state: StateType) {}

	invalidate(): void {}

	render(width: number): string[] {
		const { feed } = this.state;
		const lines: string[] = [truncateToWidth(` ${bold("Feed")} (${feed.length})`, width)];

		if (feed.length === 0) {
			lines.push(truncateToWidth(gray("  No events yet"), width));
		} else {
			// Show last N items, oldest first (top→bottom = old→new)
			const start = Math.max(0, feed.length - this.maxLines);
			const slice = feed.slice(start);
			for (const f of slice) {
				const dir = f.direction === "in" ? cyan("◀ IN ") : yellow("▶ OUT");
				const ts = (f.ts || "").slice(11, 19);
				const pk = State.shortPk(f.peer);
				const text = (f.text || "").replace(/\n/g, " ").slice(0, 200);
				lines.push(truncateToWidth(` ${ts} ${dir} [${pk}] ${text}`, width));
			}
		}
		return lines;
	}
}
