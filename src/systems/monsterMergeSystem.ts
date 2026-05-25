import { getMonsterDefinition, getNextMonsterDefinition } from '../data/monsters';
import type { MonsterDefinition } from '../types/game-state';

// Pure monster merge rules. Keep this module free of Phaser, storage, and scene state.
type MergeableMonster = Pick<MonsterDefinition, 'family' | 'level'>;

export function isSameFamilySameLevelMerge(
  sourceMonster: MergeableMonster | null | undefined,
  targetMonster: MergeableMonster | null | undefined,
): boolean {
  if (!sourceMonster || !targetMonster) {
    return false;
  }

  return sourceMonster.family === targetMonster.family
    && sourceMonster.level === targetMonster.level;
}

export function getSameFamilyNextMonsterDefinition(
  sourceMonster: MergeableMonster | null | undefined,
  targetMonster: MergeableMonster | null | undefined,
): MonsterDefinition | undefined {
  if (!isSameFamilySameLevelMerge(sourceMonster, targetMonster) || !sourceMonster) {
    return undefined;
  }

  return getNextMonsterDefinition(sourceMonster.family, sourceMonster.level);
}

export function getMonsterMergeResult(
  sourceMonster: MergeableMonster | null | undefined,
  targetMonster: MergeableMonster | null | undefined,
): MonsterDefinition | undefined {
  return getSameFamilyNextMonsterDefinition(sourceMonster, targetMonster)
    ?? getSlimeMushroomSporeFusionResult(sourceMonster, targetMonster)
    ?? getSporeCatalystFusionResult(sourceMonster, targetMonster);
}

export function canMergeMonsters(
  sourceMonster: MergeableMonster | null | undefined,
  targetMonster: MergeableMonster | null | undefined,
): boolean {
  return Boolean(getMonsterMergeResult(sourceMonster, targetMonster));
}

function getSlimeMushroomSporeFusionResult(
  sourceMonster: MergeableMonster | null | undefined,
  targetMonster: MergeableMonster | null | undefined,
): MonsterDefinition | undefined {
  if (!sourceMonster || !targetMonster || sourceMonster.level !== targetMonster.level) {
    return undefined;
  }

  const isSlimeMushroomPair = (sourceMonster.family === 'Slime' && targetMonster.family === 'Mushroom')
    || (sourceMonster.family === 'Mushroom' && targetMonster.family === 'Slime');

  if (!isSlimeMushroomPair) {
    return undefined;
  }

  return getMonsterDefinition('Spore', sourceMonster.level);
}

function getSporeCatalystFusionResult(
  sourceMonster: MergeableMonster | null | undefined,
  targetMonster: MergeableMonster | null | undefined,
): MonsterDefinition | undefined {
  if (!sourceMonster || !targetMonster || sourceMonster.level !== targetMonster.level) {
    return undefined;
  }

  const sourceFamily = sourceMonster.family;
  const targetFamily = targetMonster.family;
  const isSporeCatalystPair = (sourceFamily === 'Spore' && (targetFamily === 'Slime' || targetFamily === 'Mushroom'))
    || (targetFamily === 'Spore' && (sourceFamily === 'Slime' || sourceFamily === 'Mushroom'));

  if (!isSporeCatalystPair) {
    return undefined;
  }

  return getNextMonsterDefinition('Spore', sourceMonster.level);
}
