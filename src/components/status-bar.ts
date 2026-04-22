import type { Component } from "@mariozechner/pi-tui";
import { truncateToWidth } from "@mariozechner/pi-tui";
import { bold, gray } from "../ansi.js";
import type { State } from "../state.js";

export class StatusBar implements Component {
	constructor(private state: State) {}

	invalidate(): void {}

	render(width: number): string[] {
		const help = `${bold("Tab")}:focus ${bold("Enter")}:select ${bold("c")}:connect ${bold("r")}:room ${bold("d")}:discoverable ${bold("a")}:approve ${bold("R")}:refresh ${bold("q")}:quit`;
		return [
			gray("─".repeat(width)),
			truncateToWidth(` ${this.state.statusMsg}`, width),
			truncateToWidth(` ${help}`, width),
		];
	}
}
