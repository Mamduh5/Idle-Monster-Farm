# Idle Monster Farm Browser Playtest Checklist

Use a fresh browser profile or clear `idle-monster-farm-save` before the fresh-save test.

## Fresh Save
- Start with 10 coins and an empty 3x3 grid.
- Open Zone and confirm Grass Farm is selected and later zones are locked until Ritual/discovery progress.
- Open Goals and confirm starter missions are listed with progress, rewards, and disabled claim states.
- Hatch the first Baby Slime and confirm passive coin ticks begin.
- Hatch three monsters and confirm the hatch mission completes.
- Open Hatch Pool from Menu, then hold Hatch to open it again, and confirm family odds, locked-family hints, Rare Hatch level, Hatch Blessing odds, and current zone specialty are visible.
- Hatch until a Button Mushroom appears, then confirm it earns coins and appears in the Compendium.
- Hatch multiple Slimes, merge two matching Slimes, and confirm the merged monster remains selected.
- Merge one valid pair and confirm the merge mission completes.
- Drag a monster to the Remove zone and confirm the slot clears without granting coins.
- Merge two matching Mushrooms, confirm Slime + Mushroom drops return safely, and confirm Level 5 Mushroom + Level 5 Mushroom does not merge.
- Merge Slime + Mushroom of the same level, and Mushroom + Slime of the same level, and confirm both create the matching-level Spore.
- Try Slime + Mushroom at different levels and confirm the invalid fusion rejects safely.
- Merge two same-level Spores and confirm they create the next Spore level; confirm max-level Spore + max-level Spore rejects safely.
- Merge Mushroom + Spore at the same level and confirm it creates matching-level Cactus.
- Merge Slime + Spore at the same level and confirm it creates matching-level Cell.
- Merge Cell + Cactus at the same level and confirm it creates matching-level Plant.
- Confirm Spore, Cactus, Cell, and Plant each support 15 levels, and max-level same-family merges reject safely.
- Confirm Mushroom Level 5 and Mushroom Level 6 look visually distinct on the farm and in the Compendium.
- Open Compendium after discovering Spore, Cactus, Cell, and Plant and confirm each family appears with locked/visible rows as expected.
- Confirm Mushroom Levels 5-8 and high-level Slimes look visually distinguishable and more impressive at higher levels.
- Confirm the Next Order widget is visible on the main farm screen and does not overlap Hatch, Tap Farm, Menu, grid, or expansion controls.
- Own or seed a claimable Order, claim it from the Next Order widget, and confirm the required monster remains on the farm.
- Buy at least one upgrade and confirm coins, income/cooldown text, and upgrade level update.
- In Upgrade Shop, switch buy mode to x10, x50, and Max, then confirm buying purchases up to the selected amount without exceeding coins or max level.
- Confirm Slime Income Boost and Mushroom Income Boost now have 20 levels, Offline Storage has 8 levels, and Hatch Speed remains safely capped.
- Buy Egg Discount and confirm the displayed Hatch Egg and Production next-egg costs drop while never going below the 10 coin starting cost.
- Buy Tap Power and confirm Tap Farm normal tap reward, and Farm Burst reward if checked, increase.
- Buy Fusion Power and confirm owned Spore income and total income/sec increase while Slime and Mushroom family boosts remain separate.
- Buy Order Bonus and confirm coin rewards in Orders and Goals display and grant the boosted amount; Essence rewards stay unchanged.
- Buy Coin Bug Value and confirm Coin Bug pickup rewards increase.
- Use x10 or Max on Egg Discount, Tap Power, Fusion Power, Order Bonus, or Coin Bug Value and confirm bulk buying respects cost, coins, and max level.
- Claim a completed coin mission, confirm coins increase, and confirm the mission cannot be claimed again.
- Buy Mushroom Income Boost and Mushroom Chance, then confirm Mushroom income and Hatch Pool odds update.
- Fill the grid, confirm the hatch panel says the farm is full, then merge a valid pair to free space.
- Tap Tap Farm and confirm coins increase immediately with a compact `+coins` popup.
- Tap Tap Farm repeatedly and confirm the combo badge keeps reward text separate while the combo number and multiplier stay readable.
- Tap Tap Farm repeatedly through 10, 20, 40, and 70 combo tiers and confirm the badge grows, pulses, and gains stronger rings/sparkles/flares.
- Stop tapping for more than 2 seconds and confirm the combo resets back to the normal Tap Farm status.
- Tap Tap Farm repeatedly and confirm Farm Burst still triggers at 20 taps, grants bonus coins, resets the meter, and adds a brief stronger badge ring/sparkle burst.
- Open Menu or another panel, tap where Tap Farm sits, and confirm Tap Farm does not trigger through the modal.
- Wait for a Coin Bug to appear, tap it, and confirm coins increase with a compact `+coins` popup.
- Tap near a Coin Bug without hitting the exact visual and confirm proximity pickup collects it reliably.
- On mobile, tap around the edge of a Coin Bug and confirm it is still easy to collect.
- Let a Coin Bug expire without tapping and confirm it fades away safely.
- Catch three Coin Bugs and confirm the Goals mission progresses and completes.
- Open Orders from Menu and confirm the purpose text explains merging for rewards.
- Claim a Spore Order and confirm the reward is granted once and the required Spore remains on the farm.
- Own or seed a Level 2/3 Slime and confirm the matching Order becomes claimable.
- Claim an Order and confirm the coins or Monster Essence are granted once.
- Confirm claiming an Order does not consume or delete the required monster.
- Confirm the 3 expansion slots start locked and reject monster drops safely.
- Unlock the expansion row, confirm 350 coins are deducted, then hatch into an expanded slot.
- Drag or merge monsters using expanded slots.
- During early/mid play, confirm visible progress happens roughly every 30-90 seconds and first prestige looks reachable in about 20-40 minutes.
- During early/mid play, confirm egg costs rise less sharply and repeated hatching does not stall for minutes while income is still modest.

