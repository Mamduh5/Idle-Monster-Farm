# Idle Monster Farm Browser Playtest Checklist

Use a fresh browser profile or clear `idle-monster-farm-save` before the fresh-save test.

## Fresh Save
- Start with 10 coins and an empty 3x3 grid.
- Hatch the first Baby Slime and confirm passive coin ticks begin.
- Hatch multiple Slimes, merge two matching Slimes, and confirm the merged monster remains selected.
- Buy at least one upgrade and confirm coins, income/cooldown text, and upgrade level update.
- Fill the grid, confirm the hatch panel says the farm is full, then merge a valid pair to free space.
- Confirm the 3 expansion slots start locked and reject monster drops safely.
- Unlock the expansion row, confirm 500 coins are deducted, then hatch into an expanded slot.
- Drag or merge monsters using expanded slots.

## Mobile Viewports
- Check `360x640` and `390x844`.
- Confirm HUD, production stats, menu buttons, grid, expansion placeholder, and hatch panel do not overlap.
- Open Settings, Help, Compendium, and Upgrade Shop and confirm each panel fits and can close.

## Persistence
- Reload after hatching, merging, and buying an upgrade.
- Confirm coins, egg cost, monsters, discoveries, upgrades, expansion unlock state, and onboarding hint state persist.
- Reload after unlocking expansion and confirm expanded-slot monsters persist.
- Confirm Settings persist separately from gameplay save.

## Offline Return
- Leave and return after a few minutes, or set `lastActiveAt` backward in localStorage for a manual check.
- Confirm offline coins are added and the welcome-back message appears without console errors.

## Reset
- Open Settings and click Reset Save once.
- Tap outside the panel and confirm the reset confirmation remains open.
- Click Reset Save a second time and confirm gameplay progress clears.
- Confirm expansion returns to locked after reset.

## Max Level And Console
- Confirm Level 8 + Level 8 fails safely and both Slimes remain.
- Try an invalid drag and confirm no monster is duplicated or deleted.
- Confirm browser console errors are `0`.
