import type { Component } from "@mariozechner/pi-tui";
import { Key, matchesKey, truncateToWidth } from "@mariozechner/pi-tui";
import { bgBlue, bold, cyan, green, red, yellow } from "../ansi.js";
import { State } from "../state.js";
import type { PendingRequest } from "../types.js";

const CHOICES = ["allow", "always", "deny"] as const;

export class ApprovalOverlay implements Component {
	private selected = 0;

	constructor(
		private req: PendingRequest,
		private onDone: (action: string | null) => void,
	) {}

	invalidate(): void {}

	render(width: number): string[] {
		const w = Math.min(width - 4, 60);
		const border = "─".repeat(w);
		const lines: string[] = [
			"",
			truncateToWidth(`  ${yellow(`┌${border}┐`)}`, width),
			truncateToWidth(`  ${yellow("│")} ${bold("Approve connection?")}`, width),
			truncateToWidth(`  ${yellow("│")} Peer: ${cyan(State.shortPk(this.req.peer))}`, width),
			truncateToWidth(`  ${yellow("│")} ${this.req.detail || this.req.title}`, width),
			truncateToWidth(`  ${yellow("│")}`, width),
		];
		for (let i = 0; i < CHOICES.length; i++) {
			const c = CHOICES[i];
			const prefix = i === this.selected ? bgBlue("> ") : "  ";
			const label = c === "allow" ? green(c) : c === "always" ? yellow(c) : red(c);
			lines.push(truncateToWidth(`  ${yellow("│")} ${prefix}${label}`, width));
		}
		lines.push(truncateToWidth(`  ${yellow(`└${border}┘`)}`, width));
		return lines;
	}

	handleInput(data: string): void {
		if (matchesKey(data, Key.up) && this.selected > 0) this.selected--;
		else if (matchesKey(data, Key.down) && this.selected < 2) this.selected++;
		else if (matchesKey(data, Key.enter)) this.onDone(CHOICES[this.selected]);
		else if (matchesKey(data, Key.escape)) this.onDone(null);
	}
}
