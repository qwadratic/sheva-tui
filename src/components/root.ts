import type { Component, Terminal } from "@mariozechner/pi-tui";
import { Input, Key, matchesKey, truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import { cyan, gray } from "../ansi.js";
import type { ShevaRpc } from "../rpc.js";
import type { State } from "../state.js";
import { ApprovalOverlay } from "./approval-overlay.js";
import { ChatWindow } from "./chat-window.js";
import { Feed } from "./feed.js";
import { Header } from "./header.js";
import { HelpOverlay } from "./help-overlay.js";
import { PeerList } from "./peer-list.js";
import { PromptOverlay } from "./prompt-overlay.js";
import { StatusBar } from "./status-bar.js";

/**
 * Focus cycle: peers → pending (if any) → feed → chat (if open) → peers
 */
type FocusTarget = "peers" | "pending" | "feed" | "chat";

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
	private stopTui: () => void;

	constructor(
		private state: State,
		private terminal: Terminal,
		private rpcClient: ShevaRpc,
		requestRender: () => void,
		stopTui: () => void,
	) {
		this.requestRender = requestRender;
		this.stopTui = stopTui;
		this.header = new Header(state);
		this.peerList = new PeerList(state);
		this.feed = new Feed(state);
		this.chatWindow = new ChatWindow(state);
		this.chatInput = new Input();
		this.statusBar = new StatusBar(state);

		this.peerList.onSelectPeer = (pk) => {
			state.openChat(pk).then(() => {
				this.focusTarget = "chat";
				this.syncFocus();
				this.requestRender();
			});
		};

		this.peerList.onApprovePending = (idx) => {
			const req = this.state.pending[idx];
			if (req) this.showApproval(req);
		};

		this.chatInput.onSubmit = (text: string) => {
			if (text?.trim()) {
				state.sendMessage(text.trim());
				this.chatInput.setValue("");
			}
		};
	}

	setStatus(msg: string): void {
		this.statusBar.setTempStatus(msg, () => this.requestRender());
		this.requestRender();
	}

	private syncFocus(): void {
		this.peerList.focused = this.focusTarget === "peers" || this.focusTarget === "pending";
		this.peerList.section = this.focusTarget === "pending" ? "pending" : "peers";
		this.feed.focused = this.focusTarget === "feed";
		this.chatWindow.focused = this.focusTarget === "chat";
	}

	private nextFocus(): void {
		const hasPending = this.state.pending.length > 0;
		const hasChat = !!this.state.chatPeer;

		switch (this.focusTarget) {
			case "peers":
				if (hasPending) {
					this.focusTarget = "pending";
					this.peerList.pendingSelected = 0;
				} else {
					this.focusTarget = "feed";
					this.feed.resetScroll();
				}
				break;
			case "pending":
				this.focusTarget = "feed";
				this.feed.resetScroll();
				break;
			case "feed":
				if (hasChat) {
					this.focusTarget = "chat";
				} else {
					this.focusTarget = "peers";
				}
				break;
			case "chat":
				this.focusTarget = "peers";
				break;
		}
		this.syncFocus();
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
		const totalRows = this.terminal.rows;

		// Header
		lines.push(...this.header.render(width));

		// Two-column layout
		const leftW = Math.max(20, Math.floor(width * 0.28));
		const rightW = width - leftW - 1;

		// Adjust max lines based on terminal height
		const headerRows = 3;
		const statusRows = 2;
		const contentRows = totalRows - headerRows - statusRows;
		this.feed.maxLines = Math.max(5, Math.floor(contentRows * 0.45));
		this.chatWindow.maxLines = Math.max(5, Math.floor(contentRows * 0.35));

		// Sync focus state
		this.syncFocus();

		const leftLines = this.peerList.render(leftW);
		const rightFeed = this.feed.render(rightW);
		const rightChat = this.chatWindow.render(rightW);

		// Chat input — only show if chat is open
		let inputRendered: string[] = [];
		if (this.state.chatPeer) {
			const inputLines = this.chatInput.render(rightW - 4);
			const chatFocused = this.focusTarget === "chat";
			const prompt = chatFocused ? cyan("> ") : gray("> ");
			inputRendered = inputLines.map((l) => truncateToWidth(` ${prompt}${l}`, rightW));
		}

		const rightLines = [...rightFeed, ...rightChat, ...inputRendered];

		// Merge columns — fill to terminal height
		const maxRows = Math.max(leftLines.length, rightLines.length, contentRows);
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
			this.stopTui();
			process.exit(0);
		}

		// Tab: cycle focus
		if (matchesKey(data, "tab")) {
			this.nextFocus();
			this.requestRender();
			return;
		}

		// Global shortcuts (only when not typing in chat)
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
					this.setStatus(`Discoverable: ${this.state.discoverable ? "ON" : "OFF"}`);
				});
				return;
			}
			if (data === "a" && this.state.pending.length > 0) {
				const idx = this.focusTarget === "pending" ? this.peerList.pendingSelected : 0;
				const req = this.state.pending[idx];
				if (req) this.showApproval(req);
				return;
			}
			if (data === "h") {
				this.showHelp();
				return;
			}
			if (data === "n") {
				this.showNodeUrlPrompt();
				return;
			}
			if (data === "x") {
				this.closeChat();
				return;
			}
		}

		// 'x' works from chat focus too (when input is empty)
		if (this.focusTarget === "chat" && data === "x" && this.chatInput.getValue() === "") {
			this.closeChat();
			return;
		}

		// Route to focused component
		switch (this.focusTarget) {
			case "peers":
			case "pending":
				this.peerList.handleInput(data);
				break;
			case "feed":
				this.feed.handleInput(data);
				break;
			case "chat":
				if (matchesKey(data, Key.up) || matchesKey(data, Key.down)) {
					this.chatWindow.handleInput(data);
				} else {
					this.chatInput.handleInput(data);
				}
				break;
		}
		this.requestRender();
	}

	private closeChat(): void {
		this.state.chatPeer = null;
		this.state.chatMessages = [];
		this.focusTarget = "peers";
		this.syncFocus();
		this.requestRender();
	}

	private showConnectPrompt(): void {
		this.activeOverlay = new PromptOverlay("Connect to peer (64-char hex pubkey)", async (val) => {
			this.activeOverlay = null;
			if (val) {
				const ok = await this.state.connectPeer(val);
				this.setStatus(ok ? `Connecting to ${val.slice(0, 12)}…` : "Failed to connect");
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
				this.setStatus(ok ? `Joined room "${val}"` : "Failed to join room");
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
				this.setStatus(`${req.peer.slice(0, 12)}: ${action}`);
			}
			this.requestRender();
		});
		this.requestRender();
	}

	private showHelp(): void {
		this.activeOverlay = new HelpOverlay(() => {
			this.activeOverlay = null;
			this.requestRender();
		});
		this.requestRender();
	}

	private showNodeUrlPrompt(): void {
		const current = this.rpcClient.getUrl();
		this.activeOverlay = new PromptOverlay(`Node URL (current: ${current})`, (val) => {
			this.activeOverlay = null;
			if (val) {
				this.setStatus(`Connecting to ${val}…`);
				this.rpcClient.reconnect(val);
			}
			this.requestRender();
		});
		this.requestRender();
	}
}
