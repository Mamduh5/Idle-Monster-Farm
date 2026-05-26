import { canMergeMonsters } from '../systems/monsterMergeSystem';
import type { FarmSlotState, MonsterInstance } from '../types/game-state';

export type SlotMoveFailureReason =
  | 'same-slot'
  | 'invalid-source'
  | 'invalid-target'
  | 'locked-source'
  | 'locked-target'
  | 'empty-source'
  | 'occupied-target';

export type SlotMoveResult =
  | {
    success: true;
    slots: FarmSlotState[];
    sourceSlotId: number;
    targetSlotId: number;
  }
  | {
    success: false;
    reason: SlotMoveFailureReason;
  };

export type SlotMergeFailureReason =
  | 'same-slot'
  | 'invalid-source'
  | 'invalid-target'
  | 'locked-source'
  | 'locked-target'
  | 'not-mergeable';

export type SlotMergeCheckResult =
  | {
    canMerge: true;
    sourceSlotId: number;
    targetSlotId: number;
  }
  | {
    canMerge: false;
    reason: SlotMergeFailureReason;
  };

export function createInitialFarmSlots(slotCount: number): FarmSlotState[] {
  return Array.from({ length: Math.max(0, Math.floor(slotCount)) }, (_, index) => ({
    id: index,
    monster: null,
  }));
}

export function isValidSlotId(slots: readonly FarmSlotState[], slotId: number): boolean {
  return Number.isInteger(slotId) && slotId >= 0 && slotId < slots.length;
}

export function isSlotUnlocked(slotId: number, expansionUnlocked: boolean, mainSlotCount: number): boolean {
  return slotId >= 0 && (slotId < mainSlotCount || expansionUnlocked);
}

export function getUnlockedFarmSlots(
  slots: readonly FarmSlotState[],
  expansionUnlocked: boolean,
  mainSlotCount: number,
): FarmSlotState[] {
  return slots.filter((slot) => isSlotUnlocked(slot.id, expansionUnlocked, mainSlotCount));
}

export function isFarmFull(
  slots: readonly FarmSlotState[],
  expansionUnlocked: boolean,
  mainSlotCount: number,
): boolean {
  return getUnlockedFarmSlots(slots, expansionUnlocked, mainSlotCount).every((slot) => slot.monster !== null);
}

export function findFirstEmptyUnlockedSlot(
  slots: readonly FarmSlotState[],
  expansionUnlocked: boolean,
  mainSlotCount: number,
): FarmSlotState | undefined {
  return getUnlockedFarmSlots(slots, expansionUnlocked, mainSlotCount).find((slot) => slot.monster === null);
}

export function canMoveSlots(
  slots: readonly FarmSlotState[],
  sourceSlotId: number,
  targetSlotId: number,
  expansionUnlocked: boolean,
  mainSlotCount: number,
): boolean {
  return checkSlotMove(slots, sourceSlotId, targetSlotId, expansionUnlocked, mainSlotCount).success;
}

export function checkSlotMove(
  slots: readonly FarmSlotState[],
  sourceSlotId: number,
  targetSlotId: number,
  expansionUnlocked: boolean,
  mainSlotCount: number,
): SlotMoveResult {
  if (sourceSlotId === targetSlotId) {
    return {
      success: false,
      reason: 'same-slot',
    };
  }

  if (!isValidSlotId(slots, sourceSlotId)) {
    return {
      success: false,
      reason: 'invalid-source',
    };
  }

  if (!isValidSlotId(slots, targetSlotId)) {
    return {
      success: false,
      reason: 'invalid-target',
    };
  }

  if (!isSlotUnlocked(sourceSlotId, expansionUnlocked, mainSlotCount)) {
    return {
      success: false,
      reason: 'locked-source',
    };
  }

  if (!isSlotUnlocked(targetSlotId, expansionUnlocked, mainSlotCount)) {
    return {
      success: false,
      reason: 'locked-target',
    };
  }

  if (!slots[sourceSlotId].monster) {
    return {
      success: false,
      reason: 'empty-source',
    };
  }

  if (slots[targetSlotId].monster !== null) {
    return {
      success: false,
      reason: 'occupied-target',
    };
  }

  return {
    success: true,
    slots: cloneSlots(slots),
    sourceSlotId,
    targetSlotId,
  };
}

