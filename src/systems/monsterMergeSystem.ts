import { getMonsterDefinition, getNextMonsterDefinition } from '../data/monsters';
import type { MonsterDefinition, MonsterFamily } from '../types/game-state';

// Pure monster merge rules. Keep this module free of Phaser, storage, and scene state.
type MergeableMonster = Pick<MonsterDefinition, 'family' | 'level'>;
type FusionRecipe = {
  families: readonly [MonsterFamily, MonsterFamily];
  result: MonsterFamily;
};

const FUSION_RECIPES: FusionRecipe[] = [
  { families: ['Slime', 'Mushroom'], result: 'Spore' },
  { families: ['Mushroom', 'Spore'], result: 'Cactus' },
  { families: ['Slime', 'Spore'], result: 'Cell' },
  { families: ['Cell', 'Cactus'], result: 'Plant' },
];

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
    ?? getFusionRecipeResult(sourceMonster, targetMonster);
}

export function canMergeMonsters(
  sourceMonster: MergeableMonster | null | undefined,
  targetMonster: MergeableMonster | null | undefined,
): boolean {
  return Boolean(getMonsterMergeResult(sourceMonster, targetMonster));
}

function getFusionRecipeResult(
  sourceMonster: MergeableMonster | null | undefined,
  targetMonster: MergeableMonster | null | undefined,
): MonsterDefinition | undefined {
  if (!sourceMonster || !targetMonster || sourceMonster.level !== targetMonster.level) {
    return undefined;
  }

  const recipe = FUSION_RECIPES.find((fusionRecipe) => {
    const [leftFamily, rightFamily] = fusionRecipe.families;

    return (sourceMonster.family === leftFamily && targetMonster.family === rightFamily)
      || (sourceMonster.family === rightFamily && targetMonster.family === leftFamily);
  });

  return recipe ? getMonsterDefinition(recipe.result, sourceMonster.level) : undefined;
}
