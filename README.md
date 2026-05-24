# Idle Monster Farm

Idle Monster Farm is a browser alpha idle merge game. Hatch monsters, merge matching creatures, earn passive coins, buy upgrades, complete goals, prestige for Monster Essence, and unlock Mushroom Forest.

## Current Alpha Features

- Idle coin income from owned monsters
- Hatch and merge loop
- Slime and Mushroom monster families
- Unlockable expansion slots
- Upgrade Shop
- Goals/Missions
- Monster Essence prestige
- Zone 2: Mushroom Forest
- Compact Menu navigation for panels
- Local save/load
- Offline earnings
- Mobile-friendly browser layout
- Debug UI hidden from normal play

## Tech Stack

- Phaser
- TypeScript
- Vite
- Browser `localStorage` for saves and settings

## Local Setup

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Save Data

Gameplay progress is stored in the browser with `localStorage`. Clearing site data, using a fresh browser profile, or deleting the game's localStorage entries will reset local progress.

## Not Implemented Yet

Android packaging, ads, backend services, cloud save, and account systems are not implemented in this browser alpha.