export function canMergeSlots(
  slots: readonly FarmSlotState[],
  sourceSlotId: number,
  targetSlotId: number,
  expansionUnlocked: boolean,
  mainSlotCount: number,
): boolean {
  return checkSlotMerge(slots, sourceSlotId, targetSlotId, expansionUnlocked, mainSlotCount).canMerge;
}

export function checkSlotMerge(
  slots: readonly FarmSlotState[],
  sourceSlotId: number,
  targetSlotId: number,
  expansionUnlocked: boolean,
  mainSlotCount: number,
): SlotMergeCheckResult {
  if (sourceSlotId === targetSlotId) {
    return {
      canMerge: false,
      reason: 'same-slot',
    };
  }

  if (!isValidSlotId(slots, sourceSlotId)) {
    return {
      canMerge: false,
      reason: 'invalid-source',
    };
  }

  if (!isValidSlotId(slots, targetSlotId)) {
    return {
      canMerge: false,
      reason: 'invalid-target',
    };
  }

  if (!isSlotUnlocked(sourceSlotId, expansionUnlocked, mainSlotCount)) {
    return {
      canMerge: false,
      reason: 'locked-source',
    };
  }

  if (!isSlotUnlocked(targetSlotId, expansionUnlocked, mainSlotCount)) {
    return {
      canMerge: false,
      reason: 'locked-target',
    };
  }

  if (!canMergeMonsters(slots[sourceSlotId].monster, slots[targetSlotId].monster)) {
    return {
      canMerge: false,
      reason: 'not-mergeable',
    };
  }

  return {
    canMerge: true,
    sourceSlotId,
    targetSlotId,
  };
}

export function moveSlotMonster(
  slots: readonly FarmSlotState[],
  sourceSlotId: number,
  targetSlotId: number,
  expansionUnlocked: boolean,
  mainSlotCount: number,
): SlotMoveResult {
  const checkResult = checkSlotMove(slots, sourceSlotId, targetSlotId, expansionUnlocked, mainSlotCount);

  if (!checkResult.success) {
    return checkResult;
  }

  const updatedSlots = cloneSlots(slots);
  const sourceMonster = updatedSlots[sourceSlotId].monster;

  updatedSlots[sourceSlotId] = {
    ...updatedSlots[sourceSlotId],
    monster: null,
  };
  updatedSlots[targetSlotId] = {
    ...updatedSlots[targetSlotId],
    monster: sourceMonster,
  };

  return {
    success: true,
    slots: updatedSlots,
    sourceSlotId,
    targetSlotId,
  };
}

export function getSlotMonster(slots: readonly FarmSlotState[], slotId: number): MonsterInstance | null {
  return isValidSlotId(slots, slotId) ? slots[slotId].monster : null;
}

export function setSlotMonster(
  slots: readonly FarmSlotState[],
  slotId: number,
  monster: MonsterInstance | null,
): FarmSlotState[] {
  if (!isValidSlotId(slots, slotId)) {
    return cloneSlots(slots);
  }

  const updatedSlots = cloneSlots(slots);
  updatedSlots[slotId] = {
    ...updatedSlots[slotId],
    monster,
  };

  return updatedSlots;
}

export function clearSlotMonster(slots: readonly FarmSlotState[], slotId: number): FarmSlotState[] {
  return setSlotMonster(slots, slotId, null);
}

function cloneSlots(slots: readonly FarmSlotState[]): FarmSlotState[] {
  return slots.map((slot) => ({
    ...slot,
  }));
}
