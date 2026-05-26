import type { MissionId } from '../data/missions';
import type { OrderId } from '../data/orders';
import type { UpgradeId } from '../data/upgrades';
import type { ZoneId } from '../data/zones';
import type {
  LocalSaveData,
  SavedMonsterDiscovery,
  SavedMonsterSlot,
} from '../systems/saveSystem';
import type { MonsterDiscoveryKey } from './orderState';
import type {
  FarmSlotState,
  MonsterFamily,
  OnboardingHintId,
} from '../types/game-state';

export type SaveSourceState = {
  version: LocalSaveData['version'];
  coins: number;
  farmSlots: readonly FarmSlotState[];
  lastActiveAt: number;
  discoveredMonsters: ReadonlySet<MonsterDiscoveryKey>;
  upgrades: Record<UpgradeId, number>;
  monsterEssence: number;
  essencePowerLevel: number;
  currentEggCost: number;
  onboardingHintsSeen: ReadonlySet<OnboardingHintId>;
  expansionUnlocked: boolean;
  missionProgress: Record<MissionId, number>;
  completedMissionIds: ReadonlySet<MissionId>;
  claimedMissionIds: ReadonlySet<MissionId>;
  claimedOrderIds: ReadonlySet<OrderId>;
  unlockedZones: ReadonlySet<ZoneId>;
  currentZone: ZoneId;
  hasPrestigedOnce: boolean;
};

export type LoadedSceneStateFragments = {
  onboardingHintsSeen: Set<OnboardingHintId>;
  completedMissionIds: Set<MissionId>;
  claimedMissionIds: Set<MissionId>;
  claimedOrderIds: Set<OrderId>;
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
    currentEggCost: sourceState.currentEggCost,
    onboardingHintsSeen: Array.from(sourceState.onboardingHintsSeen),
    expansionUnlocked: sourceState.expansionUnlocked,
    missionProgress: sourceState.missionProgress,
    completedMissionIds: Array.from(sourceState.completedMissionIds),
    claimedMissionIds: Array.from(sourceState.claimedMissionIds),
    claimedOrderIds: Array.from(sourceState.claimedOrderIds),
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

    return {
      family: slot.monster.family,
      level: slot.monster.level,
    };
  });
}

export function createSavedDiscoveries(
  discoveredMonsters: ReadonlySet<MonsterDiscoveryKey>,
): SavedMonsterDiscovery[] {
  return Array.from(discoveredMonsters).map((discoveryKey) => {
    const [family, level] = discoveryKey.split(':');

    return {
      family: family as MonsterFamily,
      level: Number(level),
    };
  });
}

export function createDiscoveryKeys(
  savedDiscoveries: readonly SavedMonsterDiscovery[],
): Set<MonsterDiscoveryKey> {
  return new Set(savedDiscoveries.map((discovery) => (
    `${discovery.family}:${discovery.level}` as MonsterDiscoveryKey
  )));
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
  };
}
