import WebSocket from "ws";

export type WsEvent =
	| { type: "chat"; peer: string; ts: string; direction: "in" | "out"; text: string; flagged: boolean }
	| {
			type: "pending";
			req: { id: string; peer: string; action: string; title: string; detail: string; risk: string; ts: string };
	  }
	| { type: "pending-cleared"; id: string }
	| { type: "registry-update" }
	| { type: "rooms-update" }
	| { type: "rpc-reply"; id: number; result?: any; error?: string };

export class ShevaRpc {
	private ws: WebSocket | null = null;
	private rpcId = 0;
	private waiters = new Map<number, (result: any) => void>();
	private onEvent: (msg: WsEvent) => void;
	private onConnect: () => void;
	private onDisconnect: () => void;
	private url: string;
	private origin: string;

	constructor(opts: {
		url: string;
		origin: string;
		onEvent: (msg: WsEvent) => void;
		onConnect: () => void;
		onDisconnect: () => void;
	}) {
		this.url = opts.url;
		this.origin = opts.origin;
		this.onEvent = opts.onEvent;
		this.onConnect = opts.onConnect;
		this.onDisconnect = opts.onDisconnect;
	}

	get connected(): boolean {
		return this.ws?.readyState === WebSocket.OPEN;
	}

	getUrl(): string {
		return this.url;
	}

	reconnect(url: string): void {
		this.url = url;
		if (this.ws) {
			try {
				this.ws.removeAllListeners();
				this.ws.close();
			} catch {}
		}
		this.ws = null;
		this.connect();
	}

	connect(): void {
		this.ws = new WebSocket(this.url, { headers: { origin: this.origin } });
		this.ws.on("open", () => this.onConnect());
		this.ws.on("message", (raw: Buffer) => {
			let msg: WsEvent;
			try {
				msg = JSON.parse(raw.toString());
			} catch {
				return;
			}
			if ((msg as any).type === "rpc-reply") {
				const reply = msg as WsEvent & { type: "rpc-reply" };
				const waiter = this.waiters.get(reply.id);
				if (waiter) {
					this.waiters.delete(reply.id);
					waiter(reply.result ?? reply.error);
				}
				return;
			}
			this.onEvent(msg);
		});
		this.ws.on("close", () => {
			this.onDisconnect();
			setTimeout(() => this.connect(), 3000);
		});
		this.ws.on("error", () => {});
	}

	call(method: string, args: Record<string, any> = {}): Promise<any> {
		return new Promise((resolve) => {
			const id = ++this.rpcId;
			this.waiters.set(id, resolve);
			try {
				this.ws?.send(JSON.stringify({ type: "rpc", id, method, args }));
			} catch {
				this.waiters.delete(id);
				resolve(null);
			}
			setTimeout(() => {
				if (this.waiters.has(id)) {
					this.waiters.delete(id);
					resolve(null);
				}
			}, 10_000);
		});
	}
}
