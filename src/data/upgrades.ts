export type UpgradeId =
  | 'slime-income-boost'
  | 'mushroom-income-boost'
  | 'hatch-speed'
  | 'mushroom-chance'
  | 'offline-storage';

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
    effect: '+10% Slime income per level',
    baseCost: 25,
    costMultiplier: 1.6,
    maxLevel: 10,
  },
  {
    id: 'mushroom-income-boost',
    name: 'Mushroom Income Boost',
    effect: '+12% Mushroom income per level',
    baseCost: 45,
    costMultiplier: 1.65,
    maxLevel: 10,
  },
  {
    id: 'hatch-speed',
    name: 'Hatch Speed',
    effect: '-5% hatch cooldown per level',
    baseCost: 40,
    costMultiplier: 1.7,
    maxLevel: 10,
  },
  {
    id: 'mushroom-chance',
    name: 'Mushroom Chance',
    effect: '+3% Mushroom hatch chance per level',
    baseCost: 80,
    costMultiplier: 1.75,
    maxLevel: 5,
  },
  {
    id: 'offline-storage',
    name: 'Offline Storage',
    effect: '+30 minutes offline cap per level',
    baseCost: 60,
    costMultiplier: 1.8,
    maxLevel: 4,
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
