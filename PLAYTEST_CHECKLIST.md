# Idle Monster Farm Browser Playtest Checklist

Use a fresh browser profile or clear `idle-monster-farm-save` before the fresh-save test.

## Fresh Save
- Start with 10 coins and an empty 3x3 grid.
- Open Zone and confirm Grass Farm is selected and Mushroom Forest is locked with a prestige requirement.
- Open Goals and confirm starter missions are listed with progress, rewards, and disabled claim states.
- Hatch the first Baby Slime and confirm passive coin ticks begin.
- Hatch three monsters and confirm the hatch mission completes.
- Hatch until a Button Mushroom appears, then confirm it earns coins and appears in the Compendium.
- Hatch multiple Slimes, merge two matching Slimes, and confirm the merged monster remains selected.
- Merge one valid pair and confirm the merge mission completes.
- Merge two matching Mushrooms, confirm Slime + Mushroom drops return safely, and confirm Level 5 Mushroom + Level 5 Mushroom does not merge.
- Buy at least one upgrade and confirm coins, income/cooldown text, and upgrade level update.
- Claim a completed coin mission, confirm coins increase, and confirm the mission cannot be claimed again.
- Buy Mushroom Income Boost and Mushroom Chance, then confirm Mushroom income and hatch odds text update.
- Fill the grid, confirm the hatch panel says the farm is full, then merge a valid pair to free space.
- Confirm the 3 expansion slots start locked and reject monster drops safely.
- Unlock the expansion row, confirm 500 coins are deducted, then hatch into an expanded slot.
- Drag or merge monsters using expanded slots.

## Mobile Viewports
- Check `360x640` and `390x844`.
- Confirm HUD, production stats, compact Menu button, grid, expansion placeholder, and hatch panel do not overlap.
- Open Menu and confirm it is readable, compact, and does not cover the hatch panel unnecessarily.
- From Menu, open Upgrades, Goals, Prestige, Zone, Compendium, Help, and Settings; confirm Menu closes and each panel fits and can close.
- With outside-tap close enabled, open Menu and tap outside it to confirm Menu closes.
- With outside-tap close disabled, open Menu and tap outside it to confirm the tap is blocked and Menu remains open.

## Persistence
- Reload after hatching, merging, and buying an upgrade.
- Confirm coins, egg cost, monsters, discoveries, upgrades, expansion unlock state, and onboarding hint state persist.
- Confirm completed and claimed Goals persist after reload.
- Confirm claimed mission rewards cannot be claimed again after reload.
- Reload after unlocking expansion and confirm expanded-slot monsters persist.
- After owning a Level 6+ Slime or Level 5 Mushroom, open Prestige, confirm reset grants Monster Essence, buy Essence Power, and reload to confirm both persist.
- After prestiging once, confirm Mushroom Forest unlocks in Zone, can be selected, changes the background, and shows the Mushroom hatch +5% bonus.
- Reload after switching zones and confirm the selected zone and Mushroom Forest unlock persist.
- After egg costs grow large, confirm Hatch Egg and Production next-egg costs use compact formatting.
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
