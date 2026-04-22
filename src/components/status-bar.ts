import type { Component } from "@mariozechner/pi-tui";
import { truncateToWidth } from "@mariozechner/pi-tui";
import { gray } from "../ansi.js";
import type { State } from "../state.js";

export class StatusBar implements Component {
	private statusTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(private state: State) {}

	invalidate(): void {}

	/** Set a temporary status message that auto-resets after 5s */
	setTempStatus(msg: string, onChange: () => void): void {
		this.state.statusMsg = msg;
		if (this.statusTimer) clearTimeout(this.statusTimer);
		this.statusTimer = setTimeout(() => {
			this.state.statusMsg = "";
			this.statusTimer = null;
			onChange();
		}, 5000);
	}

	render(width: number): string[] {
		const keys = "tab:focus  enter:select  c:connect  r:room  d:disc  a:approve  n:node  h:help  q:quit";
		const status = this.state.statusMsg;
		const hrLine = gray("─".repeat(width));
		if (!status) {
			return [hrLine, truncateToWidth(gray(` ${keys}`), width)];
		}
		return [hrLine, truncateToWidth(gray(` ${status}  │  h:help  q:quit`), width)];
	}
}
