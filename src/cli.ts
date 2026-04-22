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

const rpcClient = new ShevaRpc({
	url: WS_URL,
	origin: ORIGIN,
	onEvent: (msg) => {
		state.handleEvent(msg);
	},
	onConnect: () => {
		state.statusMsg = `Connected to ${WS_URL}`;
		tui.requestRender();
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

const root = new Root(state, terminal, () => tui.requestRender(), shutdown);
tui.addChild(root);
tui.setFocus(root);
tui.start();
tui.requestRender();

// Periodic uptime refresh
setInterval(() => {
	if (rpcClient.connected) state.refreshUptime();
}, 30_000);

// Clean exit on signals
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

rpcClient.connect();
