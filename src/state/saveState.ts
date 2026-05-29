import type { QuestId } from '../data/quests';
import type { UpgradeId } from '../data/upgrades';
import type { ZoneId } from '../data/zones';
import { isElementType, normalizeElementLevel, type ElementFragmentInventory } from '../data/elements';
import type {
  LocalSaveData,
  SavedMonsterDiscovery,
  SavedMonsterSlot,
} from '../systems/saveSystem';
import {
  createDiscoveryKey,
  parseDiscoveryKey,
  type DiscoveryKey,
} from './discoveryState';
import type {
  FarmSlotState,
  OnboardingHintId,
  QuestGuideStepId,
} from '../types/game-state';

export type SaveSourceState = {
  version: LocalSaveData['version'];
  coins: number;
  farmSlots: readonly FarmSlotState[];
  lastActiveAt: number;
  discoveredMonsters: ReadonlySet<DiscoveryKey>;
  upgrades: Record<UpgradeId, number>;
  monsterEssence: number;
  essencePowerLevel: number;
  rareHatchLevel: number;
  totalRitualsPerformed: number;
  currentEggCost: number;
  onboardingHintsSeen: ReadonlySet<OnboardingHintId>;
  activeQuestGuideStepId?: QuestGuideStepId;
  completedQuestGuideStepIds: ReadonlySet<QuestGuideStepId>;
  isFirstGuideComplete: boolean;
  isFirstGuideSkipped: boolean;
  expansionUnlocked: boolean;
  questProgress: Record<QuestId, number>;
  completedQuestIds: ReadonlySet<QuestId>;
  claimedQuestIds: ReadonlySet<QuestId>;
  claimedBossBattleStageIds: ReadonlySet<string>;
  elementFragments: ElementFragmentInventory;
  bossDailyClearCounts: Record<string, number>;
  bossDailyClearLastResetDay: string;
  unlockedZones: ReadonlySet<ZoneId>;
  currentZone: ZoneId;
  hasPrestigedOnce: boolean;
  hasUsedGuidedFreeForge: boolean;
  hasUsedGuidedFreeSafeRitual: boolean;
};

export type LoadedSceneStateFragments = {
  onboardingHintsSeen: Set<OnboardingHintId>;
  completedQuestGuideStepIds: Set<QuestGuideStepId>;
  completedQuestIds: Set<QuestId>;
  claimedQuestIds: Set<QuestId>;
  claimedBossBattleStageIds: Set<string>;
};

export function createLocalSaveData(sourceState: SaveSourceState): LocalSaveData {
  return {
    version: sourceState.version,
    coins: sourceState.coins,
    grid: createSavedGrid(sourceState.farmSlots),
    lastActiveAt: sourceState.lastActiveAt,
    discoveredMonsters: createSavedDiscoveries(sourceState.discoveredMonsters),
    upgrades: sourceState.upgrades,
    monsterEssence: sourceState.monsterEssence,
    essencePowerLevel: sourceState.essencePowerLevel,
    rareHatchLevel: sourceState.rareHatchLevel,
    totalRitualsPerformed: sourceState.totalRitualsPerformed,
    currentEggCost: sourceState.currentEggCost,
    onboardingHintsSeen: Array.from(sourceState.onboardingHintsSeen),
    activeQuestGuideStepId: sourceState.activeQuestGuideStepId,
    completedQuestGuideStepIds: Array.from(sourceState.completedQuestGuideStepIds),
    isFirstGuideComplete: sourceState.isFirstGuideComplete,
    isFirstGuideSkipped: sourceState.isFirstGuideSkipped,
    expansionUnlocked: sourceState.expansionUnlocked,
    questProgress: sourceState.questProgress,
    completedQuestIds: Array.from(sourceState.completedQuestIds),
    claimedQuestIds: Array.from(sourceState.claimedQuestIds),
    claimedBossBattleStageIds: Array.from(sourceState.claimedBossBattleStageIds),
    elementFragments: { ...sourceState.elementFragments },
    bossDailyClearCounts: { ...sourceState.bossDailyClearCounts },
    bossDailyClearLastResetDay: sourceState.bossDailyClearLastResetDay,
    unlockedZones: Array.from(sourceState.unlockedZones),
    currentZone: sourceState.currentZone,
    hasPrestigedOnce: sourceState.hasPrestigedOnce,
    hasUsedGuidedFreeForge: sourceState.hasUsedGuidedFreeForge,
    hasUsedGuidedFreeSafeRitual: sourceState.hasUsedGuidedFreeSafeRitual,
  };
}

export function createSavedGrid(farmSlots: readonly FarmSlotState[]): SavedMonsterSlot[] {
  return farmSlots.map((slot) => {
    if (!slot.monster) {
      return null;
    }

    const savedSlot: NonNullable<SavedMonsterSlot> = {
      family: slot.monster.family,
      level: slot.monster.level,
    };

    if (isElementType(slot.monster.element)) {
      savedSlot.element = slot.monster.element;
      savedSlot.elementLevel = normalizeElementLevel(slot.monster.elementLevel);
    }

    return savedSlot;
  });
}

export function createSavedDiscoveries(
  discoveredMonsters: ReadonlySet<DiscoveryKey>,
): SavedMonsterDiscovery[] {
  return Array.from(discoveredMonsters).map((discoveryKey) => {
    const { family, level } = parseDiscoveryKey(discoveryKey);

    return {
      family,
      level,
    };
  });
}

export function createDiscoveryKeys(
  savedDiscoveries: readonly SavedMonsterDiscovery[],
): Set<DiscoveryKey> {
  return new Set(savedDiscoveries.map((discovery) => createDiscoveryKey(discovery.family, discovery.level)));
}

export function createLoadedSetsFromSave(saveData: LocalSaveData): LoadedSceneStateFragments {
  const completedQuestIds = new Set(saveData.completedQuestIds);
  const claimedQuestIds = new Set(saveData.claimedQuestIds);

  claimedQuestIds.forEach((questId) => {
    completedQuestIds.add(questId);
  });

  return {
    onboardingHintsSeen: new Set(saveData.onboardingHintsSeen),
    completedQuestGuideStepIds: new Set(saveData.completedQuestGuideStepIds),
    completedQuestIds,
    claimedQuestIds,
    claimedBossBattleStageIds: new Set(saveData.claimedBossBattleStageIds),
  };
}
