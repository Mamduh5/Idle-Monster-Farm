import { getCoinBugReward as getProgressionCoinBugReward } from '../systems/progressionSystem';

export const COIN_BUG_SPAWN_MIN_MS = 20_000;
export const COIN_BUG_SPAWN_MAX_MS = 35_000;
export const COIN_BUG_MIN_LIFETIME_MS = 8_000;
export const COIN_BUG_MAX_LIFETIME_MS = 12_000;
export const COIN_BUG_MAX_ACTIVE = 3;
export const COIN_BUG_REWARD_SECONDS = 10;
export const COIN_BUG_MIN_REWARD = 25;
export const COIN_BUG_HITBOX_SIZE = 72;
export const COIN_BUG_PICKUP_RADIUS_DESKTOP = 52;
export const COIN_BUG_PICKUP_RADIUS_MOBILE = 64;
export const COIN_BUG_SPAWN_ATTEMPTS = 80;
export const COIN_BUG_FAILED_SPAWN_RETRY_MS = 3_000;
export const COIN_BUG_MIN_DISTANCE_FROM_OTHER_BUGS = 58;

export type PlainPoint = {
  x: number;
  y: number;
};

export type PlainRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CoinBugStateSnapshot = {
  id: number;
  x: number;
  y: number;
  lifetimeMs: number;
  collected: boolean;
  active: boolean;
};

export type CoinBugSpawnGateInput = {
  spawnAccumulatorMs: number;
  nextSpawnDelayMs: number;
  activeCoinBugCount: number;
  maxActiveCoinBugs: number;
  isModalOpen: boolean;
  isDraggingMonster: boolean;
};

export type CoinBugSpawnStateResult = {
  spawnAccumulatorMs: number;
  nextSpawnDelayMs: number;
};

export type CoinBugSpawnLayout = {
  isNarrow: boolean;
  statsY: number;
  statsHeight: number;
  gridStartY: number;
  hatchY: number;
  hudX: number;
  hudY: number;
  hudWidth: number;
  hudHeight: number;
  statsX: number;
  statsWidth: number;
  questWidgetX: number;
  questWidgetY: number;
  questWidgetWidth: number;
  questWidgetHeight: number;
  tapFarmX: number;
  tapFarmY: number;
  tapFarmWidth: number;
  tapFarmHeight: number;
  hatchX: number;
  hatchWidth: number;
  hatchHeight: number;
  menuX: number;
  menuY: number;
  expansionLabelY: number;
};

export type CoinBugSpawnBounds = {
  margin: number;
  minY: number;
  maxY: number;
  minX: number;
  maxX: number;
};

export type CoinBugSpawnSafetyInput = {
  point: PlainPoint;
  layout: CoinBugSpawnLayout;
  worldWidth: number;
  hitboxSize: number;
  cellSize: number;
  slotCenters: readonly PlainPoint[];
  existingBugPositions: readonly PlainPoint[];
  minDistanceFromOtherBugs: number;
};

export type ChooseCoinBugSpawnPositionInput = Omit<CoinBugSpawnSafetyInput, 'point'> & {
  randomInteger: (min: number, max: number) => number;
  maxAttempts: number;
};

export function getRandomDelayMs(minMs: number, maxMs: number, randomFloat: number): number {
  return getRandomInteger(minMs, maxMs, randomFloat);
}

export function getRandomLifetimeMs(minMs: number, maxMs: number, randomFloat: number): number {
  return getRandomInteger(minMs, maxMs, randomFloat);
}

export function getActiveCoinBugCount(bugs: readonly CoinBugStateSnapshot[]): number {
  return bugs.filter((bug) => !bug.collected && bug.active).length;
}

export function shouldAttemptCoinBugSpawn(input: CoinBugSpawnGateInput): boolean {
  return input.spawnAccumulatorMs >= input.nextSpawnDelayMs
    && input.activeCoinBugCount < input.maxActiveCoinBugs
    && !input.isModalOpen
    && !input.isDraggingMonster;
}

export function getNextCoinBugSpawnState(
  didSpawn: boolean,
  nextSpawnDelayMs: number,
  failedSpawnRetryMs: number,
): CoinBugSpawnStateResult {
  return {
    spawnAccumulatorMs: 0,
    nextSpawnDelayMs: didSpawn ? nextSpawnDelayMs : failedSpawnRetryMs,
  };
}

