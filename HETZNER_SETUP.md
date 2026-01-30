# Moltbot on Hetzner VPS

Run Moltbot Gateway on a Hetzner VPS for 24/7 availability. Connect your devices (Mac, iPhone, Android) as nodes.

## Architecture

```
┌─────────────────────────────────────────┐
│         Hetzner VPS (always-on)         │
│  ┌───────────────────────────────────┐  │
│  │           Gateway                 │  │
│  │  • Messaging (WhatsApp, Telegram) │  │
│  │  • AI model calls                 │  │
│  │  • Sessions, workspace, tools     │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │
        Tailscale / SSH tunnel
                    │
     ┌──────────────┼──────────────┐
     ▼              ▼              ▼
 iPhone         Mac Mini       MacBook
 (node)         (node)         (node)
```

## 1. Provision VPS

Create an Ubuntu 22.04 VPS on Hetzner (CX11 or CX21 is fine).

```bash
ssh root@YOUR_VPS_IP
```

## 2. Install Node.js 22+

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
node --version  # Should be 22+
```

## 3. Install Moltbot

```bash
npm install -g moltbot@latest
```

## 4. Run Onboarding

```bash
moltbot onboard --install-daemon
```

This will:
- Create `~/.clawdbot/moltbot.json`
- Set up model authentication (Anthropic/OpenAI)
- Optionally configure messaging channels
- Install systemd service for auto-restart

## 5. Configure Remote Access

### Option A: Tailscale (Recommended)

Install Tailscale on the VPS:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up
```

Configure Gateway to use Tailscale Serve:

```bash
moltbot config set gateway.bind loopback
moltbot config set gateway.tailscale.mode serve
```

Now any device on your Tailnet can reach the Gateway.

### Option B: SSH Tunnel

Keep Gateway on loopback (default), forward from your Mac:

```bash
ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
```

Access Control UI at `http://127.0.0.1:18789/`

## 6. Connect Nodes (Optional)

Nodes give the Gateway access to device-local capabilities (camera, location, screen, local commands).

### macOS App

1. Download Moltbot.app or build from source
2. Settings → Gateway URL → `http://<vps-tailscale-name>:18789`
3. Pair when prompted

### iOS/Android

1. Install the app
2. Settings → Gateway URL → your Tailscale/tunnel address
3. Approve pairing: `moltbot devices approve <requestId>`

## 7. Verify

```bash
# On VPS
moltbot status --all
moltbot channels status --probe

# From your Mac (via tunnel/Tailnet)
moltbot health --url http://<gateway-address>:18789
```

## Recommended Config

```json5
// ~/.clawdbot/moltbot.json
{
  agent: {
    model: "anthropic/claude-opus-4-5"
  },
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" }
  },
  agents: {
    defaults: {
      subagents: {
        model: "google-antigravity/gemini-3-pro"  // cheaper for background tasks
      }
    }
  }
}
```

## Incremental Data Access

Start minimal, expand as needed:

| Week | Add |
|------|-----|
| 1 | Gateway + messaging channels |
| 2 | Mac Mini node (`system.run`, file access) |
| 3 | iPhone node (camera, location) |
| 4 | Google read-only (`gog auth add --readonly`) |
| 5 | Cron jobs, webhooks |

## Useful Commands

```bash
# Gateway management
moltbot gateway status
moltbot gateway restart
systemctl status moltbot-gateway  # if using systemd

# Logs
journalctl -u moltbot-gateway -f

# Channels
moltbot channels status --probe
moltbot channels login  # WhatsApp QR, etc.

# Nodes
moltbot devices list
moltbot devices approve <id>
```

## Persistence

All state lives in `~/.clawdbot/`:
- `moltbot.json` — config
- `credentials/` — channel auth (WhatsApp session, etc.)
- `auth-profiles/` — model OAuth tokens

Workspace lives in `~/clawd/` (configurable).

Back these up regularly.

## Docs

- [Full Hetzner Docker guide](https://docs.molt.bot/platforms/hetzner)
- [Remote Gateway access](https://docs.molt.bot/gateway/remote)
- [Tailscale setup](https://docs.molt.bot/gateway/tailscale)
- [Nodes](https://docs.molt.bot/nodes)
- [Security](https://docs.molt.bot/gateway/security)