## Mobile Viewports
- Check `360x640` and `390x844`.
- Confirm HUD, production stats, compact Menu button, grid, expansion placeholder, and hatch panel do not overlap.
- Confirm Tap Farm, Hatch, Menu, grid, and expansion controls remain distinct and usable.
- Confirm the Next Order widget remains readable and tappable at `360px` width.
- At `360px` width, confirm HUD, Tap Farm combo badge, hatch, toast, and panel text do not visibly overflow their bounds.
- At `360px` width, confirm the Tap Farm combo badge sits near Tap Farm without covering Hatch, the farm grid, or monster drag/drop.
- In deployed mobile Chrome or an equivalent 360px-wide browser viewport, confirm the Hatch panel is fully visible above browser/navigation bars.
- Confirm the Production panel shows Income/sec, Next Egg, and Offline Cap without clipping.
- Confirm coin values use clean whole or compact text with no long decimal strings.
- Confirm the expansion row or unlock button remains visible above the Hatch panel.
- Open Menu and confirm it is readable, compact, and does not cover the hatch panel unnecessarily.
- Open Settings, switch English to Thai, and confirm Menu labels immediately show Thai.
- Reload and confirm the selected Thai language persists, then switch back to English and confirm English returns.
- In Thai, open Upgrade Shop, Goals, Compendium, Prestige, Zone, Help, and Settings on mobile and confirm text is readable without obvious clipping.
- Confirm no raw translation keys such as `ui.menu.upgrades` are visible to players.
- From Menu, open Upgrades, Goals, Prestige, Zone, Compendium, Help, and Settings; confirm Menu closes and each panel is readable, fits, and can close.
- Open Compendium on mobile, use Prev/Next through Slime and Mushroom entries, and confirm every monster row is reachable.
- Page through the Compendium on mobile and confirm short pages use empty space acceptably without hiding Close, Prev, Next, or the page label.
- Confirm farm-grid monsters and Compendium icons remain readable at mobile size.
- Open Compendium on a desktop/wide browser, page through all entries, and confirm the layout is not compressed or overflowing.
- Open Upgrade Shop on mobile and confirm rows and Buy buttons are visible without clipping.
- Open Upgrade Shop on mobile and confirm x1/x10/x50/Max buy mode controls are readable and tappable.
- Page through the mobile Upgrade Shop and confirm the new upgrade rows remain reachable without masked scrolling or clipped pagination controls.
- Open Goals on mobile and confirm the mission list remains readable and Claim buttons still work.
- With a paginated panel open, tap inside the panel body and confirm outside-tap close is not triggered.
- With outside-tap close enabled, open Menu and tap outside it to confirm Menu closes.
- With outside-tap close disabled, open Menu and tap outside it to confirm the tap is blocked and Menu remains open.
- With a Coin Bug visible, drag a monster near it and confirm normal drag still works.
- Drag monsters near and over the Tap Farm area and confirm normal drag/drop behavior still works.
- Open a panel while a Coin Bug is visible and confirm the bug cannot be tapped through the modal.
- Open Orders on mobile and confirm rows, status labels, Claim buttons, and pagination fit at `360px`.

## Persistence
- Reload after hatching, merging, and buying an upgrade.
- Confirm coins, egg cost, monsters, discoveries, upgrades, expansion unlock state, and onboarding hint state persist.
- Confirm completed and claimed Goals persist after reload.
- Confirm claimed mission rewards cannot be claimed again after reload.
- Confirm claimed Orders persist as Done after reload and cannot be claimed again.
- Confirm reloading after claiming an Order does not delete the monster that completed it.
- Reload after unlocking expansion and confirm expanded-slot monsters persist.
- After owning a Level 6+ Slime or Level 5 Mushroom, open Ritual, confirm reset grants Monster Essence, buy Hatch Blessing and Rare Hatch, and reload to confirm both persist.
- After Ritual/discovery progress, confirm Mushroom Forest, Spore Grove, and Cactus Desert unlock in Zone, can be selected, change the background, and alter Hatch Pool odds.
- Reload after switching zones and confirm the selected zone and unlocked zone set persist.
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
- Confirm Level 15 + Level 15 monsters fail safely and both monsters remain.
- Try an invalid drag and confirm no monster is duplicated or deleted.
- Confirm browser console errors are `0`.