export function getCoinBugRewardBase(
  totalIncomePerSecond: number,
  minReward: number,
  rewardSeconds: number,
): number {
  return Math.max(minReward, totalIncomePerSecond * rewardSeconds);
}

export function getCoinBugRewardAmount(baseReward: number, coinBugValueLevel: number): number {
  return getProgressionCoinBugReward(baseReward, coinBugValueLevel);
}

export function getCoinBugPickupRadius(
  layoutMode: 'mobile' | 'desktop',
  desktopRadius: number,
  mobileRadius: number,
): number {
  return layoutMode === 'mobile' ? mobileRadius : desktopRadius;
}

export function getCoinBugSpawnBounds(layout: CoinBugSpawnLayout, worldWidth: number): CoinBugSpawnBounds {
  const margin = layout.isNarrow ? 28 : 34;

  return {
    margin,
    minY: Math.max(layout.statsY + layout.statsHeight + 18, layout.gridStartY - 42, 96),
    maxY: layout.hatchY - 34,
    minX: margin,
    maxX: Math.max(margin, worldWidth - margin),
  };
}

export function isPointInsideRectWithPadding(
  point: PlainPoint,
  rect: PlainRect,
  padding: number,
): boolean {
  return point.x >= rect.x - padding
    && point.x <= rect.x + rect.width + padding
    && point.y >= rect.y - padding
    && point.y <= rect.y + rect.height + padding;
}

export function getPointDistance(a: PlainPoint, b: PlainPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function isCoinBugSpawnPointSafe(input: CoinBugSpawnSafetyInput): boolean {
  const padding = Math.ceil(input.hitboxSize / 2);
  const criticalRects = getCoinBugCriticalRects(input.layout, input.worldWidth);

  if (criticalRects.some((rect) => isPointInsideRectWithPadding(input.point, rect, padding))) {
    return false;
  }

  const slotBuffer = Math.max(52, input.cellSize * 0.84);

  if (input.slotCenters.some((center) => center.x > 0 && getPointDistance(input.point, center) < slotBuffer)) {
    return false;
  }

  return input.existingBugPositions.every((bugPosition) => (
    getPointDistance(input.point, bugPosition) >= input.minDistanceFromOtherBugs
  ));
}

export function chooseCoinBugSpawnPosition(input: ChooseCoinBugSpawnPositionInput): PlainPoint | null {
  const bounds = getCoinBugSpawnBounds(input.layout, input.worldWidth);

  if (bounds.maxY <= bounds.minY) {
    return null;
  }

  for (let attempt = 0; attempt < input.maxAttempts; attempt += 1) {
    const point = {
      x: input.randomInteger(bounds.minX, bounds.maxX),
      y: input.randomInteger(bounds.minY, bounds.maxY),
    };

    if (isCoinBugSpawnPointSafe({ ...input, point })) {
      return point;
    }
  }

  return null;
}

export function updateCoinBugLifetime(lifetimeMs: number, deltaMs: number): number {
  return lifetimeMs - deltaMs;
}

export function shouldExpireCoinBug(lifetimeMs: number): boolean {
  return lifetimeMs <= 0;
}

function getCoinBugCriticalRects(layout: CoinBugSpawnLayout, worldWidth: number): PlainRect[] {
  return [
    { x: layout.hudX, y: layout.hudY, width: layout.hudWidth, height: layout.hudHeight },
    { x: layout.statsX, y: layout.statsY, width: layout.statsWidth, height: layout.statsHeight },
    { x: layout.questWidgetX, y: layout.questWidgetY, width: layout.questWidgetWidth, height: layout.questWidgetHeight },
    { x: layout.tapFarmX, y: layout.tapFarmY, width: layout.tapFarmWidth, height: layout.tapFarmHeight },
    { x: layout.hatchX, y: layout.hatchY, width: layout.hatchWidth, height: layout.hatchHeight },
    { x: layout.menuX - 82, y: layout.menuY - 6, width: 92, height: 42 },
    { x: worldWidth / 2 - 120, y: layout.expansionLabelY - 18, width: 240, height: 36 },
  ];
}

function getRandomInteger(min: number, max: number, randomFloat: number): number {
  const safeMin = Math.ceil(Math.min(min, max));
  const safeMax = Math.floor(Math.max(min, max));
  const safeRandomFloat = Math.min(Math.max(randomFloat, 0), 1);

  return Math.min(safeMax, Math.floor(safeRandomFloat * (safeMax - safeMin + 1)) + safeMin);
}
