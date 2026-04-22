import type { Component } from "@mariozechner/pi-tui";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
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
		const keys = "tab:focus  enter:select  c:connect  r:room  d:disc  a:approve  x:close  n:node  h:help  q:quit";
		const status = this.state.statusMsg;
		if (!status) {
			return [truncateToWidth(gray(` ${keys}`), width)];
		}
		const sep = "  │  ";
		const statusW = visibleWidth(status);
		const keysW = visibleWidth(keys);
		// If it all fits on one line, show it
		if (statusW + keysW + visibleWidth(sep) + 2 <= width) {
			return [truncateToWidth(gray(` ${status}${sep}${keys}`), width)];
		}
		// Otherwise just show status (truncated) + abbreviated keys
		return [truncateToWidth(gray(` ${status}${sep}h:help  q:quit`), width)];
	}
}
