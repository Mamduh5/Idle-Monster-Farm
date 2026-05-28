export type UpgradeId =
  | 'slime-income-boost'
  | 'mushroom-income-boost'
  | 'cactus-income-boost'
  | 'cell-income-boost'
  | 'plant-income-boost'
  | 'hatch-speed'
  | 'mushroom-chance'
  | 'offline-storage'
  | 'egg-discount'
  | 'tap-power'
  | 'fusion-power'
  | 'order-bonus'
  | 'coin-bug-value';

export type UpgradeDefinition = {
  id: UpgradeId;
  name: string;
  effect: string;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
};

export const UPGRADE_DEFINITIONS: UpgradeDefinition[] = [
  {
    id: 'slime-income-boost',
    name: 'Slime Income Boost',
    effect: '+20% Slime income per level',
    baseCost: 20,
    costMultiplier: 1.45,
    maxLevel: 20,
  },
  {
    id: 'mushroom-income-boost',
    name: 'Mushroom Income Boost',
    effect: '+22% Mushroom income per level',
    baseCost: 35,
    costMultiplier: 1.5,
    maxLevel: 20,
  },
  {
    id: 'cactus-income-boost',
    name: 'Cactus Income Boost',
    effect: '+18% Cactus income per level',
    baseCost: 420,
    costMultiplier: 1.58,
    maxLevel: 20,
  },
  {
    id: 'cell-income-boost',
    name: 'Cell Income Boost',
    effect: '+18% Cell income per level',
    baseCost: 650,
    costMultiplier: 1.6,
    maxLevel: 20,
  },
  {
    id: 'plant-income-boost',
    name: 'Plant Income Boost',
    effect: '+18% Plant income per level',
    baseCost: 900,
    costMultiplier: 1.62,
    maxLevel: 20,
  },
  {
    id: 'hatch-speed',
    name: 'Hatch Speed',
    effect: '-7% hatch cooldown per level',
    baseCost: 30,
    costMultiplier: 1.55,
    maxLevel: 10,
  },
  {
    id: 'mushroom-chance',
    name: 'Mushroom Chance',
    effect: '+4% Mushroom hatch chance per level',
    baseCost: 65,
    costMultiplier: 1.6,
    maxLevel: 5,
  },
  {
    id: 'offline-storage',
    name: 'Offline Storage',
    effect: '+30 minutes offline cap per level',
    baseCost: 50,
    costMultiplier: 1.6,
    maxLevel: 8,
  },
  {
    id: 'egg-discount',
    name: 'Egg Discount',
    effect: '-3% hatch egg cost per level',
    baseCost: 150,
    costMultiplier: 1.45,
    maxLevel: 25,
  },
  {
    id: 'tap-power',
    name: 'Tap Power',
    effect: '+15% Tap Farm reward per level',
    baseCost: 90,
    costMultiplier: 1.5,
    maxLevel: 20,
  },
  {
    id: 'fusion-power',
    name: 'Fusion Power',
    effect: '+15% Spore income per level',
    baseCost: 250,
    costMultiplier: 1.55,
    maxLevel: 20,
  },
  {
    id: 'order-bonus',
    name: 'Order Bonus',
    effect: '+10% Order and Goal coin rewards per level',
    baseCost: 300,
    costMultiplier: 1.6,
    maxLevel: 15,
  },
  {
    id: 'coin-bug-value',
    name: 'Coin Bug Value',
    effect: '+20% Coin Bug reward per level',
    baseCost: 180,
    costMultiplier: 1.55,
    maxLevel: 15,
  },
];

export function getUpgradeDefinition(upgradeId: UpgradeId): UpgradeDefinition {
  const upgrade = UPGRADE_DEFINITIONS.find((definition) => definition.id === upgradeId);

  if (!upgrade) {
    throw new Error(`Missing upgrade definition: ${upgradeId}`);
  }

  return upgrade;
}

export function getUpgradeCost(upgrade: UpgradeDefinition, currentLevel: number): number {
  if (!Number.isFinite(currentLevel) || currentLevel < 0 || currentLevel >= upgrade.maxLevel) {
    return 0;
  }

  return Math.floor(upgrade.baseCost * upgrade.costMultiplier ** currentLevel);
}
