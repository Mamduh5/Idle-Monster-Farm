import type { ExpeditionDefinition, ExpeditionId } from '../data/expeditions';
import type { FarmSlotState, MonsterInstance } from '../types/game-state';

export type ExpeditionStatus = 'claimed' | 'ready' | 'locked';
export type BattleResult = 'victory' | 'need-power';

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

export function getMonsterBattlePower(monster: MonsterInstance | null | undefined): number {
  return getMonsterExpeditionPower(monster);
}

export function getBattlePower(farmSlots: readonly FarmSlotState[]): number {
  return getExpeditionPower(farmSlots);
}

export function getTopBattleMonsters(
  farmSlots: readonly FarmSlotState[],
  limit: number,
): MonsterInstance[] {
  return farmSlots
    .map((slot) => slot.monster)
    .filter((monster): monster is MonsterInstance => Boolean(monster))
    .sort((a, b) => getMonsterBattlePower(b) - getMonsterBattlePower(a))
    .slice(0, Math.max(0, limit));
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

export function getCurrentBattleStage(
  expeditions: readonly ExpeditionDefinition[],
  claimedExpeditionIds: ReadonlySet<ExpeditionId>,
): ExpeditionDefinition | undefined {
  return expeditions.find((expedition) => !isExpeditionClaimed(expedition.id, claimedExpeditionIds))
    ?? expeditions[expeditions.length - 1];
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

export function getBattleResult(power: number, requiredPower: number): BattleResult {
  return power >= requiredPower ? 'victory' : 'need-power';
}

export function getEnemyHpAfterBattle(power: number, requiredPower: number): number {
  if (power >= requiredPower) {
    return 0;
  }

  return Math.max(1, requiredPower - Math.max(0, Math.floor(power)));
}

export function getBattleDamageTicks(power: number, requiredPower: number, tickCount: number): number[] {
  const safeTickCount = Math.max(1, Math.floor(tickCount));
  const finalHp = getEnemyHpAfterBattle(power, requiredPower);
  const totalDamage = Math.max(0, requiredPower - finalHp);
  const baseDamage = Math.floor(totalDamage / safeTickCount);
  let remainder = totalDamage % safeTickCount;

  return Array.from({ length: safeTickCount }, () => {
    const tickDamage = baseDamage + (remainder > 0 ? 1 : 0);
    remainder = Math.max(0, remainder - 1);

    return tickDamage;
  });
}

export function canClaimBattleReward(
  expedition: ExpeditionDefinition,
  farmSlots: readonly FarmSlotState[],
  claimedExpeditionIds: ReadonlySet<ExpeditionId>,
): boolean {
  return canClaimExpedition(expedition, farmSlots, claimedExpeditionIds);
}

export function getBattleStageStatus(
  expedition: ExpeditionDefinition,
  farmSlots: readonly FarmSlotState[],
  claimedExpeditionIds: ReadonlySet<ExpeditionId>,
): ExpeditionStatus {
  return getExpeditionStatus(expedition, farmSlots, claimedExpeditionIds);
}
