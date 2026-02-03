# Current Setup (VPS)

## Access

```bash
ssh cb  # <hostname>
```

Moltbot runs from source:
```bash
cd /home/matt/code/moltbot
pnpm moltbot <command>
```

Node managed via nvm: `~/.nvm/versions/node/v24.13.0/`

## Config

Location: `~/.openclaw/openclaw.json`

Note: `~/.clawdbot` and `~/.moltbot` are symlinks to `~/.openclaw` for backwards compatibility.

Key gateway settings:
```json
{
  "gateway": {
    "port": 18789,
    "bind": "loopback",
    "auth": {
      "mode": "token",
      "allowTailscale": true
    },
    "tailscale": {
      "mode": "serve"
    },
    "trustedProxies": ["127.0.0.1"]
  }
}
```

## Tools

Tools run directly on host (`sandbox.mode: "off"`). Browser uses headless Brave via `browser.defaultProfile: "openclaw"`.

## Gateway

Runs in tmux session `gateway`:
```bash
tmux attach -t gateway          # View logs
tmux send-keys -t gateway C-c   # Stop
```

Start command:
```bash
tmux new -s gateway -d 'cd ~/code/moltbot && pnpm run moltbot gateway --tailscale serve'
```

## Remote Access via Tailscale

Web console: `https://<hostname>/`

**Local connections** (same machine, localhost) auto-approve device pairing.

**Tailscale connections** (phone, other devices) require manual pairing approval:
```bash
# List pending requests
cat ~/.openclaw/devices/pending.json

# Approve by request ID
pnpm moltbot devices approve <request-id>

# List paired devices
pnpm moltbot devices list
```

## Paired Devices

- CLI (linux) - auto-approved
- MacBook webchat (MacIntel, 100.83.116.99)
- iPhone webchat (100.104.128.54)
