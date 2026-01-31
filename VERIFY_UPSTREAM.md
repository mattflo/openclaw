# Verify Upstream Changes Are Compatible

Process for checking if upstream changes are safe to merge onto your local branch.

**TL;DR after merging upstream:**
```bash
git fetch upstream && git merge upstream/main && pnpm install && rm -rf dist && pnpm build && pnpm ui:build
```

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
# Fetch latest
git fetch upstream

# Merge upstream (creates merge commit, avoids force-push issues)
git merge upstream/main

# CRITICAL: Update dependencies after merge
pnpm install

# Clean stale build artifacts and rebuild
rm -rf dist
pnpm build
pnpm ui:build

# Restart gateway
tmux kill-session -t gateway 2>/dev/null
tmux new -s gateway -d 'pnpm openclaw gateway --tailscale serve 2>&1 | tee ~/.openclaw/gateway.log'

# Watch logs for errors
tail -f ~/.openclaw/gateway.log
```

## Post-Merge Verification

After merging, ALWAYS:

1. **Run `pnpm install`** - Upstream may have updated package versions
2. **Clean and rebuild** - Stale dist/ files cause confusing import errors
3. **Check the logs** - TypeScript errors mean the merge or deps are broken

```bash
# Verify package versions match upstream
git show upstream/main:package.json | grep pi-coding-agent
cat node_modules/@mariozechner/pi-coding-agent/package.json | grep '"version"'
```

## Common Merge Problems

### Bad Conflict Resolution
If merge conflicts were resolved incorrectly (took wrong version), you'll see TypeScript errors about missing exports or wrong types. Fix by resetting specific files to upstream:

```bash
# Check what upstream has vs your merge
git diff upstream/main -- path/to/broken/file.ts

# Reset file to upstream version
git checkout upstream/main -- path/to/broken/file.ts
git commit -m "fix: restore upstream changes"
```

Or redo the merge entirely:
```bash
git reset --hard <commit-before-merge>
git merge upstream/main
# Then force push: git push --force-with-lease origin my-setup
# On other machines: git fetch origin && git reset --hard origin/my-setup
```

### Stale node_modules
Symptoms: Errors like `Module does not provide an export named 'X'` where X definitely exists in upstream code.

```bash
# Check installed vs required version
cat node_modules/@mariozechner/pi-coding-agent/package.json | grep '"version"'
git show upstream/main:package.json | grep pi-coding-agent

# Fix: reinstall
pnpm install
```

### Stale dist/ Files
Symptoms: `Cannot find module 'dist/entry.js'` or import errors referencing old exports.

```bash
rm -rf dist
pnpm build
```

### Missing Control UI Assets
Symptoms: Browser shows "Control UI assets not found".

```bash
pnpm ui:build
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
