import type { Component } from "@mariozechner/pi-tui";
import { Key, matchesKey, truncateToWidth } from "@mariozechner/pi-tui";
import { bgBlue, bold, gray, green, red, yellow } from "../ansi.js";
import { State } from "../state.js";

export class PeerList implements Component {
	selected = 0;
	onSelectPeer?: (pubkey: string) => void;

	constructor(private state: State) {}

	invalidate(): void {}

	render(width: number): string[] {
		const { peers, pending } = this.state;
		const lines: string[] = [];

		lines.push(truncateToWidth(` ${bold("Peers")} (${peers.length})`, width));
		if (peers.length === 0) {
			lines.push(truncateToWidth(gray("  No peers yet"), width));
		} else {
			for (let i = 0; i < peers.length; i++) {
				const p = peers[i];
				const dot = p.online ? green("●") : red("○");
				const trust =
					p.trust === "trusted"
						? green("T")
						: p.trust === "blocked"
							? red("B")
							: p.trust === "seen"
								? yellow("S")
								: "?";
				const prefix = i === this.selected ? bgBlue(">") : " ";
				const nick = i === this.selected ? bold(p.nick) : p.nick;
				lines.push(truncateToWidth(`${prefix} ${dot} ${nick} [${trust}]`, width));
			}
		}

		lines.push("");
		lines.push(truncateToWidth(` ${bold("Pending")} (${pending.length})`, width));
		if (pending.length === 0) {
			lines.push(truncateToWidth(gray("  ✓ None"), width));
		} else {
			for (const p of pending) {
				lines.push(truncateToWidth(`  ${yellow("⚠")} ${p.title}`, width));
				lines.push(truncateToWidth(gray(`    ${State.shortPk(p.peer)}`), width));
			}
		}

		return lines;
	}

	handleInput(data: string): void {
		const { peers } = this.state;
		if (matchesKey(data, Key.up) && this.selected > 0) {
			this.selected--;
		} else if (matchesKey(data, Key.down) && this.selected < peers.length - 1) {
			this.selected++;
		} else if (matchesKey(data, Key.enter) && peers[this.selected]) {
			this.onSelectPeer?.(peers[this.selected].pk);
		}
	}
}
