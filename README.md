# sheva-tui

Terminal UI for [sheva-node](https://www.npmjs.com/package/sheva-node) — a P2P mesh network node built on Hyperswarm.

Built with [@mariozechner/pi-tui](https://github.com/badlogic/pi-mono/tree/main/packages/tui).

## Quick Start

```bash
# Make sure sheva-node is running
npx sheva-node start

# Launch the TUI
npx sheva-tui
```

Connect to a remote node:

```bash
npx sheva-tui ws://192.168.1.10:4200
npx sheva-tui wss://my-server.example.com:4201
```

The argument is the WebSocket URL of any running sheva-node (default: `ws://127.0.0.1:4200`).

You can also change the node URL from within the running app by pressing `n`.

## Features

- **Fullscreen dashboard** — peers, rooms, feed, chat in a split-pane layout
- **Chat** — select a peer and send/receive messages in real time
- **Peer management** — connect to peers by pubkey, approve/deny incoming connections
- **Rooms** — join shared DHT rooms by code to discover peers
- **Pending approvals** — navigate and approve/deny connection requests individually
- **Discoverable toggle** — opt in/out of the public discovery pool
- **Autorefresh** — peers, rooms, and uptime refresh automatically
- **Remote access** — connect to any node by URL, change node on the fly

## Keybindings

| Key | Action |
|-----|--------|
| `Tab` | Cycle focus: Peers → Pending (if any) → Chat (if open) |
| `↑` / `↓` | Navigate peer list or pending list |
| `Enter` | Open chat with peer / approve pending / send message |
| `c` | Connect to a new peer (hex pubkey) |
| `r` | Join a room (shared code) |
| `d` | Toggle discoverable mode |
| `a` | Approve/deny pending request (selected or first) |
| `x` | Close current chat |
| `n` | Change node URL (connect to different node) |
| `h` | Show help with all keybindings and links |
| `q` / `Ctrl-C` | Quit |

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│ ● ⟁ Sheva Node  e86a4bf2bc774fbc  v0.3.9  ⏱ 1h 20m         │
│ Peers: 2/3  Rooms: 1  Pending: 0  Discoverable: OFF         │
├────────────────────┬─────────────────────────────────────────┤
│ ▸ Peers (3)        │ Feed (6)                                │
│ > ● 265329cc471a   │ 23:53:51 ▶ OUT [265329cc…] Привет!...  │
│   ● 337100701d29   │ 23:58:52 ▶ OUT [337100…] The Times...  │
│   ○ 746f35d7bb5e   │ 00:03:57 ▶ OUT [746f35…] The Times...  │
│                    │ ─────────────────────────────────────── │
│ Rooms (1)          │ Chat with 265329cc471a… (x to close)   │
│   # layer2state-…  │ ▶ 23:53:51 Привет! Это нода Sheva...   │
│                    │ ▶ 23:58:52 The Times 03/Jan/2009...    │
│ Pending (0)        │ ◀ 00:12:33 Hey, nice to meet you!     │
│   ✓ None           │ > _                                     │
│                    │                                         │
├────────────────────┴─────────────────────────────────────────┤
│ tab:focus  enter:select  c:connect  r:room  h:help  q:quit  │
└──────────────────────────────────────────────────────────────┘
```

## How It Works

**Rooms** discover peers via Hyperswarm DHT — join the same room code to find each other. **Chat** is direct peer-to-peer, cryptographically signed. No servers involved.

When a new peer connects, you'll see a pending approval request. You can:
- **allow** — connect this once
- **always** — auto-approve future connections from this peer
- **deny** — reject the connection

## Remote Access

sheva-node binds to `127.0.0.1` and rejects non-local origins. To access remotely, run a WebSocket proxy:

```bash
# sheva-ws-proxy.mjs — listens on 0.0.0.0:4201, forwards to 127.0.0.1:4200
node sheva-ws-proxy.mjs
```

Then connect from anywhere:
```bash
npx sheva-tui wss://your-server:4201
```

## Development

```bash
npm install
npm run build
npm run dev     # watch mode
npm run lint    # biome check
npm run format  # biome format
```

## Architecture

- `src/rpc.ts` — WebSocket RPC client with reconnect support
- `src/state.ts` — Application state, data fetching, autorefresh
- `src/components/` — pi-tui components:
  - `header.ts` — Node info, peer/room counts
  - `peer-list.ts` — Interactive peer list, rooms, pending approvals
  - `feed.ts` — Event feed (old→new)
  - `chat-window.ts` — Chat messages (old→new)
  - `status-bar.ts` — Keybindings, temporary status messages
  - `help-overlay.ts` — Help screen
  - `prompt-overlay.ts` — Text input dialogs
  - `approval-overlay.ts` — Allow/always/deny dialog
  - `root.ts` — Layout, focus management, key routing
- `src/cli.ts` — Entry point

## Links

- **GitHub**: https://github.com/qwadratic/sheva-tui
- **Issues**: https://github.com/qwadratic/sheva-tui/issues
- **PRs**: https://github.com/qwadratic/sheva-tui/pulls

⭐ Star us on GitHub if you find this useful!

## License

MIT
