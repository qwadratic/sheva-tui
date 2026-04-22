import type { Component } from "@mariozechner/pi-tui";
import { truncateToWidth } from "@mariozechner/pi-tui";
import { bold, cyan, gray, green, magenta, red, yellow } from "../ansi.js";
import type { State } from "../state.js";

export class Header implements Component {
	state: State;
	constructor(state: State) {
		this.state = state;
	}

	invalidate(): void {}

	render(width: number): string[] {
		const { state: s } = this;
		const dot = s.statusMsg.startsWith("Connected") ? green("●") : red("●");
		const line1 = truncateToWidth(
			` ${dot} ${bold(yellow("⟁ Sheva Node"))} ${cyan(s.nodeInfo.fingerprint)}  v${s.nodeInfo.version}  ⏱ ${s.nodeInfo.uptime}`,
			width,
		);
		const pOn = s.peers.filter((p) => p.online).length;
		const line2 = truncateToWidth(
			` Peers: ${green(String(pOn))}/${s.peers.length}  ` +
				`Rooms: ${magenta(String(s.rooms.length))} [${s.rooms.join(", ") || "none"}]  ` +
				`Pending: ${s.pending.length > 0 ? red(String(s.pending.length)) : "0"}  ` +
				`Disc: ${s.discoverable ? green("ON") : "OFF"}`,
			width,
		);
		return [line1, line2, gray("─".repeat(width))];
	}
}
