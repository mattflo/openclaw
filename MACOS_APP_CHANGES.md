# macOS App Local Changes

Local patches not yet upstream. Base: `09be5d45d` (2026-01-30)

## Build Workflow

```bash
ALLOW_ADHOC_SIGNING=1 ./scripts/package-mac-app.sh
cp -R dist/OpenClaw.app /Applications/
```

Ad-hoc signing means TCC permissions (Accessibility, Screen Recording, etc.) reset each rebuild. Re-grant in System Settings after copying.

## Active

**Exec approval dialog not showing command details**  
`apps/macos/Sources/OpenClaw/ExecApprovalsSocket.swift`  
Replaced broken NSTextView+NSScrollView with simple wrapping NSTextField. Added explicit sizing for NSAlert accessory view.

**branch**: `fix/exec-approval-dialog-display`

## Merged Upstream

_None yet_
