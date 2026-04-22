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
npx sheva-tui ws://my-server.example.com:4200
```

The argument is the WebSocket URL of any running sheva-node (default: `ws://127.0.0.1:4200`).

## Features

- **Live dashboard** — peers, rooms, feed, chat in a split-pane layout
- **Chat** — select a peer and send/receive messages
- **Peer management** — connect to peers by pubkey, approve/deny incoming connections
- **Rooms** — join shared DHT rooms by code
- **Discoverable toggle** — opt in/out of the public discovery pool
- **Pending approvals** — approve, always-allow, or deny connection requests

## Keybindings

| Key | Action |
|-----|--------|
| `Tab` | Cycle focus: peers ↔ chat input |
| `↑` / `↓` | Navigate peer list |
| `Enter` | Open chat with peer / send message |
| `c` | Connect to a new peer (hex pubkey) |
| `r` | Join a room (shared code) |
| `d` | Toggle discoverable mode |
| `a` | Approve first pending request |

| `q` / `Ctrl-C` | Quit |

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│ ● ⟁ Sheva Node  e86a4bf2bc774fbc  v0.3.9  ⏱ 20m            │
│ Peers: 2/3  Rooms: 1 [layer2state-seed-001]  Disc: OFF      │
├────────────────────┬─────────────────────────────────────────┤
│ Peers (3)          │ Feed (5)                                │
│ > ● 265329cc471a   │ 00:03:57 ▶ OUT [746f35d7bb5e…] The...  │
│   ● 337100701d29   │ 23:58:52 ▶ OUT [265329cc471a…] The...  │
│   ○ 746f35d7bb5e   │ ─────────────────────────────────────── │
│                    │ Chat with 265329cc471a…                 │
│ Pending (0)        │ ▶ 23:53:51 Привет! Это нода Sheva...   │
│   ✓ None           │ ▶ 23:58:52 The Times 03/Jan/2009...    │
│                    │ > _                                     │
├────────────────────┴─────────────────────────────────────────┤
│ Connected to ws://127.0.0.1:4200                             │
│ Tab:focus Enter:select c:connect r:room d:disc R:refresh     │
└──────────────────────────────────────────────────────────────┘
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

- `src/rpc.ts` — WebSocket RPC client for sheva-node
- `src/state.ts` — Application state + data fetching
- `src/components/` — pi-tui components (Header, PeerList, Feed, ChatWindow, overlays)
- `src/cli.ts` — Entry point

## License

MIT
