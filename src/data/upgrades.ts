export type UpgradeId = 'slime-income-boost' | 'hatch-speed' | 'offline-storage';

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
    effect: '+10% total monster income per level',
    baseCost: 25,
    costMultiplier: 1.6,
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
