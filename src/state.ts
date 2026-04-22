import type { ShevaRpc, WsEvent } from "./rpc.js";
import type { ChatMessage, FeedItem, NodeInfo, Peer, PendingRequest } from "./types.js";

export class State {
	peers: Peer[] = [];
	pending: PendingRequest[] = [];
	rooms: string[] = [];
	discoverable = false;
	feed: FeedItem[] = [];
	chatPeer: string | null = null;
	chatMessages: ChatMessage[] = [];
	nodeInfo: NodeInfo = { fingerprint: "?", version: "?", uptime: "?" };
	statusMsg = "Connecting…";

	constructor(
		private rpc: ShevaRpc,
		private onChange: () => void,
	) {}

	handleEvent(msg: WsEvent): void {
		if (msg.type === "chat") {
			this.feed.push({ peer: msg.peer, ts: msg.ts, text: msg.text, direction: msg.direction });
			if (this.feed.length > 200) this.feed.shift();
			if (msg.peer === this.chatPeer) {
				this.chatMessages.push({ ts: msg.ts, direction: msg.direction, text: msg.text, flagged: msg.flagged });
			}
			this.onChange();
		} else if (msg.type === "pending") {
			this.pending.push(msg.req);
			this.onChange();
		} else if (msg.type === "pending-cleared") {
			this.pending = this.pending.filter((p) => p.id !== msg.id);
			this.onChange();
		} else if (msg.type === "registry-update") {
			this.refreshPeers();
		} else if (msg.type === "rooms-update") {
			this.refreshRooms();
		}
	}

	async boot(): Promise<void> {
		const [who, ver, health] = await Promise.all([
			this.rpc.call("identity.whoami"),
			this.rpc.call("version"),
			this.rpc.call("health_check"),
		]);
		if (who) this.nodeInfo.fingerprint = who.fingerprint || "?";
		if (ver) this.nodeInfo.version = ver.core || "?";
		if (health) this.nodeInfo.uptime = State.fmtUptime(health.uptime);
		await this.refreshPeers();
		await this.refreshRooms();
		await this.loadFeed();
		this.onChange();
	}

	async refreshPeers(): Promise<void> {
		const list = await this.rpc.call("peers.list");
		if (Array.isArray(list)) {
			this.peers = list.map((p: any) => ({
				pk: p.pubkey || "",
				nick: p.nick || (p.pubkey || "").slice(0, 12),
				trust: p.trust || "unknown",
				online: !!p.online,
			}));
		}
		this.onChange();
	}

	async refreshRooms(): Promise<void> {
		const r = await this.rpc.call("rooms.list");
		if (r) {
			this.rooms = r.rooms || [];
			this.discoverable = !!r.discoverable;
		}
		this.onChange();
	}

	async loadFeed(): Promise<void> {
		this.feed = [];
		for (const p of this.peers) {
			const r = await this.rpc.call("chat.history", { pubkey: p.pk });
			if (r?.messages) {
				for (const m of r.messages) {
					this.feed.push({ peer: p.pk, ts: m.ts, text: m.text, direction: m.direction });
				}
			}
		}
		this.feed.sort((a, b) => (a.ts || "").localeCompare(b.ts || ""));
		this.feed = this.feed.slice(-200);
		this.onChange();
	}

	async openChat(pubkey: string): Promise<void> {
		this.chatPeer = pubkey;
		this.chatMessages = [];
		const r = await this.rpc.call("chat.history", { pubkey });
		if (r?.messages) this.chatMessages = r.messages;
		this.onChange();
	}

	async sendMessage(text: string): Promise<void> {
		if (!this.chatPeer || !text.trim()) return;
		await this.rpc.call("chat.send", { pubkey: this.chatPeer, text: text.trim() });
	}

	async connectPeer(pubkey: string): Promise<boolean> {
		const res = await this.rpc.call("peers.connect", { pubkey });
		return !!res?.ok;
	}

	async joinRoom(code: string): Promise<boolean> {
		const res = await this.rpc.call("rooms.join", { code });
		if (res?.ok) await this.refreshRooms();
		return !!res?.ok;
	}

	async toggleDiscoverable(): Promise<void> {
		const res = await this.rpc.call("discoverable.set", { on: !this.discoverable });
		if (res && typeof res.ok === "boolean") this.discoverable = res.ok;
		this.onChange();
	}

	async decide(id: string, action: string): Promise<void> {
		await this.rpc.call("approvals.decide", { id, action });
	}

	async refreshUptime(): Promise<void> {
		const h = await this.rpc.call("health_check");
		if (h) {
			this.nodeInfo.uptime = State.fmtUptime(h.uptime);
			this.onChange();
		}
	}

	static fmtUptime(ms: number): string {
		if (!ms) return "?";
		const s = Math.floor(ms / 1000);
		const h = Math.floor(s / 3600);
		const m = Math.floor((s % 3600) / 60);
		return h > 0 ? `${h}h ${m}m` : `${m}m`;
	}

	static shortPk(pk: string): string {
		return pk ? `${pk.slice(0, 12)}…` : "?";
	}
}
