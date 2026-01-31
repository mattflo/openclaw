
# Verify Upstream Changes Are Compatible

Process for checking if upstream changes are safe to rebase onto your local branch.

## Check Branch Status

```bash
# How far behind upstream
git rev-list --count HEAD..upstream/main

# List commits you're behind
git log --oneline HEAD..upstream/main | head -50

# Your local commits ahead of upstream
git log --oneline upstream/main..HEAD

# Files changed locally (your customizations)
git diff --stat upstream/main...HEAD
```

## Identify Conflicts

```bash
# Files changed in upstream that you also modified
git diff --name-only HEAD..upstream/main | sort > /tmp/upstream.txt
git diff --name-only upstream/main...HEAD | sort > /tmp/local.txt
comm -12 /tmp/upstream.txt /tmp/local.txt

# Check specific file history in upstream
git log --oneline upstream/main -- path/to/file
```

## Find Breaking Changes

Search the commit log for breaking changes and security updates:

```bash
# Gateway/routing changes (affects your VPS setup)
git log --oneline HEAD..upstream/main -- src/gateway src/routing src/commands/gateway.ts

# Config schema changes
git log --oneline HEAD..upstream/main -- src/config/schema*

# Save full commit list to file for searching
git log --oneline HEAD..upstream/main > /tmp/commits.txt
```

Key patterns to search for in commits:
- `refactor.*!:` or `feat.*!:` - Breaking changes
- `security` - Security-related changes
- `auth.*default` - Authentication default changes
- `BREAKING` - Explicit breaking change markers

## Key Areas to Review

### Gateway Auth
Your config (`~/.openclaw/openclaw.json`) should have:
```json
{
  "gateway": {
    "auth": {
      "mode": "token",
      "allowTailscale": true
    }
  }
}
```

### Security Defaults to Watch
- **Gateway auth required by default** - Ensure `auth.mode` is set
- **Inbound DMs locked down** - May need `allowFrom` config per channel
- **Default-deny command execution** - Enable `tools.exec` if needed

## Merge Upstream and Push

```bash
# Merge upstream (creates merge commit, avoids force-push issues)
git merge upstream/main

# Push to your fork
git push origin my-setup

# Verify gateway still works
pnpm moltbot channels status --probe

# Check paired devices
pnpm moltbot devices list

# If devices need re-approval
pnpm moltbot devices approve <request-id>
```

## Interrogate Your Local Changes

```bash
# List all files you've changed/added vs upstream
git diff --stat upstream/main...HEAD

# Show just filenames
git diff --name-only upstream/main...HEAD

# List your local commits with messages
git log --oneline upstream/main..HEAD

# Show full diff of your changes
git diff upstream/main...HEAD

# Check if a specific file exists in upstream
git show upstream/main:path/to/file 2>/dev/null || echo "Not in upstream"

# See history of a file in upstream
git log --oneline upstream/main -- path/to/file
```
