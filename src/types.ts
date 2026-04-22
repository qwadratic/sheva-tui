export interface Peer {
	pk: string;
	nick: string;
	trust: string;
	online: boolean;
}

export interface PendingRequest {
	id: string;
	peer: string;
	action: string;
	title: string;
	detail: string;
	risk: string;
	ts: string;
}

export interface ChatMessage {
	ts: string;
	direction: "in" | "out";
	text: string;
	flagged: boolean;
}

export interface FeedItem {
	peer: string;
	ts: string;
	text: string;
	direction: "in" | "out";
}

export interface NodeInfo {
	fingerprint: string;
	version: string;
	uptime: string;
}
