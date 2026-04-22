import type { Component, Terminal } from "@mariozechner/pi-tui";
import { Input, Key, matchesKey, truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import { gray } from "../ansi.js";
import type { State } from "../state.js";
import { ApprovalOverlay } from "./approval-overlay.js";
import { ChatWindow } from "./chat-window.js";
import { Feed } from "./feed.js";
import { Header } from "./header.js";
import { PeerList } from "./peer-list.js";
import { PromptOverlay } from "./prompt-overlay.js";
import { StatusBar } from "./status-bar.js";

type FocusTarget = "peers" | "chat";

export class Root implements Component {
	private header: Header;
	private peerList: PeerList;
	private feed: Feed;
	private chatWindow: ChatWindow;
	private chatInput: Input;
	private statusBar: StatusBar;
	private focusTarget: FocusTarget = "peers";
	private activeOverlay: Component | null = null;
	private requestRender: () => void;

	constructor(
		private state: State,
		private terminal: Terminal,
		requestRender: () => void,
	) {
		this.requestRender = requestRender;
		this.header = new Header(state);
		this.peerList = new PeerList(state);
		this.feed = new Feed(state);
		this.chatWindow = new ChatWindow(state);
		this.chatInput = new Input();
		this.statusBar = new StatusBar(state);

		this.peerList.onSelectPeer = (pk) => {
			state.openChat(pk).then(() => {
				this.focusTarget = "chat";
				this.requestRender();
			});
		};

		this.chatInput.onSubmit = (text: string) => {
			if (text?.trim()) {
				state.sendMessage(text.trim());
				this.chatInput.setValue("");
			}
		};
	}

	invalidate(): void {
		this.header.invalidate();
		this.peerList.invalidate();
		this.feed.invalidate();
		this.chatWindow.invalidate();
		this.chatInput.invalidate();
		this.statusBar.invalidate();
		if (this.activeOverlay) this.activeOverlay.invalidate();
	}

	render(width: number): string[] {
		const lines: string[] = [];

		// Header
		lines.push(...this.header.render(width));

		// Two-column layout
		const leftW = Math.max(20, Math.floor(width * 0.28));
		const rightW = width - leftW - 1;

		// Adjust max lines based on terminal height
		const contentRows = this.terminal.rows - 6; // header + status
		this.feed.maxLines = Math.max(5, Math.floor(contentRows * 0.45));
		this.chatWindow.maxLines = Math.max(5, Math.floor(contentRows * 0.35));

		const leftLines = this.peerList.render(leftW);
		const rightFeed = this.feed.render(rightW);
		const rightChat = this.chatWindow.render(rightW);
		const inputLines = this.chatInput.render(rightW - 4);
		const inputRendered = inputLines.map((l) => truncateToWidth(` > ${l}`, rightW));
		const rightLines = [...rightFeed, ...rightChat, ...inputRendered];

		// Merge columns
		const maxRows = Math.max(leftLines.length, rightLines.length);
		for (let i = 0; i < maxRows; i++) {
			const left = i < leftLines.length ? leftLines[i] : "";
			const right = i < rightLines.length ? rightLines[i] : "";
			const leftPad = leftW - visibleWidth(left);
			const padded = left + " ".repeat(Math.max(0, leftPad));
			lines.push(truncateToWidth(`${padded}${gray("│")}${right}`, width));
		}

		// Status bar
		lines.push(...this.statusBar.render(width));

		// Overlay
		if (this.activeOverlay) {
			const overlayLines = this.activeOverlay.render(width);
			const startRow = Math.max(0, lines.length - overlayLines.length - 2);
			for (let i = 0; i < overlayLines.length; i++) {
				if (startRow + i < lines.length) lines[startRow + i] = overlayLines[i];
				else lines.push(overlayLines[i]);
			}
		}

		return lines;
	}

	handleInput(data: string): void {
		// Overlay captures all input
		if (this.activeOverlay) {
			if (this.activeOverlay.handleInput) this.activeOverlay.handleInput(data);
			this.requestRender();
			return;
		}

		// Global quit
		if (matchesKey(data, Key.ctrl("c")) || (this.focusTarget !== "chat" && data === "q")) {
			process.exit(0);
		}

		// Tab to switch focus
		if (matchesKey(data, "tab")) {
			this.focusTarget = this.focusTarget === "peers" ? "chat" : "peers";
			this.requestRender();
			return;
		}

		// Global shortcuts (only when not typing)
		if (this.focusTarget !== "chat") {
			if (data === "c") {
				this.showConnectPrompt();
				return;
			}
			if (data === "r") {
				this.showRoomPrompt();
				return;
			}
			if (data === "d") {
				this.state.toggleDiscoverable().then(() => {
					this.state.statusMsg = `Discoverable: ${this.state.discoverable ? "ON" : "OFF"}`;
					this.requestRender();
				});
				return;
			}
			if (data === "R") {
				this.refreshAll();
				return;
			}
			if (data === "a" && this.state.pending.length > 0) {
				this.showApproval(this.state.pending[0]);
				return;
			}
		}

		// Route to focused component
		if (this.focusTarget === "peers") {
			this.peerList.handleInput(data);
		} else {
			this.chatInput.handleInput(data);
		}
		this.requestRender();
	}

	private showConnectPrompt(): void {
		this.activeOverlay = new PromptOverlay("Connect to peer (64-char hex pubkey)", async (val) => {
			this.activeOverlay = null;
			if (val) {
				const ok = await this.state.connectPeer(val);
				this.state.statusMsg = ok ? `Connecting to ${val.slice(0, 12)}…` : "Failed to connect";
			}
			this.requestRender();
		});
		this.requestRender();
	}

	private showRoomPrompt(): void {
		this.activeOverlay = new PromptOverlay("Join room (code)", async (val) => {
			this.activeOverlay = null;
			if (val) {
				const ok = await this.state.joinRoom(val);
				this.state.statusMsg = ok ? `Joined room "${val}"` : "Failed to join room";
			}
			this.requestRender();
		});
		this.requestRender();
	}

	private showApproval(req: (typeof this.state.pending)[0]): void {
		this.activeOverlay = new ApprovalOverlay(req, async (action) => {
			this.activeOverlay = null;
			if (action) {
				await this.state.decide(req.id, action);
				this.state.statusMsg = `${req.peer.slice(0, 12)}: ${action}`;
			}
			this.requestRender();
		});
		this.requestRender();
	}

	private async refreshAll(): Promise<void> {
		this.state.statusMsg = "Refreshing…";
		this.requestRender();
		await this.state.boot();
		this.state.statusMsg = "Refreshed";
		this.requestRender();
	}
}
