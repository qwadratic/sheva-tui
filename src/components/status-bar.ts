import type { Component } from "@mariozechner/pi-tui";
import { truncateToWidth } from "@mariozechner/pi-tui";
import { gray } from "../ansi.js";
import type { State } from "../state.js";

export class StatusBar implements Component {
	constructor(private state: State) {}

	invalidate(): void {}

	render(width: number): string[] {
		const keys = "tab:focus  enter:select  c:connect  r:room  d:discoverable  a:approve  n:node  h:help  q:quit";
		return [truncateToWidth(gray(` ${this.state.statusMsg}  │  ${keys}`), width)];
	}
}
