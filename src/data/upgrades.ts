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
    effect: '+20% Slime income per level',
    baseCost: 20,
    costMultiplier: 1.45,
    maxLevel: 10,
  },
  {
    id: 'mushroom-income-boost',
    name: 'Mushroom Income Boost',
    effect: '+22% Mushroom income per level',
    baseCost: 35,
    costMultiplier: 1.5,
    maxLevel: 10,
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
