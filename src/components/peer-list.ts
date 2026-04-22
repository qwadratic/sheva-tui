import type { Component } from "@mariozechner/pi-tui";
import { Key, matchesKey, truncateToWidth } from "@mariozechner/pi-tui";
import { bgBlue, bold, cyan, gray, green, magenta, red, yellow } from "../ansi.js";
import { State } from "../state.js";

type Section = "peers" | "pending";

export class PeerList implements Component {
	selected = 0;
	section: Section = "peers";
	focused = false;
	pendingSelected = 0;
	onSelectPeer?: (pubkey: string) => void;
	onApprovePending?: (idx: number) => void;

	constructor(private state: State) {}

	invalidate(): void {}

	render(width: number): string[] {
		const { peers, pending } = this.state;
		const lines: string[] = [];

		// Peers section
		const peersActive = this.focused && this.section === "peers";
		const peersTitle = peersActive ? cyan(bold("▸ Peers")) : bold("Peers");
		lines.push(truncateToWidth(` ${peersTitle} (${peers.length})`, width));
		if (peers.length === 0) {
			lines.push(truncateToWidth(gray("  No peers yet"), width));
		} else {
			for (let i = 0; i < peers.length; i++) {
				const p = peers[i];
				const dot = p.online ? green("●") : red("○");
				const trust =
					p.trust === "trusted"
						? green("trusted")
						: p.trust === "blocked"
							? red("blocked")
							: p.trust === "seen"
								? yellow("seen")
								: gray("unknown");
				const isSel = i === this.selected && peersActive;
				const prefix = isSel ? bgBlue(">") : i === this.selected ? ">" : " ";
				const nick = i === this.selected ? bold(p.nick) : p.nick;
				lines.push(truncateToWidth(`${prefix} ${dot} ${nick} ${trust}`, width));
			}
		}

		// Rooms
		lines.push("");
		lines.push(truncateToWidth(` ${bold("Rooms")} (${this.state.rooms.length})`, width));
		if (this.state.rooms.length === 0) {
			lines.push(truncateToWidth(gray("  No rooms"), width));
		} else {
			for (const r of this.state.rooms) {
				lines.push(truncateToWidth(`  ${magenta("#")} ${r}`, width));
			}
		}

		// Pending section
		lines.push("");
		const pendingActive = this.focused && this.section === "pending";
		const pendingTitle = pendingActive ? cyan(bold("▸ Pending")) : bold("Pending");
		lines.push(truncateToWidth(` ${pendingTitle} (${pending.length})`, width));
		if (pending.length === 0) {
			lines.push(truncateToWidth(gray("  ✓ None"), width));
		} else {
			for (let i = 0; i < pending.length; i++) {
				const p = pending[i];
				const isSel = i === this.pendingSelected && pendingActive;
				const prefix = isSel ? bgBlue(">") : " ";
				lines.push(truncateToWidth(`${prefix} ${yellow("⚠")} ${p.title}`, width));
				lines.push(truncateToWidth(gray(`    ${State.shortPk(p.peer)}`), width));
			}
		}

		return lines;
	}

	/** Cycle to next section. Returns false if we should leave this component. */
	cycleSection(): boolean {
		const hasPending = this.state.pending.length > 0;
		if (this.section === "peers" && hasPending) {
			this.section = "pending";
			this.pendingSelected = 0;
			return true;
		}
		// Leave component — caller should move focus to chat
		this.section = "peers";
		return false;
	}

	/** Move focus back into this component from chat */
	enterFromChat(): void {
		this.section = "peers";
	}

	handleInput(data: string): void {
		if (this.section === "peers") {
			this.handlePeersInput(data);
		} else {
			this.handlePendingInput(data);
		}
	}

	private handlePeersInput(data: string): void {
		const { peers } = this.state;
		if (matchesKey(data, Key.up) && this.selected > 0) {
			this.selected--;
		} else if (matchesKey(data, Key.down) && this.selected < peers.length - 1) {
			this.selected++;
		} else if (matchesKey(data, Key.enter) && peers[this.selected]) {
			this.onSelectPeer?.(peers[this.selected].pk);
		}
	}

	private handlePendingInput(data: string): void {
		const { pending } = this.state;
		if (pending.length === 0) return;
		if (matchesKey(data, Key.up) && this.pendingSelected > 0) {
			this.pendingSelected--;
		} else if (matchesKey(data, Key.down) && this.pendingSelected < pending.length - 1) {
			this.pendingSelected++;
		} else if (matchesKey(data, Key.enter) || data === "a") {
			this.onApprovePending?.(this.pendingSelected);
		}
	}
}
