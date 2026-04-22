#!/usr/bin/env node

import { ProcessTerminal, TUI } from "@mariozechner/pi-tui";
import { Root } from "./components/root.js";
import { ShevaRpc } from "./rpc.js";
import { State } from "./state.js";

const WS_URL = process.argv[2] || "ws://127.0.0.1:4200";
const ORIGIN = "http://127.0.0.1:4200";

const terminal = new ProcessTerminal();
const tui = new TUI(terminal);

function shutdown(): void {
	tui.stop();
	process.exit(0);
}

let root: Root | null = null;

const rpcClient = new ShevaRpc({
	url: WS_URL,
	origin: ORIGIN,
	onEvent: (msg) => {
		state.handleEvent(msg);
	},
	onConnect: () => {
		root?.setStatus(`Connected to ${rpcClient.getUrl()}`);
		state.boot();
	},
	onDisconnect: () => {
		state.statusMsg = "Disconnected — reconnecting…";
		tui.requestRender();
	},
});

const state = new State(rpcClient, () => {
	tui.requestRender();
});

root = new Root(state, terminal, rpcClient, () => tui.requestRender(), shutdown);
tui.addChild(root);
tui.setFocus(root);
tui.start();
tui.requestRender();

// Autorefresh: uptime every 30s, peers/rooms every 10s
setInterval(() => {
	if (rpcClient.connected) state.refreshUptime();
}, 30_000);

setInterval(() => {
	if (rpcClient.connected) {
		state.refreshPeers();
		state.refreshRooms();
	}
}, 10_000);

// Clean exit on signals
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

rpcClient.connect();
