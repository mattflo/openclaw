# Himalaya Setup (Read-Only + Drafts)

IMAP email access for the agent — read, search, organize, and draft replies. No sending.

## Install

```bash
brew install himalaya
```

## Configure (Fastmail)

Create `~/.config/himalaya/config.toml`:

```toml
[accounts.fastmail]
email = "you@fastmail.com"
display-name = "Your Name"
default = true

backend.type = "imap"
backend.host = "imap.fastmail.com"
backend.port = 993
backend.encryption.type = "tls"
backend.login = "you@fastmail.com"
backend.auth.type = "password"
backend.auth.cmd = "security find-generic-password -s himalaya-fastmail -w"
```

Store the password in macOS Keychain:

```bash
security add-generic-password -s himalaya-fastmail -a himalaya -w "YOUR_APP_PASSWORD"
```

Use a Fastmail app-specific password (Settings → Privacy & Security → App Passwords).

## Test

```bash
himalaya folder list
himalaya envelope list --page-size 5
himalaya message read 1
```

## Agent Usage

The agent can now:
- `himalaya envelope list` — list inbox
- `himalaya envelope list from:sender@example.com` — search
- `himalaya message read <id>` — read full message
- `himalaya message move <id> "Archive"` — organize
- `himalaya flag add <id> --flag seen` — mark read

For drafts, the agent can compose replies but stop short of sending:

```bash
himalaya template reply <id>
```

This outputs the draft without sending. You review and send manually.

## Cron Workflow (Optional)

To have the agent periodically check and summarize new mail, set up a heartbeat that prompts:

> "Check my inbox for unread emails. Summarize anything important and draft replies for messages that need responses."

The agent uses himalaya to read, then delivers the summary via Discord (or your preferred channel).
