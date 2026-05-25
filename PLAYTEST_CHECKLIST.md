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
- Confirm Mushroom Level 5 and Mushroom Level 6 look visually distinct on the farm and in the Compendium.
- Buy at least one upgrade and confirm coins, income/cooldown text, and upgrade level update.
- Claim a completed coin mission, confirm coins increase, and confirm the mission cannot be claimed again.
- Buy Mushroom Income Boost and Mushroom Chance, then confirm Mushroom income and hatch odds text update.
- Fill the grid, confirm the hatch panel says the farm is full, then merge a valid pair to free space.
- Wait for a Coin Bug to appear, tap it, and confirm coins increase with a compact `+coins` popup.
- On mobile, tap around the edge of a Coin Bug and confirm it is still easy to collect.
- Let a Coin Bug expire without tapping and confirm it fades away safely.
- Catch three Coin Bugs and confirm the Goals mission progresses and completes.
- Confirm the 3 expansion slots start locked and reject monster drops safely.
- Unlock the expansion row, confirm 350 coins are deducted, then hatch into an expanded slot.
- Drag or merge monsters using expanded slots.
- During early/mid play, confirm visible progress happens roughly every 30-90 seconds and first prestige looks reachable in about 20-40 minutes.

## Mobile Viewports
- Check `360x640` and `390x844`.
- Confirm HUD, production stats, compact Menu button, grid, expansion placeholder, and hatch panel do not overlap.
- At `360px` width, confirm HUD, hatch, toast, and panel text do not visibly overflow their bounds.
- In deployed mobile Chrome or an equivalent 360px-wide browser viewport, confirm the Hatch panel is fully visible above browser/navigation bars.
- Confirm the Production panel shows Income/sec, Next Egg, and Offline Cap without clipping.
- Confirm coin values use clean whole or compact text with no long decimal strings.
- Confirm the expansion row or unlock button remains visible above the Hatch panel.
- Open Menu and confirm it is readable, compact, and does not cover the hatch panel unnecessarily.
- From Menu, open Upgrades, Goals, Prestige, Zone, Compendium, Help, and Settings; confirm Menu closes and each panel is readable, fits, and can close.
- Open Compendium on mobile, scroll from Slime through Mushroom entries, and confirm every monster row is reachable.
- Open Upgrade Shop on mobile and confirm the list remains readable and scroll-safe with Buy buttons usable.
- Open Goals on mobile and confirm the current mission list remains readable within the panel.
- With outside-tap close enabled, open Menu and tap outside it to confirm Menu closes.
- With outside-tap close disabled, open Menu and tap outside it to confirm the tap is blocked and Menu remains open.
- With a Coin Bug visible, drag a monster near it and confirm normal drag still works.
- Open a panel while a Coin Bug is visible and confirm the bug cannot be tapped through the modal.

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
- Confirm the offline earnings popup stays inside a `360px` mobile viewport and uses compact/no-long-decimal coin text.
- In mobile Chrome, switch apps or background the browser without closing it, then return and confirm offline coins are added without a reload.
- Background the app while Hatch is cooling down, return, and confirm Hatch cooldown advanced or became ready.
- Trigger visible/focus repeatedly after returning and confirm the same offline reward is not granted again.

## Reset
- Open Settings and click Reset Save once.
- Tap outside the panel and confirm the reset confirmation remains open.
- Click Reset Save a second time and confirm gameplay progress clears.
- Confirm expansion returns to locked after reset.

## Max Level And Console
- Confirm Level 12 + Level 12 Slime and Level 8 + Level 8 Mushroom fail safely and both monsters remain.
- Try an invalid drag and confirm no monster is duplicated or deleted.
- Confirm browser console errors are `0`.
