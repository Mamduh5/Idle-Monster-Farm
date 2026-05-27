import type { MonsterFamily } from '../types/game-state';

export type HatchPoolEntryDefinition = {
  family: MonsterFamily;
  baseWeight: number;
  rare: boolean;
  minimumRareHatchLevel: number;
  requiresDiscovery: boolean;
  unlockHintKey: string;
};

export const RARE_HATCH_WEIGHT_BONUS_PER_LEVEL = 0.15;

export const HATCH_POOL_DEFINITIONS: HatchPoolEntryDefinition[] = [
  {
    family: 'Slime',
    baseWeight: 70,
    rare: false,
    minimumRareHatchLevel: 0,
    requiresDiscovery: false,
    unlockHintKey: 'ui.hatchPool.unlock.always',
  },
  {
    family: 'Mushroom',
    baseWeight: 25,
    rare: false,
    minimumRareHatchLevel: 0,
    requiresDiscovery: false,
    unlockHintKey: 'ui.hatchPool.unlock.always',
  },
  {
    family: 'Spore',
    baseWeight: 5,
    rare: true,
    minimumRareHatchLevel: 1,
    requiresDiscovery: false,
    unlockHintKey: 'ui.hatchPool.unlock.spore',
  },
  {
    family: 'Cactus',
    baseWeight: 3,
    rare: true,
    minimumRareHatchLevel: 2,
    requiresDiscovery: false,
    unlockHintKey: 'ui.hatchPool.unlock.cactus',
  },
  {
    family: 'Cell',
    baseWeight: 2,
    rare: true,
    minimumRareHatchLevel: 3,
    requiresDiscovery: true,
    unlockHintKey: 'ui.hatchPool.unlock.cell',
  },
  {
    family: 'Plant',
    baseWeight: 1,
    rare: true,
    minimumRareHatchLevel: 4,
    requiresDiscovery: true,
    unlockHintKey: 'ui.hatchPool.unlock.plant',
  },
];
