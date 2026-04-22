import type { Component } from "@mariozechner/pi-tui";
import { Input, truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import { bold, gray, yellow } from "../ansi.js";

export class PromptOverlay implements Component {
	private input: Input;

	constructor(
		private title: string,
		private onDone: (value: string | null) => void,
	) {
		this.input = new Input();
		this.input.onSubmit = (val: string) => this.onDone(val || null);
		this.input.onEscape = () => this.onDone(null);
	}

	invalidate(): void {
		this.input.invalidate();
	}

	render(width: number): string[] {
		const w = Math.min(width - 4, 60);
		const border = "─".repeat(w);
		const titleVis = visibleWidth(this.title);
		const titlePad = " ".repeat(Math.max(0, w - titleVis - 1));
		const lines: string[] = [
			"",
			truncateToWidth(`  ${yellow(`┌${border}┐`)}`, width),
			truncateToWidth(`  ${yellow("│")} ${bold(this.title)}${titlePad}${yellow("│")}`, width),
		];
		const inputLines = this.input.render(w - 4);
		for (const il of inputLines) {
			const pad = " ".repeat(Math.max(0, w - visibleWidth(il) - 1));
			lines.push(truncateToWidth(`  ${yellow("│")} ${il}${pad}${yellow("│")}`, width));
		}
		lines.push(truncateToWidth(`  ${yellow(`└${border}┘`)}`, width));
		lines.push(truncateToWidth(gray("  Enter to confirm, Esc to cancel"), width));
		return lines;
	}

	handleInput(data: string): void {
		this.input.handleInput(data);
	}
}
