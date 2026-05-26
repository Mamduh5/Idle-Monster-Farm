import type { ExpeditionDefinition, ExpeditionId } from '../data/expeditions';
import type { FarmSlotState, MonsterInstance } from '../types/game-state';

export type ExpeditionStatus = 'claimed' | 'ready' | 'locked';

export function getMonsterExpeditionPower(monster: MonsterInstance | null | undefined): number {
  if (!monster) {
    return 0;
  }

  const levelPower = Number.isFinite(monster.level) ? monster.level * 10 : 0;
  const incomePower = Number.isFinite(monster.incomePerSecond) ? monster.incomePerSecond : 0;

  return Math.max(0, Math.floor(levelPower + incomePower));
}

export function getExpeditionPower(farmSlots: readonly FarmSlotState[]): number {
  return Math.floor(farmSlots.reduce((totalPower, slot) => totalPower + getMonsterExpeditionPower(slot.monster), 0));
}

export function isExpeditionClaimed(
  expeditionId: ExpeditionId,
  claimedExpeditionIds: ReadonlySet<ExpeditionId>,
): boolean {
  return claimedExpeditionIds.has(expeditionId);
}

export function isExpeditionComplete(
  expedition: ExpeditionDefinition,
  farmSlots: readonly FarmSlotState[],
): boolean {
  return getExpeditionPower(farmSlots) >= expedition.requiredPower;
}

export function canClaimExpedition(
  expedition: ExpeditionDefinition,
  farmSlots: readonly FarmSlotState[],
  claimedExpeditionIds: ReadonlySet<ExpeditionId>,
): boolean {
  return !isExpeditionClaimed(expedition.id, claimedExpeditionIds) && isExpeditionComplete(expedition, farmSlots);
}

export function getNextRecommendedExpedition(
  expeditions: readonly ExpeditionDefinition[],
  farmSlots: readonly FarmSlotState[],
  claimedExpeditionIds: ReadonlySet<ExpeditionId>,
): ExpeditionDefinition | undefined {
  return expeditions.find((expedition) => canClaimExpedition(expedition, farmSlots, claimedExpeditionIds))
    ?? expeditions.find((expedition) => !isExpeditionClaimed(expedition.id, claimedExpeditionIds));
}

export function getSanitizedClaimedExpeditionIds(
  rawIds: unknown,
  validIds: readonly ExpeditionId[],
): Set<ExpeditionId> {
  if (!Array.isArray(rawIds)) {
    return new Set<ExpeditionId>();
  }

  return new Set(rawIds.filter((expeditionId): expeditionId is ExpeditionId => (
    typeof expeditionId === 'string' && validIds.includes(expeditionId as ExpeditionId)
  )));
}

export function getExpeditionStatus(
  expedition: ExpeditionDefinition,
  farmSlots: readonly FarmSlotState[],
  claimedExpeditionIds: ReadonlySet<ExpeditionId>,
): ExpeditionStatus {
  if (isExpeditionClaimed(expedition.id, claimedExpeditionIds)) {
    return 'claimed';
  }

  if (isExpeditionComplete(expedition, farmSlots)) {
    return 'ready';
  }

  return 'locked';
}
