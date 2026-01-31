# Sandbox Setup Plan

## Prerequisites
- Docker installed: `curl -fsSL https://get.docker.com | sudo sh`
- User in docker group: `sudo usermod -aG docker matt && newgrp docker`

## Phase 1: Build Images
```bash
cd ~/code/moltbot
./scripts/sandbox-setup.sh          # tool sandbox (~2 min)
./scripts/sandbox-browser-setup.sh  # browser sandbox (~3 min)
```

Verify:
```bash
docker images | grep openclaw-sandbox
```

## Phase 2: Configure
```bash
# Sandbox mode and scope
pnpm openclaw config set agents.defaults.sandbox.mode "all"
pnpm openclaw config set agents.defaults.sandbox.scope "shared"
pnpm openclaw config set agents.defaults.sandbox.workspaceAccess "rw"

# Network (required for browser CDP access)
pnpm openclaw config set agents.defaults.sandbox.docker.network "bridge"

# Browser sandbox
pnpm openclaw config set agents.defaults.sandbox.browser.enabled true

# Tool policy: allow browser in sandbox
pnpm openclaw config set tools.sandbox.tools.allow '["exec", "process", "read", "write", "edit", "apply_patch", "image", "sessions_list", "sessions_history", "sessions_send", "sessions_spawn", "session_status", "browser"]'
pnpm openclaw config set tools.sandbox.tools.deny '["canvas", "nodes", "cron", "gateway", "telegram", "whatsapp", "discord", "googlechat", "slack", "signal", "imessage"]'
```

## Phase 3: Restart & Test
```bash
task restart
pnpm openclaw sandbox explain    # verify: runtime=sandboxed, browser in allow list
```

## Phase 4: Cleanup (optional)
Stop host Brave if no longer needed:
```bash
pnpm openclaw browser --browser-profile openclaw stop
```

## Phase 5: CalDAV Setup (optional)

Dockerfile.sandbox includes `vdirsyncer` and `khal`. Configs live in workspace:

```
~/clawd/.config/vdirsyncer/config
~/clawd/.config/khal/config
```

Config paths must use `/workspace/...` (not `~/...`) since container home is `/workspace`.

After editing configs, rebuild and recreate:
```bash
./scripts/sandbox-setup.sh
docker rm -f openclaw-sbx-shared openclaw-sbx-browser-shared
task restart
```

## Status
- [x] Tool sandbox - working 2026-01-31
- [x] Browser sandbox - working 2026-01-30
- [x] CalDAV skill - working 2026-01-31

## Adding Skills to Sandbox

Skills requiring CLI tools need three things:

1. **Binary in container** — Add to `Dockerfile.sandbox` apt install list, rebuild image
2. **Config in workspace** — Store at `~/clawd/.config/<tool>/` (mounted at `/workspace/.config/`)
3. **Credentials** — Store in workspace config dir with appropriate permissions

### Required sandbox config for workspace access

```json
"docker": {
  "user": "1000:1000",
  "env": {
    "HOME": "/workspace",
    "XDG_CONFIG_HOME": "/workspace/.config",
    "XDG_DATA_HOME": "/workspace/.local/share"
  }
}
```

- `user: "1000:1000"` — Run as host uid to match file ownership (avoids permission denied errors)
- `HOME=/workspace` — Tools can write cache/data to mounted workspace
- `XDG_*` — Tools find configs in workspace instead of ephemeral container home

### File ownership gotchas

When testing manually with `docker run` as root, files created in the workspace will be owned by root. The sandbox runs as uid 1000 and can't access them.

Fix with: `sudo chown -R matt:matt ~/clawd/.local/share/<tool>/`

## Potential Improvements

### Custom image layer (avoids editing upstream Dockerfile.sandbox)

Instead of modifying `Dockerfile.sandbox` directly:

1. Create `~/clawd/Dockerfile.sandbox`:
   ```dockerfile
   FROM openclaw-sandbox:bookworm-slim
   RUN apt-get update && apt-get install -y --no-install-recommends \
       vdirsyncer khal \
     && rm -rf /var/lib/apt/lists/*
   ```

2. Build custom image:
   ```bash
   docker build -t openclaw-sandbox-custom:bookworm-slim -f ~/clawd/Dockerfile.sandbox ~/clawd
   ```

3. Configure to use it:
   ```bash
   pnpm openclaw config set agents.defaults.sandbox.docker.image "openclaw-sandbox-custom:bookworm-slim"
   ```

Benefits:
- Upstream `Dockerfile.sandbox` stays untouched
- Customizations survive `git pull`
- Rebuild custom image when base updates

## Notes
- `mode: "all"` = sandbox all sessions (use "non-main" for channels/groups only, DMs are "main")
- `scope: "shared"` = one container for all (low memory)
- `workspaceAccess: "rw"` = mount host workspace read-write (process isolation + persistent memory)
  - `"ro"` = read-only mount, `"none"` = fully isolated ephemeral filesystem
- `docker.network: "bridge"` = required so gateway can reach container CDP
- Gateway process must have docker group access (restart gateway after `newgrp docker`)
