# Idle Monster Farm

Idle Monster Farm is a browser alpha idle merge game. Hatch monsters, merge matching creatures, earn passive coins, buy upgrades, complete goals, prestige for Monster Essence, and unlock Mushroom Forest.

## Current Alpha Features

- Idle coin income from owned monsters
- Hatch and merge loop
- Slime and Mushroom monster families
- Unlockable expansion slots
- Upgrade Shop
- Egg Discount, Tap Power, Fusion Power, Order Bonus, and Coin Bug Value upgrade depth
- Goals/Missions
- Tap Farm combo reaction stack and Farm Burst feedback
- Monster Essence prestige
- Zone 2: Mushroom Forest
- Compact Menu navigation for panels
- Local save/load
- Offline earnings
- Mobile-friendly browser layout
- English and Thai UI language setting
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

## Browser Alpha Deployment

Build the browser alpha for a generic static host:

```bash
npm run build
```

The deployable files are written to `dist/`. Upload the contents of `dist/` to any static host that serves the game at the site root.

For GitHub Pages on the repository path `https://<user>.github.io/Idle-Monster-Farm/`, build with the project base path:

```bash
npm run build:pages
```

This uses Vite's `--base=/Idle-Monster-Farm/` option only for the Pages build. Local development, normal production builds, and `npm run preview` still use the default root path unless you run the Pages-specific build.

An optional GitHub Actions workflow is included at `.github/workflows/deploy.yml`. In GitHub, set Pages to deploy from GitHub Actions, then push to `main` to build and publish `dist/`.

Save data remains local to each browser and device because progress is stored in `localStorage`.

## Save Data

Gameplay progress is stored in the browser with `localStorage`. Clearing site data, using a fresh browser profile, or deleting the game's localStorage entries will reset local progress.

## Not Implemented Yet

Android packaging, ads, backend services, cloud save, and account systems are not implemented in this browser alpha.
