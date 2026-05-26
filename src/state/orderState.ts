import type { OrderDefinition, OrderId } from '../data/orders';
import type { FarmSlotState, MonsterFamily } from '../types/game-state';

export type OrderStatus = 'done' | 'locked' | 'claim' | 'in-progress';
export type MonsterDiscoveryKey = `${MonsterFamily}:${number}`;

export function getMonsterDiscoveryKey(family: MonsterFamily, level: number): MonsterDiscoveryKey {
  return `${family}:${level}`;
}

export function getOrderDefinition(
  orderDefinitions: readonly OrderDefinition[],
  orderId: OrderId,
): OrderDefinition | undefined {
  return orderDefinitions.find((order) => order.id === orderId);
}

export function isOrderUnlocked(
  order: OrderDefinition,
  discoveredMonsters: ReadonlySet<MonsterDiscoveryKey>,
): boolean {
  if (!order.unlockCondition) {
    return true;
  }

  if (order.unlockCondition.type === 'discovered') {
    return discoveredMonsters.has(getMonsterDiscoveryKey(order.unlockCondition.family, order.unlockCondition.level));
  }

  return false;
}

export function isOrderComplete(
  order: OrderDefinition,
  farmSlots: readonly FarmSlotState[],
  discoveredMonsters: ReadonlySet<MonsterDiscoveryKey>,
): boolean {
  return isOrderUnlocked(order, discoveredMonsters) && farmSlots.some((slot) => (
    slot.monster?.family === order.requiredFamily
    && slot.monster.level >= order.requiredLevel
  ));
}

export function getOrderStatus(
  order: OrderDefinition,
  farmSlots: readonly FarmSlotState[],
  discoveredMonsters: ReadonlySet<MonsterDiscoveryKey>,
  claimedOrderIds: ReadonlySet<OrderId>,
): OrderStatus {
  if (claimedOrderIds.has(order.id)) {
    return 'done';
  }

  if (!isOrderUnlocked(order, discoveredMonsters)) {
    return 'locked';
  }

  if (isOrderComplete(order, farmSlots, discoveredMonsters)) {
    return 'claim';
  }

  return 'in-progress';
}

export function canClaimOrder(
  order: OrderDefinition,
  farmSlots: readonly FarmSlotState[],
  discoveredMonsters: ReadonlySet<MonsterDiscoveryKey>,
  claimedOrderIds: ReadonlySet<OrderId>,
): boolean {
  return getOrderStatus(order, farmSlots, discoveredMonsters, claimedOrderIds) === 'claim';
}

export function getRecommendedOrder(
  orderDefinitions: readonly OrderDefinition[],
  farmSlots: readonly FarmSlotState[],
  discoveredMonsters: ReadonlySet<MonsterDiscoveryKey>,
  claimedOrderIds: ReadonlySet<OrderId>,
): OrderDefinition | undefined {
  return orderDefinitions.find((order) => !claimedOrderIds.has(order.id) && isOrderComplete(order, farmSlots, discoveredMonsters))
    ?? orderDefinitions.find((order) => !claimedOrderIds.has(order.id) && isOrderUnlocked(order, discoveredMonsters))
    ?? orderDefinitions.find((order) => !claimedOrderIds.has(order.id));
}
