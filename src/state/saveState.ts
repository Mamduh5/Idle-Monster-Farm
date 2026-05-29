import type { MissionId } from '../data/missions';
import type { OrderId } from '../data/orders';
import type { UpgradeId } from '../data/upgrades';
import type { ZoneId } from '../data/zones';
import { isElementType, type ElementFragmentInventory } from '../data/elements';
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
  expansionUnlocked: boolean;
  missionProgress: Record<MissionId, number>;
  completedMissionIds: ReadonlySet<MissionId>;
  claimedMissionIds: ReadonlySet<MissionId>;
  claimedOrderIds: ReadonlySet<OrderId>;
  claimedBossBattleStageIds: ReadonlySet<string>;
  elementFragments: ElementFragmentInventory;
  bossDailyClearCounts: Record<string, number>;
  bossDailyClearLastResetDay: string;
  unlockedZones: ReadonlySet<ZoneId>;
  currentZone: ZoneId;
  hasPrestigedOnce: boolean;
};

export type LoadedSceneStateFragments = {
  onboardingHintsSeen: Set<OnboardingHintId>;
  completedMissionIds: Set<MissionId>;
  claimedMissionIds: Set<MissionId>;
  claimedOrderIds: Set<OrderId>;
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
    expansionUnlocked: sourceState.expansionUnlocked,
    missionProgress: sourceState.missionProgress,
    completedMissionIds: Array.from(sourceState.completedMissionIds),
    claimedMissionIds: Array.from(sourceState.claimedMissionIds),
    claimedOrderIds: Array.from(sourceState.claimedOrderIds),
    claimedBossBattleStageIds: Array.from(sourceState.claimedBossBattleStageIds),
    elementFragments: { ...sourceState.elementFragments },
    bossDailyClearCounts: { ...sourceState.bossDailyClearCounts },
    bossDailyClearLastResetDay: sourceState.bossDailyClearLastResetDay,
    unlockedZones: Array.from(sourceState.unlockedZones),
    currentZone: sourceState.currentZone,
    hasPrestigedOnce: sourceState.hasPrestigedOnce,
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
  const completedMissionIds = new Set(saveData.completedMissionIds);
  const claimedMissionIds = new Set(saveData.claimedMissionIds);

  claimedMissionIds.forEach((missionId) => {
    completedMissionIds.add(missionId);
  });

  return {
    onboardingHintsSeen: new Set(saveData.onboardingHintsSeen),
    completedMissionIds,
    claimedMissionIds,
    claimedOrderIds: new Set(saveData.claimedOrderIds),
    claimedBossBattleStageIds: new Set(saveData.claimedBossBattleStageIds),
  };
}
