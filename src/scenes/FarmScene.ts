import Phaser from 'phaser';
import { MonsterRenderer, type MonsterVisual } from '../rendering/MonsterRenderer';
import { GameplayActionBarView, type GameplayActionBarAction } from '../ui/GameplayActionBarView';
import { HatchPanelView } from '../ui/HatchPanelView';
import { HudView } from '../ui/HudView';
import { NavigationControlView } from '../ui/NavigationControlView';
import { NavigationMenuPanelView, type NavigationMenuPanelItem } from '../ui/NavigationMenuPanelView';
import { OrderWidgetView } from '../ui/OrderWidgetView';
import {
  addPanelBackground,
  getInsetPanelSize,
  getPanelSize,
  getPanelTitleFontSize,
} from '../ui/PanelChrome';
import {
  addCloseButton,
  addPaginationControls as addPanelPaginationControls,
} from '../ui/PanelControls';
import { TapFarmView } from '../ui/TapFarmView';
import { ToastView, type ToastVariant } from '../ui/ToastView';
import { EXPANSION_UNLOCK_COST, STARTING_EGG_COST } from '../data/economy';
import {
  BOSS_BATTLE_DEFINITIONS,
  type BossBattleBossId,
  type BossBattleDefinition,
  type BossBattleReward,
  type BossBattleStage,
  type BossVisualTheme,
  type ElementFragmentReward,
} from '../data/bossBattles';
import {
  addElementFragments,
  createInitialElementFragments,
  ELEMENT_TYPES,
  type ElementFragmentInventory,
} from '../data/elements';
import { MISSION_DEFINITIONS, type MissionDefinition, type MissionId, type MissionReward } from '../data/missions';
import { ORDER_DEFINITIONS, type OrderDefinition, type OrderId, type OrderReward } from '../data/orders';
import {
  canMergeSlots as canMergeFarmSlots,
  canMoveSlots as canMoveFarmSlots,
  clearSlotMonster,
  createInitialFarmSlots as createInitialFarmSlotState,
  findFirstEmptyUnlockedSlot,
  getUnlockedFarmSlots as getUnlockedFarmSlotState,
  isFarmFull as isFarmSlotStateFull,
  isSlotUnlocked as isFarmSlotUnlocked,
  moveSlotMonster as moveFarmSlotMonster,
  setSlotMonster,
} from '../state/farmSlotState';
import { chooseCoinBugSpawnPosition, COIN_BUG_FAILED_SPAWN_RETRY_MS, COIN_BUG_HITBOX_SIZE, COIN_BUG_MAX_ACTIVE, COIN_BUG_MAX_LIFETIME_MS, COIN_BUG_MIN_DISTANCE_FROM_OTHER_BUGS, COIN_BUG_MIN_LIFETIME_MS, COIN_BUG_MIN_REWARD, COIN_BUG_PICKUP_RADIUS_DESKTOP, COIN_BUG_PICKUP_RADIUS_MOBILE, COIN_BUG_REWARD_SECONDS, COIN_BUG_SPAWN_ATTEMPTS, COIN_BUG_SPAWN_MAX_MS, COIN_BUG_SPAWN_MIN_MS, getActiveCoinBugCount as getActiveCoinBugStateCount, getCoinBugPickupRadius as getCoinBugPickupRadiusFromState, getCoinBugRewardAmount, getCoinBugRewardBase, getNextCoinBugSpawnState, getPointDistance, getRandomDelayMs, getRandomLifetimeMs, shouldAttemptCoinBugSpawn, shouldExpireCoinBug, updateCoinBugLifetime } from '../state/coinBugState';
import {
  clampCompendiumFamilyPageIndex,
  discoverMonster as discoverMonsterInState,
  getCompendiumFamilyItems,
  getCompendiumFamilyMonsters,
  getCompendiumFamilyPageCount,
  getCompendiumFamilyPageItems,
  getFamilyProgress,
  hasDiscoveredFamily,
  isMonsterDiscovered as isMonsterDiscoveredInState,
  type CompendiumFamilyItem,
  type DiscoveryKey,
} from '../state/discoveryState';
import { applyHatchBlessingToMonsterDefinition, canAffordHatch as canAffordHatchInState, getAppliedAwayHatchCooldown, getCappedHatchCooldown, getHatchAttemptState, getHatchBlessingTierBonus, getHatchCooldownDurationForState, getHatchCost, getNextHatchCostAfterSuccess, getUpdatedHatchCooldown, isHatchReady as isHatchReadyInState } from '../state/hatchState';
import {
  getHatchPoolEntries,
  getRareHatchWeightMultiplier,
  getWeightedHatchFamily,
  type HatchPoolEntryState,
} from '../state/hatchPoolState';
import { getActiveTapFarmCombo as getActiveTapFarmComboFromState, getBaseTapFarmReward, getClampedTapFarmEnergy, getTapFarmComboMultiplier as getTapFarmComboMultiplierFromState, getTapFarmComboTimeoutResult, getTapFarmEnergyRatio as getTapFarmEnergyRatioFromState, getTapFarmRewardAmount, getTapFarmTapResult, resetTapFarmEnergy, TAP_FARM_BURST_THRESHOLD, TAP_FARM_COMBO_MAX_MULTIPLIER, TAP_FARM_COMBO_TIMEOUT_MS, TAP_FARM_COOLDOWN_MS, TAP_FARM_DEFAULT_CONFIG, TAP_FARM_MIN_REWARD, TAP_FARM_REWARD_SECONDS } from '../state/tapFarmState';
import {
  canIncrementMission,
  createInitialMissionProgress as createInitialMissionProgressState,
  getIncrementedMissionProgress,
  getMissionClaimStatus,
  getMissionDefinition as getMissionDefinitionFromState,
  getMissionProgress as getMissionProgressFromState,
  getSanitizedMissionProgress as getSanitizedMissionProgressFromState,
} from '../state/missionState';
import {
  canClaimOrder,
  getOrderDefinition as getOrderDefinitionFromState,
  getOrderStatus,
  getRecommendedOrder as getRecommendedOrderFromState,
  isOrderComplete as isOrderCompleteState,
  isOrderUnlocked as isOrderUnlockedState,
} from '../state/orderState';
import {
  applyBossTurn,
  applyPlayerSkill,
  canUseBattleSkill,
  clampBossStageIndex,
  createBattleSession,
  getActiveBattleMonster,
  getAutoBattleTeam,
  getAvailableSkillsForMonster,
  getBossReplayReward,
  getDefaultBossStageIndexForBoss,
  isBossStageCleared,
  reviveBattleSession,
  type BattleMonsterSnapshot,
  type BattleSessionState,
  type BattleSkillDefinition,
  type BattleSkillId,
} from '../state/bossBattleState';
import {
  applyUpgradePurchase,
  createInitialUpgradeLevels as createInitialUpgradeLevelState,
  getSanitizedUpgradeLevels as getSanitizedUpgradeLevelsFromState,
  getUpgradeCostForLevel as getUpgradeCostForLevelFromState,
  getUpgradeLevel as getUpgradeLevelFromState,
  getUpgradePurchasePreview as getUpgradePurchasePreviewFromState,
  isUpgradeMaxed,
  type UpgradeBuyMode,
  type UpgradePurchasePreview,
} from '../state/upgradeState';
import { canAffordEssencePower, canAffordRareHatch, canPerformRitual, canPerformSafeRitual, canSwitchToZone, createInitialUnlockedZones, getEssencePowerPurchaseResult, getFarmRitualPower, getRitualCompletionResult, getRitualIncomeMultiplier, getRitualRequirement, getRitualSacrificeCandidate, getSanitizedUnlockedZones, getZoneSelectionStatus, sanitizePrestigeInteger as sanitizePrestigeIntegerState, syncZoneUnlockFromPrestigeProgress as syncZoneUnlockFromPrestigeProgressState, type RitualCompletionResult } from '../state/prestigeZoneState';
import {
  createLoadedSetsFromSave,
  createLocalSaveData,
} from '../state/saveState';
import {
  BABY_SLIME,
  getMonsterDefinition,
  getNextMonsterDefinition,
  MONSTER_DEFINITIONS,
  MONSTER_FAMILY_DEFINITIONS,
} from '../data/monsters';
import {
  UPGRADE_DEFINITIONS,
  type UpgradeDefinition,
  type UpgradeId,
} from '../data/upgrades';
import {
  GRASS_FARM_ZONE_ID,
  MUSHROOM_FOREST_ZONE_ID,
  SPORE_GROVE_ZONE_ID,
  CACTUS_DESERT_ZONE_ID,
  CELL_MARSH_ZONE_ID,
  BLOOM_GARDEN_ZONE_ID,
  ZONE_DEFINITIONS,
  ZONE_IDS,
  type ZoneDefinition,
  type ZoneId,
} from '../data/zones';
import {
  clearSaveData,
  loadSaveData,
  sanitizeSavedCoins,
  SAVE_VERSION,
  writeSaveData,
} from '../systems/saveSystem';
import {
  calculateOfflineCoins,
  getEffectiveMonsterIncome,
  getFamilyIncomeMultiplier,
  getOfflineCapSeconds,
  getOrderCoinReward,
  getSporeIncomeMultiplier,
  getTotalIncomePerSecond,
  HATCH_COOLDOWN_MS,
  sanitizeEggCost,
} from '../systems/progressionSystem';
import { getMonsterMergeResult } from '../systems/monsterMergeSystem';
import { audioSystem } from '../systems/audioSystem';
import { getText, type LanguageCode } from '../i18n/translations';
import { loadSettings, writeSettings, type GameSettings } from '../systems/settingsSystem';
import { showRewardedAd } from '../services/rewardedAdService';
import type {
  CurrencyState,
  FarmSlotState,
  MonsterDefinition,
  MonsterFamily,
  MonsterInstance,
  OnboardingHintId,
} from '../types/game-state';

const GRID_COLUMNS = 3;
const GRID_ROWS = 3;
const CELL_SIZE = 72;
const GRID_GAP = 10;
const EXPANSION_COLUMNS = 3;
const EXPANSION_ROWS = 1;
const MAIN_SLOT_COUNT = GRID_COLUMNS * GRID_ROWS;
const EXPANSION_SLOT_COUNT = EXPANSION_COLUMNS * EXPANSION_ROWS;
const TOTAL_SLOT_COUNT = MAIN_SLOT_COUNT + EXPANSION_SLOT_COUNT;
const MILLISECONDS_PER_SECOND = 1000;
const SAVE_THROTTLE_MS = 5000;
const STARTING_COINS = STARTING_EGG_COST;
const ESSENCE_POWER_COST = 1;
const RARE_HATCH_COST = 1;
const HATCH_POOL_HOLD_MS = 800;
const HATCH_POOL_HINT_HATCH_COUNT = 3;
const SHOW_DEBUG_PANEL = false;
const SHOW_MONSTER_HITBOX_DEBUG = false;
const MODAL_OVERLAY_DEPTH = 18;
const BOSS_SELECT_PAGE_SIZE = 4;
const BOSS_STAGE_PAGE_SIZE = 5;
const BOSS_DAILY_CLEAR_LIMIT = 2;
const COMPENDIUM_FAMILIES_PER_PAGE = 9;
const COMPENDIUM_MONSTERS_PER_PAGE = 15;
const UI_FONT_FAMILY = 'Arial, Tahoma, "Noto Sans Thai", sans-serif';
const MONO_FONT_FAMILY = 'Consolas, monospace';
const THEME = {
  sky: 0x9bd7f2,
  grass: 0x6fbd64,
  grassDark: 0x4f944b,
  grassPatch: 0x86cf72,
  dirt: 0x9b7446,
  dirtDark: 0x6d5232,
  panel: 0x173c27,
  panelAlt: 0x1f4b33,
  panelBorder: 0xf4e6a6,
  button: 0x2f6b45,
  buttonHover: 0x3c8156,
  buttonWarm: 0x7b5628,
  buttonWarmHover: 0x9a6a22,
  buttonRitual: 0x6740a6,
  buttonRitualHover: 0x7e5ed0,
  danger: 0x8f3044,
  success: 0x3f8c43,
  warning: 0x9a6a22,
  slot: 0xa4dc72,
  slotInner: 0xbee98f,
  slotBorder: 0x3f8c43,
  locked: 0x37483f,
  lockedInner: 0x45584d,
  lockedBorder: 0x8b978c,
  shadow: 0x14351f,
  text: '#f7ffe8',
  mutedText: '#d8e8d0',
  goldText: '#fff0a8',
};

type MonsterDragZone = Phaser.GameObjects.Zone;
type UiLayoutMode = 'mobile' | 'desktop';
type ModalKind = 'compendium' | 'upgrade-shop' | 'goals' | 'orders' | 'battle' | 'default';
type BossBattlePlayerVisualEffect = {
  kind: 'damage' | 'support';
  amount: number;
  skillId: BattleSkillId;
};
type BossBattleBossVisualEffect = {
  damage: number;
  targetId?: string;
  visualTheme: BossVisualTheme;
};
type BossBattleRewardX2Source = 'first-clear' | 'auto-clear';
type BossBattleCoinReward = Extract<BossBattleReward, { type: 'coins' }>;
type BossBattleRewardX2Opportunity = {
  id: number;
  source: BossBattleRewardX2Source;
  stageId: string;
  reward: BossBattleCoinReward;
  consumed: boolean;
  adInProgress: boolean;
};
type BossBattlePanelRefreshOptions = {
  preserveBattleAnimation?: boolean;
};
type CoinBug = {
  id: number;
  container: Phaser.GameObjects.Container;
  lifetimeMs: number;
  collected: boolean;
  bobTween?: Phaser.Tweens.Tween;
  sparkleTween?: Phaser.Tweens.Tween;
  ringTween?: Phaser.Tweens.Tween;
};
type MonsterRemoveDropZone = {
  background: Phaser.GameObjects.Rectangle;
  bounds: Phaser.Geom.Rectangle;
  container: Phaser.GameObjects.Container;
  helperText: Phaser.GameObjects.Text;
  isHot: boolean;
  pulseTween?: Phaser.Tweens.Tween;
  titleText: Phaser.GameObjects.Text;
};
type TapFarmReactionTier = {
  fillColor: number;
  ringColor: number;
  glowColor: number;
  accentColor: number;
  textStroke: string;
  numberColor: string;
  multiplierColor: string;
  labelColor: string;
  radius: number;
  ringWidth: number;
  sparkleCount: number;
  flareCount: number;
};
type FarmSceneLayout = {
  isNarrow: boolean;
  margin: number;
  cellSize: number;
  gridGap: number;
  gridStartX: number;
  gridStartY: number;
  hudX: number;
  hudY: number;
  hudWidth: number;
  hudHeight: number;
  statsX: number;
  statsY: number;
  statsWidth: number;
  statsHeight: number;
  orderWidgetX: number;
  orderWidgetY: number;
  orderWidgetWidth: number;
  orderWidgetHeight: number;
  menuX: number;
  menuY: number;
  menuGap: number;
  menuFontSize: string;
  bottomSafePadding: number;
  expansionLabelY: number;
  expansionStartX: number;
  expansionStartY: number;
  tapFarmX: number;
  tapFarmY: number;
  tapFarmWidth: number;
  tapFarmHeight: number;
  actionBarX: number;
  actionBarY: number;
  actionBarWidth: number;
  actionBarHeight: number;
  actionBarButtonGap: number;
  hatchX: number;
  hatchY: number;
  hatchWidth: number;
  hatchHeight: number;
};
type ZoneBackgroundTheme = {
  skyColor: number;
  groundColor: number;
  groundPatchColor: number;
  lowerGroundColor: number;
  lowerGroundDarkColor: number;
  motif: 'grass' | 'mushroom' | 'spore' | 'desert' | 'marsh' | 'garden';
};

export class FarmScene extends Phaser.Scene {
  private readonly gameplayActionBarView: GameplayActionBarView;
  private readonly hatchPanelView: HatchPanelView;
  private readonly hudView: HudView;
  private readonly monsterRenderer: MonsterRenderer;
  private readonly navigationControlView: NavigationControlView;
  private readonly navigationMenuPanelView: NavigationMenuPanelView;
  private readonly orderWidgetView: OrderWidgetView;
  private readonly tapFarmView: TapFarmView;
  private readonly toastView: ToastView;
  private currency: CurrencyState = {
    coins: STARTING_COINS,
  };

  private backgroundContainer?: Phaser.GameObjects.Container;
  private farmGridContainer?: Phaser.GameObjects.Container;
  private expansionContainer?: Phaser.GameObjects.Container;
  private tapFarmReactionContainer?: Phaser.GameObjects.Container;
  private tapFarmReactionTween?: Phaser.Tweens.Tween;
  private tapFarmReactionHideTween?: Phaser.Tweens.Tween;
  private tapFarmReactionHideEvent?: Phaser.Time.TimerEvent;
  private tapFarmReactionEffects: Phaser.GameObjects.GameObject[] = [];
  private activeCoinBugs: CoinBug[] = [];
  private farmSlots: FarmSlotState[] = [];
  private slotCenters: Phaser.Math.Vector2[] = [];
  private monsterVisuals: Array<MonsterVisual | null> = [];
  private monsterDragZones: Array<MonsterDragZone | null> = [];
  private hatchCooldownMs = HATCH_COOLDOWN_MS;
  private cellSize = CELL_SIZE;
  private gridGap = GRID_GAP;
  private currentEggCost = STARTING_EGG_COST;
  private monsterEssence = 0;
  // Legacy save field name; this now represents the visible Hatch Blessing level.
  private essencePowerLevel = 0;
  private rareHatchLevel = 0;
  private totalRitualsPerformed = 0;
  private expansionUnlocked = false;
  private nextMonsterId = 1;
  private incomeAccumulatorMs = 0;
  private saveThrottleAccumulatorMs = 0;
  private hasUnsavedProgress = false;
  private skipSavingUntilProgress = false;
  private discoveredMonsters = new Set<DiscoveryKey>();
  private onboardingHintsSeen = new Set<OnboardingHintId>();
  private compendiumPanel?: Phaser.GameObjects.Container;
  private settingsPanel?: Phaser.GameObjects.Container;
  private helpPanel?: Phaser.GameObjects.Container;
  private patchNotesPanel?: Phaser.GameObjects.Container;
  private zonePanel?: Phaser.GameObjects.Container;
  private missionsPanel?: Phaser.GameObjects.Container;
  private ordersPanel?: Phaser.GameObjects.Container;
  private bossBattlePanel?: Phaser.GameObjects.Container;
  private upgradeShopPanel?: Phaser.GameObjects.Container;
  private prestigePanel?: Phaser.GameObjects.Container;
  private hatchPoolPanel?: Phaser.GameObjects.Container;
  private modalOverlay?: Phaser.GameObjects.Rectangle;
  private economyDebugPanel?: Phaser.GameObjects.Container;
  private economyDebugText?: Phaser.GameObjects.Text;
  private activeDragSlotId: number | null = null;
  private activeDragVisual?: MonsterVisual;
  private activeDragPointerId: number | null = null;
  private monsterRemoveDropZone?: MonsterRemoveDropZone;
  private upgradeLevels: Record<UpgradeId, number> = this.createInitialUpgradeLevels();
  private missionProgress: Record<MissionId, number> = this.createInitialMissionProgress();
  private completedMissionIds = new Set<MissionId>();
  private claimedMissionIds = new Set<MissionId>();
  private claimedOrderIds = new Set<OrderId>();
  private claimedBossBattleStageIds = new Set<string>();
  private elementFragments: ElementFragmentInventory = createInitialElementFragments();
  private bossDailyClearCounts: Record<string, number> = {};
  private bossDailyClearLastResetDay = '';
  private unlockedZones = createInitialUnlockedZones(GRASS_FARM_ZONE_ID);
  private currentZone: ZoneId = GRASS_FARM_ZONE_ID;
  private hasPrestigedOnce = false;
  private settings: GameSettings = loadSettings();
  private resetConfirmationArmed = false;
  private prestigeConfirmationArmed = false;
  private safeRitualInProgress = false;
  private selectedCompendiumFamily?: MonsterFamily;
  private compendiumFamilyHomePageIndex = 0;
  private compendiumFamilyPageIndex = 0;
  private upgradeShopPageIndex = 0;
  private missionsPageIndex = 0;
  private ordersPageIndex = 0;
  private bossBattleBossPageIndex = 0;
  private bossBattleStagePageIndex = 0;
  private selectedBossBattleBossId?: BossBattleBossId;
  private bossBattleStageIndex = 0;
  private bossBattleSession?: BattleSessionState;
  private bossBattleStatusText = '';
  private bossBattleLogText = '';
  private bossBattleTargetMonsterId?: string;
  private bossBattleTurnBanner = '';
  private bossBattlePlayerVisualEffect?: BossBattlePlayerVisualEffect;
  private bossBattleBossVisualEffect?: BossBattleBossVisualEffect;
  private bossBattleRewardX2Opportunity?: BossBattleRewardX2Opportunity;
  private nextBossBattleRewardX2OpportunityId = 1;
  private battleAnimationEvents: Phaser.Time.TimerEvent[] = [];
  private battleAnimationInProgress = false;
  private upgradeBuyMode: UpgradeBuyMode = 'x1';
  private lastBlockedOutsideTapToastAt = 0;
  private lastHiddenAt: number | null = null;
  private nextCoinBugId = 1;
  private coinBugSpawnAccumulatorMs = 0;
  private nextCoinBugSpawnMs = 0;
  private tapFarmEnergy = 0;
  private lastTapFarmAt = -TAP_FARM_COOLDOWN_MS;
  private tapFarmCombo = 0;
  private lastTapFarmComboAt = -TAP_FARM_COMBO_TIMEOUT_MS;
  private hatchPoolHoldTimer?: Phaser.Time.TimerEvent;
  private hatchPoolHoldPointerId: number | null = null;
  private hatchPoolHoldTriggered = false;
  private successfulHatchesThisSession = 0;
  private hatchPoolHintShownThisSession = false;

  private readonly handlePageHide = (): void => {
    this.cancelHatchPoolHold();
    this.saveProgress();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.cancelHatchPoolHold();
      this.lastHiddenAt = Date.now();
      this.saveProgress();
      return;
    }

    if (document.visibilityState === 'visible') {
      this.applyResumeProgress();
    }
  };

  private readonly handleWindowBlur = (): void => {
    this.cancelHatchPoolHold();
  };

  private readonly handleManualDragPointerMove = (pointer: Phaser.Input.Pointer): void => {
    this.updateManualMonsterDrag(pointer);
  };

  private readonly handleManualDragPointerUp = (pointer: Phaser.Input.Pointer): void => {
    this.finishManualMonsterDrag(pointer);
  };

  private readonly handleCoinBugProximityPointerDown = (pointer: Phaser.Input.Pointer): void => {
    this.tryCollectNearbyCoinBug(pointer);
  };

  private readonly handleScaleResize = (): void => {
    this.rebuildResponsiveFarmView();
  };

  constructor() {
    super('FarmScene');
    this.gameplayActionBarView = new GameplayActionBarView(this, {
      fontFamily: UI_FONT_FAMILY,
      getLayout: () => this.getLayout(),
      isModalOpen: () => this.isModalOpen(),
      onAction: (action) => this.handleGameplayActionBarAction(action),
      onButtonClickSound: () => this.playButtonClickSound(),
      onHoverBlocked: () => this.resetFarmControlHoverState(),
      t: (key, params) => this.t(key, params),
      theme: THEME,
    });
    this.hatchPanelView = new HatchPanelView(this, {
      fontFamily: UI_FONT_FAMILY,
      formatCoinAmount: (amount) => this.formatCoinAmount(amount),
      getLayout: () => this.getLayout(),
      isModalOpen: () => this.isModalOpen(),
      onHoverBlocked: () => this.resetFarmControlHoverState(),
      onPressCancel: (pointer) => this.cancelHatchPoolHold(pointer),
      onPressEnd: (pointer) => this.finishHatchPanelPress(pointer),
      onPressStart: (pointer) => this.startHatchPanelPress(pointer),
      t: (key, params) => this.t(key, params),
      theme: THEME,
    });
    this.hudView = new HudView(this, {
      fontFamily: UI_FONT_FAMILY,
      formatCoinAmount: (amount) => this.formatCoinAmount(amount),
      formatDuration: (seconds) => this.formatDuration(seconds),
      getEffectiveEggCost: () => this.getEffectiveEggCost(),
      getLayout: () => this.getLayout(),
      getOfflineCapSeconds: () => this.getOfflineCapSeconds(),
      getTotalIncomePerSecond: () => this.getTotalIncomePerSecond(),
      t: (key, params) => this.t(key, params),
      theme: THEME,
    });
    this.monsterRenderer = new MonsterRenderer(this, UI_FONT_FAMILY, SHOW_DEBUG_PANEL);
    this.navigationControlView = new NavigationControlView(this, {
      fontFamily: UI_FONT_FAMILY,
      getLayout: () => this.getLayout(),
      isModalOpen: () => this.isModalOpen(),
      onButtonClickSound: () => this.playButtonClickSound(),
      onDebugClick: () => this.toggleEconomyDebugPanel(),
      onHoverBlocked: () => this.resetFarmControlHoverState(),
      onMenuClick: () => this.toggleNavigationMenuPanel(),
      t: (key, params) => this.t(key, params),
      theme: THEME,
    });
    this.navigationMenuPanelView = new NavigationMenuPanelView(this, {
      fontFamily: UI_FONT_FAMILY,
      getLayout: () => this.getLayout(),
      onButtonClickSound: () => this.playButtonClickSound(),
      onClose: () => this.closeNavigationMenuPanel(),
      t: (key, params) => this.t(key, params),
      theme: THEME,
    });
    this.orderWidgetView = new OrderWidgetView(this, {
      fontFamily: UI_FONT_FAMILY,
      getLayout: () => this.getLayout(),
      getOrderRequirementText: (order) => this.getOrderRequirementText(order),
      getOrderRewardText: (reward) => this.getOrderRewardText(reward),
      getOrderWidgetStatusText: (order) => this.getOrderWidgetStatusText(order),
      getRecommendedOrder: () => this.getRecommendedOrder(),
      isModalOpen: () => this.isModalOpen(),
      isOrderClaimed: (orderId) => this.claimedOrderIds.has(orderId),
      isOrderComplete: (order) => this.isOrderComplete(order),
      onButtonClickSound: () => this.playButtonClickSound(),
      onClaimOrder: (orderId) => this.claimOrderReward(orderId),
      onOpenOrdersPanel: () => this.openOrdersPanel(),
      t: (key, params) => this.t(key, params),
      theme: THEME,
    });
    this.tapFarmView = new TapFarmView(this, {
      fontFamily: UI_FONT_FAMILY,
      getLayout: () => this.getLayout(),
      getTapFarmEnergyRatio: () => this.getTapFarmEnergyRatio(),
      getTapFarmStatusText: () => this.getTapFarmStatusText(),
      isDraggingMonster: () => this.activeDragSlotId !== null,
      isModalOpen: () => this.isModalOpen(),
      onHoverBlocked: () => this.resetFarmControlHoverState(),
      onTapFarmClick: (pointer) => this.handleTapFarm(pointer),
      t: (key, params) => this.t(key, params),
      theme: THEME,
    });
    this.toastView = new ToastView(this, {
      fontFamily: UI_FONT_FAMILY,
      getLayout: () => this.getLayout(),
      theme: THEME,
    });
  }

  create(): void {
    this.currency = {
      coins: STARTING_COINS,
    };
    this.nextMonsterId = 1;
    this.incomeAccumulatorMs = 0;
    this.hatchCooldownMs = HATCH_COOLDOWN_MS;
    this.saveThrottleAccumulatorMs = 0;
    this.hasUnsavedProgress = false;
    this.skipSavingUntilProgress = false;
    this.discoveredMonsters = new Set<DiscoveryKey>();
    this.onboardingHintsSeen = new Set<OnboardingHintId>();
    this.compendiumPanel = undefined;
    this.settingsPanel = undefined;
    this.helpPanel = undefined;
    this.patchNotesPanel = undefined;
    this.zonePanel = undefined;
    this.missionsPanel = undefined;
    this.ordersPanel = undefined;
    this.bossBattlePanel = undefined;
    this.upgradeShopPanel = undefined;
    this.prestigePanel = undefined;
    this.hatchPoolPanel = undefined;
    this.navigationMenuPanelView.destroy();
    this.modalOverlay = undefined;
    this.economyDebugPanel = undefined;
    this.economyDebugText = undefined;
    this.activeDragSlotId = null;
    this.activeDragVisual = undefined;
    this.activeDragPointerId = null;
    this.hideMonsterRemoveZone();
    this.upgradeLevels = this.createInitialUpgradeLevels();
    this.missionProgress = this.createInitialMissionProgress();
    this.completedMissionIds = new Set<MissionId>();
    this.claimedMissionIds = new Set<MissionId>();
    this.claimedOrderIds = new Set<OrderId>();
    this.unlockedZones = createInitialUnlockedZones(GRASS_FARM_ZONE_ID);
    this.currentZone = GRASS_FARM_ZONE_ID;
    this.hasPrestigedOnce = false;
    this.settings = loadSettings();
    this.syncAudioSettings();
    this.resetConfirmationArmed = false;
    this.prestigeConfirmationArmed = false;
    this.safeRitualInProgress = false;
    this.selectedCompendiumFamily = undefined;
    this.compendiumFamilyHomePageIndex = 0;
    this.compendiumFamilyPageIndex = 0;
    this.upgradeShopPageIndex = 0;
    this.missionsPageIndex = 0;
    this.ordersPageIndex = 0;
    this.clearBattleAnimationEvents();
    this.bossBattleRewardX2Opportunity = undefined;
    this.nextBossBattleRewardX2OpportunityId = 1;
    this.battleAnimationInProgress = false;
    this.upgradeBuyMode = 'x1';
    this.lastBlockedOutsideTapToastAt = 0;
    this.lastHiddenAt = null;
    this.nextCoinBugId = 1;
    this.coinBugSpawnAccumulatorMs = 0;
    this.nextCoinBugSpawnMs = this.getNextCoinBugSpawnDelayMs();
    this.tapFarmEnergy = 0;
    this.lastTapFarmAt = -TAP_FARM_COOLDOWN_MS;
    this.tapFarmCombo = 0;
    this.lastTapFarmComboAt = -TAP_FARM_COMBO_TIMEOUT_MS;
    this.cancelHatchPoolHold();
    this.successfulHatchesThisSession = 0;
    this.hatchPoolHintShownThisSession = false;
    this.monsterRenderer.validateMonsterVisualIdentities();
    this.clearCoinBugs();
    this.hatchCooldownMs = HATCH_COOLDOWN_MS;
    this.hatchPanelView.destroy();
    this.backgroundContainer = undefined;
    this.farmGridContainer = undefined;
    this.hudView.destroy();
    this.orderWidgetView.destroy();
    this.expansionContainer = undefined;
    this.tapFarmView.destroy();
    this.gameplayActionBarView.destroy();
    this.clearTapFarmReactionStack();
    this.navigationControlView.destroy();
    this.currentEggCost = STARTING_EGG_COST;
    this.monsterEssence = 0;
    this.essencePowerLevel = 0;
    this.rareHatchLevel = 0;
    this.totalRitualsPerformed = 0;
    this.expansionUnlocked = false;
    this.clearToast();
    this.farmSlots = this.createInitialFarmSlots();
    this.monsterVisuals = Array.from({ length: TOTAL_SLOT_COUNT }, () => null);
    this.monsterDragZones = Array.from({ length: TOTAL_SLOT_COUNT }, () => null);
    this.createFarmBackground();
    this.createFarmGrid();
    this.createExpansionPlaceholder();
    this.createHud();
    this.createOrderWidget();
    this.createHatchArea();
    this.createTapFarmArea();
    this.createGameplayActionBar();
    this.createNavigationControl();
    this.createEconomyDebugControl();
    this.registerKeyboardShortcuts();
    this.registerManualDragInput();
    this.registerCoinBugProximityPickupInput();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleScaleResize);
    this.loadProgress();
    this.registerPersistenceEvents();
    this.updateHud();
    this.scheduleInitialOnboardingHints();
  }

  update(_time: number, delta: number): void {
    this.updateHatchCooldown(delta);
    this.addPassiveIncome(delta);
    this.updateCoinBugs(delta);
    this.updateTapFarmComboTimeout();
    this.updateOnboardingHints();
    this.saveProgressWhenReady(delta);
    this.refreshEconomyDebugPanel();
  }

  private rebuildResponsiveFarmView(): void {
    if (this.isModalOpen() || this.activeDragSlotId !== null) {
      return;
    }

    this.cancelHatchPoolHold();
    this.monsterVisuals.forEach((visual) => {
      visual?.destroy();
    });
    this.monsterDragZones.forEach((zone) => {
      zone?.destroy();
    });
    this.clearCoinBugs();
    this.monsterVisuals = Array.from({ length: TOTAL_SLOT_COUNT }, () => null);
    this.monsterDragZones = Array.from({ length: TOTAL_SLOT_COUNT }, () => null);

    this.createFarmBackground();
    this.createFarmGrid();
    this.createExpansionPlaceholder();
    this.createHud();
    this.createOrderWidget();
    this.createHatchArea();
    this.createTapFarmArea();
    this.createGameplayActionBar();
    this.createNavigationControl();
    this.createEconomyDebugControl();

    this.farmSlots.forEach((slot) => {
      this.renderMonsterInSlot(slot);
    });
    this.updateHud();
  }

  private createFarmBackground(): void {
    const { width, height } = this.scale;
    const zoneTheme = this.getZoneBackgroundTheme(this.currentZone);

    this.backgroundContainer?.destroy();
    const backgroundContainer = this.add.container(0, 0).setDepth(-30);

    backgroundContainer.add(this.add.rectangle(0, 0, width, height, zoneTheme.groundColor).setOrigin(0));
    backgroundContainer.add(this.add.rectangle(0, 0, width, 92, zoneTheme.skyColor).setOrigin(0).setAlpha(0.9));
    backgroundContainer.add(this.add.rectangle(0, 92, width, 18, zoneTheme.groundPatchColor).setOrigin(0).setAlpha(0.7));
    backgroundContainer.add(this.add.rectangle(0, height - 96, width, 96, zoneTheme.lowerGroundColor).setOrigin(0).setAlpha(0.56));
    backgroundContainer.add(this.add.rectangle(0, height - 96, width, 8, zoneTheme.lowerGroundDarkColor).setOrigin(0).setAlpha(0.3));

    const graphics = this.add.graphics();

    for (let x = 24; x < width; x += 72) {
      const y = 116 + ((x / 24) % 5) * 34;
      graphics.fillStyle(zoneTheme.groundPatchColor, zoneTheme.motif === 'mushroom' ? 0.32 : 0.24);
      graphics.fillEllipse(x, y, 34, 10);
    }

    for (let x = 36; x < width; x += 92) {
      graphics.fillStyle(zoneTheme.lowerGroundDarkColor, 0.18);
      graphics.fillEllipse(x, height - 52 + (x % 3) * 5, 26, 8);
    }

    this.addZoneBackgroundMotifs(graphics, zoneTheme, width, height);

    backgroundContainer.add(graphics);
    this.backgroundContainer = backgroundContainer;
  }

  private getZoneBackgroundTheme(zoneId: ZoneId): ZoneBackgroundTheme {
    if (zoneId === MUSHROOM_FOREST_ZONE_ID) {
      return {
        skyColor: 0x637d68,
        groundColor: 0x355f3f,
        groundPatchColor: 0x4e7a4a,
        lowerGroundColor: 0x3b2f28,
        lowerGroundDarkColor: 0x231f1b,
        motif: 'mushroom',
      };
    }

    if (zoneId === SPORE_GROVE_ZONE_ID) {
      return {
        skyColor: 0x536b95,
        groundColor: 0x315568,
        groundPatchColor: 0x6aa77d,
        lowerGroundColor: 0x3f355f,
        lowerGroundDarkColor: 0x24213f,
        motif: 'spore',
      };
    }

    if (zoneId === CACTUS_DESERT_ZONE_ID) {
      return {
        skyColor: 0xdb8b54,
        groundColor: 0xc99a58,
        groundPatchColor: 0xe5bd73,
        lowerGroundColor: 0x9b6738,
        lowerGroundDarkColor: 0x6f472b,
        motif: 'desert',
      };
    }

    if (zoneId === CELL_MARSH_ZONE_ID) {
      return {
        skyColor: 0x5f93a6,
        groundColor: 0x2f6a64,
        groundPatchColor: 0x64b8a5,
        lowerGroundColor: 0x27555f,
        lowerGroundDarkColor: 0x173943,
        motif: 'marsh',
      };
    }

    if (zoneId === BLOOM_GARDEN_ZONE_ID) {
      return {
        skyColor: 0x8ccf9b,
        groundColor: 0x62a84e,
        groundPatchColor: 0xa7d86b,
        lowerGroundColor: 0x6b9f47,
        lowerGroundDarkColor: 0x3c6d36,
        motif: 'garden',
      };
    }

    return {
      skyColor: THEME.sky,
      groundColor: THEME.grass,
      groundPatchColor: THEME.grassPatch,
      lowerGroundColor: THEME.dirt,
      lowerGroundDarkColor: THEME.dirtDark,
      motif: 'grass',
    };
  }

  private addZoneBackgroundMotifs(
    graphics: Phaser.GameObjects.Graphics,
    zoneTheme: ZoneBackgroundTheme,
    width: number,
    height: number,
  ): void {
    if (zoneTheme.motif === 'mushroom') {
      for (let x = 30; x < width; x += 86) {
        const y = 118 + ((x / 43) % 4) * 42;
        graphics.fillStyle(0x5b3f74, 0.24);
        graphics.fillCircle(x, y, 18);
        graphics.fillStyle(0xe7dbc0, 0.68);
        graphics.fillRoundedRect(x - 5, y + 8, 10, 16, 4);
      }

      for (let x = 64; x < width; x += 120) {
        graphics.fillStyle(0x253f2f, 0.32);
        graphics.fillTriangle(x, 100, x - 34, 184, x + 34, 184);
      }
      return;
    }

    if (zoneTheme.motif === 'spore') {
      for (let x = 32; x < width; x += 58) {
        const y = 126 + ((x / 29) % 6) * 30;
        graphics.fillStyle(0xa7f0c4, 0.18);
        graphics.fillCircle(x, y, 10 + (x % 3) * 3);
        graphics.fillStyle(0x7f69c9, 0.2);
        graphics.fillCircle(x + 18, y + 16, 7);
      }
      return;
    }

    if (zoneTheme.motif === 'desert') {
      for (let x = 40; x < width; x += 104) {
        const y = height - 140 + (x % 4) * 6;
        graphics.fillStyle(0x6f7d3f, 0.34);
        graphics.fillRoundedRect(x, y - 42, 12, 54, 5);
        graphics.fillRoundedRect(x - 14, y - 24, 10, 28, 5);
        graphics.fillRoundedRect(x + 14, y - 30, 10, 32, 5);
        graphics.fillStyle(0x9b6738, 0.24);
        graphics.fillEllipse(x + 4, y + 18, 62, 12);
      }
      return;
    }

    if (zoneTheme.motif === 'marsh') {
      for (let x = 26; x < width; x += 70) {
        const y = 126 + ((x / 35) % 5) * 38;
        graphics.fillStyle(0x7bd4c3, 0.23);
        graphics.fillEllipse(x, y, 52, 18);
        graphics.fillStyle(0xbef5ee, 0.2);
        graphics.fillCircle(x + 16, y - 20, 8);
        graphics.fillCircle(x - 12, y - 12, 5);
      }
      return;
    }

    if (zoneTheme.motif === 'garden') {
      for (let x = 28; x < width; x += 64) {
        const y = 130 + ((x / 32) % 5) * 34;
        graphics.fillStyle(0x3f8c43, 0.28);
        graphics.fillEllipse(x, y + 10, 34, 12);
        graphics.fillStyle(0xf5d76e, 0.55);
        graphics.fillCircle(x, y, 6);
        graphics.fillStyle(0xf08bb0, 0.34);
        graphics.fillCircle(x - 8, y, 5);
        graphics.fillCircle(x + 8, y, 5);
        graphics.fillCircle(x, y - 8, 5);
      }
    }
  }

  private getLayout(): FarmSceneLayout {
    const width = this.scale.width;
    const height = this.scale.height;
    const isNarrow = width < 700;
    const margin = isNarrow ? 12 : 24;
    const gridGap = isNarrow && height < 680 ? 8 : GRID_GAP;
    const hudWidth = isNarrow ? 158 : 220;
    const hudHeight = isNarrow ? 54 : 64;
    const hudX = margin;
    const hudY = isNarrow ? 8 : 20;
    const statsWidth = hudWidth;
    const statsHeight = isNarrow ? 88 : 104;
    const statsX = margin;
    const statsY = isNarrow ? hudY + hudHeight + 6 : 94;
    const menuX = width - margin;
    const menuY = isNarrow ? 8 : 22;
    const menuGap = isNarrow ? 25 : 40;
    const menuButtonCount = SHOW_DEBUG_PANEL ? 2 : 1;
    const menuBottom = menuY + (menuButtonCount - 1) * menuGap + 30;
    const orderWidgetWidth = isNarrow
      ? Math.max(146, Math.min(168, width - hudWidth - margin * 3))
      : 236;
    const orderWidgetHeight = isNarrow ? 80 : 88;
    const orderWidgetX = width - margin - orderWidgetWidth;
    const orderWidgetY = isNarrow ? menuY + 38 : menuY + 44;
    const topContentBottom = isNarrow ? Math.max(statsY + statsHeight, menuBottom) : 126;
    const bottomSafePadding = isNarrow ? (height < 700 ? 14 : 18) : 18;
    const actionBarWidth = isNarrow ? Math.min(width - margin * 2, 366) : 420;
    const actionBarHeight = isNarrow ? (height < 680 ? 58 : 64) : 64;
    const actionBarButtonGap = isNarrow ? 6 : 8;
    const actionBarX = (width - actionBarWidth) / 2;
    const actionBarY = height - bottomSafePadding - actionBarHeight;
    const controlGap = isNarrow ? (height < 680 ? 6 : 8) : 10;
    const sharedControlHeight = isNarrow ? (height < 680 ? 72 : 80) : 0;
    const sharedControlWidth = Math.min(width - margin * 2, actionBarWidth);
    const sharedControlX = (width - sharedControlWidth) / 2;
    const sharedControlY = actionBarY - controlGap - sharedControlHeight;
    const mobileControlGap = height < 680 ? 6 : 8;
    const mobileHatchWidth = Math.floor((sharedControlWidth - mobileControlGap) * 0.6);
    const hatchWidth = isNarrow ? mobileHatchWidth : Math.min(260, width - margin * 2);
    const hatchHeight = isNarrow ? sharedControlHeight : 76;
    const hatchX = isNarrow ? sharedControlX : width - hatchWidth - margin;
    const hatchY = isNarrow ? sharedControlY : actionBarY - controlGap - hatchHeight;
    const tapFarmWidth = isNarrow ? sharedControlWidth - hatchWidth - mobileControlGap : hatchWidth;
    const tapFarmHeight = isNarrow ? sharedControlHeight : 46;
    const tapFarmX = isNarrow ? hatchX + hatchWidth + mobileControlGap : hatchX;
    const tapFarmY = isNarrow ? sharedControlY : hatchY - tapFarmHeight - controlGap;
    const gridTopGap = isNarrow ? (height < 680 ? 6 : 10) : 0;
    const gridToExpansionLabelGap = isNarrow ? (height < 680 ? 8 : 12) : 20;
    const expansionLabelToRowGap = isNarrow ? (height < 680 ? 18 : 24) : 34;
    const expansionToControlsGap = isNarrow ? (height < 680 ? 6 : 8) : 12;
    const minGridStartY = topContentBottom + gridTopGap;
    const widthLimitedCellSize = Math.floor((width - margin * 2 - (GRID_COLUMNS - 1) * gridGap) / GRID_COLUMNS);
    const availableStackHeight = Math.max(0, tapFarmY - minGridStartY);
    const heightLimitedCellSize = Math.floor(
      (
        availableStackHeight
        - (GRID_ROWS - 1) * gridGap
        - gridToExpansionLabelGap
        - expansionLabelToRowGap
        - expansionToControlsGap
      ) / (GRID_ROWS + EXPANSION_ROWS),
    );
    const mobileMinimumCellSize = height < 560 ? 48 : 52;
    const cellSize = Math.max(
      isNarrow ? mobileMinimumCellSize : 56,
      Math.min(CELL_SIZE, widthLimitedCellSize, isNarrow ? heightLimitedCellSize : CELL_SIZE),
    );
    const gridWidth = GRID_COLUMNS * cellSize + (GRID_COLUMNS - 1) * gridGap;
    const gridHeight = GRID_ROWS * cellSize + (GRID_ROWS - 1) * gridGap;
    const expansionHeight = gridToExpansionLabelGap + expansionLabelToRowGap + cellSize;
    const maxGridStartY = tapFarmY - gridHeight - expansionHeight - expansionToControlsGap;
    const gridStartY = isNarrow
      ? Math.max(minGridStartY, Math.min(minGridStartY, maxGridStartY))
      : 126;
    const expansionLabelY = gridStartY + gridHeight + gridToExpansionLabelGap;
    const expansionStartY = expansionLabelY + expansionLabelToRowGap;

    return {
      isNarrow,
      margin,
      cellSize,
      gridGap,
      gridStartX: (width - gridWidth) / 2,
      gridStartY,
      hudX,
      hudY,
      hudWidth,
      hudHeight,
      statsX,
      statsY,
      statsWidth,
      statsHeight,
      orderWidgetX,
      orderWidgetY,
      orderWidgetWidth,
      orderWidgetHeight,
      menuX,
      menuY,
      menuGap,
      menuFontSize: isNarrow ? '13px' : '15px',
      bottomSafePadding,
      expansionLabelY,
      expansionStartX: (width - gridWidth) / 2,
      expansionStartY,
      tapFarmX,
      tapFarmY,
      tapFarmWidth,
      tapFarmHeight,
      actionBarX,
      actionBarY,
      actionBarWidth,
      actionBarHeight,
      actionBarButtonGap,
      hatchX,
      hatchY,
      hatchWidth,
      hatchHeight,
    };
  }

  private createFarmGrid(): void {
    this.farmGridContainer?.destroy();

    const layout = this.getLayout();
    const startX = layout.gridStartX;
    const startY = layout.gridStartY;
    const farmGridContainer = this.add.container(0, 0);

    this.cellSize = layout.cellSize;
    this.gridGap = layout.gridGap;

    this.slotCenters = Array.from({ length: TOTAL_SLOT_COUNT }, () => new Phaser.Math.Vector2(-9999, -9999));

    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let column = 0; column < GRID_COLUMNS; column += 1) {
        const x = startX + column * (this.cellSize + this.gridGap);
        const y = startY + row * (this.cellSize + this.gridGap);

        const slotId = row * GRID_COLUMNS + column;
        this.addUnlockedSlotTile(farmGridContainer, x, y, slotId);
        this.slotCenters[slotId] = new Phaser.Math.Vector2(x + this.cellSize / 2, y + this.cellSize / 2);
      }
    }

    this.farmGridContainer = farmGridContainer;
  }

  private createExpansionPlaceholder(): void {
    this.expansionContainer?.destroy();

    const layout = this.getLayout();
    const startX = layout.expansionStartX;
    const labelY = layout.expansionLabelY;
    const startY = layout.expansionStartY;
    const expansionContainer = this.add.container(0, 0);

    if (this.expansionUnlocked) {
      expansionContainer.add(this.add.text(this.scale.width / 2, labelY, this.t('ui.expansion.slots'), {
        color: '#d9d6ec',
        fontFamily: UI_FONT_FAMILY,
        fontSize: layout.isNarrow ? '14px' : '16px',
        fontStyle: 'bold',
      }).setOrigin(0.5));
    } else {
      const unlockText = this.add.text(this.scale.width / 2, labelY, this.t('ui.expansion.unlock', {
        amount: this.formatCoinAmount(EXPANSION_UNLOCK_COST),
      }), {
        color: THEME.text,
        fontFamily: UI_FONT_FAMILY,
        fontSize: layout.isNarrow ? '13px' : '15px',
        fontStyle: 'bold',
        backgroundColor: `#${THEME.buttonWarm.toString(16).padStart(6, '0')}`,
        padding: {
          x: 10,
          y: 5,
        },
      }).setOrigin(0.5);

      unlockText
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          if (this.isModalOpen()) {
            return;
          }

          this.playButtonClickSound();
          this.tryUnlockExpansion();
        });

      expansionContainer.add(unlockText);
    }

    for (let row = 0; row < EXPANSION_ROWS; row += 1) {
      for (let column = 0; column < EXPANSION_COLUMNS; column += 1) {
        const x = startX + column * (this.cellSize + this.gridGap);
        const y = startY + row * (this.cellSize + this.gridGap);
        const slotId = MAIN_SLOT_COUNT + row * EXPANSION_COLUMNS + column;

        this.slotCenters[slotId] = new Phaser.Math.Vector2(x + this.cellSize / 2, y + this.cellSize / 2);

        if (this.expansionUnlocked) {
          this.addUnlockedSlotTile(expansionContainer, x, y, slotId, false);
          continue;
        }

        this.addLockedExpansionSlotTile(expansionContainer, x, y, layout.isNarrow);
      }
    }

    this.expansionContainer = expansionContainer;
  }

  private addUnlockedSlotTile(
    container: Phaser.GameObjects.Container | undefined,
    x: number,
    y: number,
    slotId: number,
    enableSlotClick = true,
  ): void {
    const shadow = this.add.rectangle(x + 4, y + 5, this.cellSize, this.cellSize, THEME.shadow, 0.24)
      .setOrigin(0);

    const slotTile = this.add.rectangle(x, y, this.cellSize, this.cellSize, THEME.slot)
      .setOrigin(0)
      .setStrokeStyle(3, THEME.slotBorder, 0.9);

    const inner = this.add.rectangle(x + 8, y + 8, this.cellSize - 16, this.cellSize - 16, THEME.slotInner, 0.22)
      .setOrigin(0);

    container?.add([shadow, slotTile, inner]);

    if (enableSlotClick) {
      slotTile
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          pointer.event?.stopPropagation();

          if (this.isModalOpen()) {
            return;
          }

          this.clearSelectedSlot();
        });
    }
  }

  private addLockedExpansionSlotTile(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    isNarrow: boolean,
  ): void {
    container.add(this.add.rectangle(x + 3, y + 4, this.cellSize, this.cellSize, THEME.shadow, 0.22)
      .setOrigin(0));

    const lockedTile = this.add.rectangle(x, y, this.cellSize, this.cellSize, THEME.locked, 0.72)
      .setOrigin(0)
      .setStrokeStyle(3, THEME.lockedBorder, 0.72);

    lockedTile
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.isModalOpen()) {
          return;
        }

        this.playButtonClickSound();
        this.tryUnlockExpansion();
      });

    container.add(lockedTile);

    container.add(this.add.rectangle(x + 8, y + 8, this.cellSize - 16, this.cellSize - 16, THEME.lockedInner, 0.22)
      .setOrigin(0));

    container.add(this.add.text(x + this.cellSize / 2, y + this.cellSize / 2 - 8, this.t('ui.expansion.lock'), {
      color: '#d1d9d2',
      fontFamily: UI_FONT_FAMILY,
      fontSize: isNarrow ? '12px' : '14px',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    container.add(this.add.text(x + this.cellSize / 2, y + this.cellSize / 2 + 13, this.formatCoinAmount(EXPANSION_UNLOCK_COST), {
      color: '#fff4a8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: '12px',
      fontStyle: 'bold',
    }).setOrigin(0.5));
  }

  private createHud(): void {
    this.hudView.create(this.currency.coins);
  }

  private createOrderWidget(): void {
    this.orderWidgetView.create();
  }

  private createHatchArea(): void {
    this.cancelHatchPoolHold();
    this.hatchPanelView.create();
    this.updateHatchCooldownUi();
  }

  private createTapFarmArea(): void {
    this.clearTapFarmReactionStack();
    this.tapFarmView.create();
    this.updateTapFarmUi();
  }

  private createGameplayActionBar(): void {
    this.gameplayActionBarView.create();
  }

  private createNavigationControl(): void {
    this.navigationControlView.createMenuControl();
  }

  private handleGameplayActionBarAction(action: GameplayActionBarAction): void {
    if (this.isModalOpen()) {
      return;
    }

    if (action === 'shop') {
      this.openUpgradeShopPanel();
      return;
    }

    if (action === 'battle') {
      this.openBossBattlePanel();
      return;
    }

    if (action === 'quests') {
      this.openMissionsPanel();
      return;
    }

    this.prestigeConfirmationArmed = false;
    this.openPrestigePanel();
  }

  private createEconomyDebugControl(): void {
    if (!SHOW_DEBUG_PANEL) {
      return;
    }

    this.navigationControlView.addDebugControl();
  }

  private toggleNavigationMenuPanel(): void {
    if (this.navigationMenuPanelView.isOpen()) {
      this.closeNavigationMenuPanel();
      return;
    }

    if (this.isModalOpen()) {
      return;
    }

    this.openNavigationMenuPanel();
  }

  private openNavigationMenuPanel(): void {
    this.closeNavigationMenuPanel();
    this.closeCompendiumPanel();
    this.closeSettingsPanel();
    this.closeHelpPanel();
    this.closePatchNotesPanel();
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeOrdersPanel();
    this.closeBossBattlePanel();
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const menuItems: NavigationMenuPanelItem[] = [
      { label: this.t('ui.menu.settings'), openPanel: () => this.openSettingsPanel() },
      { label: this.t('ui.menu.help'), openPanel: () => this.openHelpPanel() },
      { label: this.t('ui.menu.patchNotes'), openPanel: () => this.openPatchNotesPanel() },
      { label: this.t('ui.menu.hatchPool'), openPanel: () => this.openHatchPoolPanel() },
      { label: this.t('ui.menu.compendium'), openPanel: () => this.openCompendiumPanel() },
      { label: this.t('ui.menu.zone'), openPanel: () => this.openZonePanel() },
    ];

    this.navigationMenuPanelView.create(menuItems);
  }

  private closeNavigationMenuPanel(): void {
    if (this.navigationMenuPanelView.isOpen()) {
      this.navigationMenuPanelView.destroy();
      this.hideModalOverlay();
    }
  }

  private syncAudioSettings(): void {
    audioSystem.setSoundEnabled(this.settings.soundEnabled);
    audioSystem.setMusicEnabled(this.settings.musicEnabled);
  }

  private playButtonClickSound(): void {
    audioSystem.resume();
    audioSystem.playButtonClick();
  }

  private t(key: string, params?: Record<string, string | number>): string {
    return getText(this.settings.language, key, params);
  }

  private getLocalizedFamilyName(family: MonsterFamily): string {
    return this.t(`family.${family}`);
  }

  private getLocalizedMonsterName(monster: MonsterDefinition): string {
    return this.t(`monster.${monster.family}.${monster.level}`);
  }

  private getLocalizedUpgradeName(upgrade: UpgradeDefinition): string {
    return this.t(`upgrade.${upgrade.id}.name`);
  }

  private getLocalizedUpgradeEffect(upgrade: UpgradeDefinition): string {
    return this.t(`upgrade.${upgrade.id}.effect`);
  }

  private getLocalizedMissionName(mission: MissionDefinition): string {
    return this.t(`mission.${mission.id}.name`);
  }

  private getLocalizedZoneName(zone: ZoneDefinition): string {
    return this.t(`zone.${zone.id}.name`);
  }

  private getLocalizedZoneDescription(zone: ZoneDefinition): string {
    return this.t(`zone.${zone.id}.description`);
  }

  private setLanguage(language: LanguageCode): void {
    if (this.settings.language === language) {
      return;
    }

    this.settings.language = language;
    writeSettings(this.settings);
    this.createExpansionPlaceholder();
    this.createHud();
    this.createOrderWidget();
    this.createHatchArea();
    this.createTapFarmArea();
    this.createGameplayActionBar();
    this.createNavigationControl();
    this.updateHud();
    this.openSettingsPanel();
    this.showToast(this.t('toast.languageChanged'), 'success');
  }

  private getUiLayoutMode(): UiLayoutMode {
    const { width, height } = this.scale;
    const touchConstrained = navigator.maxTouchPoints > 0 && (width < 900 || height < 760);

    return width < 700 || height < 680 || touchConstrained ? 'mobile' : 'desktop';
  }

  private getModalSize(kind: ModalKind, preferredWidth: number, preferredHeight: number): { width: number; height: number } {
    const mode = this.getUiLayoutMode();

    if (mode === 'mobile') {
      const inset = 12;
      const isListModal = kind === 'compendium' || kind === 'upgrade-shop' || kind === 'goals' || kind === 'orders' || kind === 'battle';
      const mobileMaxWidth = isListModal ? 390 : preferredWidth;

      return getInsetPanelSize(
        this.scale,
        mobileMaxWidth,
        isListModal ? this.scale.height : preferredHeight,
        inset,
      );
    }

    const inset = 36;

    return getInsetPanelSize(this.scale, preferredWidth, preferredHeight, inset);
  }

  private getRowsPerPage(rowGap: number, bodyHeight: number, totalRows: number, mobilePreferredRows: number, desktopPreferredRows: number): number {
    const mode = this.getUiLayoutMode();
    const preferredRows = mode === 'mobile' ? mobilePreferredRows : desktopPreferredRows;
    const fitRows = Math.max(1, Math.floor(bodyHeight / rowGap));

    return Math.max(1, Math.min(totalRows, preferredRows, fitRows));
  }

  private getPageCount(totalItems: number, rowsPerPage: number): number {
    return Math.max(1, Math.ceil(totalItems / Math.max(1, rowsPerPage)));
  }

  private addModalCloseButton(
    panel: Phaser.GameObjects.Container,
    panelWidth: number,
    panelHeight: number,
    onClose: () => void,
    options: {
      color?: string;
      label?: string;
      stopPropagation?: boolean;
      xOffset?: number;
      yOffset?: number;
    } = {},
  ): void {
    addCloseButton(this, panel, {
      color: options.color ?? THEME.text,
      fontFamily: UI_FONT_FAMILY,
      label: options.label ?? this.t('common.close'),
      onPointerDown: () => {
        this.playButtonClickSound();
        onClose();
      },
      stopPropagation: options.stopPropagation,
      x: panelWidth / 2 - (options.xOffset ?? 24),
      y: -panelHeight / 2 + (options.yOffset ?? 22),
    });
  }

  private addPaginationControls(
    panel: Phaser.GameObjects.Container,
    panelWidth: number,
    panelHeight: number,
    pageIndex: number,
    pageCount: number,
    onPageChange: (nextPageIndex: number) => void,
  ): void {
    addPanelPaginationControls(this, panel, {
      buttonColor: THEME.button,
      disabledButtonColor: THEME.lockedInner,
      disabledTextColor: '#9ca79f',
      fontFamily: UI_FONT_FAMILY,
      mutedTextColor: THEME.mutedText,
      nextEnabled: pageIndex < pageCount - 1,
      nextLabel: this.t('common.next'),
      onNext: () => {
        this.playButtonClickSound();
        onPageChange(pageIndex + 1);
      },
      onPrevious: () => {
        this.playButtonClickSound();
        onPageChange(pageIndex - 1);
      },
      pageCount,
      pageIndex,
      panelHeight,
      panelWidth,
      previousEnabled: pageIndex > 0,
      previousLabel: this.t('common.prev'),
      textColor: THEME.text,
    });
  }

  private showModalOverlay(): void {
    this.cancelHatchPoolHold();
    this.cancelActiveDrag();
    this.hideModalOverlay();
    this.setModalOpenVisualState(true);

    const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x06170d, 0.44)
      .setOrigin(0)
      .setDepth(MODAL_OVERLAY_DEPTH)
      .setInteractive(
        new Phaser.Geom.Rectangle(0, 0, this.scale.width, this.scale.height),
        Phaser.Geom.Rectangle.Contains,
      );

    overlay.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      this.handleModalOverlayTap();
    });
    overlay.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
    });
    overlay.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
    });

    this.modalOverlay = overlay;
  }

  private hideModalOverlay(): void {
    this.modalOverlay?.destroy();
    this.modalOverlay = undefined;
    this.setModalOpenVisualState(false);
  }

  private isModalOpen(): boolean {
    return Boolean(
      this.compendiumPanel
      || this.settingsPanel
      || this.helpPanel
      || this.patchNotesPanel
      || this.zonePanel
      || this.missionsPanel
      || this.ordersPanel
      || this.bossBattlePanel
      || this.upgradeShopPanel
      || this.prestigePanel
      || this.hatchPoolPanel
      || this.navigationMenuPanelView.isOpen()
      || this.modalOverlay
    );
  }

  private handleModalOverlayTap(): void {
    if (this.resetConfirmationArmed || this.prestigeConfirmationArmed) {
      this.showBlockedOutsideTapToast();
      return;
    }

    if (!this.settings.outsideTapClosesPanels) {
      return;
    }

    this.closeActiveOutsideClosableModal();
  }

  private closeActiveOutsideClosableModal(): void {
    if (this.settingsPanel) {
      this.closeSettingsPanel();
      return;
    }

    if (this.upgradeShopPanel) {
      this.closeUpgradeShopPanel();
      return;
    }

    if (this.prestigePanel) {
      this.closePrestigePanel();
      return;
    }

    if (this.hatchPoolPanel) {
      this.closeHatchPoolPanel();
      return;
    }

    if (this.zonePanel) {
      this.closeZonePanel();
      return;
    }

    if (this.missionsPanel) {
      this.closeMissionsPanel();
      return;
    }

    if (this.ordersPanel) {
      this.closeOrdersPanel();
      return;
    }

    if (this.bossBattlePanel) {
      this.closeBossBattlePanel();
      return;
    }

    if (this.helpPanel) {
      this.closeHelpPanel();
      return;
    }

    if (this.patchNotesPanel) {
      this.closePatchNotesPanel();
      return;
    }

    if (this.compendiumPanel) {
      this.closeCompendiumPanel();
      return;
    }

    if (this.navigationMenuPanelView.isOpen()) {
      this.closeNavigationMenuPanel();
    }
  }

  private showBlockedOutsideTapToast(): void {
    if (this.time.now - this.lastBlockedOutsideTapToastAt < 1400) {
      return;
    }

    this.lastBlockedOutsideTapToastAt = this.time.now;
    this.showToast(this.t('toast.useClose'), 'warning');
  }

  private setModalOpenVisualState(isOpen: boolean): void {
    this.resetFarmControlHoverState();
    this.hatchPanelView.setModalOpenVisualState(isOpen);
    this.tapFarmView.setModalOpenVisualState(isOpen);
    this.gameplayActionBarView.setModalOpenVisualState(isOpen);
    this.orderWidgetView.setModalOpenVisualState(isOpen);
    this.navigationControlView.setModalOpenVisualState(isOpen);
  }

  private resetFarmControlHoverState(): void {
    this.cancelHatchPoolHold();
    this.hatchPanelView.resetHoverState();
    this.tapFarmView.resetHoverState();
    this.gameplayActionBarView.resetHoverState();
    this.navigationControlView.resetHoverState();
  }

  private registerKeyboardShortcuts(): void {
    this.input.keyboard?.on('keydown-C', () => {
      if (this.hasArmedDestructiveConfirmation()) {
        return;
      }

      this.toggleCompendiumPanel();
    });

    this.input.keyboard?.on('keydown-S', () => {
      if (this.hasArmedDestructiveConfirmation()) {
        return;
      }

      this.toggleSettingsPanel();
    });

    this.input.keyboard?.on('keydown-H', () => {
      if (this.hasArmedDestructiveConfirmation()) {
        return;
      }

      this.toggleHelpPanel();
    });

    this.input.keyboard?.on('keydown-M', () => {
      if (this.hasArmedDestructiveConfirmation()) {
        return;
      }

      this.toggleNavigationMenuPanel();
    });

    this.input.keyboard?.on('keydown-D', () => {
      if (this.hasArmedDestructiveConfirmation() || !SHOW_DEBUG_PANEL) {
        return;
      }

      this.toggleEconomyDebugPanel();
    });
  }

  private hasArmedDestructiveConfirmation(): boolean {
    return this.resetConfirmationArmed || this.prestigeConfirmationArmed;
  }

  private registerManualDragInput(): void {
    this.input.off('pointermove', this.handleManualDragPointerMove);
    this.input.off('pointerup', this.handleManualDragPointerUp);
    this.input.off('pointerupoutside', this.handleManualDragPointerUp);
    this.input.on('pointermove', this.handleManualDragPointerMove);
    this.input.on('pointerup', this.handleManualDragPointerUp);
    this.input.on('pointerupoutside', this.handleManualDragPointerUp);
  }

  private registerCoinBugProximityPickupInput(): void {
    this.input.off('pointerdown', this.handleCoinBugProximityPointerDown);
    this.input.on('pointerdown', this.handleCoinBugProximityPointerDown);
  }

  private tryCollectNearbyCoinBug(pointer: Phaser.Input.Pointer): void {
    if (
      this.isModalOpen()
      || this.activeDragSlotId !== null
      || this.isPointerOverFarmControl(pointer)
    ) {
      return;
    }

    const nearestBug = this.getNearestCollectableCoinBug(pointer.worldX, pointer.worldY);

    if (!nearestBug) {
      return;
    }

    pointer.event?.stopPropagation();
    this.collectCoinBug(nearestBug);
  }

  private getNearestCollectableCoinBug(x: number, y: number): CoinBug | null {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }

    const pickupRadius = getCoinBugPickupRadiusFromState(
      this.getUiLayoutMode(),
      COIN_BUG_PICKUP_RADIUS_DESKTOP,
      COIN_BUG_PICKUP_RADIUS_MOBILE,
    );
    let nearestBug: CoinBug | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    this.activeCoinBugs.forEach((bug) => {
      if (bug.collected || !bug.container.active) {
        return;
      }

      const distance = getPointDistance({ x, y }, { x: bug.container.x, y: bug.container.y });

      if (distance > pickupRadius || distance >= nearestDistance) {
        return;
      }

      nearestBug = bug;
      nearestDistance = distance;
    });

    return nearestBug;
  }

  private isPointerOverFarmControl(pointer: Phaser.Input.Pointer): boolean {
    const x = pointer.worldX;
    const y = pointer.worldY;

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return true;
    }

    const point = new Phaser.Math.Vector2(x, y);
    const layout = this.getLayout();
    const farmControlRects = [
      new Phaser.Geom.Rectangle(layout.hudX, layout.hudY, layout.hudWidth, layout.hudHeight),
      new Phaser.Geom.Rectangle(layout.statsX, layout.statsY, layout.statsWidth, layout.statsHeight),
      new Phaser.Geom.Rectangle(layout.orderWidgetX, layout.orderWidgetY, layout.orderWidgetWidth, layout.orderWidgetHeight),
      new Phaser.Geom.Rectangle(layout.tapFarmX, layout.tapFarmY, layout.tapFarmWidth, layout.tapFarmHeight),
      new Phaser.Geom.Rectangle(layout.actionBarX, layout.actionBarY, layout.actionBarWidth, layout.actionBarHeight),
      new Phaser.Geom.Rectangle(layout.hatchX, layout.hatchY, layout.hatchWidth, layout.hatchHeight),
      new Phaser.Geom.Rectangle(
        layout.expansionStartX - 8,
        layout.expansionLabelY - 22,
        this.cellSize * EXPANSION_COLUMNS + this.gridGap * (EXPANSION_COLUMNS - 1) + 16,
        Math.max(44, layout.expansionStartY + this.cellSize - layout.expansionLabelY + 28),
      ),
    ];

    if (farmControlRects.some((rect) => Phaser.Geom.Rectangle.Contains(rect, point.x, point.y))) {
      return true;
    }

    if (this.navigationControlView.containsPoint(x, y)) {
      return true;
    }

    return this.slotCenters.some((center) => (
      center.x > 0
      && Math.abs(x - center.x) <= this.cellSize / 2
      && Math.abs(y - center.y) <= this.cellSize / 2
    ));
  }

  private toggleSettingsPanel(): void {
    if (this.settingsPanel) {
      this.closeSettingsPanel();
      return;
    }

    this.resetConfirmationArmed = false;
    this.openSettingsPanel();
  }

  private openSettingsPanel(): void {
    this.closeSettingsPanel(false);
    this.closeNavigationMenuPanel();
    this.closeCompendiumPanel();
    this.closeHelpPanel();
    this.closePatchNotesPanel();
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeOrdersPanel();
    this.closeBossBattlePanel();
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = getPanelSize(this.scale, 360, 360);

    panel.setDepth(25);

    addPanelBackground(this, panel, panelWidth, panelHeight, THEME);

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 20, this.t('ui.settings.title'), {
      color: THEME.text,
      fontFamily: UI_FONT_FAMILY,
      fontSize: getPanelTitleFontSize(panelWidth),
      fontStyle: 'bold',
    }));

    this.addModalCloseButton(panel, panelWidth, panelHeight, () => this.closeSettingsPanel());

    this.addSettingsToggle(panel, this.t('ui.settings.music'), this.settings.musicEnabled, -86, () => {
      this.settings.musicEnabled = !this.settings.musicEnabled;
      writeSettings(this.settings);
      this.syncAudioSettings();
      this.openSettingsPanel();
      this.showToast(this.settings.musicEnabled ? this.t('toast.musicOn') : this.t('toast.musicOff'), this.settings.musicEnabled ? 'success' : 'info');
    });

    this.addSettingsToggle(panel, this.t('ui.settings.sound'), this.settings.soundEnabled, -38, () => {
      this.settings.soundEnabled = !this.settings.soundEnabled;
      writeSettings(this.settings);
      this.syncAudioSettings();
      this.openSettingsPanel();
      this.showToast(this.settings.soundEnabled ? this.t('toast.soundOn') : this.t('toast.soundOff'), this.settings.soundEnabled ? 'success' : 'info');
    });

    this.addSettingsToggle(panel, this.t('ui.settings.outsideTap'), this.settings.outsideTapClosesPanels, 10, () => {
      this.settings.outsideTapClosesPanels = !this.settings.outsideTapClosesPanels;
      writeSettings(this.settings);
      this.openSettingsPanel();
      this.showToast(
        this.settings.outsideTapClosesPanels ? this.t('toast.outsideTapOn') : this.t('toast.outsideTapOff'),
        this.settings.outsideTapClosesPanels ? 'success' : 'info',
      );
    });

    panel.add(this.add.text(-132, 28, this.t('ui.settings.closesPanels'), {
      color: THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: '12px',
    }));

    this.addLanguageSetting(panel, 70);

    const resetText = this.add.text(0, 136, this.resetConfirmationArmed ? this.t('ui.settings.resetConfirm') : this.t('ui.settings.resetSave'), {
      color: this.resetConfirmationArmed ? '#fff4a8' : '#ffffff',
      fontFamily: UI_FONT_FAMILY,
      fontSize: '17px',
      fontStyle: 'bold',
      backgroundColor: this.resetConfirmationArmed ? '#8a6426' : `#${THEME.danger.toString(16).padStart(6, '0')}`,
      padding: {
        x: 14,
        y: 8,
      },
    }).setOrigin(0.5);

    resetText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.playButtonClickSound();
        if (!this.resetConfirmationArmed) {
          this.resetConfirmationArmed = true;
          this.openSettingsPanel();
          return;
        }

        this.resetProgress();
        this.openSettingsPanel();
        this.showToast(this.t('toast.progressReset'), 'success');
      });

    panel.add(resetText);
    this.settingsPanel = panel;
  }

  private addLanguageSetting(
    panel: Phaser.GameObjects.Container,
    y: number,
  ): void {
    panel.add(this.add.text(-132, y - 11, this.t('ui.settings.language'), {
      color: '#f7ffe8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: '18px',
      fontStyle: 'bold',
    }));

    const englishText = this.add.text(32, y - 14, this.t('ui.settings.english'), {
      color: '#ffffff',
      fontFamily: UI_FONT_FAMILY,
      fontSize: '14px',
      fontStyle: 'bold',
      backgroundColor: `#${(this.settings.language === 'en' ? THEME.buttonHover : THEME.lockedInner).toString(16).padStart(6, '0')}`,
      padding: {
        x: 10,
        y: 7,
      },
    }).setOrigin(1, 0);

    const thaiText = this.add.text(132, y - 14, this.t('ui.settings.thai'), {
      color: '#ffffff',
      fontFamily: UI_FONT_FAMILY,
      fontSize: '14px',
      fontStyle: 'bold',
      backgroundColor: `#${(this.settings.language === 'th' ? THEME.buttonHover : THEME.lockedInner).toString(16).padStart(6, '0')}`,
      padding: {
        x: 14,
        y: 7,
      },
    }).setOrigin(1, 0);

    englishText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.playButtonClickSound();
        this.setLanguage('en');
      });

    thaiText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.playButtonClickSound();
        this.setLanguage('th');
      });

    panel.add([englishText, thaiText]);
  }

  private addSettingsToggle(
    panel: Phaser.GameObjects.Container,
    label: string,
    isEnabled: boolean,
    y: number,
    onToggle: () => void,
  ): void {
    panel.add(this.add.text(-132, y - 11, label, {
      color: '#f7ffe8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: '18px',
      fontStyle: 'bold',
    }));

    const toggleColor = isEnabled ? THEME.buttonHover : THEME.danger;
    const toggleText = this.add.text(132, y - 14, isEnabled ? this.t('common.on') : this.t('common.off'), {
      color: '#ffffff',
      fontFamily: UI_FONT_FAMILY,
      fontSize: '16px',
      fontStyle: 'bold',
      backgroundColor: `#${toggleColor.toString(16).padStart(6, '0')}`,
      padding: {
        x: 18,
        y: 7,
      },
    }).setOrigin(1, 0);

    toggleText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.playButtonClickSound();
        onToggle();
      });

    panel.add(toggleText);
  }

  private closeSettingsPanel(resetConfirmation = true): void {
    if (this.settingsPanel) {
      this.settingsPanel.destroy();
      this.settingsPanel = undefined;
      this.hideModalOverlay();
    }

    if (resetConfirmation) {
      this.resetConfirmationArmed = false;
    }
  }

  private toggleHelpPanel(): void {
    if (this.helpPanel) {
      this.closeHelpPanel();
      return;
    }

    this.openHelpPanel();
  }

  private openHelpPanel(): void {
    this.closeHelpPanel();
    this.closeNavigationMenuPanel();
    this.closeCompendiumPanel();
    this.closeSettingsPanel();
    this.closePatchNotesPanel();
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeOrdersPanel();
    this.closeBossBattlePanel();
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = getPanelSize(this.scale, 500, 460);

    panel.setDepth(26);

    addPanelBackground(this, panel, panelWidth, panelHeight, THEME);

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 20, this.t('ui.help.title'), {
      color: THEME.text,
      fontFamily: UI_FONT_FAMILY,
      fontSize: getPanelTitleFontSize(panelWidth),
      fontStyle: 'bold',
    }));

    this.addModalCloseButton(panel, panelWidth, panelHeight, () => this.closeHelpPanel());

    const helpLines = [
      [this.t('ui.help.hatch.label'), this.t('ui.help.hatch.description')],
      [this.t('ui.help.tapFarm.label'), this.t('ui.help.tapFarm.description')],
      [this.t('ui.help.merge.label'), this.t('ui.help.merge.description')],
      [this.t('ui.help.upgrades.label'), this.t('ui.help.upgrades.description')],
      [this.t('ui.help.orders.label'), this.t('ui.help.orders.description')],
      [this.t('ui.help.fragments.label'), this.t('ui.help.fragments.description')],
      [this.t('ui.help.info.label'), this.t('ui.help.info.description')],
      [this.t('ui.help.compendium.label'), this.t('ui.help.compendium.description')],
      [this.t('ui.help.settings.label'), this.t('ui.help.settings.description')],
    ];

    const lineGap = Math.min(panelWidth < 420 ? 46 : 42, (panelHeight - 146) / helpLines.length);

    helpLines.forEach(([label, description], index) => {
      this.addHelpLine(panel, label, description, -panelHeight / 2 + 82 + index * lineGap, panelWidth);
    });

    const resetHintsText = this.add.text(0, panelHeight / 2 - 30, this.t('ui.help.resetHints'), {
      color: THEME.text,
      fontFamily: UI_FONT_FAMILY,
      fontSize: '15px',
      fontStyle: 'bold',
      backgroundColor: `#${THEME.buttonWarm.toString(16).padStart(6, '0')}`,
      padding: {
        x: 12,
        y: 6,
      },
    }).setOrigin(0.5);

    resetHintsText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.playButtonClickSound();
        this.resetOnboardingHints();
      });

    panel.add(resetHintsText);
    this.helpPanel = panel;
  }

  private addHelpLine(
    panel: Phaser.GameObjects.Container,
    label: string,
    description: string,
    y: number,
    panelWidth: number,
  ): void {
    const labelX = -panelWidth / 2 + 24;
    const descriptionX = -panelWidth / 2 + 142;

    panel.add(this.add.text(labelX, y, label, {
      color: '#fff4a8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: '16px',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5));

    panel.add(this.add.text(descriptionX, y, description, {
      color: '#f7ffe8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: '15px',
      wordWrap: {
        width: Math.max(150, panelWidth - 166),
      },
    }).setOrigin(0, 0.5));
  }

  private closeHelpPanel(): void {
    if (this.helpPanel) {
      this.helpPanel.destroy();
      this.helpPanel = undefined;
      this.hideModalOverlay();
    }
  }

  private openPatchNotesPanel(): void {
    this.closePatchNotesPanel(false);
    this.closeNavigationMenuPanel();
    this.closeCompendiumPanel();
    this.closeSettingsPanel();
    this.closeHelpPanel();
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeOrdersPanel();
    this.closeBossBattlePanel();
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeHatchPoolPanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = getPanelSize(this.scale, 500, 540);
    const contentX = -panelWidth / 2 + 24;
    const contentWidth = panelWidth - 48;
    const patchNoteKeys = [
      'ui.patchNotes.bossBranches',
      'ui.patchNotes.elementFragments',
      'ui.patchNotes.hatchPool',
      'ui.patchNotes.rareHatch',
      'ui.patchNotes.hatchBlessing',
      'ui.patchNotes.sporeHint',
      'ui.patchNotes.cellPlantHint',
      'ui.patchNotes.zones',
      'ui.patchNotes.families',
      'ui.patchNotes.upgrades',
      'ui.patchNotes.recipes',
      'ui.patchNotes.remove',
    ];
    let y = -panelHeight / 2 + 66;

    panel.setDepth(26);
    addPanelBackground(this, panel, panelWidth, panelHeight, THEME);

    panel.add(this.add.text(contentX, -panelHeight / 2 + 20, this.t('ui.patchNotes.title'), {
      color: THEME.text,
      fontFamily: UI_FONT_FAMILY,
      fontSize: getPanelTitleFontSize(panelWidth),
      fontStyle: 'bold',
    }));

    this.addModalCloseButton(panel, panelWidth, panelHeight, () => this.closePatchNotesPanel());

    patchNoteKeys.forEach((key) => {
      const line = this.add.text(contentX, y, `- ${this.t(key)}`, {
        color: '#f7ffe8',
        fontFamily: UI_FONT_FAMILY,
        fontSize: panelWidth < 390 ? '11px' : '13px',
        fixedWidth: contentWidth,
        wordWrap: {
          width: contentWidth,
          useAdvancedWrap: true,
        },
      });

      panel.add(line);
      y += line.height + (panelWidth < 390 ? 7 : 9);
    });

    this.patchNotesPanel = panel;
  }

  private closePatchNotesPanel(hideOverlay = true): void {
    if (this.patchNotesPanel) {
      this.patchNotesPanel.destroy();
      this.patchNotesPanel = undefined;

      if (hideOverlay) {
        this.hideModalOverlay();
      }
    }
  }

  private toggleZonePanel(): void {
    if (this.zonePanel) {
      this.closeZonePanel();
      return;
    }

    this.openZonePanel();
  }

  private openZonePanel(): void {
    this.closeZonePanel();
    this.closeNavigationMenuPanel();
    this.closeCompendiumPanel();
    this.closeSettingsPanel();
    this.closeHelpPanel();
    this.closePatchNotesPanel();
    this.closeMissionsPanel();
    this.closeOrdersPanel();
    this.closeBossBattlePanel();
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = getPanelSize(this.scale, 460, 480);
    const firstRowY = -panelHeight / 2 + 88;
    const rowGap = Math.min(84, Math.max(56, (panelHeight - 138) / ZONE_DEFINITIONS.length));
    const rowHeight = Math.min(68, rowGap - 6);

    panel.setDepth(24);
    addPanelBackground(this, panel, panelWidth, panelHeight, THEME);

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 20, this.t('ui.zone.title'), {
      color: THEME.text,
      fontFamily: UI_FONT_FAMILY,
      fontSize: getPanelTitleFontSize(panelWidth),
      fontStyle: 'bold',
    }));

    this.addModalCloseButton(panel, panelWidth, panelHeight, () => this.closeZonePanel());

    ZONE_DEFINITIONS.forEach((zone, index) => {
      this.addZoneRow(panel, zone, firstRowY + index * rowGap, panelWidth, rowHeight);
    });

    this.zonePanel = panel;
  }

  private addZoneRow(
    panel: Phaser.GameObjects.Container,
    zone: ZoneDefinition,
    rowY: number,
    panelWidth: number,
    rowHeight: number,
  ): void {
    const isCompactPanel = panelWidth < 400;
    const status = getZoneSelectionStatus(zone.id, this.currentZone, this.unlockedZones);
    const isUnlocked = status !== 'locked';
    const isCurrent = status === 'selected';
    const canSelect = status === 'unlocked';
    const rowTop = rowY - rowHeight / 2;
    const statusText = status === 'selected'
      ? this.t('ui.zone.selected')
      : status === 'unlocked'
        ? this.t('ui.zone.unlocked')
        : this.t('ui.zone.lockedPrestige');
    const bonusText = this.t(zone.hatchSpecialtyKey);

    panel.add(this.add.rectangle(0, rowY, panelWidth - 48, rowHeight, isUnlocked ? THEME.panelAlt : 0x29362f, 0.92)
      .setStrokeStyle(2, isCurrent ? THEME.panelBorder : canSelect ? THEME.slot : THEME.lockedBorder, 0.78));

    panel.add(this.add.text(-panelWidth / 2 + 42, rowTop + (isCompactPanel ? 6 : 8), this.getLocalizedZoneName(zone), {
      color: isUnlocked ? THEME.text : '#9ca79f',
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '13px' : '16px',
      fontStyle: 'bold',
      fixedWidth: panelWidth - (isCompactPanel ? 160 : 178),
    }));

    panel.add(this.add.text(-panelWidth / 2 + 42, rowTop + (isCompactPanel ? 26 : 31), statusText, {
      color: isUnlocked ? '#cdebb3' : THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '10px' : '12px',
      wordWrap: {
        width: panelWidth - (isCompactPanel ? 160 : 170),
      },
    }));

    panel.add(this.add.text(-panelWidth / 2 + 42, rowTop + (isCompactPanel ? 40 : 48), bonusText, {
      color: isUnlocked ? '#fff4a8' : THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '10px' : '11px',
      wordWrap: {
        width: panelWidth - (isCompactPanel ? 160 : 170),
      },
    }));

    const actionText = this.add.text(panelWidth / 2 - 42, rowY, isCurrent ? this.t('ui.zone.current') : isUnlocked ? this.t('ui.zone.switch') : this.t('ui.zone.locked'), {
      color: isUnlocked ? '#ffffff' : '#9ca79f',
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '11px' : '14px',
      fontStyle: 'bold',
      backgroundColor: `#${(canSelect ? THEME.buttonHover : THEME.lockedInner).toString(16).padStart(6, '0')}`,
      padding: {
        x: isCompactPanel ? 9 : 11,
        y: 5,
      },
    }).setOrigin(1, 0.5);

    if (canSelect) {
      actionText
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.playButtonClickSound();
          this.switchZone(zone.id);
        });
    }

    panel.add(actionText);
  }

  private closeZonePanel(): void {
    if (this.zonePanel) {
      this.zonePanel.destroy();
      this.zonePanel = undefined;
      this.hideModalOverlay();
    }
  }

  private getCurrentZoneDefinition(): ZoneDefinition {
    return ZONE_DEFINITIONS.find((zone) => zone.id === this.currentZone) ?? ZONE_DEFINITIONS[0];
  }

  private switchZone(zoneId: ZoneId): void {
    if (!canSwitchToZone(zoneId, this.currentZone, this.unlockedZones)) {
      return;
    }

    this.currentZone = zoneId;
    this.createFarmBackground();
    this.updateHud();
    this.refreshOrdersPanel();
    this.skipSavingUntilProgress = false;
    this.saveProgress();
    this.openZonePanel();
    this.showToast(this.t('ui.zone.selectedToast', {
      zone: this.getLocalizedZoneName(this.getCurrentZoneDefinition()),
    }), 'success');
  }

  private syncZoneUnlockFromPrestigeProgress(): void {
    const syncResult = syncZoneUnlockFromPrestigeProgressState(
      this.unlockedZones,
      this.currentZone,
      this.hasPrestigedOnce,
      this.monsterEssence,
      this.essencePowerLevel,
      this.totalRitualsPerformed,
      GRASS_FARM_ZONE_ID,
      MUSHROOM_FOREST_ZONE_ID,
      this.getDiscoveredFamilies(),
    );

    this.unlockedZones = syncResult.unlockedZones;
    this.currentZone = syncResult.currentZone;
    this.hasPrestigedOnce = syncResult.hasPrestigedOnce;
  }

  private getDiscoveredFamilies(): Set<MonsterFamily> {
    const families = new Set<MonsterFamily>();

    this.discoveredMonsters.forEach((discoveryKey) => {
      families.add(discoveryKey.split(':')[0] as MonsterFamily);
    });

    return families;
  }

  private toggleMissionsPanel(): void {
    if (this.missionsPanel) {
      this.closeMissionsPanel();
      return;
    }

    this.openMissionsPanel();
  }

  private openMissionsPanel(): void {
    this.closeMissionsPanel();
    this.closeNavigationMenuPanel();
    this.closeCompendiumPanel();
    this.closeSettingsPanel();
    this.closeHelpPanel();
    this.closePatchNotesPanel();
    this.closeZonePanel();
    this.closeOrdersPanel();
    this.closeBossBattlePanel();
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = this.getModalSize('goals', 540, 520);
    const rowGap = panelWidth < 420 ? 50 : 56;
    const rowHeight = Math.min(50, rowGap - 6);
    const firstRowY = -panelHeight / 2 + 90;
    const bodyHeight = panelHeight - 138;
    const rowsPerPage = this.getRowsPerPage(rowGap, bodyHeight, MISSION_DEFINITIONS.length, 7, 8);
    const pageCount = this.getPageCount(MISSION_DEFINITIONS.length, rowsPerPage);
    const pageIndex = Phaser.Math.Clamp(this.missionsPageIndex, 0, pageCount - 1);
    const pageMissions = MISSION_DEFINITIONS.slice(pageIndex * rowsPerPage, (pageIndex + 1) * rowsPerPage);

    this.missionsPageIndex = pageIndex;

    panel.setDepth(24);
    addPanelBackground(this, panel, panelWidth, panelHeight, THEME);

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 20, this.t('ui.goals.title'), {
      color: THEME.text,
      fontFamily: UI_FONT_FAMILY,
      fontSize: getPanelTitleFontSize(panelWidth),
      fontStyle: 'bold',
    }));

    this.addModalCloseButton(panel, panelWidth, panelHeight, () => this.closeMissionsPanel());

    pageMissions.forEach((mission, index) => {
      this.addMissionRow(panel, mission, firstRowY + index * rowGap, panelWidth, rowHeight);
    });

    this.addPaginationControls(panel, panelWidth, panelHeight, pageIndex, pageCount, (nextPageIndex) => {
      this.missionsPageIndex = nextPageIndex;
      this.openMissionsPanel();
    });

    this.missionsPanel = panel;
  }

  private addMissionRow(
    panel: Phaser.GameObjects.Container,
    mission: MissionDefinition,
    rowY: number,
    panelWidth: number,
    rowHeight: number,
  ): Phaser.GameObjects.Text | undefined {
    const isCompactPanel = panelWidth < 420 || rowHeight < 48;
    const isCompleted = this.completedMissionIds.has(mission.id);
    const isClaimed = this.claimedMissionIds.has(mission.id);
    const canClaim = isCompleted && !isClaimed;
    const progress = this.getMissionProgress(mission);
    const rowTop = rowY - rowHeight / 2;
    const rowWidth = panelWidth - 48;
    const statusText = isClaimed ? this.t('ui.goals.claimed') : isCompleted ? this.t('ui.goals.complete') : `${progress}/${mission.goal}`;
    const detailText = this.t('ui.goals.rewardDetail', {
      status: statusText,
      reward: this.getMissionRewardText(mission.reward),
    });

    panel.add(this.add.rectangle(0, rowY, rowWidth, rowHeight, isClaimed ? 0x29362f : THEME.panelAlt, 0.92)
      .setStrokeStyle(2, canClaim ? THEME.slot : THEME.lockedBorder, 0.72));

    panel.add(this.add.text(-panelWidth / 2 + 42, rowTop + 7, this.getLocalizedMissionName(mission), {
      color: isClaimed ? '#cdebb3' : THEME.text,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '14px' : '16px',
      fontStyle: 'bold',
      wordWrap: {
        width: panelWidth - (isCompactPanel ? 150 : 176),
      },
    }));

    panel.add(this.add.text(-panelWidth / 2 + 42, rowTop + (isCompactPanel ? 28 : 30), detailText, {
      color: canClaim ? '#fff4a8' : THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '12px' : '13px',
      wordWrap: {
        width: panelWidth - (isCompactPanel ? 150 : 176),
      },
    }));

    const actionText = this.add.text(panelWidth / 2 - 42, rowY, isClaimed ? this.t('ui.goals.done') : canClaim ? this.t('ui.goals.claim') : `${progress}/${mission.goal}`, {
      color: isClaimed ? '#cdebb3' : '#ffffff',
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '13px' : '14px',
      fontStyle: 'bold',
      backgroundColor: `#${(canClaim ? THEME.buttonHover : THEME.lockedInner).toString(16).padStart(6, '0')}`,
      padding: {
        x: isCompactPanel ? 9 : 11,
        y: 5,
      },
    }).setOrigin(1, 0.5);

    if (canClaim) {
      actionText
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          pointer.event?.stopPropagation();
          this.playButtonClickSound();
          this.claimMissionReward(mission.id);
        });
    }

    panel.add(actionText);
    return actionText;
  }

  private closeMissionsPanel(): void {
    if (this.missionsPanel) {
      this.missionsPanel.destroy();
      this.missionsPanel = undefined;
      this.hideModalOverlay();
    }
  }

  private refreshMissionsPanel(): void {
    if (this.missionsPanel) {
      this.openMissionsPanel();
    }
  }

  private toggleOrdersPanel(): void {
    if (this.ordersPanel) {
      this.closeOrdersPanel();
      return;
    }

    this.openOrdersPanel();
  }

  private openOrdersPanel(): void {
    this.closeOrdersPanel();
    this.closeNavigationMenuPanel();
    this.closeCompendiumPanel();
    this.closeSettingsPanel();
    this.closeHelpPanel();
    this.closePatchNotesPanel();
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeBossBattlePanel();
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = this.getModalSize('orders', 560, 540);
    const rowGap = panelWidth < 420 ? 62 : 64;
    const rowHeight = Math.min(58, rowGap - 6);
    const firstRowY = -panelHeight / 2 + 126;
    const bodyHeight = panelHeight - 178;
    const rowsPerPage = this.getRowsPerPage(rowGap, bodyHeight, ORDER_DEFINITIONS.length, 6, 7);
    const pageCount = this.getPageCount(ORDER_DEFINITIONS.length, rowsPerPage);
    const pageIndex = Phaser.Math.Clamp(this.ordersPageIndex, 0, pageCount - 1);
    const pageOrders = ORDER_DEFINITIONS.slice(pageIndex * rowsPerPage, (pageIndex + 1) * rowsPerPage);

    this.ordersPageIndex = pageIndex;

    panel.setDepth(24);
    addPanelBackground(this, panel, panelWidth, panelHeight, THEME);

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 20, this.t('ui.orders.title'), {
      color: THEME.text,
      fontFamily: UI_FONT_FAMILY,
      fontSize: getPanelTitleFontSize(panelWidth),
      fontStyle: 'bold',
    }));

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 54, this.t('ui.orders.purpose'), {
      color: THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '12px' : '13px',
      fixedWidth: panelWidth - 48,
      wordWrap: {
        width: panelWidth - 48,
        useAdvancedWrap: true,
      },
    }));

    this.addModalCloseButton(panel, panelWidth, panelHeight, () => this.closeOrdersPanel(), {
      stopPropagation: true,
    });

    pageOrders.forEach((order, index) => {
      this.addOrderRow(panel, order, firstRowY + index * rowGap, panelWidth, rowHeight);
    });

    this.addPaginationControls(panel, panelWidth, panelHeight, pageIndex, pageCount, (nextPageIndex) => {
      this.ordersPageIndex = nextPageIndex;
      this.openOrdersPanel();
    });

    this.ordersPanel = panel;
  }

  private addOrderRow(
    panel: Phaser.GameObjects.Container,
    order: OrderDefinition,
    rowY: number,
    panelWidth: number,
    rowHeight: number,
  ): Phaser.GameObjects.Text {
    const isCompactPanel = panelWidth < 420 || rowHeight < 56;
    const isClaimed = this.claimedOrderIds.has(order.id);
    const isUnlocked = this.isOrderUnlocked(order);
    const isComplete = this.isOrderComplete(order);
    const canClaim = isUnlocked && isComplete && !isClaimed;
    const rowTop = rowY - rowHeight / 2;
    const rowWidth = panelWidth - 48;
    const leftX = -panelWidth / 2 + 42;
    const actionLabel = this.getOrderStatusText(order);

    panel.add(this.add.rectangle(0, rowY, rowWidth, rowHeight, isClaimed ? 0x29362f : THEME.panelAlt, 0.92)
      .setStrokeStyle(2, canClaim ? THEME.slot : THEME.lockedBorder, 0.72));

    panel.add(this.add.text(leftX, rowTop + 6, this.getLocalizedOrderTitle(order), {
      color: isClaimed ? '#cdebb3' : THEME.text,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '13px' : '15px',
      fontStyle: 'bold',
      wordWrap: {
        width: panelWidth - (isCompactPanel ? 160 : 186),
      },
    }));

    panel.add(this.add.text(leftX, rowTop + (isCompactPanel ? 25 : 27), this.getOrderRequirementText(order), {
      color: isUnlocked ? THEME.mutedText : '#b8b9af',
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '11px' : '12px',
      wordWrap: {
        width: panelWidth - (isCompactPanel ? 160 : 186),
      },
    }));

    panel.add(this.add.text(leftX, rowTop + (isCompactPanel ? 40 : 43), this.t('common.reward', {
      reward: this.getOrderRewardText(order.reward),
    }), {
      color: canClaim ? '#fff4a8' : THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '11px' : '12px',
      wordWrap: {
        width: panelWidth - (isCompactPanel ? 160 : 186),
      },
    }));

    const actionText = this.add.text(panelWidth / 2 - 42, rowY, actionLabel, {
      color: isClaimed ? '#cdebb3' : '#ffffff',
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '11px' : '13px',
      fontStyle: 'bold',
      backgroundColor: `#${(canClaim ? THEME.buttonHover : THEME.lockedInner).toString(16).padStart(6, '0')}`,
      padding: {
        x: isCompactPanel ? 7 : 10,
        y: 5,
      },
    }).setOrigin(1, 0.5);

    if (canClaim) {
      actionText
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          pointer.event?.stopPropagation();
          this.playButtonClickSound();
          this.claimOrderReward(order.id);
        });
    }

    panel.add(actionText);
    return actionText;
  }

  private closeOrdersPanel(): void {
    if (this.ordersPanel) {
      this.ordersPanel.destroy();
      this.ordersPanel = undefined;
      this.hideModalOverlay();
    }
  }

  private refreshOrdersPanel(): void {
    if (this.ordersPanel) {
      this.openOrdersPanel();
    }
  }

  private refreshOrderWidget(): void {
    this.createOrderWidget();
  }

  private getOrderDefinition(orderId: OrderId): OrderDefinition | undefined {
    return getOrderDefinitionFromState(ORDER_DEFINITIONS, orderId);
  }

  private getLocalizedOrderTitle(order: OrderDefinition): string {
    return this.t(`order.${order.id}.title`);
  }

  private getOrderRequirementText(order: OrderDefinition): string {
    return this.t('ui.orders.requirement', {
      level: order.requiredLevel,
      family: this.getLocalizedFamilyName(order.requiredFamily),
    });
  }

  private getOrderStatusText(order: OrderDefinition): string {
    const status = getOrderStatus(order, this.farmSlots, this.discoveredMonsters, this.claimedOrderIds);

    if (status === 'done') {
      return this.t('ui.orders.done');
    }

    if (status === 'locked') {
      return this.t('ui.orders.locked');
    }

    if (status === 'claim') {
      return this.t('ui.orders.claim');
    }

    return this.t('ui.orders.inProgress');
  }

  private getOrderWidgetStatusText(order: OrderDefinition): string {
    const status = getOrderStatus(order, this.farmSlots, this.discoveredMonsters, this.claimedOrderIds);

    if (status === 'done') {
      return this.t('ui.orders.done');
    }

    if (status === 'claim') {
      return this.t('ui.orderWidget.ready');
    }

    if (status === 'locked') {
      return this.t('ui.orders.locked');
    }

    return this.t('ui.orders.inProgress');
  }

  private getRecommendedOrder(): OrderDefinition | undefined {
    return getRecommendedOrderFromState(
      ORDER_DEFINITIONS,
      this.farmSlots,
      this.discoveredMonsters,
      this.claimedOrderIds,
    );
  }

  private isOrderUnlocked(order: OrderDefinition): boolean {
    return isOrderUnlockedState(order, this.discoveredMonsters);
  }

  private isOrderComplete(order: OrderDefinition): boolean {
    return isOrderCompleteState(order, this.farmSlots, this.discoveredMonsters);
  }

  private claimOrderReward(orderId: OrderId): void {
    const order = this.getOrderDefinition(orderId);

    if (!order || !canClaimOrder(order, this.farmSlots, this.discoveredMonsters, this.claimedOrderIds)) {
      return;
    }

    if (order.reward.type === 'coins') {
      this.currency.coins = this.sanitizeCoins(this.currency.coins + this.getEffectiveOrderCoinReward(order.reward.amount));
    } else {
      this.monsterEssence = sanitizePrestigeIntegerState(this.monsterEssence + order.reward.amount);
      this.syncZoneUnlockFromPrestigeProgress();
    }

    this.claimedOrderIds.add(orderId);
    this.skipSavingUntilProgress = false;
    this.updateHud();
    this.saveProgress();
    this.refreshOrdersPanel();
    this.refreshOrderWidget();
    this.showToast(this.t('toast.claimed', {
      reward: this.getOrderRewardText(order.reward),
    }), 'success');
  }

  private getOrderRewardText(reward: OrderReward): string {
    if (reward.type === 'coins') {
      return this.t('common.coins', {
        amount: this.formatCoinAmount(this.getEffectiveOrderCoinReward(reward.amount)),
      });
    }

    return this.t('common.essence', {
      amount: reward.amount,
    });
  }

  private toggleBossBattlePanel(): void {
    if (this.bossBattlePanel) {
      this.closeBossBattlePanel();
      return;
    }

    this.openBossBattlePanel();
  }

  private openBossBattlePanel(useDefaultStage = true, options: BossBattlePanelRefreshOptions = {}): void {
    this.closeBossBattlePanel(false, options);
    this.closeNavigationMenuPanel();
    this.closeCompendiumPanel();
    this.closeSettingsPanel();
    this.closeHelpPanel();
    this.closePatchNotesPanel();
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeOrdersPanel();
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const isMobilePanel = this.getUiLayoutMode() === 'mobile';
    const { width: panelWidth, height: panelHeight } = getInsetPanelSize(
      this.scale,
      isMobilePanel ? 390 : 560,
      isMobilePanel ? 632 : 590,
      isMobilePanel ? 12 : 36,
    );
    const isCompactPanel = panelWidth < 420;
    const contentLeft = -panelWidth / 2 + 24;
    const contentWidth = panelWidth - 48;

    panel.setDepth(24);
    addPanelBackground(this, panel, panelWidth, panelHeight, THEME);

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 20, this.t('ui.bossBattle.title'), {
      color: THEME.text,
      fontFamily: UI_FONT_FAMILY,
      fontSize: getPanelTitleFontSize(panelWidth),
      fontStyle: 'bold',
      fixedWidth: panelWidth - 118,
    }));

    this.addModalCloseButton(panel, panelWidth, panelHeight, () => this.closeBossBattlePanel(), {
      stopPropagation: true,
    });

    if (BOSS_BATTLE_DEFINITIONS.length === 0) {
      panel.add(this.add.text(contentLeft, -panelHeight / 2 + 86, this.t('ui.bossBattle.noStages'), {
        color: THEME.mutedText,
        fontFamily: UI_FONT_FAMILY,
        fontSize: isCompactPanel ? '13px' : '15px',
        fixedWidth: contentWidth,
        wordWrap: { width: contentWidth },
      }));
      this.bossBattlePanel = panel;
      return;
    }

    if (!this.selectedBossBattleBossId) {
      this.bossBattleBossPageIndex = this.getClampedBossBattleBossPageIndex(this.bossBattleBossPageIndex);
      this.addBossBattleSelectContent(panel, panelWidth, panelHeight);
    } else {
      const boss = this.getSelectedBossBattleDefinition();

      if (!boss) {
        this.selectedBossBattleBossId = undefined;
        this.bossBattleBossPageIndex = this.getClampedBossBattleBossPageIndex(0);
        this.addBossBattleSelectContent(panel, panelWidth, panelHeight);
      } else {
        if (useDefaultStage && !this.bossBattleSession) {
          this.bossBattleStageIndex = getDefaultBossStageIndexForBoss(boss, this.claimedBossBattleStageIds);
          this.bossBattleStagePageIndex = this.getBossBattleStagePageIndexForStage(this.bossBattleStageIndex);
        } else {
          this.bossBattleStageIndex = clampBossStageIndex(this.bossBattleStageIndex, boss.stages);
          this.bossBattleStagePageIndex = this.getClampedBossBattleStagePageIndex(this.bossBattleStagePageIndex, boss);
        }
        this.addBossBattleContent(panel, boss, boss.stages[this.bossBattleStageIndex], panelWidth, panelHeight);
      }
    }

    this.bossBattlePanel = panel;
  }

  private addBossBattleSelectContent(
    panel: Phaser.GameObjects.Container,
    panelWidth: number,
    panelHeight: number,
  ): void {
    const isCompactPanel = panelWidth < 420;
    const contentWidth = panelWidth - 48;
    const pageCount = this.getBossBattleBossPageCount();
    this.bossBattleBossPageIndex = this.getClampedBossBattleBossPageIndex(this.bossBattleBossPageIndex);
    const visibleBosses = this.getVisibleBossBattleDefinitions();
    const headerY = -panelHeight / 2 + (isCompactPanel ? 62 : 70);
    const cardGap = isCompactPanel ? 8 : 12;
    const rowGap = isCompactPanel ? 10 : 12;
    const cardWidth = (contentWidth - cardGap) / 2;
    const cardHeight = isCompactPanel ? 164 : 178;
    const gridTop = headerY + (isCompactPanel ? 58 : 64);
    const startX = -contentWidth / 2 + cardWidth / 2;
    const pageControlsY = gridTop + cardHeight * 2 + rowGap + (isCompactPanel ? 26 : 30);

    panel.add(this.add.text(0, headerY, this.t('ui.bossBattle.selectBoss'), {
      align: 'center',
      color: THEME.mutedText,
      fixedWidth: contentWidth,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '12px' : '14px',
      wordWrap: { width: contentWidth },
    }).setOrigin(0.5, 0));

    this.getElementFragmentInventoryLines().forEach((line, index) => {
      panel.add(this.add.text(0, headerY + 18 + index * 13, line, {
        align: 'center',
        color: index === 0 ? '#fff4a8' : THEME.mutedText,
        fixedWidth: contentWidth,
        fontFamily: UI_FONT_FAMILY,
        fontSize: isCompactPanel ? '10px' : '11px',
      }).setOrigin(0.5, 0));
    });

    visibleBosses.forEach((boss, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = startX + column * (cardWidth + cardGap);
      const y = gridTop + cardHeight / 2 + row * (cardHeight + rowGap);

      this.addBossBattleCard(panel, boss, x, y, cardWidth, cardHeight, isCompactPanel);
    });

    if (pageCount > 1) {
      const buttonWidth = isCompactPanel ? 70 : 82;
      const buttonHeight = isCompactPanel ? 28 : 30;
      this.addBattleButton(
        panel,
        -buttonWidth - 44,
        pageControlsY,
        buttonWidth,
        buttonHeight,
        this.t('common.prev'),
        THEME.button,
        '#ffffff',
        () => this.selectBossBattleBossPage(this.bossBattleBossPageIndex - 1),
        this.bossBattleBossPageIndex > 0 && !this.battleAnimationInProgress,
      );
      panel.add(this.add.text(0, pageControlsY - 9, this.t('ui.bossBattle.page', {
        current: this.bossBattleBossPageIndex + 1,
        total: pageCount,
      }), {
        align: 'center',
        color: THEME.mutedText,
        fixedWidth: 96,
        fontFamily: UI_FONT_FAMILY,
        fontSize: isCompactPanel ? '10px' : '11px',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0));
      this.addBattleButton(
        panel,
        buttonWidth + 44,
        pageControlsY,
        buttonWidth,
        buttonHeight,
        this.t('common.next'),
        THEME.button,
        '#ffffff',
        () => this.selectBossBattleBossPage(this.bossBattleBossPageIndex + 1),
        this.bossBattleBossPageIndex < pageCount - 1 && !this.battleAnimationInProgress,
      );
    }
  }

  private addBossBattleCard(
    panel: Phaser.GameObjects.Container,
    boss: BossBattleDefinition,
    centerX: number,
    centerY: number,
    cardWidth: number,
    cardHeight: number,
    isCompactPanel: boolean,
  ): void {
    const cardTop = centerY - cardHeight / 2;
    const clearedCount = boss.stages.filter((stage) => isBossStageCleared(stage.id, this.claimedBossBattleStageIds)).length;
    const nextStage = boss.stages.find((stage) => !isBossStageCleared(stage.id, this.claimedBossBattleStageIds))
      ?? boss.stages[boss.stages.length - 1];
    const isAllCleared = clearedCount >= boss.stages.length;
    const statusText = isAllCleared ? this.t('ui.bossBattle.cleared') : this.t('ui.bossBattle.readySkill');
    const rewardText = nextStage
      ? isAllCleared
        ? this.t('ui.bossBattle.replayRewardShort', { reward: this.getBossBattleFullRewardText(nextStage.replayReward, nextStage.replayFragmentReward) })
        : this.t('ui.bossBattle.rewardShort', { reward: this.getBossBattleFullRewardText(nextStage.firstClearReward, nextStage.firstClearFragmentReward) })
      : '';
    const branchText = this.t('ui.bossBattle.branch', {
      branch: this.t(`element.${boss.futureElementTheme}`),
    });

    panel.add(this.add.rectangle(centerX, centerY, cardWidth, cardHeight, THEME.panelAlt, 0.92)
      .setStrokeStyle(2, isAllCleared ? THEME.slot : THEME.panelBorder, 0.72));

    const preview = this.add.container(centerX, cardTop + (isCompactPanel ? 34 : 38));
    this.addBossBattleHumanVisual(preview, boss, isCompactPanel ? 0.48 : 0.54);
    panel.add(preview);

    panel.add(this.add.text(centerX, cardTop + (isCompactPanel ? 68 : 76), this.getCompactBossBattleText(this.getLocalizedBossName(boss), isCompactPanel ? 18 : 24), {
      align: 'center',
      color: THEME.goldText,
      fixedWidth: cardWidth - 14,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '12px' : '14px',
      fontStyle: 'bold',
      wordWrap: { width: cardWidth - 14 },
    }).setOrigin(0.5, 0));
    panel.add(this.add.text(centerX, cardTop + (isCompactPanel ? 88 : 99), this.getCompactBossBattleText(this.getLocalizedBossClass(boss), isCompactPanel ? 18 : 24), {
      align: 'center',
      color: THEME.text,
      fixedWidth: cardWidth - 14,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '10px' : '11px',
      wordWrap: { width: cardWidth - 14 },
    }).setOrigin(0.5, 0));

    panel.add(this.add.text(centerX, cardTop + (isCompactPanel ? 102 : 114), this.getCompactBossBattleText(branchText, isCompactPanel ? 20 : 28), {
      align: 'center',
      color: '#fff4a8',
      fixedWidth: cardWidth - 14,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '9px' : '10px',
      wordWrap: { width: cardWidth - 14 },
    }).setOrigin(0.5, 0));
    panel.add(this.add.text(centerX, cardTop + (isCompactPanel ? 116 : 130), this.t('ui.bossBattle.bossProgress', {
      cleared: clearedCount,
      total: boss.stages.length,
    }), {
      align: 'center',
      color: statusText === this.t('ui.bossBattle.cleared') ? '#cdebb3' : THEME.mutedText,
      fixedWidth: cardWidth - 14,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '10px' : '11px',
    }).setOrigin(0.5, 0));
    panel.add(this.add.text(centerX, cardTop + (isCompactPanel ? 130 : 146), this.getCompactBossBattleText(rewardText, isCompactPanel ? 28 : 38), {
      align: 'center',
      color: THEME.mutedText,
      fixedWidth: cardWidth - 14,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '9px' : '10px',
      wordWrap: { width: cardWidth - 14 },
    }).setOrigin(0.5, 0));

    this.addBattleButton(
      panel,
      centerX,
      cardTop + cardHeight - (isCompactPanel ? 17 : 19),
      Math.min(cardWidth - 24, 112),
      isCompactPanel ? 28 : 30,
      this.t('ui.bossBattle.enter'),
      THEME.buttonWarm,
      '#ffffff',
      () => this.enterBossBattleRoom(boss.id),
      !this.battleAnimationInProgress,
    );
  }

  private addBossBattleContent(
    panel: Phaser.GameObjects.Container,
    boss: BossBattleDefinition,
    stage: BossBattleStage,
    panelWidth: number,
    panelHeight: number,
  ): void {
    const isCompactPanel = panelWidth < 420;
    const contentLeft = -panelWidth / 2 + 24;
    const contentWidth = panelWidth - 48;
    const session = this.bossBattleSession?.stageId === stage.id ? this.bossBattleSession : undefined;
    const isCleared = isBossStageCleared(stage.id, this.claimedBossBattleStageIds);
    const dailyClearsRemaining = this.getBossDailyClearsRemaining(stage.bossId);
    const team = session?.team ?? getAutoBattleTeam(this.farmSlots, stage.teamSize);
    const bossHp = session?.bossHp ?? stage.hp;
    const bossHpRatio = Phaser.Math.Clamp(bossHp / stage.hp, 0, 1);
    const stageY = -panelHeight / 2 + (isCompactPanel ? 58 : 62);
    const arenaTop = stageY + (isCompactPanel ? 104 : 112);
    const arenaHeight = isCompactPanel ? 210 : 224;
    const actionTop = arenaTop + arenaHeight + (isCompactPanel ? 10 : 14);
    const stageButtonHeight = isCompactPanel ? 30 : 34;
    this.bossBattleStagePageIndex = this.getClampedBossBattleStagePageIndex(this.bossBattleStagePageIndex, boss);

    this.addBattleButton(
      panel,
      contentLeft + (isCompactPanel ? 44 : 50),
      stageY + 17,
      isCompactPanel ? 82 : 96,
      stageButtonHeight,
      this.t('ui.bossBattle.back'),
      THEME.button,
      '#ffffff',
      () => this.backToBossBattleSelect(),
      !this.battleAnimationInProgress,
    );

    panel.add(this.add.text(0, stageY - 2, this.t('ui.bossBattle.stage', {
      current: this.bossBattleStageIndex + 1,
      total: boss.stages.length,
    }), {
      align: 'center',
      color: THEME.mutedText,
      fixedWidth: contentWidth - (isCompactPanel ? 164 : 192),
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '11px' : '12px',
    }).setOrigin(0.5, 0));

    panel.add(this.add.text(0, stageY + 20, this.getCompactBossBattleText(this.getLocalizedBossStageName(stage), isCompactPanel ? 26 : 34), {
      align: 'center',
      color: THEME.goldText,
      fixedWidth: contentWidth - (isCompactPanel ? 164 : 192),
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '16px' : '18px',
      fontStyle: 'bold',
      wordWrap: { width: contentWidth - (isCompactPanel ? 164 : 192) },
    }).setOrigin(0.5, 0));

    this.addBossBattleStageSelector(panel, boss, stageY + 50, contentWidth, isCompactPanel);

    const rewardText = isCleared
      ? this.t('ui.bossBattle.replayReward', { reward: this.getBossBattleFullRewardText(stage.replayReward, stage.replayFragmentReward) })
      : this.t('ui.bossBattle.firstClearReward', { reward: this.getBossBattleFullRewardText(stage.firstClearReward, stage.firstClearFragmentReward) });
    panel.add(this.add.text(contentLeft + contentWidth, stageY + (isCompactPanel ? 14 : 18), isCleared ? this.t('ui.bossBattle.cleared') : this.t('ui.bossBattle.readySkill'), {
      align: 'center',
      backgroundColor: `#${(isCleared ? THEME.buttonHover : THEME.buttonWarm).toString(16).padStart(6, '0')}`,
      color: '#ffffff',
      fixedWidth: isCompactPanel ? 70 : 82,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '10px' : '11px',
      fontStyle: 'bold',
      padding: { y: 4 },
    }).setOrigin(1, 0.5));

    panel.add(this.add.text(0, stageY + (isCompactPanel ? 78 : 84), this.getCompactBossBattleText(rewardText, isCompactPanel ? 42 : 54), {
      align: 'center',
      color: isCleared ? '#cdebb3' : THEME.goldText,
      fixedWidth: contentWidth,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '11px' : '12px',
      wordWrap: { width: contentWidth },
    }).setOrigin(0.5, 0));

    const clearsLeftText = this.t('ui.bossBattle.clearsLeft', {
      remaining: dailyClearsRemaining,
      max: BOSS_DAILY_CLEAR_LIMIT,
    });
    const dailyLimitText = dailyClearsRemaining > 0
      ? clearsLeftText
      : `${clearsLeftText} - ${this.t('ui.bossBattle.resetsTomorrow')}`;

    panel.add(this.add.text(0, stageY + (isCompactPanel ? 94 : 101), dailyLimitText, {
      align: 'center',
      color: dailyClearsRemaining > 0 ? THEME.mutedText : '#ffcfba',
      fixedWidth: contentWidth,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '9px' : '10px',
    }).setOrigin(0.5, 0));

    panel.add(this.add.rectangle(0, arenaTop + arenaHeight / 2, contentWidth, arenaHeight, 0x102a1c, 0.42)
      .setStrokeStyle(2, THEME.panelBorder, 0.34));

    panel.add(this.add.text(contentLeft + 76, arenaTop + 14, this.t('ui.bossBattle.team'), {
      color: THEME.text,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '12px' : '13px',
      fontStyle: 'bold',
    }).setOrigin(0.5));
    panel.add(this.add.text(panelWidth / 2 - 96, arenaTop + 14, this.t('ui.bossBattle.boss'), {
      color: THEME.text,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '12px' : '13px',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    const teamLeft = contentLeft + 16;
    const teamTop = arenaTop + 38;
    const teamWidth = contentWidth * 0.47;
    this.addBossBattleTeamCards(panel, team, teamLeft, teamTop, teamWidth, isCompactPanel, session);
    if (this.bossBattlePlayerVisualEffect?.kind === 'support') {
      this.addBossBattleSupportEffect(panel, this.bossBattlePlayerVisualEffect, teamLeft, teamTop, teamWidth, team.length, isCompactPanel);
    }

    const bossX = panelWidth * 0.23;
    const bossY = arenaTop + (isCompactPanel ? 130 : 138);
    const bossHpWidth = Math.min(isCompactPanel ? 138 : 168, contentWidth * 0.42);
    panel.add(this.add.rectangle(bossX - bossHpWidth / 2, arenaTop + 36, bossHpWidth, 12, 0x14231a, 0.9)
      .setOrigin(0)
      .setStrokeStyle(1, THEME.panelBorder, 0.76));
    panel.add(this.add.rectangle(bossX - bossHpWidth / 2 + 2, arenaTop + 42, Math.max(1, bossHpWidth - 4), 8, 0xd9574f, 0.96)
      .setOrigin(0, 0.5)
      .setScale(bossHpRatio, 1));
    panel.add(this.add.text(bossX, arenaTop + 52, this.t('ui.bossBattle.hpValue', {
      current: bossHp,
      max: stage.hp,
    }), {
      color: THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '10px' : '11px',
    }).setOrigin(0.5, 0));

    const enemyContainer = this.add.container(bossX, bossY);
    this.addBossBattleHumanVisual(enemyContainer, boss, isCompactPanel ? 0.9 : 1);
    panel.add(enemyContainer);

    if (this.bossBattlePlayerVisualEffect?.kind === 'damage') {
      this.addBossBattlePlayerImpactEffect(panel, enemyContainer, this.bossBattlePlayerVisualEffect, isCompactPanel);
    }

    if (this.bossBattleBossVisualEffect) {
      this.addBossBattleAttackEffect(panel, enemyContainer, this.bossBattleBossVisualEffect, team, teamLeft, teamTop, teamWidth, isCompactPanel);
    }

    const statusText = this.add.text(0, actionTop, this.getCompactBossBattleText(
      this.getBossBattleStatusText(stage, session),
      isCompactPanel ? 48 : 72,
    ), {
      align: 'center',
      color: session?.status === 'victory' ? THEME.goldText : THEME.mutedText,
      fixedWidth: contentWidth,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '12px' : '14px',
      fontStyle: 'bold',
      wordWrap: { width: contentWidth },
    }).setOrigin(0.5, 0);
    statusText.setMaxLines(1);
    panel.add(statusText);

    if (this.bossBattleLogText) {
      const logText = this.add.text(0, actionTop + (isCompactPanel ? 20 : 23), this.getCompactBossBattleLogText(this.bossBattleLogText, isCompactPanel), {
        align: 'center',
        color: THEME.text,
        fixedWidth: contentWidth,
        fontFamily: UI_FONT_FAMILY,
        fontSize: isCompactPanel ? '10px' : '11px',
        wordWrap: { width: contentWidth },
      }).setOrigin(0.5, 0);
      logText.setMaxLines(isCompactPanel ? 2 : 3);
      panel.add(logText);
    }

    if (team.length === 0 && !isCleared) {
      panel.add(this.add.text(0, actionTop + (isCompactPanel ? 46 : 52), this.t('ui.bossBattle.noTeam'), {
        align: 'center',
        color: THEME.mutedText,
        fixedWidth: contentWidth,
        fontFamily: UI_FONT_FAMILY,
        fontSize: isCompactPanel ? '12px' : '14px',
        wordWrap: { width: contentWidth },
      }).setOrigin(0.5));
      return;
    }

    if (!session || session.status !== 'ready') {
      this.addBossBattleStartControls(panel, stage, actionTop + (isCompactPanel ? 80 : 88), contentWidth, isCompactPanel, session);
      return;
    }

    this.addBossBattleSkillControls(panel, session, actionTop + (isCompactPanel ? 80 : 88), contentWidth, isCompactPanel);
  }

  private addBossBattleStageSelector(
    panel: Phaser.GameObjects.Container,
    boss: BossBattleDefinition,
    y: number,
    contentWidth: number,
    isCompactPanel: boolean,
  ): void {
    const pageCount = this.getBossBattleStagePageCount(boss);
    const visibleStages = this.getVisibleBossBattleStageEntries(boss);
    const gap = isCompactPanel ? 5 : 6;
    const navWidth = pageCount > 1 ? (isCompactPanel ? 32 : 38) : 0;
    const navGap = pageCount > 1 ? gap : 0;
    const availableWidth = contentWidth - navWidth * 2 - navGap * 2;
    const chipWidth = Math.min(isCompactPanel ? 42 : 50, (availableWidth - gap * Math.max(0, visibleStages.length - 1)) / Math.max(1, visibleStages.length));
    const chipHeight = isCompactPanel ? 27 : 30;
    const totalChipWidth = chipWidth * visibleStages.length + gap * Math.max(0, visibleStages.length - 1);
    const chipsStartX = -totalChipWidth / 2 + chipWidth / 2;
    const controlsEnabled = !this.battleAnimationInProgress;

    if (pageCount > 1) {
      this.addBattleButton(
        panel,
        -contentWidth / 2 + navWidth / 2,
        y,
        navWidth,
        chipHeight,
        '<',
        THEME.button,
        '#ffffff',
        () => this.selectBossBattleStagePage(this.bossBattleStagePageIndex - 1),
        this.bossBattleStagePageIndex > 0 && controlsEnabled,
      );
      this.addBattleButton(
        panel,
        contentWidth / 2 - navWidth / 2,
        y,
        navWidth,
        chipHeight,
        '>',
        THEME.button,
        '#ffffff',
        () => this.selectBossBattleStagePage(this.bossBattleStagePageIndex + 1),
        this.bossBattleStagePageIndex < pageCount - 1 && controlsEnabled,
      );
    }

    visibleStages.forEach(({ stage, index }, visibleIndex) => {
      const isSelected = index === this.bossBattleStageIndex;
      this.addBattleButton(
        panel,
        chipsStartX + visibleIndex * (chipWidth + gap),
        y,
        chipWidth,
        chipHeight,
        stage.stageNumber.toString(),
        isSelected ? THEME.buttonHover : THEME.button,
        isSelected ? '#fff4a8' : '#ffffff',
        () => this.selectBossBattleStage(index),
        !isSelected && controlsEnabled,
      );
    });
  }

  private addBossBattleStartControls(
    panel: Phaser.GameObjects.Container,
    stage: BossBattleStage,
    y: number,
    contentWidth: number,
    isCompactPanel: boolean,
    session: BattleSessionState | undefined,
  ): void {
    const buttonWidth = Math.min(isCompactPanel ? 138 : 164, contentWidth * 0.45);
    const isCleared = isBossStageCleared(stage.id, this.claimedBossBattleStageIds);
    const controlsEnabled = !this.battleAnimationInProgress;
    const dailyClearsRemaining = this.getBossDailyClearsRemaining(stage.bossId);
    const canClearToday = dailyClearsRemaining > 0;
    const firstClearX2Opportunity = this.getBossBattleRewardX2Opportunity(stage.id, 'first-clear');

    if (firstClearX2Opportunity) {
      this.addBattleButton(
        panel,
        0,
        y,
        buttonWidth,
        isCompactPanel ? 34 : 38,
        this.t('ui.bossBattle.watchAdX2'),
        THEME.buttonHover,
        '#ffffff',
        () => {
          void this.claimBossBattleRewardX2(stage, 'first-clear');
        },
        controlsEnabled && !firstClearX2Opportunity.adInProgress,
      );
      this.addBossBattleAdDetail(
        panel,
        0,
        y + (isCompactPanel ? 23 : 26),
        buttonWidth,
        firstClearX2Opportunity.adInProgress
          ? this.t('ui.bossBattle.adPending')
          : this.t('ui.bossBattle.firstClearX2Detail'),
        isCompactPanel,
      );
      return;
    }

    if (isCleared) {
      const autoClearX2Opportunity = this.getBossBattleRewardX2Opportunity(stage.id, 'auto-clear');
      const gap = isCompactPanel ? 8 : 10;
      const twoButtonWidth = Math.min(isCompactPanel ? 132 : 158, (contentWidth - gap) / 2);

      this.addBattleButton(
        panel,
        -twoButtonWidth / 2 - gap / 2,
        y,
        twoButtonWidth,
        isCompactPanel ? 34 : 38,
        this.t('ui.bossBattle.autoClear'),
        THEME.buttonWarm,
        '#ffffff',
        () => this.autoClearBossBattle(stage),
        controlsEnabled && canClearToday && !autoClearX2Opportunity?.adInProgress,
      );
      this.addBattleButton(
        panel,
        twoButtonWidth / 2 + gap / 2,
        y,
        twoButtonWidth,
        isCompactPanel ? 34 : 38,
        this.t('ui.bossBattle.autoClearX2'),
        THEME.buttonHover,
        '#ffffff',
        () => {
          void this.autoClearBossBattleWithX2(stage);
        },
        controlsEnabled && canClearToday && !autoClearX2Opportunity?.adInProgress,
      );
      this.addBossBattleAdDetail(
        panel,
        twoButtonWidth / 2 + gap / 2,
        y + (isCompactPanel ? 23 : 26),
        twoButtonWidth,
        canClearToday
          ? autoClearX2Opportunity?.adInProgress
            ? this.t('ui.bossBattle.adPending')
            : this.t('ui.bossBattle.autoClearX2Detail')
          : this.t('ui.bossBattle.resetsTomorrow'),
        isCompactPanel,
        canClearToday ? THEME.mutedText : '#ffcfba',
      );
      return;
    }

    if (session?.status === 'defeat' && !session.reviveUsed) {
      const gap = isCompactPanel ? 8 : 10;
      panel.add(this.add.text(0, y - 42, this.t('ui.bossBattle.defeatDetail'), {
        align: 'center',
        color: '#ffcfba',
        fixedWidth: contentWidth,
        fontFamily: UI_FONT_FAMILY,
        fontSize: isCompactPanel ? '11px' : '12px',
        wordWrap: { width: contentWidth },
      }).setOrigin(0.5, 0));
      this.addBattleButton(panel, -buttonWidth / 2 - gap / 2, y, buttonWidth, isCompactPanel ? 34 : 38, this.t('ui.bossBattle.startFight'), THEME.buttonWarm, '#ffffff', () => {
        this.startBossBattle(stage);
      }, controlsEnabled && canClearToday);
      this.addBattleButton(panel, buttonWidth / 2 + gap / 2, y, buttonWidth, isCompactPanel ? 34 : 38, this.t('ui.bossBattle.reviveAd'), THEME.buttonRitual, '#ffffff', () => {
        void this.reviveBossBattleWithAd();
      }, controlsEnabled);
      panel.add(this.add.text(0, y + 24, this.t('ui.bossBattle.reviveHint'), {
        align: 'center',
        color: THEME.mutedText,
        fixedWidth: contentWidth,
        fontFamily: UI_FONT_FAMILY,
        fontSize: isCompactPanel ? '10px' : '11px',
        wordWrap: { width: contentWidth },
      }).setOrigin(0.5, 0));
      return;
    }

    this.addBattleButton(panel, 0, y, buttonWidth, isCompactPanel ? 34 : 38, this.t('ui.bossBattle.startFight'), THEME.buttonWarm, '#ffffff', () => {
      this.startBossBattle(stage);
    }, controlsEnabled && canClearToday);
  }

  private addBossBattleAdDetail(
    panel: Phaser.GameObjects.Container,
    x: number,
    y: number,
    width: number,
    text: string,
    isCompactPanel: boolean,
    color = THEME.mutedText,
  ): void {
    const detailText = this.add.text(x, y, text, {
      align: 'center',
      color,
      fixedWidth: width,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '9px' : '10px',
    }).setOrigin(0.5, 0);

    detailText.setMaxLines(1);
    panel.add(detailText);
  }

  private addBossBattleSkillControls(
    panel: Phaser.GameObjects.Container,
    session: BattleSessionState,
    y: number,
    contentWidth: number,
    isCompactPanel: boolean,
  ): void {
    const activeMonster = getActiveBattleMonster(session);

    if (!activeMonster) {
      return;
    }

    const skills = getAvailableSkillsForMonster(activeMonster);
    const gap = isCompactPanel ? 6 : 8;
    const buttonWidth = Math.min(isCompactPanel ? 104 : 132, (contentWidth - gap * (skills.length - 1)) / Math.max(1, skills.length));
    const startX = -((buttonWidth + gap) * (skills.length - 1)) / 2;

    panel.add(this.add.text(0, y - 32, this.t('ui.bossBattle.activeTurn', {
      family: this.t(`family.${activeMonster.family}`),
      level: activeMonster.level,
    }), {
      align: 'center',
      color: THEME.text,
      fixedWidth: contentWidth,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '11px' : '12px',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    skills.forEach((skill, index) => {
      const cooldown = this.getBattleSkillCooldown(session, activeMonster.id, skill.id);
      const canUse = canUseBattleSkill(session, skill.id) && !this.battleAnimationInProgress;
      const label = cooldown > 0
        ? this.t('ui.bossBattle.cooldownShort', { turns: cooldown })
        : `${this.t(skill.labelKey)}\n${this.getBossBattleSkillEffectText(skill, activeMonster)}`;

      this.addBattleButton(
        panel,
        startX + index * (buttonWidth + gap),
        y,
        buttonWidth,
        isCompactPanel ? 32 : 36,
        label,
        canUse ? THEME.buttonWarm : THEME.lockedInner,
        canUse ? '#ffffff' : '#cdebb3',
        () => this.useBossBattleSkill(skill.id),
        canUse,
      );
    });
  }

  private addBossBattleTeamCards(
    panel: Phaser.GameObjects.Container,
    team: readonly BattleMonsterSnapshot[],
    leftX: number,
    topY: number,
    width: number,
    isCompactPanel: boolean,
    session: BattleSessionState | undefined,
  ): void {
    const cardHeight = isCompactPanel ? 54 : 60;
    const gap = isCompactPanel ? 7 : 9;
    const activeMonster = session ? getActiveBattleMonster(session) : undefined;

    team.forEach((monster, index) => {
      const y = topY + index * (cardHeight + gap);
      const isActive = activeMonster?.id === monster.id;
      const isTargeted = this.bossBattleTargetMonsterId === monster.id;
      const isDown = monster.hp <= 0;
      const hpRatio = Phaser.Math.Clamp(monster.hp / monster.maxHp, 0, 1);

      const cardBackground = this.add.rectangle(leftX + width / 2, y + cardHeight / 2, width, cardHeight, isDown ? 0x29362f : isActive ? 0x2f6b45 : THEME.panelAlt, isDown ? 0.72 : 0.9)
        .setStrokeStyle(2, isTargeted ? THEME.warning : isActive ? THEME.panelBorder : THEME.lockedBorder, isTargeted ? 0.96 : isActive ? 0.86 : 0.52);
      panel.add(cardBackground);
      const monsterIcon = this.add.container(leftX + 29, y + 27).setAlpha(isDown ? 0.46 : 1);
      this.monsterRenderer.addMonsterVisual(monsterIcon, monster, 0, 0, isCompactPanel ? 0.34 : 0.39);
      panel.add(monsterIcon);
      panel.add(this.add.text(leftX + 58, y + 5, this.t('ui.bossBattle.monsterTurnName', {
        family: this.t(`family.${monster.family}`),
        level: monster.level,
      }), {
        color: THEME.text,
        fontFamily: UI_FONT_FAMILY,
        fontSize: isCompactPanel ? '9px' : '10px',
        fontStyle: 'bold',
        fixedWidth: width - 64,
      }));
      panel.add(this.add.text(leftX + 58, y + 21, this.t('ui.bossBattle.hpValue', {
        current: monster.hp,
        max: monster.maxHp,
      }), {
        color: THEME.mutedText,
        fontFamily: UI_FONT_FAMILY,
        fontSize: isCompactPanel ? '9px' : '10px',
      }));
      panel.add(this.add.text(leftX + width - 8, y + 21, isDown ? this.t('ui.bossBattle.down') : isActive ? this.t('ui.bossBattle.active') : '', {
        align: 'right',
        color: isDown ? '#ffb5a8' : '#fff4a8',
        fontFamily: UI_FONT_FAMILY,
        fontSize: isCompactPanel ? '9px' : '10px',
        fontStyle: 'bold',
      }).setOrigin(1, 0));
      panel.add(this.add.rectangle(leftX + 58, y + cardHeight - 10, width - 70, 7, 0x14231a, 0.9)
        .setOrigin(0, 0.5));
      panel.add(this.add.rectangle(leftX + 60, y + cardHeight - 10, Math.max(1, (width - 74) * hpRatio), 4, 0x6fbd64, 0.96)
        .setOrigin(0, 0.5));

      if (this.bossBattleBossVisualEffect?.targetId === monster.id) {
        this.addBossBattleTargetHitEffect(panel, cardBackground, monsterIcon, this.bossBattleBossVisualEffect.damage, leftX, y, width, cardHeight, isCompactPanel);
      }
    });
  }

  private addBossBattlePlayerImpactEffect(
    panel: Phaser.GameObjects.Container,
    enemyContainer: Phaser.GameObjects.Container,
    effect: BossBattlePlayerVisualEffect,
    isCompactPanel: boolean,
  ): void {
    const style = this.getBossBattleSkillVisualStyle(effect.skillId);
    const color = style.primary;
    const impactX = enemyContainer.x - (isCompactPanel ? 8 : 12);
    const impactY = enemyContainer.y - (isCompactPanel ? 22 : 28);
    const ring = this.add.circle(impactX, impactY, style.radius * (isCompactPanel ? 0.82 : 1), color, 0.18)
      .setStrokeStyle(isCompactPanel ? 3 : 4, style.accent, 0.92);
    const damageText = this.add.text(impactX + (isCompactPanel ? 16 : 20), impactY - 12, `-${effect.amount}`, {
      color: '#fff4a8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '15px' : '17px',
      fontStyle: 'bold',
      stroke: '#5a241d',
      strokeThickness: 4,
    }).setOrigin(0.5);

    panel.add(ring);
    panel.add(damageText);
    this.addBossBattleSkillSpecificImpact(panel, effect.skillId, impactX, impactY, isCompactPanel);
    this.tweens.add({
      alpha: 0,
      duration: 420,
      ease: 'Sine.easeOut',
      scale: style.impactScale,
      targets: ring,
    });
    this.tweens.add({
      alpha: 0,
      duration: 500,
      ease: 'Sine.easeOut',
      targets: damageText,
      y: damageText.y - (isCompactPanel ? 24 : 28),
    });
    this.tweens.add({
      duration: 92,
      ease: 'Sine.easeOut',
      scaleX: 1.12,
      scaleY: 0.9,
      targets: enemyContainer,
      x: enemyContainer.x + (isCompactPanel ? 4 : 6),
      yoyo: true,
    });

    for (let index = 0; index < style.particleCount; index += 1) {
      const angle = (Math.PI * 2 * index) / style.particleCount;
      const spark = this.add.circle(impactX, impactY, isCompactPanel ? 2.5 : 3, index % 2 === 0 ? color : style.accent, 0.9);
      panel.add(spark);
      this.tweens.add({
        alpha: 0,
        duration: 360,
        ease: 'Sine.easeOut',
        targets: spark,
        x: impactX + Math.cos(angle) * style.spread * (isCompactPanel ? 0.78 : 1),
        y: impactY + Math.sin(angle) * style.spread * (isCompactPanel ? 0.54 : 0.68),
      });
    }

    if (style.label) {
      const label = this.add.text(impactX, impactY + (isCompactPanel ? 20 : 24), style.label, {
        color: style.labelColor,
        fontFamily: UI_FONT_FAMILY,
        fontSize: isCompactPanel ? '11px' : '12px',
        fontStyle: 'bold',
        stroke: '#173c27',
        strokeThickness: 3,
      }).setOrigin(0.5);

      panel.add(label);
      this.tweens.add({
        alpha: 0,
        duration: 460,
        ease: 'Sine.easeOut',
        targets: label,
        y: label.y - (isCompactPanel ? 18 : 22),
      });
    }
  }

  private addBossBattleSupportEffect(
    panel: Phaser.GameObjects.Container,
    effect: BossBattlePlayerVisualEffect,
    leftX: number,
    topY: number,
    width: number,
    teamSize: number,
    isCompactPanel: boolean,
  ): void {
    const cardHeight = isCompactPanel ? 54 : 60;
    const gap = isCompactPanel ? 7 : 9;
    const visibleCardCount = Math.max(1, Math.min(teamSize, 3));
    const effectX = leftX + width / 2;
    const effectY = topY + ((cardHeight + gap) * visibleCardCount - gap) / 2;
    const style = this.getBossBattleSkillVisualStyle(effect.skillId);
    const label = effect.amount > 0 ? `+${effect.amount}` : this.getBossBattleSupportEffectLabel(effect.skillId);
    const aura = this.add.rectangle(effectX, effectY, width + 8, cardHeight * 0.78, style.primary, 0.14)
      .setStrokeStyle(2, style.accent, 0.75);
    const text = this.add.text(effectX, effectY - (isCompactPanel ? 22 : 26), label, {
      color: '#dfffd2',
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '14px' : '16px',
      fontStyle: 'bold',
      stroke: '#15341f',
      strokeThickness: 4,
    }).setOrigin(0.5);

    panel.add(aura);
    panel.add(text);
    this.addBossBattleSupportParticles(panel, effect.skillId, effectX, effectY, width, isCompactPanel);
    this.tweens.add({
      alpha: 0,
      duration: 520,
      ease: 'Sine.easeOut',
      scaleX: 1.08,
      scaleY: 1.35,
      targets: aura,
    });
    this.tweens.add({
      alpha: 0,
      duration: 520,
      ease: 'Sine.easeOut',
      targets: text,
      y: text.y - (isCompactPanel ? 18 : 22),
    });
  }

  private addBossBattleSkillSpecificImpact(
    panel: Phaser.GameObjects.Container,
    skillId: BattleSkillId,
    x: number,
    y: number,
    isCompactPanel: boolean,
  ): void {
    const style = this.getBossBattleSkillVisualStyle(skillId);

    if (skillId === 'slime-surge') {
      const wave = this.add.ellipse(x - 8, y + 4, isCompactPanel ? 56 : 72, isCompactPanel ? 18 : 22, style.primary, 0.2)
        .setStrokeStyle(3, style.accent, 0.75);
      panel.add(wave);
      this.tweens.add({
        alpha: 0,
        duration: 420,
        ease: 'Sine.easeOut',
        scaleX: 1.28,
        targets: wave,
      });
      return;
    }

    if (skillId === 'poison-puff' || skillId === 'daze-dust') {
      const cloudCount = isCompactPanel ? 4 : 5;
      for (let index = 0; index < cloudCount; index += 1) {
        const cloud = this.add.circle(
          x + (index - cloudCount / 2) * (isCompactPanel ? 8 : 10),
          y + (index % 2 === 0 ? -4 : 6),
          isCompactPanel ? 8 : 10,
          index % 2 === 0 ? style.primary : style.accent,
          0.26,
        );
        panel.add(cloud);
        this.tweens.add({
          alpha: 0,
          duration: 520,
          ease: 'Sine.easeOut',
          targets: cloud,
          x: cloud.x + (index - 2) * 4,
          y: cloud.y - (isCompactPanel ? 12 : 16),
        });
      }
      return;
    }

    if (skillId === 'thorn-jab' || skillId === 'thorn-storm') {
      const needleCount = skillId === 'thorn-storm' ? (isCompactPanel ? 5 : 7) : 2;
      for (let index = 0; index < needleCount; index += 1) {
        const needle = this.add.rectangle(
          x - (isCompactPanel ? 26 : 34) - index * 2,
          y - (needleCount / 2 - index) * 5,
          isCompactPanel ? 20 : 25,
          3,
          style.primary,
          0.9,
        ).setRotation(-0.22 + index * 0.08);
        panel.add(needle);
        this.tweens.add({
          alpha: 0,
          duration: 340,
          ease: 'Sine.easeOut',
          targets: needle,
          x: x + (isCompactPanel ? 16 : 22),
        });
      }
      return;
    }

    if (skillId === 'dream-shot' || skillId === 'dream-burst') {
      const sparkleCount = skillId === 'dream-burst' ? (isCompactPanel ? 6 : 8) : 4;
      for (let index = 0; index < sparkleCount; index += 1) {
        const sparkle = this.add.text(x, y, '*', {
          color: index % 2 === 0 ? '#d6d2ff' : '#8ad7ff',
          fontFamily: UI_FONT_FAMILY,
          fontSize: isCompactPanel ? '13px' : '15px',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        const angle = (Math.PI * 2 * index) / sparkleCount;
        panel.add(sparkle);
        this.tweens.add({
          alpha: 0,
          duration: 420,
          ease: 'Sine.easeOut',
          targets: sparkle,
          x: x + Math.cos(angle) * (isCompactPanel ? 24 : 32),
          y: y + Math.sin(angle) * (isCompactPanel ? 16 : 22),
        });
      }
      return;
    }

    if (skillId === 'splash-hit' || skillId === 'spore-bonk') {
      const dropCount = isCompactPanel ? 4 : 5;
      for (let index = 0; index < dropCount; index += 1) {
        const drop = this.add.circle(x, y, isCompactPanel ? 3 : 4, index % 2 === 0 ? style.primary : style.accent, 0.85);
        const angle = -Math.PI + (Math.PI * index) / Math.max(1, dropCount - 1);
        panel.add(drop);
        this.tweens.add({
          alpha: 0,
          duration: 360,
          ease: 'Sine.easeOut',
          targets: drop,
          x: x + Math.cos(angle) * (isCompactPanel ? 20 : 26),
          y: y + Math.sin(angle) * (isCompactPanel ? 14 : 18),
        });
      }
    }
  }

  private addBossBattleSupportParticles(
    panel: Phaser.GameObjects.Container,
    skillId: BattleSkillId,
    x: number,
    y: number,
    width: number,
    isCompactPanel: boolean,
  ): void {
    const style = this.getBossBattleSkillVisualStyle(skillId);
    const count = skillId === 'healing-spores' ? (isCompactPanel ? 6 : 8) : (isCompactPanel ? 5 : 6);

    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const radiusX = width * 0.38;
      const radiusY = isCompactPanel ? 24 : 30;
      const particle = skillId === 'needle-guard'
        ? this.add.rectangle(x, y, isCompactPanel ? 13 : 16, 3, style.accent, 0.9).setRotation(angle)
        : this.add.circle(x, y, isCompactPanel ? 3 : 4, index % 2 === 0 ? style.primary : style.accent, 0.85);

      panel.add(particle);
      this.tweens.add({
        alpha: 0,
        duration: 520,
        ease: 'Sine.easeOut',
        targets: particle,
        x: x + Math.cos(angle) * radiusX,
        y: y + Math.sin(angle) * radiusY,
      });
    }
  }

  private addBossBattleAttackEffect(
    panel: Phaser.GameObjects.Container,
    enemyContainer: Phaser.GameObjects.Container,
    effect: BossBattleBossVisualEffect,
    team: readonly BattleMonsterSnapshot[],
    leftX: number,
    topY: number,
    width: number,
    isCompactPanel: boolean,
  ): void {
    const targetPoint = this.getBossBattleTargetPoint(effect.targetId, team, leftX, topY, width, isCompactPanel);
    const style = this.getBossBattleAttackVisualStyle(effect.visualTheme);

    this.tweens.add({
      duration: 150,
      ease: 'Sine.easeOut',
      scaleX: 1.16,
      scaleY: 0.88,
      targets: enemyContainer,
      x: enemyContainer.x - (isCompactPanel ? 14 : 18),
      yoyo: true,
    });

    if (!targetPoint) {
      return;
    }

    const startX = enemyContainer.x - (isCompactPanel ? 38 : 46);
    const startY = enemyContainer.y - (isCompactPanel ? 24 : 28);
    const deltaX = targetPoint.x - startX;
    const deltaY = targetPoint.y - startY;
    const distance = Math.max(1, Math.sqrt(deltaX * deltaX + deltaY * deltaY));
    const slash = this.add.rectangle(startX + deltaX / 2, startY + deltaY / 2, distance, isCompactPanel ? 6 : 8, style.primary, 0.82)
      .setRotation(Math.atan2(deltaY, deltaX));
    const impact = this.add.circle(targetPoint.x, targetPoint.y, isCompactPanel ? 12 : 14, style.primary, 0.2)
      .setStrokeStyle(isCompactPanel ? 3 : 4, style.accent, 0.9);

    panel.add(slash);
    panel.add(impact);
    this.addBossBattleThemedAttackParticles(panel, effect.visualTheme, startX, startY, targetPoint.x, targetPoint.y, isCompactPanel);
    this.tweens.add({
      alpha: 0,
      duration: 360,
      ease: 'Sine.easeOut',
      scaleX: 0.35,
      targets: slash,
    });
    this.tweens.add({
      alpha: 0,
      duration: 420,
      ease: 'Sine.easeOut',
      scale: 2.1,
      targets: impact,
    });
  }

  private addBossBattleThemedAttackParticles(
    panel: Phaser.GameObjects.Container,
    visualTheme: BossVisualTheme,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    isCompactPanel: boolean,
  ): void {
    const style = this.getBossBattleAttackVisualStyle(visualTheme);
    const count = isCompactPanel ? 4 : 6;

    for (let index = 0; index < count; index += 1) {
      const progress = (index + 1) / (count + 1);
      const x = Phaser.Math.Linear(startX, targetX, progress);
      const y = Phaser.Math.Linear(startY, targetY, progress);
      const offset = (index % 2 === 0 ? -1 : 1) * (isCompactPanel ? 5 : 7);
      const particle = this.createBossBattleAttackParticle(visualTheme, x, y + offset, style, isCompactPanel, index);

      panel.add(particle);
      this.tweens.add({
        alpha: 0,
        duration: 420,
        ease: 'Sine.easeOut',
        targets: particle,
        x: x + (targetX - startX) * 0.08,
        y: y + offset * 1.5,
      });
    }
  }

  private createBossBattleAttackParticle(
    visualTheme: BossVisualTheme,
    x: number,
    y: number,
    style: { primary: number; accent: number; textColor: string },
    isCompactPanel: boolean,
    index: number,
  ): Phaser.GameObjects.GameObject {
    if (visualTheme === 'programmer') {
      return this.add.rectangle(x, y, isCompactPanel ? 6 : 8, isCompactPanel ? 6 : 8, index % 2 === 0 ? style.primary : style.accent, 0.92)
        .setRotation(index % 2 === 0 ? 0.15 : -0.18);
    }

    if (visualTheme === 'chef') {
      return this.add.circle(x, y, isCompactPanel ? 4 : 5, index % 2 === 0 ? style.primary : style.accent, 0.9);
    }

    if (visualTheme === 'driver') {
      return this.add.rectangle(x, y, isCompactPanel ? 18 : 22, isCompactPanel ? 3 : 4, index % 2 === 0 ? style.primary : style.accent, 0.88)
        .setRotation(-0.08);
    }

    return this.add.text(x, y, index % 2 === 0 ? 'Z' : 'z', {
      color: style.textColor,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '12px' : '14px',
      fontStyle: 'bold',
      stroke: '#173c27',
      strokeThickness: 3,
    }).setOrigin(0.5);
  }

  private addBossBattleTargetHitEffect(
    panel: Phaser.GameObjects.Container,
    cardBackground: Phaser.GameObjects.Rectangle,
    monsterIcon: Phaser.GameObjects.Container,
    damage: number,
    leftX: number,
    y: number,
    width: number,
    cardHeight: number,
    isCompactPanel: boolean,
  ): void {
    const centerX = leftX + width / 2;
    const centerY = y + cardHeight / 2;
    const flash = this.add.rectangle(centerX, centerY, width + 6, cardHeight + 6, 0xfff0a8, 0.18)
      .setStrokeStyle(3, THEME.warning, 0.9);
    const damageText = this.add.text(centerX + width * 0.2, y + (isCompactPanel ? 10 : 12), `-${damage}`, {
      color: '#fff4a8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '14px' : '16px',
      fontStyle: 'bold',
      stroke: '#5a241d',
      strokeThickness: 4,
    }).setOrigin(0.5);

    panel.add(flash);
    panel.add(damageText);
    this.tweens.add({
      alpha: 0,
      duration: 620,
      ease: 'Sine.easeOut',
      scaleX: 1.04,
      scaleY: 1.18,
      targets: flash,
    });
    this.tweens.add({
      duration: 80,
      ease: 'Sine.easeOut',
      scaleX: 1.04,
      scaleY: 0.96,
      targets: cardBackground,
      yoyo: true,
    });
    this.tweens.add({
      duration: 80,
      ease: 'Sine.easeOut',
      targets: monsterIcon,
      x: monsterIcon.x - 5,
      yoyo: true,
    });
    this.tweens.add({
      alpha: 0,
      duration: 620,
      ease: 'Sine.easeOut',
      targets: damageText,
      y: damageText.y - (isCompactPanel ? 20 : 24),
    });
  }

  private getBossBattleTargetPoint(
    targetId: string | undefined,
    team: readonly BattleMonsterSnapshot[],
    leftX: number,
    topY: number,
    width: number,
    isCompactPanel: boolean,
  ): Phaser.Math.Vector2 | undefined {
    if (!targetId) {
      return undefined;
    }

    const targetIndex = team.findIndex((monster) => monster.id === targetId);

    if (targetIndex < 0) {
      return undefined;
    }

    const cardHeight = isCompactPanel ? 54 : 60;
    const gap = isCompactPanel ? 7 : 9;

    return new Phaser.Math.Vector2(leftX + width * 0.42, topY + targetIndex * (cardHeight + gap) + cardHeight / 2);
  }

  private getBossBattleSkillVisualStyle(skillId: BattleSkillId): {
    primary: number;
    accent: number;
    label?: string;
    labelColor: string;
    radius: number;
    impactScale: number;
    particleCount: number;
    spread: number;
  } {
    switch (skillId) {
      case 'splash-hit':
        return { primary: 0x74d8ff, accent: 0xbaf5ff, labelColor: '#baf5ff', radius: 11, impactScale: 2.15, particleCount: 5, spread: 26 };
      case 'jelly-guard':
        return { primary: 0x77e8cf, accent: 0xb8fff0, labelColor: '#dfffd2', radius: 13, impactScale: 2.05, particleCount: 5, spread: 24 };
      case 'slime-surge':
        return { primary: 0x3eb8ff, accent: 0xd6fbff, label: 'Rush', labelColor: '#d6fbff', radius: 15, impactScale: 2.6, particleCount: 7, spread: 34 };
      case 'spore-bonk':
        return { primary: 0x9be56a, accent: 0xe2ffba, labelColor: '#e2ffba', radius: 12, impactScale: 2.15, particleCount: 5, spread: 26 };
      case 'healing-spores':
        return { primary: 0x7bdd67, accent: 0xdfffd2, labelColor: '#dfffd2', radius: 13, impactScale: 2.1, particleCount: 6, spread: 26 };
      case 'poison-puff':
        return { primary: 0x9be56a, accent: 0xb06add, label: 'Poison', labelColor: '#d8b7ff', radius: 14, impactScale: 2.35, particleCount: 6, spread: 30 };
      case 'dream-shot':
        return { primary: 0x8ad7ff, accent: 0xb8a7ff, labelColor: '#d6d2ff', radius: 12, impactScale: 2.2, particleCount: 5, spread: 28 };
      case 'daze-dust':
        return { primary: 0xc6b18a, accent: 0x8ad7ff, label: 'Daze', labelColor: '#d6d2ff', radius: 13, impactScale: 2.25, particleCount: 5, spread: 28 };
      case 'dream-burst':
        return { primary: 0x8ad7ff, accent: 0xd6a8ff, label: 'Burst', labelColor: '#e8d7ff', radius: 16, impactScale: 2.75, particleCount: 8, spread: 36 };
      case 'thorn-jab':
        return { primary: 0xffd166, accent: 0xdfffd2, labelColor: '#fff4a8', radius: 11, impactScale: 2.05, particleCount: 4, spread: 24 };
      case 'needle-guard':
        return { primary: 0x6fbd64, accent: 0xffd166, labelColor: '#fff4a8', radius: 13, impactScale: 2.05, particleCount: 6, spread: 26 };
      case 'thorn-storm':
        return { primary: 0xffd166, accent: 0x9be56a, label: 'Storm', labelColor: '#fff4a8', radius: 15, impactScale: 2.55, particleCount: 8, spread: 36 };
      default:
        return { primary: 0x8ee8ff, accent: 0xd6fbff, labelColor: '#d6fbff', radius: 12, impactScale: 2.2, particleCount: 5, spread: 28 };
    }
  }

  private getBossBattleSupportEffectLabel(skillId: BattleSkillId): string {
    if (skillId === 'needle-guard') {
      return 'Counter';
    }

    return this.t('ui.bossBattle.skillShield');
  }

  private getBossBattleAttackVisualStyle(visualTheme: BossVisualTheme): {
    primary: number;
    accent: number;
    textColor: string;
  } {
    if (visualTheme === 'programmer') {
      return { primary: 0x78f3ff, accent: 0xb7fff2, textColor: '#b7fff2' };
    }

    if (visualTheme === 'chef') {
      return { primary: 0xff6b35, accent: 0xffd166, textColor: '#ffd7a8' };
    }

    if (visualTheme === 'driver') {
      return { primary: 0xffd84a, accent: 0xb7b3a8, textColor: '#fff4a8' };
    }

    return { primary: 0x8ad7ff, accent: 0x77e8cf, textColor: '#d6fbff' };
  }

  private addBossBattleHumanVisual(
    container: Phaser.GameObjects.Container,
    boss: BossBattleDefinition,
    scale: number,
  ): void {
    container.add(this.add.ellipse(0, 46 * scale, 78 * scale, 18 * scale, THEME.shadow, 0.24));

    const skin = 0xf4c49a;
    const outline = 0x473324;

    if (boss.visualTheme === 'programmer') {
      container.add(this.add.rectangle(0, 18 * scale, 42 * scale, 58 * scale, 0x5467d8, 0.96)
        .setStrokeStyle(3, 0x28306f, 0.82));
      container.add(this.add.circle(0, -24 * scale, 24 * scale, skin, 0.98)
        .setStrokeStyle(3, outline, 0.78));
      container.add(this.add.rectangle(-9 * scale, -25 * scale, 12 * scale, 7 * scale, 0xd9f4ff, 0.9)
        .setStrokeStyle(2, 0x24324a, 0.8));
      container.add(this.add.rectangle(9 * scale, -25 * scale, 12 * scale, 7 * scale, 0xd9f4ff, 0.9)
        .setStrokeStyle(2, 0x24324a, 0.8));
      container.add(this.add.rectangle(0, 34 * scale, 62 * scale, 30 * scale, 0x283045, 0.96)
        .setStrokeStyle(2, 0xaed9ff, 0.74));
      container.add(this.add.text(0, 25 * scale, '</>', {
        color: '#b7fff2',
        fontFamily: MONO_FONT_FAMILY,
        fontSize: `${Math.floor(13 * scale)}px`,
        fontStyle: 'bold',
      }).setOrigin(0.5));
      container.add(this.add.text(33 * scale, -42 * scale, '0/1', {
        color: '#b7fff2',
        fontFamily: MONO_FONT_FAMILY,
        fontSize: `${Math.floor(10 * scale)}px`,
      }).setOrigin(0.5));
      return;
    }

    if (boss.visualTheme === 'chef') {
      container.add(this.add.rectangle(0, 18 * scale, 44 * scale, 58 * scale, 0xffffff, 0.96)
        .setStrokeStyle(3, 0x8f3044, 0.7));
      container.add(this.add.circle(0, -22 * scale, 23 * scale, skin, 0.98)
        .setStrokeStyle(3, outline, 0.78));
      container.add(this.add.circle(-14 * scale, -46 * scale, 13 * scale, 0xffffff, 0.98));
      container.add(this.add.circle(0, -51 * scale, 15 * scale, 0xffffff, 0.98));
      container.add(this.add.circle(15 * scale, -46 * scale, 13 * scale, 0xffffff, 0.98));
      container.add(this.add.rectangle(0, -38 * scale, 44 * scale, 14 * scale, 0xffffff, 0.98)
        .setStrokeStyle(2, 0xd0d8dd, 0.8));
      container.add(this.add.ellipse(34 * scale, 14 * scale, 42 * scale, 20 * scale, 0x3c3b3a, 0.96)
        .setStrokeStyle(2, 0x151515, 0.75));
      container.add(this.add.rectangle(58 * scale, 11 * scale, 30 * scale, 6 * scale, 0x3c3b3a, 0.96));
      container.add(this.add.ellipse(-31 * scale, 4 * scale, 10 * scale, 26 * scale, 0xe64b35, 0.95).setAngle(-24));
      return;
    }

    if (boss.visualTheme === 'driver') {
      container.add(this.add.rectangle(0, 18 * scale, 46 * scale, 58 * scale, 0xf4c542, 0.96)
        .setStrokeStyle(3, 0x26231a, 0.82));
      container.add(this.add.circle(0, -22 * scale, 23 * scale, skin, 0.98)
        .setStrokeStyle(3, outline, 0.78));
      container.add(this.add.rectangle(0, -45 * scale, 42 * scale, 14 * scale, 0x202020, 0.96)
        .setStrokeStyle(2, 0xf4c542, 0.8));
      container.add(this.add.rectangle(14 * scale, -38 * scale, 28 * scale, 8 * scale, 0x202020, 0.96));
      container.add(this.add.circle(0, 26 * scale, 26 * scale, 0x2d2d2d, 0.96)
        .setStrokeStyle(4, 0xf7ffe8, 0.8));
      container.add(this.add.circle(0, 26 * scale, 7 * scale, 0xf4c542, 0.96));
      container.add(this.add.triangle(-40 * scale, -2 * scale, 0, -16 * scale, 14 * scale, 12 * scale, -14 * scale, 12 * scale, 0xf4c542, 0.98)
        .setStrokeStyle(2, 0x202020, 0.78));
      return;
    }

    container.add(this.add.rectangle(0, 18 * scale, 46 * scale, 62 * scale, 0xf7fffb, 0.96)
      .setStrokeStyle(3, 0x2a7f7c, 0.72));
    container.add(this.add.circle(0, -22 * scale, 23 * scale, skin, 0.98)
      .setStrokeStyle(3, outline, 0.78));
    container.add(this.add.rectangle(0, -44 * scale, 40 * scale, 12 * scale, 0xdff6f4, 0.96)
      .setStrokeStyle(2, 0x2a7f7c, 0.7));
    container.add(this.add.rectangle(0, -44 * scale, 6 * scale, 22 * scale, 0x2a7f7c, 0.96));
    container.add(this.add.rectangle(0, -44 * scale, 20 * scale, 6 * scale, 0x2a7f7c, 0.96));
    container.add(this.add.circle(-20 * scale, 4 * scale, 5 * scale, 0x2a7f7c, 0.98));
    container.add(this.add.circle(18 * scale, 4 * scale, 5 * scale, 0x2a7f7c, 0.98));
    container.add(this.add.arc(-1 * scale, 6 * scale, 20 * scale, 205, 335, false, 0x2a7f7c, 0.9)
      .setStrokeStyle(3, 0x2a7f7c, 0.9));
    container.add(this.add.rectangle(35 * scale, 24 * scale, 28 * scale, 24 * scale, 0x34a9a4, 0.96)
      .setStrokeStyle(2, 0x145f5c, 0.8));
    container.add(this.add.rectangle(35 * scale, 24 * scale, 17 * scale, 4 * scale, 0xffffff, 0.95));
    container.add(this.add.rectangle(35 * scale, 24 * scale, 4 * scale, 17 * scale, 0xffffff, 0.95));
  }

  private addBossBattleEnemyVisual(
    container: Phaser.GameObjects.Container,
    stage: BossBattleStage,
    scale: number,
  ): void {
    const shadow = this.add.ellipse(0, 36 * scale, 82 * scale, 18 * scale, THEME.shadow, 0.24);
    container.add(shadow);

    if (stage.bossId === 'byte-wizard') {
      container.add(this.add.rectangle(0, 4 * scale, 24 * scale, 62 * scale, 0x9b7446, 0.96)
        .setStrokeStyle(3, 0x5b3a21, 0.85));
      container.add(this.add.circle(0, -34 * scale, 20 * scale, 0xc68a4c, 0.96)
        .setStrokeStyle(3, 0x5b3a21, 0.85));
      container.add(this.add.rectangle(0, -4 * scale, 64 * scale, 10 * scale, 0xc68a4c, 0.96)
        .setStrokeStyle(2, 0x5b3a21, 0.75));
      return;
    }

    if (stage.bossId === 'chili-chef') {
      container.add(this.add.ellipse(0, 5 * scale, 62 * scale, 74 * scale, 0x7a5734, 0.96)
        .setStrokeStyle(4, 0x3d2615, 0.86));
      container.add(this.add.ellipse(0, -24 * scale, 52 * scale, 20 * scale, 0xb58650, 0.94)
        .setStrokeStyle(2, 0x3d2615, 0.7));
      container.add(this.add.circle(-13 * scale, 1 * scale, 4 * scale, 0x14351f));
      container.add(this.add.circle(13 * scale, 1 * scale, 4 * scale, 0x14351f));
      return;
    }

    const dragonScale = stage.bossId === 'doctor-snooze' ? 1.12 * scale : scale;
    const bodyColor = stage.bossId === 'doctor-snooze' ? 0x5a54c8 : 0x7554c8;
    container.add(this.add.ellipse(0, 12 * dragonScale, 58 * dragonScale, 44 * dragonScale, bodyColor, 0.96)
      .setStrokeStyle(3, 0x342052, 0.9));
    container.add(this.add.circle(0, -24 * dragonScale, 28 * dragonScale, 0x8e67da, 0.96)
      .setStrokeStyle(3, 0x342052, 0.9));
    container.add(this.add.triangle(-36 * dragonScale, 5 * dragonScale, 0, 20 * dragonScale, -28 * dragonScale, -28 * dragonScale, 16 * dragonScale, -10 * dragonScale, 0xb956bf, 0.9)
      .setStrokeStyle(2, 0x342052, 0.78));
    container.add(this.add.triangle(36 * dragonScale, 5 * dragonScale, 0, 20 * dragonScale, 28 * dragonScale, -28 * dragonScale, -16 * dragonScale, -10 * dragonScale, 0xb956bf, 0.9)
      .setStrokeStyle(2, 0x342052, 0.78));
  }

  private addBattleButton(
    panel: Phaser.GameObjects.Container,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    backgroundColor: number,
    textColor: string,
    onClick: () => void,
    enabled: boolean,
  ): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, label, {
      align: 'center',
      backgroundColor: `#${backgroundColor.toString(16).padStart(6, '0')}`,
      color: textColor,
      fixedWidth: width,
      fontFamily: UI_FONT_FAMILY,
      fontSize: width < 135 ? '13px' : '15px',
      fontStyle: 'bold',
      padding: {
        y: Math.max(6, Math.floor((height - 20) / 2)),
      },
    }).setOrigin(0.5);

    if (enabled) {
      button
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          pointer.event?.stopPropagation();
          this.playButtonClickSound();
          onClick();
        });
    }

    panel.add(button);
    return button;
  }

  private clearBattleAnimationEvents(): void {
    this.battleAnimationEvents.forEach((event) => {
      event.remove(false);
    });
    this.battleAnimationEvents = [];
    this.battleAnimationInProgress = false;
  }

  private closeBossBattlePanel(
    resetBossBattleState = true,
    options: BossBattlePanelRefreshOptions = {},
  ): void {
    if (this.bossBattlePanel) {
      if (!options.preserveBattleAnimation) {
        this.clearBattleAnimationEvents();
      }
      this.bossBattlePanel.destroy();
      this.bossBattlePanel = undefined;
      if (resetBossBattleState) {
        this.selectedBossBattleBossId = undefined;
        this.bossBattleSession = undefined;
        this.bossBattleStatusText = '';
        this.bossBattleLogText = '';
        this.bossBattleTargetMonsterId = undefined;
        this.bossBattleTurnBanner = '';
        this.bossBattlePlayerVisualEffect = undefined;
        this.bossBattleBossVisualEffect = undefined;
        this.bossBattleRewardX2Opportunity = undefined;
        this.bossBattleStagePageIndex = 0;
      }
      this.hideModalOverlay();
    }
  }

  private refreshBossBattlePanel(options: BossBattlePanelRefreshOptions = { preserveBattleAnimation: true }): void {
    if (this.bossBattlePanel) {
      this.openBossBattlePanel(false, options);
    }
  }

  private clearBossBattleRewardX2Opportunity(): void {
    this.bossBattleRewardX2Opportunity = undefined;
  }

  private setBossBattleRewardX2Opportunity(
    stage: BossBattleStage,
    source: BossBattleRewardX2Source,
    reward: BossBattleReward,
  ): void {
    if (reward.type !== 'coins') {
      this.clearBossBattleRewardX2Opportunity();
      return;
    }

    this.bossBattleRewardX2Opportunity = {
      id: this.nextBossBattleRewardX2OpportunityId,
      source,
      stageId: stage.id,
      reward,
      consumed: false,
      adInProgress: false,
    };
    this.nextBossBattleRewardX2OpportunityId += 1;
  }

  private getBossBattleRewardX2Opportunity(
    stageId: string,
    source?: BossBattleRewardX2Source,
  ): BossBattleRewardX2Opportunity | undefined {
    const opportunity = this.bossBattleRewardX2Opportunity;

    if (
      !opportunity
      || opportunity.consumed
      || opportunity.stageId !== stageId
      || (source && opportunity.source !== source)
    ) {
      return undefined;
    }

    return opportunity;
  }

  private selectBossBattleBossPage(pageIndex: number): void {
    if (this.battleAnimationInProgress) {
      return;
    }

    this.bossBattleBossPageIndex = this.getClampedBossBattleBossPageIndex(pageIndex);
    this.refreshBossBattlePanel();
  }

  private selectBossBattleStagePage(pageIndex: number): void {
    if (this.battleAnimationInProgress) {
      return;
    }

    const boss = this.getSelectedBossBattleDefinition();

    if (!boss) {
      return;
    }

    this.bossBattleStagePageIndex = this.getClampedBossBattleStagePageIndex(pageIndex, boss);
    this.refreshBossBattlePanel();
  }

  private selectBossBattleStage(stageIndex: number): void {
    if (this.battleAnimationInProgress) {
      return;
    }

    const boss = this.getSelectedBossBattleDefinition();

    if (!boss) {
      return;
    }

    this.clearBattleAnimationEvents();
    this.clearBossBattleRewardX2Opportunity();
    this.bossBattleStageIndex = clampBossStageIndex(stageIndex, boss.stages);
    this.bossBattleStagePageIndex = this.getBossBattleStagePageIndexForStage(this.bossBattleStageIndex);
    this.bossBattleSession = undefined;
    this.bossBattleStatusText = '';
    this.bossBattleLogText = '';
    this.bossBattleTargetMonsterId = undefined;
    this.bossBattleTurnBanner = '';
    this.bossBattlePlayerVisualEffect = undefined;
    this.bossBattleBossVisualEffect = undefined;
    this.refreshBossBattlePanel();
  }

  private enterBossBattleRoom(bossId: BossBattleBossId): void {
    if (this.battleAnimationInProgress) {
      return;
    }

    const boss = BOSS_BATTLE_DEFINITIONS.find((definition) => definition.id === bossId);

    if (!boss) {
      return;
    }

    this.clearBattleAnimationEvents();
    this.clearBossBattleRewardX2Opportunity();
    this.selectedBossBattleBossId = boss.id;
    this.bossBattleStageIndex = getDefaultBossStageIndexForBoss(boss, this.claimedBossBattleStageIds);
    this.bossBattleStagePageIndex = this.getBossBattleStagePageIndexForStage(this.bossBattleStageIndex);
    this.bossBattleSession = undefined;
    this.bossBattleStatusText = '';
    this.bossBattleLogText = '';
    this.bossBattleTargetMonsterId = undefined;
    this.bossBattleTurnBanner = '';
    this.bossBattlePlayerVisualEffect = undefined;
    this.bossBattleBossVisualEffect = undefined;
    this.refreshBossBattlePanel();
  }

  private backToBossBattleSelect(): void {
    if (this.battleAnimationInProgress) {
      return;
    }

    this.clearBattleAnimationEvents();
    this.clearBossBattleRewardX2Opportunity();
    this.selectedBossBattleBossId = undefined;
    this.bossBattleSession = undefined;
    this.bossBattleStatusText = '';
    this.bossBattleLogText = '';
    this.bossBattleTargetMonsterId = undefined;
    this.bossBattleTurnBanner = '';
    this.bossBattlePlayerVisualEffect = undefined;
    this.bossBattleBossVisualEffect = undefined;
    this.bossBattleStagePageIndex = 0;
    this.refreshBossBattlePanel();
  }

  private getSelectedBossBattleDefinition(): BossBattleDefinition | undefined {
    return BOSS_BATTLE_DEFINITIONS.find((boss) => boss.id === this.selectedBossBattleBossId);
  }

  private getCurrentLocalDayKey(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private syncBossDailyClearReset(): void {
    const today = this.getCurrentLocalDayKey();

    if (this.bossDailyClearLastResetDay === today) {
      return;
    }

    this.bossDailyClearCounts = {};
    this.bossDailyClearLastResetDay = today;
    this.hasUnsavedProgress = true;
  }

  private getBossDailyClearsUsed(bossId: BossBattleBossId): number {
    this.syncBossDailyClearReset();

    const count = this.bossDailyClearCounts[bossId] ?? 0;

    if (!Number.isFinite(count)) {
      return 0;
    }

    return Math.max(0, Math.floor(count));
  }

  private getBossDailyClearsRemaining(bossId: BossBattleBossId): number {
    return Math.max(0, BOSS_DAILY_CLEAR_LIMIT - this.getBossDailyClearsUsed(bossId));
  }

  private canClearBossToday(bossId: BossBattleBossId): boolean {
    return this.getBossDailyClearsRemaining(bossId) > 0;
  }

  private consumeBossDailyClear(bossId: BossBattleBossId): boolean {
    const bossExists = BOSS_BATTLE_DEFINITIONS.some((boss) => boss.id === bossId);

    if (!bossExists || !this.canClearBossToday(bossId)) {
      return false;
    }

    this.bossDailyClearCounts = {
      ...this.bossDailyClearCounts,
      [bossId]: this.getBossDailyClearsUsed(bossId) + 1,
    };
    this.hasUnsavedProgress = true;

    return true;
  }

  private setBossDailyLimitReachedStatus(): void {
    this.bossBattleStatusText = this.t('ui.bossBattle.limitReached');
    this.bossBattleLogText = this.t('ui.bossBattle.resetsTomorrow');
  }

  private getBossBattleBossPageCount(): number {
    return Math.max(1, Math.ceil(BOSS_BATTLE_DEFINITIONS.length / BOSS_SELECT_PAGE_SIZE));
  }

  private getClampedBossBattleBossPageIndex(index: number): number {
    return Math.min(Math.max(Math.floor(index), 0), this.getBossBattleBossPageCount() - 1);
  }

  private getVisibleBossBattleDefinitions(): BossBattleDefinition[] {
    const pageIndex = this.getClampedBossBattleBossPageIndex(this.bossBattleBossPageIndex);
    const startIndex = pageIndex * BOSS_SELECT_PAGE_SIZE;

    return BOSS_BATTLE_DEFINITIONS.slice(startIndex, startIndex + BOSS_SELECT_PAGE_SIZE);
  }

  private getBossBattleStagePageCount(boss: BossBattleDefinition): number {
    return Math.max(1, Math.ceil(boss.stages.length / BOSS_STAGE_PAGE_SIZE));
  }

  private getClampedBossBattleStagePageIndex(index: number, boss: BossBattleDefinition): number {
    return Math.min(Math.max(Math.floor(index), 0), this.getBossBattleStagePageCount(boss) - 1);
  }

  private getBossBattleStagePageIndexForStage(stageIndex: number): number {
    return Math.max(0, Math.floor(Math.max(0, stageIndex) / BOSS_STAGE_PAGE_SIZE));
  }

  private getVisibleBossBattleStageEntries(boss: BossBattleDefinition): Array<{ stage: BossBattleStage; index: number }> {
    const pageIndex = this.getClampedBossBattleStagePageIndex(this.bossBattleStagePageIndex, boss);
    const startIndex = pageIndex * BOSS_STAGE_PAGE_SIZE;

    return boss.stages
      .slice(startIndex, startIndex + BOSS_STAGE_PAGE_SIZE)
      .map((stage, offset) => ({
        stage,
        index: startIndex + offset,
      }));
  }

  private startBossBattle(stage: BossBattleStage): void {
    if (this.battleAnimationInProgress) {
      return;
    }

    if (isBossStageCleared(stage.id, this.claimedBossBattleStageIds)) {
      this.clearBattleAnimationEvents();
      this.bossBattleSession = undefined;
      this.bossBattleTargetMonsterId = undefined;
      this.bossBattleTurnBanner = '';
      this.bossBattlePlayerVisualEffect = undefined;
      this.bossBattleBossVisualEffect = undefined;
      this.bossBattleStatusText = this.t('ui.bossBattle.autoClearOnly');
      this.bossBattleLogText = '';
      this.refreshBossBattlePanel();
      return;
    }

    if (!this.canClearBossToday(stage.bossId)) {
      this.clearBattleAnimationEvents();
      this.bossBattleSession = undefined;
      this.bossBattleTargetMonsterId = undefined;
      this.bossBattleTurnBanner = '';
      this.bossBattlePlayerVisualEffect = undefined;
      this.bossBattleBossVisualEffect = undefined;
      this.setBossDailyLimitReachedStatus();
      this.refreshBossBattlePanel();
      return;
    }

    this.clearBattleAnimationEvents();
    this.clearBossBattleRewardX2Opportunity();
    const team = getAutoBattleTeam(this.farmSlots, stage.teamSize);

    if (team.length === 0) {
      this.bossBattleStatusText = this.t('ui.bossBattle.noTeam');
      this.refreshBossBattlePanel();
      return;
    }

    this.bossBattleSession = createBattleSession(stage, team);
    this.bossBattleStatusText = this.t('ui.bossBattle.chooseSkill');
    this.bossBattleLogText = '';
    this.bossBattleTargetMonsterId = undefined;
    this.bossBattleTurnBanner = 'player';
    this.bossBattlePlayerVisualEffect = undefined;
    this.bossBattleBossVisualEffect = undefined;
    this.refreshBossBattlePanel();
  }

  private getDoubledBossBattleCoinReward(reward: BossBattleCoinReward): BossBattleCoinReward {
    return {
      type: 'coins',
      amount: reward.amount * 2,
    };
  }

  private autoClearBossBattle(stage: BossBattleStage): void {
    if (this.battleAnimationInProgress || !isBossStageCleared(stage.id, this.claimedBossBattleStageIds)) {
      return;
    }

    if (!this.consumeBossDailyClear(stage.bossId)) {
      this.setBossDailyLimitReachedStatus();
      this.refreshBossBattlePanel();
      return;
    }

    const reward = getBossReplayReward(stage);
    const fragmentReward = stage.replayFragmentReward;
    const fullRewardText = this.getBossBattleFullRewardText(reward, fragmentReward);

    this.clearBattleAnimationEvents();
    this.clearBossBattleRewardX2Opportunity();
    this.grantBossBattleReward(reward);
    this.grantElementFragmentReward(fragmentReward);
    this.bossBattleSession = undefined;
    this.bossBattleTargetMonsterId = undefined;
    this.bossBattleTurnBanner = '';
    this.bossBattlePlayerVisualEffect = undefined;
    this.bossBattleBossVisualEffect = undefined;
    this.bossBattleStatusText = this.t('ui.bossBattle.autoClearGranted', {
      reward: fullRewardText,
    });
    this.bossBattleLogText = this.bossBattleStatusText;
    this.skipSavingUntilProgress = false;
    this.updateHud();
    this.saveProgress();
    this.refreshBossBattlePanel();
    this.showToast(this.t('toast.bossBattleReward', {
      reward: fullRewardText,
    }), 'success');
  }

  private async autoClearBossBattleWithX2(stage: BossBattleStage): Promise<void> {
    if (this.battleAnimationInProgress || !isBossStageCleared(stage.id, this.claimedBossBattleStageIds)) {
      return;
    }

    if (!this.canClearBossToday(stage.bossId)) {
      this.setBossDailyLimitReachedStatus();
      this.refreshBossBattlePanel();
      return;
    }

    const activeOpportunity = this.getBossBattleRewardX2Opportunity(stage.id, 'auto-clear');

    if (activeOpportunity?.adInProgress) {
      return;
    }

    const reward = getBossReplayReward(stage);

    this.setBossBattleRewardX2Opportunity(stage, 'auto-clear', reward);
    const opportunity = this.getBossBattleRewardX2Opportunity(stage.id, 'auto-clear');

    if (!opportunity) {
      return;
    }

    opportunity.adInProgress = true;
    this.bossBattleSession = undefined;
    this.bossBattleTargetMonsterId = undefined;
    this.bossBattleTurnBanner = '';
    this.bossBattlePlayerVisualEffect = undefined;
    this.bossBattleBossVisualEffect = undefined;
    this.bossBattleStatusText = this.t('ui.bossBattle.rewardX2');
    this.bossBattleLogText = '';
    this.refreshBossBattlePanel();

    const adCompleted = await showRewardedAd('boss-auto-clear-x2').catch(() => false);
    const currentOpportunity = this.bossBattleRewardX2Opportunity;

    if (!currentOpportunity || currentOpportunity.id !== opportunity.id || currentOpportunity.consumed) {
      return;
    }

    if (!adCompleted) {
      this.clearBossBattleRewardX2Opportunity();
      this.showToast(this.t('toast.adNotCompleted'), 'warning');
      this.refreshBossBattlePanel();
      return;
    }

    if (!this.consumeBossDailyClear(stage.bossId)) {
      this.clearBossBattleRewardX2Opportunity();
      this.setBossDailyLimitReachedStatus();
      this.refreshBossBattlePanel();
      return;
    }

    const doubledReward = this.getDoubledBossBattleCoinReward(currentOpportunity.reward);
    const fragmentReward = stage.replayFragmentReward;
    const fullRewardText = this.getBossBattleFullRewardText(doubledReward, fragmentReward);

    currentOpportunity.consumed = true;
    this.grantBossBattleReward(doubledReward);
    this.grantElementFragmentReward(fragmentReward);
    this.clearBossBattleRewardX2Opportunity();
    this.bossBattleStatusText = this.t('ui.bossBattle.autoClearX2Granted', {
      reward: fullRewardText,
    });
    this.bossBattleLogText = this.bossBattleStatusText;
    this.skipSavingUntilProgress = false;
    this.updateHud();
    this.saveProgress();
    this.refreshBossBattlePanel();
    this.showToast(this.t('toast.bossBattleRewardX2', {
      reward: fullRewardText,
    }), 'success');
  }

  private async claimBossBattleRewardX2(stage: BossBattleStage, source: BossBattleRewardX2Source): Promise<void> {
    const opportunity = this.getBossBattleRewardX2Opportunity(stage.id, source);

    if (!opportunity || opportunity.adInProgress || opportunity.consumed) {
      return;
    }

    opportunity.adInProgress = true;
    this.refreshBossBattlePanel();

    const adReason = source === 'first-clear' ? 'boss-first-clear-x2' : 'boss-auto-clear-x2';
    const adCompleted = await showRewardedAd(adReason).catch(() => false);
    const currentOpportunity = this.bossBattleRewardX2Opportunity;

    if (!currentOpportunity || currentOpportunity.id !== opportunity.id || currentOpportunity.consumed) {
      return;
    }

    currentOpportunity.adInProgress = false;

    if (!adCompleted) {
      this.showToast(this.t('toast.adNotCompleted'), 'warning');
      this.refreshBossBattlePanel();
      return;
    }

    currentOpportunity.consumed = true;
    this.grantBossBattleReward(currentOpportunity.reward);
    this.bossBattleStatusText = this.t('ui.bossBattle.rewardX2Granted', {
      reward: this.getBossBattleRewardText(currentOpportunity.reward),
    });
    this.bossBattleLogText = this.bossBattleStatusText;
    this.skipSavingUntilProgress = false;
    this.updateHud();
    this.saveProgress();
    this.refreshBossBattlePanel();
    this.showToast(this.t('toast.bossBattleRewardX2', {
      reward: this.getBossBattleRewardText(currentOpportunity.reward),
    }), 'success');
  }

  private useBossBattleSkill(skillId: BattleSkillId): void {
    const boss = this.getSelectedBossBattleDefinition();
    const stage = boss?.stages[this.bossBattleStageIndex];
    const session = this.bossBattleSession;

    if (
      this.battleAnimationInProgress
      || !boss
      || !stage
      || !session
      || session.stageId !== stage.id
      || !canUseBattleSkill(session, skillId)
    ) {
      return;
    }

    this.clearBattleAnimationEvents();
    this.battleAnimationInProgress = true;
    this.bossBattlePlayerVisualEffect = undefined;
    this.bossBattleBossVisualEffect = undefined;

    const activeMonster = getActiveBattleMonster(session);
    const skill = activeMonster
      ? getAvailableSkillsForMonster(activeMonster).find((availableSkill) => availableSkill.id === skillId)
      : undefined;
    const playerResult = applyPlayerSkill(session, skillId);
    let nextSession = playerResult.session;
    const resultParts: string[] = [];
    this.bossBattleTargetMonsterId = undefined;
    this.bossBattleTurnBanner = 'player';
    this.bossBattlePlayerVisualEffect = {
      kind: playerResult.damage > 0 ? 'damage' : 'support',
      amount: playerResult.damage > 0 ? playerResult.damage : playerResult.healing,
      skillId,
    };

    if (playerResult.damage > 0) {
      resultParts.push(this.t('ui.bossBattle.playerUsedDamage', {
        monster: activeMonster ? this.getBossBattleMonsterShortName(activeMonster) : this.t('ui.bossBattle.team'),
        skill: skill ? this.t(skill.labelKey) : '',
        amount: playerResult.damage,
      }));
    }

    if (playerResult.healing > 0) {
      resultParts.push(this.t('ui.bossBattle.playerUsedHeal', {
        monster: activeMonster ? this.getBossBattleMonsterShortName(activeMonster) : this.t('ui.bossBattle.team'),
        skill: skill ? this.t(skill.labelKey) : '',
        amount: playerResult.healing,
      }));
    }

    if (skill && playerResult.damage <= 0 && playerResult.healing <= 0) {
      resultParts.push(this.t('ui.bossBattle.playerUsedSkill', {
        monster: activeMonster ? this.getBossBattleMonsterShortName(activeMonster) : this.t('ui.bossBattle.team'),
        skill: this.t(skill.labelKey),
      }));
    }

    this.bossBattleSession = nextSession;
    this.bossBattleStatusText = resultParts.join('  ');
    this.bossBattleLogText = resultParts.join('  ');
    this.refreshBossBattlePanel();

    if (nextSession.status !== 'ready') {
      this.handleBossBattleResult(stage);
      this.refreshBossBattlePanel();
      const finishPlayerOnlyEvent = this.time.delayedCall(460, () => {
        this.battleAnimationInProgress = false;
        this.bossBattlePlayerVisualEffect = undefined;
        this.refreshBossBattlePanel();
      });
      this.battleAnimationEvents.push(finishPlayerOnlyEvent);
      return;
    }

    const playerLogParts = [...resultParts];
    const bossEvent = this.time.delayedCall(240, () => {
      if (
        this.bossBattleSession?.stageId !== stage.id
        || this.bossBattleSession.status !== 'ready'
        || !this.battleAnimationInProgress
      ) {
        this.battleAnimationInProgress = false;
        this.bossBattlePlayerVisualEffect = undefined;
        this.bossBattleBossVisualEffect = undefined;
        return;
      }

      const bossResult = applyBossTurn(this.bossBattleSession);
      nextSession = bossResult.session;
      const turnLogParts = [...playerLogParts];
      this.bossBattlePlayerVisualEffect = undefined;
      this.bossBattleBossVisualEffect = {
        damage: bossResult.bossDamage,
        targetId: bossResult.bossTargetId,
        visualTheme: boss.visualTheme,
      };
      this.bossBattleTargetMonsterId = bossResult.bossTargetId;
      this.bossBattleTurnBanner = 'boss';

      if (bossResult.damage > 0) {
        turnLogParts.push(this.t('ui.bossBattle.bossStatusDamage', { amount: bossResult.damage }));
      }

      if (bossResult.bossDamage > 0) {
        const target = bossResult.bossTargetId
          ? bossResult.session.team.find((monster) => monster.id === bossResult.bossTargetId)
          : undefined;
        turnLogParts.push(this.t('ui.bossBattle.bossUsedDamage', {
          boss: this.getLocalizedBossName(boss),
          skill: this.getLocalizedBossAttackName(boss),
          target: target ? this.getBossBattleMonsterShortName(target) : this.t('ui.bossBattle.team'),
          amount: bossResult.bossDamage,
        }));
      }

      if (bossResult.defeatedMonsterId) {
        turnLogParts.push(this.t('ui.bossBattle.monsterDown', {
          monster: this.getBossBattleMonsterShortName(
            bossResult.session.team.find((monster) => monster.id === bossResult.defeatedMonsterId)
              ?? session.team[0],
          ),
        }));
      }

      this.bossBattleSession = nextSession;
      this.bossBattleStatusText = turnLogParts.join('  ');
      this.bossBattleLogText = turnLogParts.join('  ');
      this.handleBossBattleResult(stage);
      this.refreshBossBattlePanel();

      const finishBossEvent = this.time.delayedCall(620, () => {
        if (this.bossBattleSession?.stageId !== stage.id) {
          this.battleAnimationInProgress = false;
          this.bossBattleBossVisualEffect = undefined;
          this.bossBattleTargetMonsterId = undefined;
          return;
        }

        this.battleAnimationInProgress = false;
        this.bossBattleBossVisualEffect = undefined;

        if (this.bossBattleSession.status === 'ready') {
          this.bossBattleTurnBanner = 'player';
          this.bossBattleStatusText = this.t('ui.bossBattle.yourTurn');
          this.bossBattleTargetMonsterId = undefined;
        }

        this.refreshBossBattlePanel();
      });
      this.battleAnimationEvents.push(finishBossEvent);
    });
    this.battleAnimationEvents.push(bossEvent);
  }

  private handleBossBattleResult(stage: BossBattleStage): void {
    const session = this.bossBattleSession;

    if (!session || session.stageId !== stage.id) {
      return;
    }

    if (session.status === 'victory') {
      if (!isBossStageCleared(stage.id, this.claimedBossBattleStageIds)) {
        if (!this.consumeBossDailyClear(stage.bossId)) {
          this.setBossDailyLimitReachedStatus();
          this.refreshBossBattlePanel();
          return;
        }

        const fragmentReward = stage.firstClearFragmentReward;
        const fullRewardText = this.getBossBattleFullRewardText(stage.firstClearReward, fragmentReward);

        this.grantBossBattleReward(stage.firstClearReward);
        this.grantElementFragmentReward(fragmentReward);
        this.setBossBattleRewardX2Opportunity(stage, 'first-clear', stage.firstClearReward);
        this.claimedBossBattleStageIds.add(stage.id);
        this.bossBattleStatusText = this.t('ui.bossBattle.firstClearGranted', {
          reward: fullRewardText,
        });
        this.bossBattleLogText = this.bossBattleStatusText;
        this.skipSavingUntilProgress = false;
        this.updateHud();
        this.saveProgress();
        this.showToast(this.t('toast.bossBattleFirstClear', {
          reward: fullRewardText,
        }), 'success');
        return;
      }

      this.bossBattleStatusText = this.t('ui.bossBattle.victory');
      return;
    }

    if (session.status === 'defeat') {
      this.bossBattleStatusText = this.t('ui.bossBattle.defeat');
      this.bossBattleLogText = this.t('ui.bossBattle.defeatDetail');
    }
  }

  private async reviveBossBattleWithAd(): Promise<void> {
    const session = this.bossBattleSession;

    if (this.battleAnimationInProgress || !session || session.status !== 'defeat' || session.reviveUsed) {
      return;
    }

    const adCompleted = await showRewardedAd('boss-revive').catch(() => false);

    if (!adCompleted) {
      this.showToast(this.t('toast.adNotCompleted'), 'warning');
      return;
    }

    this.bossBattleSession = reviveBattleSession(session);
    this.bossBattleStatusText = this.t('ui.bossBattle.revived');
    this.bossBattleLogText = this.t('ui.bossBattle.reviveApplied');
    this.bossBattleTargetMonsterId = undefined;
    this.bossBattleTurnBanner = 'player';
    this.bossBattlePlayerVisualEffect = undefined;
    this.bossBattleBossVisualEffect = undefined;
    this.refreshBossBattlePanel();
  }

  private grantBossBattleReward(reward: BossBattleReward): void {
    if (reward.type === 'coins') {
      this.currency.coins = this.sanitizeCoins(this.currency.coins + reward.amount);
      return;
    }

    this.monsterEssence = sanitizePrestigeIntegerState(this.monsterEssence + reward.amount);
    this.syncZoneUnlockFromPrestigeProgress();
  }

  private grantElementFragmentReward(reward: ElementFragmentReward | undefined): void {
    if (!reward || reward.amount <= 0) {
      return;
    }

    this.elementFragments = addElementFragments(this.elementFragments, reward.element, reward.amount);
    this.hasUnsavedProgress = true;
  }

  private getBossBattleStatusText(stage: BossBattleStage, session: BattleSessionState | undefined): string {
    if (!session || session.stageId !== stage.id) {
      if (this.bossBattleStatusText) {
        return this.bossBattleStatusText;
      }

      if (!this.canClearBossToday(stage.bossId)) {
        return this.t('ui.bossBattle.limitReached');
      }

      return this.t('ui.bossBattle.ready');
    }

    if (this.bossBattleTurnBanner === 'boss') {
      return this.t('ui.bossBattle.bossTurn');
    }

    if (this.bossBattleStatusText) {
      return this.bossBattleStatusText;
    }

    if (session.status === 'victory') {
      return this.t('ui.bossBattle.victory');
    }

    if (session.status === 'defeat') {
      return this.t('ui.bossBattle.defeat');
    }

    return this.t('ui.bossBattle.yourTurn');
  }

  private getLocalizedBossStageName(stage: BossBattleStage): string {
    return this.t(`bossBattle.${stage.id}.name`);
  }

  private getLocalizedBossName(boss: BossBattleDefinition): string {
    return this.t(`bossBattle.${boss.id}.name`);
  }

  private getLocalizedBossClass(boss: BossBattleDefinition): string {
    return this.t(`bossBattle.${boss.id}.class`);
  }

  private getLocalizedBossAttackName(boss: BossBattleDefinition): string {
    return this.t(`bossBattle.${boss.id}.attack`);
  }

  private getBossBattleMonsterShortName(monster: Pick<BattleMonsterSnapshot, 'family' | 'level'>): string {
    return this.t('ui.bossBattle.monsterTurnName', {
      family: this.t(`family.${monster.family}`),
      level: monster.level,
    });
  }

  private getBossBattleSkillEffectText(
    skill: BattleSkillDefinition,
    monster: BattleMonsterSnapshot,
  ): string {
    if (skill.damageMultiplier) {
      return this.t('ui.bossBattle.skillDamage', {
        amount: Math.max(1, Math.floor(monster.attack * skill.damageMultiplier)),
      });
    }

    if (skill.healLowestPercentOfCasterMaxHp) {
      return this.t('ui.bossBattle.skillHeal', {
        amount: Math.max(1, Math.floor(monster.maxHp * skill.healLowestPercentOfCasterMaxHp)),
      });
    }

    if (skill.shieldPercent) {
      return this.t('ui.bossBattle.skillShield');
    }

    return this.t('ui.bossBattle.readySkill');
  }

  private getBattleSkillCooldown(session: BattleSessionState, monsterId: string, skillId: BattleSkillId): number {
    return session.skillCooldowns[`${monsterId}:${skillId}`] ?? 0;
  }

  private getBossBattleRewardText(reward: BossBattleReward): string {
    if (reward.type === 'coins') {
      return this.t('common.coins', {
        amount: this.formatCoinAmount(reward.amount),
      });
    }

    return this.t('common.essence', {
      amount: reward.amount,
    });
  }

  private getElementFragmentRewardText(reward: ElementFragmentReward): string {
    return this.t('ui.fragments.shortAmount', {
      amount: reward.amount,
      element: this.t(`element.${reward.element}`),
    });
  }

  private getBossStageFragmentRewardText(
    stage: BossBattleStage,
    source: 'first-clear' | 'replay',
  ): string {
    const reward = source === 'first-clear' ? stage.firstClearFragmentReward : stage.replayFragmentReward;

    return reward ? this.getElementFragmentRewardText(reward) : '';
  }

  private getBossBattleFullRewardText(
    baseReward: BossBattleReward,
    fragmentReward: ElementFragmentReward | undefined,
  ): string {
    const baseRewardText = this.getBossBattleRewardText(baseReward);

    if (!fragmentReward) {
      return baseRewardText;
    }

    return this.t('ui.bossBattle.rewardWithFragments', {
      reward: baseRewardText,
      fragments: this.getElementFragmentRewardText(fragmentReward),
    });
  }

  private getElementFragmentInventoryLines(): string[] {
    const labels = ELEMENT_TYPES.map((element) => this.t('ui.fragments.amount', {
      amount: this.elementFragments[element] ?? 0,
      element: this.t(`element.${element}`),
    }));

    return [
      this.t('ui.fragments.inventory'),
      `${labels[0]} | ${labels[1]}   ${labels[2]} | ${labels[3]}`,
    ];
  }

  private getCompactBossBattleText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
  }

  private getCompactBossBattleLogText(text: string, isCompactPanel: boolean): string {
    const maxLength = isCompactPanel ? 96 : 150;

    if (text.length <= maxLength) {
      return text;
    }

    return this.getCompactBossBattleText(text, maxLength);
  }

  private toggleEconomyDebugPanel(): void {
    if (this.economyDebugPanel) {
      this.closeEconomyDebugPanel();
      return;
    }

    this.openEconomyDebugPanel();
  }

  private openEconomyDebugPanel(): void {
    this.closeEconomyDebugPanel();
    this.closeNavigationMenuPanel();
    this.closeCompendiumPanel();
    this.closeSettingsPanel();
    this.closeHelpPanel();
    this.closePatchNotesPanel();
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeOrdersPanel();
    this.closeBossBattlePanel();
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.clearSelectedSlot();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = getPanelSize(this.scale, 390, 310);

    panel.setDepth(28);

    addPanelBackground(this, panel, panelWidth, panelHeight, THEME, 0x2f2818, THEME.panelBorder);

    panel.add(this.add.text(-panelWidth / 2 + 20, -panelHeight / 2 + 18, 'Economy Debug', {
      color: '#fff4a8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: getPanelTitleFontSize(panelWidth, 22),
      fontStyle: 'bold',
    }));

    panel.add(this.add.text(-panelWidth / 2 + 20, -panelHeight / 2 + 45, 'Development only', {
      color: '#d9d6ec',
      fontFamily: UI_FONT_FAMILY,
      fontSize: '12px',
    }));

    this.addModalCloseButton(panel, panelWidth, panelHeight, () => this.closeEconomyDebugPanel(), {
      color: '#f7ffe8',
      label: 'Close',
      xOffset: 20,
      yOffset: 20,
    });

    this.economyDebugText = this.add.text(-panelWidth / 2 + 20, -panelHeight / 2 + 78, '', {
      color: '#f7ffe8',
      fontFamily: MONO_FONT_FAMILY,
      fontSize: '14px',
      lineSpacing: 5,
    });

    panel.add(this.economyDebugText);
    this.economyDebugPanel = panel;
    this.refreshEconomyDebugPanel();
  }

  private closeEconomyDebugPanel(): void {
    this.economyDebugPanel?.destroy();
    this.economyDebugPanel = undefined;
    this.economyDebugText = undefined;
  }

  private refreshEconomyDebugPanel(): void {
    if (!this.economyDebugText) {
      return;
    }

    this.economyDebugText.setText(this.getEconomyDebugText());
  }

  private getEconomyDebugText(): string {
    const cooldownMs = this.getHatchCooldownMs();
    const remainingMs = Math.max(0, cooldownMs - this.hatchCooldownMs);
    const ritualRequirement = getRitualRequirement(this.totalRitualsPerformed);
    const ritualSacrificeCandidate = getRitualSacrificeCandidate(this.farmSlots, this.totalRitualsPerformed);
    const ritualCompletionResult = getRitualCompletionResult(this.farmSlots, this.totalRitualsPerformed);
    const hatchBlessingBonus = getHatchBlessingTierBonus(this.essencePowerLevel);
    const hatchState = this.isHatchReady()
      ? 'Ready'
      : `${(remainingMs / MILLISECONDS_PER_SECOND).toFixed(1)}s remaining`;
    const upgradeLines = UPGRADE_DEFINITIONS
      .map((upgrade) => `${upgrade.name}: Lv ${this.getUpgradeLevel(upgrade.id)}/${upgrade.maxLevel}`)
      .join('\n');

    return [
      `Egg cost: ${this.getEffectiveEggCost()} effective / ${this.currentEggCost} raw`,
      `Income/sec: ${this.formatCoinAmount(this.getTotalIncomePerSecond())}`,
      `Rituals performed: ${this.totalRitualsPerformed}`,
      `Ritual Power: ${getFarmRitualPower(this.farmSlots)} / ${ritualRequirement}`,
      `Ritual sacrifice power: ${ritualSacrificeCandidate?.ritualPower ?? 0}`,
      `Ritual reward: ${ritualCompletionResult.success ? ritualCompletionResult.rewardEssence : 0}`,
      `Ritual requirement: ${ritualRequirement}`,
      `Ritual income: x${this.getPrestigeIncomeMultiplier().toFixed(2)}`,
      `Hatch Blessing: Lv ${this.essencePowerLevel} (+1 ${Math.round(hatchBlessingBonus.plusOneChance * 100)}% / +2 ${Math.round(hatchBlessingBonus.plusTwoChance * 100)}% / +3 ${Math.round(hatchBlessingBonus.plusThreeChance * 100)}%)`,
      `Rare Hatch: Lv ${this.rareHatchLevel} (rare weight x${getRareHatchWeightMultiplier(this.rareHatchLevel).toFixed(2)})`,
      `Hatch cooldown: ${(cooldownMs / MILLISECONDS_PER_SECOND).toFixed(1)}s`,
      `Hatch state: ${hatchState}`,
      `Offline cap: ${this.formatDuration(this.getOfflineCapSeconds())}`,
      '',
      'Upgrade levels:',
      upgradeLines,
    ].join('\n');
  }

  private toggleUpgradeShopPanel(): void {
    if (this.upgradeShopPanel) {
      this.closeUpgradeShopPanel();
      return;
    }

    this.openUpgradeShopPanel();
  }

  private openUpgradeShopPanel(): void {
    this.closeUpgradeShopPanel();
    this.closeNavigationMenuPanel();
    this.closeCompendiumPanel();
    this.closeSettingsPanel();
    this.closeHelpPanel();
    this.closePatchNotesPanel();
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeOrdersPanel();
    this.closeBossBattlePanel();
    this.closePrestigePanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = this.getModalSize('upgrade-shop', 640, 560);
    const rowGap = panelWidth < 500 ? 76 : 82;
    const rowHeight = Math.min(72, rowGap - 8);
    const firstRowY = -panelHeight / 2 + 124;
    const bodyHeight = panelHeight - 174;
    const rowsPerPage = this.getRowsPerPage(rowGap, bodyHeight, UPGRADE_DEFINITIONS.length, 5, 6);
    const pageCount = this.getPageCount(UPGRADE_DEFINITIONS.length, rowsPerPage);
    const pageIndex = Phaser.Math.Clamp(this.upgradeShopPageIndex, 0, pageCount - 1);
    const pageUpgrades = UPGRADE_DEFINITIONS.slice(pageIndex * rowsPerPage, (pageIndex + 1) * rowsPerPage);

    this.upgradeShopPageIndex = pageIndex;

    panel.setDepth(24);

    addPanelBackground(this, panel, panelWidth, panelHeight, THEME);

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 20, this.t('ui.upgrades.title'), {
      color: THEME.text,
      fontFamily: UI_FONT_FAMILY,
      fontSize: getPanelTitleFontSize(panelWidth),
      fontStyle: 'bold',
    }));

    this.addModalCloseButton(panel, panelWidth, panelHeight, () => this.closeUpgradeShopPanel());

    this.addUpgradeBuyModeControls(panel, panelWidth, -panelHeight / 2 + 66);

    pageUpgrades.forEach((upgrade, index) => {
      this.addUpgradeRow(panel, upgrade, firstRowY + index * rowGap, panelWidth, rowHeight);
    });

    this.addPaginationControls(panel, panelWidth, panelHeight, pageIndex, pageCount, (nextPageIndex) => {
      this.upgradeShopPageIndex = nextPageIndex;
      this.openUpgradeShopPanel();
    });

    this.upgradeShopPanel = panel;
    this.showOnboardingHint('upgrades', this.t('hint.upgrades'));
  }

  private addUpgradeRow(
    panel: Phaser.GameObjects.Container,
    upgrade: UpgradeDefinition,
    rowY: number,
    panelWidth: number,
    rowHeight: number,
  ): Phaser.GameObjects.Text | undefined {
    const isCompactPanel = panelWidth < 500 || rowHeight < 70;
    const level = this.getUpgradeLevel(upgrade.id);
    const isMaxLevel = level >= upgrade.maxLevel;
    const cost = this.getUpgradeCostForLevel(upgrade, level);
    const purchasePreview = this.getUpgradePurchasePreview(upgrade, level);
    const canAfford = purchasePreview.levels > 0 && !isMaxLevel;
    const rowTop = rowY - rowHeight / 2;
    const costAmount = canAfford ? purchasePreview.totalCost : cost;

    panel.add(this.add.rectangle(0, rowY, panelWidth - 48, rowHeight, THEME.panelAlt, 0.92)
      .setStrokeStyle(2, canAfford ? THEME.slot : THEME.lockedBorder, 0.78));

    panel.add(this.add.text(-panelWidth / 2 + 42, rowTop + 8, this.getLocalizedUpgradeName(upgrade), {
      color: '#f7ffe8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '15px' : '17px',
      fontStyle: 'bold',
      wordWrap: {
        width: isCompactPanel ? panelWidth - 170 : panelWidth - 210,
      },
    }));

    panel.add(this.add.text(-panelWidth / 2 + 42, rowTop + (isCompactPanel ? 29 : 31), this.t('common.levelProgress', {
      level,
      max: upgrade.maxLevel,
    }), {
      color: '#cdebb3',
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '13px' : '14px',
      fontStyle: 'bold',
    }));

    panel.add(this.add.text(
      -panelWidth / 2 + 42,
      rowTop + (isCompactPanel ? 49 : 52),
      isCompactPanel ? this.getUpgradeCurrentEffectText(upgrade.id) : this.t('ui.upgrades.effectDetail', {
        effect: this.getLocalizedUpgradeEffect(upgrade),
        current: this.getUpgradeCurrentEffectText(upgrade.id),
      }),
      {
      color: '#d9d6ec',
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '12px' : '13px',
      wordWrap: {
        width: isCompactPanel ? panelWidth - 160 : Math.max(170, panelWidth - 240),
      },
      },
    ));

    panel.add(this.add.text(panelWidth / 2 - 42, rowTop + 6, isMaxLevel ? this.t('ui.upgrades.maxed') : this.t('common.cost', {
      amount: this.formatCoinAmount(costAmount),
    }), {
      color: isMaxLevel ? '#cdebb3' : '#fff4a8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '13px' : '15px',
      fontStyle: 'bold',
    }).setOrigin(1, 0));

    const buyText = this.add.text(panelWidth / 2 - 42, rowTop + (isCompactPanel ? 30 : 32), isMaxLevel ? this.t('ui.upgrades.max') : this.t('ui.upgrades.buyModeButton', {
      mode: this.getUpgradeBuyModeLabel(this.upgradeBuyMode),
    }), {
      color: '#ffffff',
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '15px' : '16px',
      fontStyle: 'bold',
      backgroundColor: isMaxLevel
        ? `#${THEME.lockedInner.toString(16).padStart(6, '0')}`
        : canAfford
          ? `#${THEME.buttonHover.toString(16).padStart(6, '0')}`
          : `#${THEME.danger.toString(16).padStart(6, '0')}`,
      padding: {
        x: isCompactPanel ? 13 : 15,
        y: isCompactPanel ? 6 : 8,
      },
    }).setOrigin(1, 0);

    if (!isMaxLevel) {
      buyText
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          pointer.event?.stopPropagation();
          this.playButtonClickSound();
          this.buyUpgrade(upgrade.id);
        });
    }

    panel.add(buyText);
    return buyText;
  }

  private closeUpgradeShopPanel(): void {
    if (this.upgradeShopPanel) {
      this.upgradeShopPanel.destroy();
      this.upgradeShopPanel = undefined;
      this.hideModalOverlay();
    }
  }

  private togglePrestigePanel(): void {
    if (this.prestigePanel) {
      this.closePrestigePanel();
      return;
    }

    this.prestigeConfirmationArmed = false;
    this.openPrestigePanel();
  }

  private openPrestigePanel(): void {
    this.closePrestigePanel(false);
    this.closeNavigationMenuPanel();
    this.closeCompendiumPanel();
    this.closeSettingsPanel();
    this.closeHelpPanel();
    this.closePatchNotesPanel();
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeOrdersPanel();
    this.closeBossBattlePanel();
    this.closeUpgradeShopPanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = getPanelSize(this.scale, 430, 460);
    const ritualPower = getFarmRitualPower(this.farmSlots);
    const ritualRequirement = getRitualRequirement(this.totalRitualsPerformed);
    const sacrificeCandidate = getRitualSacrificeCandidate(this.farmSlots, this.totalRitualsPerformed);
    const completionResult = getRitualCompletionResult(this.farmSlots, this.totalRitualsPerformed);
    const reward = completionResult.success ? completionResult.rewardEssence : 0;
    const sacrificePower = completionResult.success
      ? completionResult.sacrificePower
      : sacrificeCandidate?.ritualPower ?? 0;
    const canPrestige = canPerformRitual(this.farmSlots, this.totalRitualsPerformed);
    const canSafeRitual = canPerformSafeRitual(
      this.farmSlots,
      this.totalRitualsPerformed,
    )
      && !this.safeRitualInProgress;
    const canBuyEssencePower = canAffordEssencePower(this.monsterEssence, ESSENCE_POWER_COST);
    const canBuyRareHatch = canAffordRareHatch(this.monsterEssence, RARE_HATCH_COST);

    panel.setDepth(24);
    addPanelBackground(this, panel, panelWidth, panelHeight, THEME);

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 20, this.t('ui.prestige.title'), {
      color: THEME.text,
      fontFamily: UI_FONT_FAMILY,
      fontSize: getPanelTitleFontSize(panelWidth),
      fontStyle: 'bold',
    }));

    this.addModalCloseButton(panel, panelWidth, panelHeight, () => this.closePrestigePanel());

    const contentX = -panelWidth / 2 + 26;
    const contentWidth = panelWidth - 52;
    const statusText = canPrestige
      ? this.t('ui.prestige.ready')
      : this.t('ui.prestige.notReady');

    panel.add(this.add.text(contentX, -panelHeight / 2 + 78, this.t('ui.prestige.monsterEssence', {
      amount: this.monsterEssence,
    }), {
      color: '#fff4a8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: '18px',
      fontStyle: 'bold',
    }));

    panel.add(this.add.text(contentX, -panelHeight / 2 + 106, this.t('ui.prestige.ritualPower', {
      current: ritualPower,
      required: ritualRequirement,
    }), {
      color: canPrestige ? '#cdebb3' : '#fff4a8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '13px' : '14px',
      fontStyle: 'bold',
      fixedWidth: contentWidth,
    }));

    panel.add(this.add.text(contentX, -panelHeight / 2 + 130, this.t('ui.prestige.permanentIncome', {
      current: this.getPrestigeIncomeMultiplier().toFixed(2),
      next: getRitualIncomeMultiplier(this.totalRitualsPerformed + 1).toFixed(2),
    }), {
      color: '#f7ffe8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '12px' : '13px',
      fontStyle: 'bold',
      fixedWidth: contentWidth,
    }));

    panel.add(this.add.text(contentX, -panelHeight / 2 + 154, statusText, {
      color: canPrestige ? '#cdebb3' : THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '13px' : '14px',
      fixedWidth: contentWidth,
      wordWrap: {
        width: contentWidth,
      },
    }));

    const sacrificeText = sacrificeCandidate
      ? this.t('ui.prestige.sacrifice', {
        monster: this.getLocalizedMonsterName(sacrificeCandidate.monster),
        level: sacrificeCandidate.monster.level,
      })
      : this.t('ui.prestige.noSacrifice');

    panel.add(this.add.text(contentX, -panelHeight / 2 + 180, sacrificeText, {
      color: sacrificeCandidate ? '#cdebb3' : '#9ca79f',
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '13px' : '14px',
      fontStyle: 'bold',
      fixedWidth: contentWidth,
      wordWrap: {
        width: contentWidth,
      },
    }));

    panel.add(this.add.text(contentX, -panelHeight / 2 + 204, this.t('ui.prestige.sacrificePower', {
      amount: sacrificePower,
    }), {
      color: sacrificeCandidate ? '#cdebb3' : '#9ca79f',
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '13px' : '14px',
      fontStyle: 'bold',
      fixedWidth: contentWidth,
    }));

    panel.add(this.add.text(contentX, -panelHeight / 2 + 228, this.t('ui.prestige.reward', {
      amount: reward,
    }), {
      color: canPrestige ? '#fff4a8' : '#9ca79f',
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '13px' : '14px',
      fontStyle: 'bold',
      fixedWidth: contentWidth,
    }));

    panel.add(this.add.text(contentX, -panelHeight / 2 + 252, this.t('ui.prestige.rewardHint'), {
      color: THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '12px' : '13px',
      fixedWidth: contentWidth,
      wordWrap: {
        width: contentWidth,
      },
    }));

    this.addEssenceUpgradeSection(panel, panelWidth, panelHeight, canBuyEssencePower, canBuyRareHatch);
    this.addPrestigeAction(panel, panelWidth, panelHeight, canPrestige, canSafeRitual);

    this.prestigePanel = panel;
  }

  private addEssenceUpgradeSection(
    panel: Phaser.GameObjects.Container,
    panelWidth: number,
    panelHeight: number,
    canBuyEssencePower: boolean,
    canBuyRareHatch: boolean,
  ): void {
    const y = panelHeight / 2 - 145;
    const rowWidth = panelWidth - 52;
    const leftX = -panelWidth / 2 + 42;
    const actionX = panelWidth / 2 - 42;
    const actionColumnWidth = panelWidth < 390 ? 78 : 92;
    const textGap = panelWidth < 390 ? 10 : 14;
    const textWidth = Math.max(96, actionX - actionColumnWidth - textGap - leftX);
    const rowHeight = 52;
    const hatchBlessingBonus = getHatchBlessingTierBonus(this.essencePowerLevel);
    const hatchBlessingParams = {
      plusOne: Math.round(hatchBlessingBonus.plusOneChance * 100),
      plusTwo: Math.round(hatchBlessingBonus.plusTwoChance * 100),
      plusThree: Math.round(hatchBlessingBonus.plusThreeChance * 100),
    };
    const usesCompactEffect = panelWidth < 430 || this.getUiLayoutMode() === 'mobile' || textWidth < 300;
    const effectText = this.t(
      usesCompactEffect
        ? 'ui.prestige.hatchBlessingEffectCompact'
        : 'ui.prestige.hatchBlessingEffect',
      hatchBlessingParams,
    );
    const rareBonusPercent = Math.round((getRareHatchWeightMultiplier(this.rareHatchLevel) - 1) * 100);

    this.addEssenceUpgradeRow(panel, {
      y,
      rowWidth,
      rowHeight,
      leftX,
      actionX,
      actionColumnWidth,
      textWidth,
      title: this.t('ui.prestige.hatchBlessing'),
      level: this.essencePowerLevel,
      effectText,
      cost: ESSENCE_POWER_COST,
      canBuy: canBuyEssencePower,
      onBuy: () => this.buyHatchBlessing(),
      panelWidth,
    });

    this.addEssenceUpgradeRow(panel, {
      y: y + rowHeight + 8,
      rowWidth,
      rowHeight,
      leftX,
      actionX,
      actionColumnWidth,
      textWidth,
      title: this.t('ui.prestige.rareHatch'),
      level: this.rareHatchLevel,
      effectText: this.rareHatchLevel === 0
        ? this.t('ui.prestige.rareHatchUnlockHint')
        : this.t('ui.prestige.rareHatchEffectCompact', { percent: rareBonusPercent }),
      cost: RARE_HATCH_COST,
      canBuy: canBuyRareHatch,
      onBuy: () => this.buyRareHatch(),
      panelWidth,
    });
  }

  private addEssenceUpgradeRow(
    panel: Phaser.GameObjects.Container,
    options: {
      y: number;
      rowWidth: number;
      rowHeight: number;
      leftX: number;
      actionX: number;
      actionColumnWidth: number;
      textWidth: number;
      title: string;
      level: number;
      effectText: string;
      cost: number;
      canBuy: boolean;
      onBuy: () => void;
      panelWidth: number;
    },
  ): void {
    const {
      y,
      rowWidth,
      rowHeight,
      leftX,
      actionX,
      actionColumnWidth,
      textWidth,
      title,
      level,
      effectText,
      cost,
      canBuy,
      onBuy,
      panelWidth,
    } = options;

    panel.add(this.add.rectangle(0, y, rowWidth, rowHeight, THEME.panelAlt, 0.92)
      .setStrokeStyle(2, canBuy ? THEME.slot : THEME.lockedBorder, 0.78));

    panel.add(this.add.text(leftX, y - 20, title, {
      color: '#f7ffe8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '13px' : '15px',
      fontStyle: 'bold',
      fixedWidth: textWidth,
      wordWrap: {
        width: textWidth,
      },
    }));

    panel.add(this.add.text(leftX, y - 1, this.t('common.level', {
      level,
    }), {
      color: '#cdebb3',
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '11px' : '12px',
      fontStyle: 'bold',
      fixedWidth: 60,
    }));

    panel.add(this.add.text(leftX + 62, y - 1, effectText, {
      color: THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '10px' : '11px',
      fixedWidth: Math.max(70, textWidth - 62),
      wordWrap: {
        width: Math.max(70, textWidth - 62),
      },
    }));

    panel.add(this.add.text(actionX, y - 22, this.t('common.cost', {
      amount: this.formatCoinAmount(cost),
    }), {
      color: '#fff4a8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '11px' : '12px',
      fontStyle: 'bold',
      fixedWidth: actionColumnWidth,
      align: 'right',
    }).setOrigin(1, 0));

    const buyText = this.add.text(actionX, y - 2, this.t('common.buy'), {
      color: '#ffffff',
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '12px' : '13px',
      fontStyle: 'bold',
      backgroundColor: `#${(canBuy ? THEME.buttonHover : THEME.danger).toString(16).padStart(6, '0')}`,
      padding: {
        x: 11,
        y: 5,
      },
    }).setOrigin(1, 0);

    buyText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.playButtonClickSound();
        onBuy();
      });

    panel.add(buyText);
  }

  private addPrestigeAction(
    panel: Phaser.GameObjects.Container,
    panelWidth: number,
    panelHeight: number,
    canPrestige: boolean,
    canSafeRitual: boolean,
  ): void {
    const label = this.prestigeConfirmationArmed
      ? this.t('ui.prestige.confirm')
      : this.t('ui.prestige.normalRitual');
    const backgroundColor = !canPrestige
      ? THEME.lockedInner
      : this.prestigeConfirmationArmed
        ? THEME.warning
        : THEME.danger;
    const actionY = panelHeight / 2 - 42;
    const isCompact = panelWidth < 390;

    if (!canPrestige || this.prestigeConfirmationArmed) {
      const prestigeText = this.add.text(0, actionY, label, {
        color: canPrestige ? '#ffffff' : '#9ca79f',
        fontFamily: UI_FONT_FAMILY,
        fontSize: this.scale.width < 390 ? '14px' : '16px',
        fontStyle: 'bold',
        backgroundColor: `#${backgroundColor.toString(16).padStart(6, '0')}`,
        align: 'center',
        fixedWidth: Math.min(panelWidth - 76, 320),
        padding: {
          x: 13,
          y: 8,
        },
      }).setOrigin(0.5);

      prestigeText
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          pointer.event?.stopPropagation();
          this.playButtonClickSound();
          this.tryPrestige();
        });

      panel.add(prestigeText);
      return;
    }

    const buttonWidth = Math.floor((panelWidth - (isCompact ? 72 : 92)) / 2);
    const buttonGap = isCompact ? 10 : 14;
    const normalX = -buttonWidth / 2 - buttonGap / 2;
    const safeX = buttonWidth / 2 + buttonGap / 2;
    const normalText = this.add.text(normalX, actionY, label, {
      color: canPrestige ? '#ffffff' : '#9ca79f',
      fontFamily: UI_FONT_FAMILY,
      fontSize: this.scale.width < 390 ? '13px' : '15px',
      fontStyle: 'bold',
      backgroundColor: `#${backgroundColor.toString(16).padStart(6, '0')}`,
      align: 'center',
      fixedWidth: buttonWidth,
      padding: {
        x: 8,
        y: 8,
      },
    }).setOrigin(0.5);

    normalText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        this.playButtonClickSound();
        this.tryPrestige();
      });

    const safeBackgroundColor = canSafeRitual ? THEME.buttonHover : THEME.lockedInner;
    const safeText = this.add.text(safeX, actionY - 8, this.t('ui.prestige.safeRitual'), {
      color: canSafeRitual ? '#ffffff' : '#9ca79f',
      fontFamily: UI_FONT_FAMILY,
      fontSize: this.scale.width < 390 ? '13px' : '15px',
      fontStyle: 'bold',
      backgroundColor: `#${safeBackgroundColor.toString(16).padStart(6, '0')}`,
      align: 'center',
      fixedWidth: buttonWidth,
      padding: {
        x: 8,
        y: 8,
      },
    }).setOrigin(0.5);

    safeText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        this.playButtonClickSound();
        void this.trySafeRitual();
      });

    const safeDetail = this.safeRitualInProgress
      ? this.t('ui.prestige.safePending')
      : this.t('ui.prestige.safeDetailSacrifice');

    panel.add(this.add.text(safeX, actionY + 23, safeDetail, {
      color: canSafeRitual ? '#cdebb3' : '#9ca79f',
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompact ? '11px' : '12px',
      align: 'center',
      fixedWidth: buttonWidth,
      wordWrap: {
        width: buttonWidth,
      },
    }).setOrigin(0.5));

    panel.add(normalText);
    panel.add(safeText);
  }

  private closePrestigePanel(resetConfirmation = true): void {
    if (this.prestigePanel) {
      this.prestigePanel.destroy();
      this.prestigePanel = undefined;
      this.hideModalOverlay();
    }

    if (resetConfirmation) {
      this.prestigeConfirmationArmed = false;
    }
  }

  private updateCoinBugs(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) {
      return;
    }

    this.activeCoinBugs.forEach((bug) => {
      if (bug.collected) {
        return;
      }

      bug.lifetimeMs = updateCoinBugLifetime(bug.lifetimeMs, deltaMs);

      if (shouldExpireCoinBug(bug.lifetimeMs)) {
        this.expireCoinBug(bug);
      }
    });

    this.activeCoinBugs = this.activeCoinBugs.filter((bug) => bug.container.active);
    this.coinBugSpawnAccumulatorMs += deltaMs;

    if (!shouldAttemptCoinBugSpawn({
      spawnAccumulatorMs: this.coinBugSpawnAccumulatorMs,
      nextSpawnDelayMs: this.nextCoinBugSpawnMs,
      activeCoinBugCount: this.getActiveCoinBugCount(),
      maxActiveCoinBugs: COIN_BUG_MAX_ACTIVE,
      isModalOpen: this.isModalOpen(),
      isDraggingMonster: this.activeDragSlotId !== null,
    })) {
      return;
    }

    if (this.spawnCoinBug()) {
      this.scheduleNextCoinBugSpawn();
      return;
    }

    const spawnState = getNextCoinBugSpawnState(false, this.nextCoinBugSpawnMs, COIN_BUG_FAILED_SPAWN_RETRY_MS);
    this.coinBugSpawnAccumulatorMs = spawnState.spawnAccumulatorMs;
    this.nextCoinBugSpawnMs = spawnState.nextSpawnDelayMs;
  }

  private getActiveCoinBugCount(): number {
    return getActiveCoinBugStateCount(this.activeCoinBugs.map((bug) => ({
      id: bug.id,
      x: bug.container.x,
      y: bug.container.y,
      lifetimeMs: bug.lifetimeMs,
      collected: bug.collected,
      active: bug.container.active,
    })));
  }

  private scheduleNextCoinBugSpawn(): void {
    const spawnState = getNextCoinBugSpawnState(true, this.getNextCoinBugSpawnDelayMs(), COIN_BUG_FAILED_SPAWN_RETRY_MS);
    this.coinBugSpawnAccumulatorMs = spawnState.spawnAccumulatorMs;
    this.nextCoinBugSpawnMs = spawnState.nextSpawnDelayMs;
  }

  private getNextCoinBugSpawnDelayMs(): number {
    return getRandomDelayMs(COIN_BUG_SPAWN_MIN_MS, COIN_BUG_SPAWN_MAX_MS, Math.random());
  }

  private spawnCoinBug(): boolean {
    const position = this.getCoinBugSpawnPosition();

    if (!position) {
      return false;
    }

    const container = this.createCoinBugVisual(position.x, position.y);
    const bug: CoinBug = {
      id: this.nextCoinBugId,
      container,
      lifetimeMs: getRandomLifetimeMs(COIN_BUG_MIN_LIFETIME_MS, COIN_BUG_MAX_LIFETIME_MS, Math.random()),
      collected: false,
    };

    this.nextCoinBugId += 1;

    bug.bobTween = this.tweens.add({
      targets: container,
      y: container.y - 4,
      yoyo: true,
      repeat: -1,
      duration: 820,
      ease: 'Sine.easeInOut',
    });

    const sparkle = container.getByName('sparkle') as Phaser.GameObjects.Shape | null;

    if (sparkle) {
      bug.sparkleTween = this.tweens.add({
        targets: sparkle,
        alpha: 0.18,
        scale: 0.75,
        yoyo: true,
        repeat: -1,
        duration: 520,
        ease: 'Sine.easeInOut',
      });
    }

    const ring = container.getByName('tap-ring') as Phaser.GameObjects.Shape | null;

    if (ring) {
      bug.ringTween = this.tweens.add({
        targets: ring,
        alpha: 0.12,
        scale: 1.14,
        yoyo: true,
        repeat: -1,
        duration: 920,
        ease: 'Sine.easeInOut',
      });
    }

    container.on(
      'pointerdown',
      (
        pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        if (this.isModalOpen() || this.activeDragSlotId !== null) {
          return;
        }

        event.stopPropagation();
        pointer.event?.stopPropagation();
        this.collectCoinBug(bug);
      },
    );

    this.activeCoinBugs.push(bug);
    return true;
  }

  private createCoinBugVisual(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setDepth(8).setAlpha(0);
    const glow = this.add.circle(0, 0, 21, 0xfff1a6, 0.22);
    const tapRing = this.add.circle(0, 0, 25, 0xfff8c9, 0)
      .setStrokeStyle(2, 0xfff8c9, 0.28)
      .setName('tap-ring');
    const leftWing = this.add.ellipse(-8, -5, 14, 10, 0xd6ffe4, 0.55)
      .setStrokeStyle(1, 0xf7ffe8, 0.42);
    const rightWing = this.add.ellipse(8, -5, 14, 10, 0xd6ffe4, 0.55)
      .setStrokeStyle(1, 0xf7ffe8, 0.42);
    const body = this.add.ellipse(0, 2, 20, 16, 0xf3d06b, 0.96)
      .setStrokeStyle(2, 0x7b5628, 0.9);
    const shine = this.add.ellipse(-5, -1, 7, 4, 0xffffff, 0.38);
    const eyeLeft = this.add.circle(-4, -3, 1.6, 0x173c27, 1);
    const eyeRight = this.add.circle(4, -3, 1.6, 0x173c27, 1);
    const sparkle = this.add.circle(13, -14, 3, 0xfff8c9, 0.86).setName('sparkle');

    container.add([glow, tapRing, leftWing, rightWing, body, shine, eyeLeft, eyeRight, sparkle]);
    container.setSize(COIN_BUG_HITBOX_SIZE, COIN_BUG_HITBOX_SIZE);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-COIN_BUG_HITBOX_SIZE / 2, -COIN_BUG_HITBOX_SIZE / 2, COIN_BUG_HITBOX_SIZE, COIN_BUG_HITBOX_SIZE),
      Phaser.Geom.Rectangle.Contains,
    );

    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: { from: 0.84, to: 1 },
      duration: 180,
      ease: 'Back.easeOut',
    });

    return container;
  }

  private getCoinBugSpawnPosition(): { x: number; y: number } | null {
    const layout = this.getLayout();

    return chooseCoinBugSpawnPosition({
      layout,
      worldWidth: this.scale.width,
      hitboxSize: COIN_BUG_HITBOX_SIZE,
      cellSize: this.cellSize,
      slotCenters: this.slotCenters,
      existingBugPositions: this.activeCoinBugs
        .filter((bug) => !bug.collected)
        .map((bug) => ({ x: bug.container.x, y: bug.container.y })),
      minDistanceFromOtherBugs: COIN_BUG_MIN_DISTANCE_FROM_OTHER_BUGS,
      maxAttempts: COIN_BUG_SPAWN_ATTEMPTS,
      randomInteger: (min, max) => Phaser.Math.Between(min, max),
    });
  }

  private collectCoinBug(bug: CoinBug): void {
    if (bug.collected) {
      return;
    }

    bug.collected = true;
    bug.container.disableInteractive();
    bug.bobTween?.stop();
    bug.sparkleTween?.stop();
    bug.ringTween?.stop();

    const reward = this.getCoinBugReward();
    this.currency.coins = this.sanitizeCoins(this.currency.coins + reward);
    this.hasUnsavedProgress = true;
    this.skipSavingUntilProgress = false;
    audioSystem.resume();
    audioSystem.playCoinTick();
    this.updateHud();
    this.incrementMissionProgress('catch-coin-bugs');
    this.showFloatingCoinReward(bug.container.x, bug.container.y - 12, reward);
    this.showCoinBugPickupPulse(bug.container.x, bug.container.y);

    this.tweens.add({
      targets: bug.container,
      alpha: 0,
      scale: 1.28,
      duration: 220,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.removeCoinBug(bug);
      },
    });
  }

  private showCoinBugPickupPulse(x: number, y: number): void {
    const pulse = this.add.circle(x, y, 18, 0xfff8c9, 0)
      .setStrokeStyle(2, 0xfff8c9, 0.55)
      .setDepth(83);

    this.tweens.add({
      targets: pulse,
      alpha: 0,
      scale: 1.75,
      duration: 260,
      ease: 'Sine.easeOut',
      onComplete: () => {
        pulse.destroy();
      },
    });
  }

  private getCoinBugReward(): number {
    const baseReward = getCoinBugRewardBase(this.getTotalIncomePerSecond(), COIN_BUG_MIN_REWARD, COIN_BUG_REWARD_SECONDS);

    return getCoinBugRewardAmount(baseReward, this.getUpgradeLevel('coin-bug-value'));
  }

  private handleTapFarm(pointer: Phaser.Input.Pointer): void {
    const tapResult = getTapFarmTapResult({
      state: {
        tapFarmEnergy: this.tapFarmEnergy,
        tapFarmCombo: this.tapFarmCombo,
        lastTapFarmAt: this.lastTapFarmAt,
        lastTapFarmComboAt: this.lastTapFarmComboAt,
      },
      config: TAP_FARM_DEFAULT_CONFIG,
      now: this.time.now,
      totalIncomePerSecond: this.getTotalIncomePerSecond(),
      tapPowerLevel: this.getUpgradeLevel('tap-power'),
    });

    if (!tapResult.accepted) {
      return;
    }

    this.tapFarmEnergy = tapResult.nextState.tapFarmEnergy;
    this.tapFarmCombo = tapResult.nextState.tapFarmCombo;
    this.lastTapFarmAt = tapResult.nextState.lastTapFarmAt;
    this.lastTapFarmComboAt = tapResult.nextState.lastTapFarmComboAt;
    const reward = tapResult.tapReward;
    this.currency.coins = this.sanitizeCoins(this.currency.coins + reward);
    this.hasUnsavedProgress = true;
    this.skipSavingUntilProgress = false;
    audioSystem.resume();
    audioSystem.playCoinTick();

    const layout = this.getLayout();
    const popupX = Number.isFinite(pointer.worldX) ? pointer.worldX : layout.tapFarmX + layout.tapFarmWidth / 2;
    const popupY = Number.isFinite(pointer.worldY) ? pointer.worldY - 10 : layout.tapFarmY;
    const combo = tapResult.activeCombo;

    this.showFloatingCoinReward(popupX, popupY, reward);
    this.showTapFarmReactionStack(combo, false);
    this.showTapFarmPulse(tapResult.isTierTap ? 0xf3d06b : 0xd9f6ba);
    this.showTapFarmParticles(popupX, popupY, false);

    if (tapResult.shouldBurst) {
      this.triggerFarmBurst(tapResult.burstReward);
    }

    this.updateHud();
  }

  private getTapFarmReward(): number {
    const baseReward = getBaseTapFarmReward(this.getTotalIncomePerSecond(), TAP_FARM_MIN_REWARD, TAP_FARM_REWARD_SECONDS);
    const multiplier = this.getTapFarmComboMultiplier(this.getActiveTapFarmCombo());

    return getTapFarmRewardAmount(baseReward, multiplier, this.getUpgradeLevel('tap-power'));
  }

  private updateTapFarmComboTimeout(): void {
    const timeoutResult = getTapFarmComboTimeoutResult({
      tapFarmEnergy: this.tapFarmEnergy,
      tapFarmCombo: this.tapFarmCombo,
      lastTapFarmAt: this.lastTapFarmAt,
      lastTapFarmComboAt: this.lastTapFarmComboAt,
    }, this.time.now, TAP_FARM_COMBO_TIMEOUT_MS);

    if (!timeoutResult.expired) {
      return;
    }

    this.tapFarmCombo = timeoutResult.nextState.tapFarmCombo;
    this.lastTapFarmComboAt = timeoutResult.nextState.lastTapFarmComboAt;
    this.hideTapFarmReactionStack();
    this.updateTapFarmUi();
  }

  private getActiveTapFarmCombo(): number {
    return getActiveTapFarmComboFromState(this.tapFarmCombo, this.time.now, this.lastTapFarmComboAt, TAP_FARM_COMBO_TIMEOUT_MS);
  }

  private getTapFarmComboMultiplier(combo: number): number {
    return getTapFarmComboMultiplierFromState(combo, TAP_FARM_COMBO_MAX_MULTIPLIER);
  }

  private triggerFarmBurst(reward: number): void {
    const layout = this.getLayout();
    const x = layout.tapFarmX + layout.tapFarmWidth / 2;
    const y = layout.tapFarmY - 4;

    this.tapFarmEnergy = resetTapFarmEnergy();
    this.currency.coins = this.sanitizeCoins(this.currency.coins + reward);
    this.showTapFarmReactionStack(this.getActiveTapFarmCombo(), true);
    this.showFarmBurstReward(x, y, reward);
    this.showTapFarmPulse(0xf3d06b);
    this.showTapFarmParticles(x, y, true);
  }

  private showTapFarmReactionStack(combo: number, isBurst: boolean): void {
    const layout = this.getLayout();
    const safeCombo = Math.max(1, Math.floor(combo));
    const multiplier = this.getTapFarmComboMultiplier(safeCombo);
    const tier = this.getTapFarmReactionTier(safeCombo);
    const targetScale = this.getTapFarmReactionScale(safeCombo);
    const position = this.getTapFarmReactionPosition(layout, tier, targetScale);

    if (!this.tapFarmReactionContainer || !this.tapFarmReactionContainer.active) {
      this.tapFarmReactionContainer = this.add.container(position.x, position.y).setDepth(86);
    }

    this.tapFarmReactionTween?.stop();
    this.tapFarmReactionHideTween?.stop();
    this.tweens.killTweensOf(this.tapFarmReactionContainer);
    this.tapFarmReactionContainer.removeAll(true);
    this.tapFarmReactionContainer.setPosition(position.x, position.y);
    this.tapFarmReactionContainer.setVisible(true);
    this.tapFarmReactionContainer.setAlpha(1);
    this.tapFarmReactionContainer.setScale(targetScale);

    this.populateTapFarmReactionBadge(layout, safeCombo, multiplier, tier, isBurst);

    this.tapFarmReactionTween = this.tweens.add({
      targets: this.tapFarmReactionContainer,
      scale: targetScale * (isBurst ? 1.28 : 1.14),
      duration: isBurst ? 150 : 95,
      yoyo: true,
      ease: 'Sine.easeOut',
    });

    if (isBurst) {
      this.showTapFarmBadgeBurstEffect(position.x, position.y, tier, targetScale);
    }

    this.tapFarmReactionHideEvent?.remove(false);
    this.tapFarmReactionHideEvent = this.time.delayedCall(TAP_FARM_COMBO_TIMEOUT_MS + 120, () => {
      this.hideTapFarmReactionStack();
    });
  }

  private populateTapFarmReactionBadge(
    layout: FarmSceneLayout,
    combo: number,
    multiplier: number,
    tier: TapFarmReactionTier,
    isBurst: boolean,
  ): void {
    if (!this.tapFarmReactionContainer) {
      return;
    }

    const radius = tier.radius;
    const ringAlpha = isBurst ? 0.95 : 0.78;
    const sparkleRadius = radius + (layout.isNarrow ? 9 : 11);

    this.tapFarmReactionContainer.add(this.add.circle(2, 4, radius + 8, THEME.shadow, 0.22));
    this.tapFarmReactionContainer.add(this.add.circle(0, 0, radius + 12, tier.glowColor, isBurst ? 0.28 : 0.18));

    if (tier.flareCount > 0) {
      const flareWidth = tier.flareCount >= 4 ? 32 : 24;
      const flareAlpha = tier.flareCount >= 4 ? 0.52 : 0.4;

      this.tapFarmReactionContainer.add(this.add.ellipse(
        -radius - 13,
        1,
        flareWidth,
        16,
        tier.accentColor,
        flareAlpha,
      ).setAngle(-18));
      this.tapFarmReactionContainer.add(this.add.ellipse(
        radius + 13,
        1,
        flareWidth,
        16,
        tier.accentColor,
        flareAlpha,
      ).setAngle(18));
    }

    this.tapFarmReactionContainer.add(this.add.circle(0, 0, radius, tier.fillColor, 0.96)
      .setStrokeStyle(tier.ringWidth, tier.ringColor, ringAlpha));
    this.tapFarmReactionContainer.add(this.add.circle(-radius * 0.28, -radius * 0.34, radius * 0.28, 0xffffff, 0.22));
    this.tapFarmReactionContainer.add(this.add.circle(radius * 0.24, radius * 0.22, radius * 0.18, tier.accentColor, 0.16));

    if (combo >= 10) {
      this.tapFarmReactionContainer.add(this.add.circle(0, 0, radius + 7, tier.ringColor, 0)
        .setStrokeStyle(2, tier.ringColor, combo >= 40 ? 0.58 : 0.42));
    }

    for (let index = 0; index < tier.sparkleCount; index += 1) {
      const angle = ((Math.PI * 2) / Math.max(1, tier.sparkleCount)) * index - Math.PI / 2;
      const distance = sparkleRadius + (index % 2 === 0 ? 0 : 5);
      const sparkle = this.add.star(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        5,
        combo >= 40 ? 1.8 : 1.4,
        combo >= 70 ? 5.8 : combo >= 20 ? 5 : 4,
        index % 2 === 0 ? tier.ringColor : tier.accentColor,
        combo >= 20 ? 0.9 : 0.68,
      );
      sparkle.setAngle(Phaser.Math.RadToDeg(angle));
      this.tapFarmReactionContainer.add(sparkle);
    }

    this.tapFarmReactionContainer.add(this.add.text(0, -radius - 13, this.t('ui.tapFarm.comboLabel'), {
      color: tier.labelColor,
      fontFamily: UI_FONT_FAMILY,
      fontSize: layout.isNarrow ? '10px' : '11px',
      fontStyle: 'bold',
      stroke: tier.textStroke,
      strokeThickness: 3,
    }).setOrigin(0.5));

    this.tapFarmReactionContainer.add(this.add.text(0, -3, combo.toString(), {
      color: tier.numberColor,
      fontFamily: UI_FONT_FAMILY,
      fontSize: layout.isNarrow ? '30px' : '34px',
      fontStyle: 'bold',
      stroke: tier.textStroke,
      strokeThickness: 5,
    }).setOrigin(0.5));

    this.tapFarmReactionContainer.add(this.add.text(0, radius - 7, `x${this.formatTapFarmComboMultiplier(multiplier)}`, {
      color: tier.multiplierColor,
      fontFamily: UI_FONT_FAMILY,
      fontSize: layout.isNarrow ? '13px' : '14px',
      fontStyle: 'bold',
      stroke: tier.textStroke,
      strokeThickness: 4,
    }).setOrigin(0.5));
  }

  private getTapFarmReactionPosition(
    layout: FarmSceneLayout,
    tier: TapFarmReactionTier,
    targetScale: number,
  ): Phaser.Math.Vector2 {
    const scaledRadius = (tier.radius + 22) * targetScale;
    const x = layout.isNarrow
      ? Math.min(
        this.scale.width - layout.margin - scaledRadius,
        layout.tapFarmX + layout.tapFarmWidth - 38,
      )
      : layout.tapFarmX + layout.tapFarmWidth / 2;
    const y = Math.max(
      layout.isNarrow ? 68 : 74,
      layout.tapFarmY - (layout.isNarrow ? 18 : 28),
    );

    return new Phaser.Math.Vector2(x, y);
  }

  private getTapFarmReactionTier(combo: number): TapFarmReactionTier {
    if (combo >= 70) {
      return {
        fillColor: 0x7554c8,
        ringColor: 0xfff0a8,
        glowColor: 0xff83df,
        accentColor: 0xf3d06b,
        textStroke: '#342052',
        numberColor: '#ffffff',
        multiplierColor: '#fff0a8',
        labelColor: '#ffe8ff',
        radius: 38,
        ringWidth: 5,
        sparkleCount: 8,
        flareCount: 4,
      };
    }

    if (combo >= 40) {
      return {
        fillColor: 0xd88b2f,
        ringColor: 0xfff0a8,
        glowColor: 0xffb75e,
        accentColor: 0xffdf7d,
        textStroke: '#5f3212',
        numberColor: '#ffffff',
        multiplierColor: '#fff0a8',
        labelColor: '#fff4c8',
        radius: 36,
        ringWidth: 4,
        sparkleCount: 6,
        flareCount: 2,
      };
    }

    if (combo >= 20) {
      return {
        fillColor: 0xb956bf,
        ringColor: 0xff9fd6,
        glowColor: 0xd8bdff,
        accentColor: 0xfff0a8,
        textStroke: '#4d2358',
        numberColor: '#ffffff',
        multiplierColor: '#fff0a8',
        labelColor: '#ffe0ff',
        radius: 34,
        ringWidth: 4,
        sparkleCount: 5,
        flareCount: 0,
      };
    }

    if (combo >= 10) {
      return {
        fillColor: 0x45a985,
        ringColor: 0xf3d06b,
        glowColor: 0xa9f7ff,
        accentColor: 0xd9f6ba,
        textStroke: '#173c27',
        numberColor: '#ffffff',
        multiplierColor: '#fff0a8',
        labelColor: '#eaffd6',
        radius: 32,
        ringWidth: 4,
        sparkleCount: 3,
        flareCount: 0,
      };
    }

    return {
      fillColor: 0x3f8c61,
      ringColor: 0x9ff7ff,
      glowColor: 0x70d6d0,
      accentColor: 0xd9f6ba,
      textStroke: '#10291a',
      numberColor: '#ffffff',
      multiplierColor: '#d9f6ba',
      labelColor: '#eaffd6',
      radius: 30,
      ringWidth: 3,
      sparkleCount: 1,
      flareCount: 0,
    };
  }

  private getTapFarmReactionScale(combo: number): number {
    const comboScale = 0.9 + Math.min(0.34, combo * 0.006);
    const tierScale = combo >= 70 ? 0.22 : combo >= 40 ? 0.15 : combo >= 20 ? 0.08 : combo >= 10 ? 0.04 : 0;

    return Phaser.Math.Clamp(comboScale + tierScale, 0.9, 1.46);
  }

  private showTapFarmBadgeBurstEffect(
    x: number,
    y: number,
    tier: TapFarmReactionTier,
    targetScale: number,
  ): void {
    const baseRadius = tier.radius * targetScale;

    for (let index = 0; index < 2; index += 1) {
      const ring = this.add.circle(x, y, baseRadius + index * 8, tier.ringColor, 0)
        .setStrokeStyle(index === 0 ? 5 : 3, index === 0 ? 0xfff4a8 : tier.glowColor, index === 0 ? 0.86 : 0.58)
        .setDepth(85);
      this.tapFarmReactionEffects.push(ring);

      this.tweens.add({
        targets: ring,
        alpha: 0,
        scale: index === 0 ? 2.05 : 2.45,
        duration: index === 0 ? 360 : 480,
        ease: 'Sine.easeOut',
        onComplete: () => {
          ring.destroy();
          this.tapFarmReactionEffects = this.tapFarmReactionEffects.filter((effect) => effect !== ring);
        },
      });
    }

    for (let index = 0; index < 10; index += 1) {
      const angle = ((Math.PI * 2) / 10) * index;
      const startDistance = baseRadius + 6;
      const endDistance = baseRadius + 36 + (index % 2) * 10;
      const sparkle = this.add.star(
        x + Math.cos(angle) * startDistance,
        y + Math.sin(angle) * startDistance,
        5,
        2,
        7,
        index % 2 === 0 ? tier.ringColor : tier.accentColor,
        0.95,
      ).setDepth(87);
      this.tapFarmReactionEffects.push(sparkle);

      this.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * endDistance,
        y: y + Math.sin(angle) * endDistance,
        alpha: 0,
        scale: 1.35,
        angle: Phaser.Math.RadToDeg(angle) + 45,
        duration: 520,
        ease: 'Sine.easeOut',
        onComplete: () => {
          sparkle.destroy();
          this.tapFarmReactionEffects = this.tapFarmReactionEffects.filter((effect) => effect !== sparkle);
        },
      });
    }
  }

  private hideTapFarmReactionStack(): void {
    if (!this.tapFarmReactionContainer || !this.tapFarmReactionContainer.active) {
      return;
    }

    this.tapFarmReactionHideEvent?.remove(false);
    this.tapFarmReactionHideEvent = undefined;
    this.tapFarmReactionTween?.stop();
    this.tapFarmReactionHideTween?.stop();
    this.tapFarmReactionHideTween = this.tweens.add({
      targets: this.tapFarmReactionContainer,
      alpha: 0,
      y: this.tapFarmReactionContainer.y - 12,
      scale: this.tapFarmReactionContainer.scale * 0.72,
      duration: 220,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.tapFarmReactionContainer?.setVisible(false);
        this.tapFarmReactionHideTween = undefined;
      },
    });
  }

  private clearTapFarmReactionStack(): void {
    this.tapFarmReactionTween?.stop();
    this.tapFarmReactionHideTween?.stop();
    this.tapFarmReactionHideEvent?.remove(false);
    this.tapFarmReactionEffects.forEach((effect) => {
      this.tweens.killTweensOf(effect);
      effect.destroy();
    });
    this.tapFarmReactionEffects = [];
    this.tapFarmReactionContainer?.destroy();
    this.tapFarmReactionContainer = undefined;
    this.tapFarmReactionTween = undefined;
    this.tapFarmReactionHideTween = undefined;
    this.tapFarmReactionHideEvent = undefined;
  }

  private showTapFarmPulse(color = 0xd9f6ba): void {
    const layout = this.getLayout();
    const pulse = this.add.rectangle(
      layout.tapFarmX + layout.tapFarmWidth / 2,
      layout.tapFarmY + layout.tapFarmHeight / 2,
      layout.tapFarmWidth,
      layout.tapFarmHeight,
      color,
      0,
    )
      .setStrokeStyle(3, color, 0.62)
      .setDepth(82);

    this.tweens.add({
      targets: pulse,
      alpha: 0,
      scaleX: 1.06,
      scaleY: 1.18,
      duration: 180,
      ease: 'Sine.easeOut',
      onComplete: () => {
        pulse.destroy();
      },
    });
  }

  private showTapFarmParticles(x: number, y: number, isBurst: boolean): void {
    const combo = this.getActiveTapFarmCombo();
    const particleCount = isBurst
      ? 14
      : combo >= 40
        ? 7
        : combo >= 20
          ? 5
          : combo >= 10
            ? 3
            : 2;
    const colors = isBurst
      ? ['#fff4a8', '#ff8fb3', '#9ff7ff', '#d8bdff']
      : combo >= 20
        ? ['#ff8fb3', '#fff4a8', '#d8bdff']
        : ['#ff9fb1', '#f3d06b'];

    for (let index = 0; index < particleCount; index += 1) {
      const startX = x + Phaser.Math.Between(-12, 12);
      const startY = y + Phaser.Math.Between(-8, 8);
      const driftX = Phaser.Math.Between(isBurst ? -42 : -24, isBurst ? 42 : 24);
      const driftY = Phaser.Math.Between(isBurst ? -64 : -42, isBurst ? -32 : -20);
      const color = colors[index % colors.length];
      const useHeart = isBurst || index % 2 === 0;
      const particle = useHeart
        ? this.add.text(startX, startY, '♥', {
          color,
          fontFamily: UI_FONT_FAMILY,
          fontSize: `${Phaser.Math.Between(isBurst ? 15 : 10, isBurst ? 22 : 16)}px`,
          fontStyle: 'bold',
          stroke: '#10291a',
          strokeThickness: 2,
        }).setOrigin(0.5)
        : this.add.star(
          startX,
          startY,
          5,
          isBurst ? 2.5 : 1.6,
          isBurst ? 6 : 4,
          Number.parseInt(color.slice(1), 16),
          0.9,
        );

      particle.setDepth(84);
      particle.setScale(isBurst ? 1.08 : 0.95);

      this.tweens.add({
        targets: particle,
        x: startX + driftX,
        y: startY + driftY,
        alpha: 0,
        scale: isBurst ? 1.46 : 1.24,
        angle: Phaser.Math.Between(-18, 18),
        duration: Phaser.Math.Between(isBurst ? 720 : 520, isBurst ? 980 : 760),
        ease: 'Sine.easeOut',
        onComplete: () => {
          particle.destroy();
        },
      });
    }
  }

  private showFarmBurstReward(x: number, y: number, amount: number): void {
    const text = this.add.text(x, y, this.t('ui.tapFarm.burstPopup', {
      amount: this.formatSignedCoinAmount(amount),
    }), {
      color: '#fff4a8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: this.scale.width < 380 ? '16px' : '19px',
      fontStyle: 'bold',
      stroke: '#10291a',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(84);

    this.tweens.add({
      targets: text,
      y: text.y - 28,
      alpha: 0,
      scale: 1.08,
      duration: 900,
      ease: 'Sine.easeOut',
      onComplete: () => {
        text.destroy();
      },
    });
  }

  private showFloatingCoinReward(x: number, y: number, amount: number): void {
    const text = this.add.text(x, y, this.formatSignedCoinAmount(amount), {
      color: '#fff4a8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: this.scale.width < 380 ? '15px' : '17px',
      fontStyle: 'bold',
      stroke: '#10291a',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(84);

    this.tweens.add({
      targets: text,
      y: text.y - 22,
      alpha: 0,
      duration: 720,
      ease: 'Sine.easeOut',
      onComplete: () => {
        text.destroy();
      },
    });
  }

  private expireCoinBug(bug: CoinBug): void {
    if (bug.collected) {
      return;
    }

    bug.collected = true;
    bug.container.disableInteractive();
    bug.bobTween?.stop();
    bug.sparkleTween?.stop();
    bug.ringTween?.stop();

    this.tweens.add({
      targets: bug.container,
      alpha: 0,
      scale: 0.72,
      duration: 360,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.removeCoinBug(bug);
      },
    });
  }

  private removeCoinBug(bug: CoinBug): void {
    bug.bobTween?.stop();
    bug.sparkleTween?.stop();
    bug.ringTween?.stop();
    bug.container.destroy();
    this.activeCoinBugs = this.activeCoinBugs.filter((activeBug) => activeBug.id !== bug.id);
  }

  private clearCoinBugs(): void {
    this.activeCoinBugs.forEach((bug) => {
      bug.bobTween?.stop();
      bug.sparkleTween?.stop();
      bug.ringTween?.stop();
      bug.container.destroy();
    });
    this.activeCoinBugs = [];
  }

  private createInitialFarmSlots(): FarmSlotState[] {
    return createInitialFarmSlotState(TOTAL_SLOT_COUNT);
  }

  private createInitialMissionProgress(): Record<MissionId, number> {
    return createInitialMissionProgressState(MISSION_DEFINITIONS);
  }

  private getMissionDefinition(missionId: MissionId): MissionDefinition | undefined {
    return getMissionDefinitionFromState(MISSION_DEFINITIONS, missionId);
  }

  private getMissionProgress(mission: MissionDefinition): number {
    return getMissionProgressFromState(mission, this.missionProgress, this.completedMissionIds);
  }

  private getSanitizedMissionProgress(): Record<MissionId, number> {
    return getSanitizedMissionProgressFromState(
      MISSION_DEFINITIONS,
      this.missionProgress,
      this.completedMissionIds,
    );
  }

  private incrementMissionProgress(missionId: MissionId, amount = 1): void {
    const mission = this.getMissionDefinition(missionId);

    if (!mission || !canIncrementMission(missionId, this.completedMissionIds, this.claimedMissionIds)) {
      return;
    }

    const nextProgress = getIncrementedMissionProgress(mission, this.getMissionProgress(mission), amount);
    this.missionProgress[missionId] = nextProgress;

    if (nextProgress >= mission.goal) {
      this.completeMission(missionId);
      return;
    }

    this.hasUnsavedProgress = true;
    this.refreshMissionsPanel();
  }

  private completeMission(missionId: MissionId, showCompletionToast = true): void {
    const mission = this.getMissionDefinition(missionId);

    if (!mission || this.completedMissionIds.has(missionId)) {
      return;
    }

    this.missionProgress[missionId] = mission.goal;
    this.completedMissionIds.add(missionId);
    this.hasUnsavedProgress = true;
    this.refreshMissionsPanel();

    if (showCompletionToast) {
      this.showToast(this.t('toast.missionComplete'), 'success');
    }
  }

  private evaluateMonsterMissions(monster: MonsterDefinition, showCompletionToast = true): void {
    if (monster.family === 'Mushroom') {
      this.completeMission('discover-mushroom', showCompletionToast);
    }

    this.evaluateOwnedMonsterMissions(showCompletionToast);
  }

  private evaluateOwnedMonsterMissions(showCompletionToast = true): void {
    if (this.farmSlots.some((slot) => slot.monster?.family === 'Slime' && slot.monster.level >= 3)) {
      this.completeMission('own-level-3-slime', showCompletionToast);
    }
  }

  private syncMissionStateFromCurrentProgress(showCompletionToast = false): void {
    if (hasDiscoveredFamily(this.discoveredMonsters, 'Mushroom')
      || this.farmSlots.some((slot) => slot.monster?.family === 'Mushroom')) {
      this.completeMission('discover-mushroom', showCompletionToast);
    }

    this.evaluateOwnedMonsterMissions(showCompletionToast);

    if (Object.values(this.upgradeLevels).some((level) => level > 0)) {
      this.completeMission('buy-upgrade-1', showCompletionToast);
    }

    if (this.expansionUnlocked) {
      this.completeMission('unlock-expansion', showCompletionToast);
    }

    if (this.monsterEssence > 0 || this.essencePowerLevel > 0 || this.rareHatchLevel > 0 || this.totalRitualsPerformed > 0) {
      this.completeMission('prestige-once', showCompletionToast);
    }

    MISSION_DEFINITIONS.forEach((mission) => {
      if (this.completedMissionIds.has(mission.id)) {
        this.missionProgress[mission.id] = mission.goal;
      }
    });
  }

  private claimMissionReward(missionId: MissionId): void {
    const mission = this.getMissionDefinition(missionId);

    if (!mission || getMissionClaimStatus(mission, this.completedMissionIds, this.claimedMissionIds) !== 'complete') {
      return;
    }

    if (mission.reward.type === 'coins') {
      this.currency.coins = this.sanitizeCoins(this.currency.coins + this.getEffectiveMissionCoinReward(mission.reward.amount));
    } else {
      this.monsterEssence = sanitizePrestigeIntegerState(this.monsterEssence + mission.reward.amount);
    }

    this.claimedMissionIds.add(missionId);
    this.skipSavingUntilProgress = false;
    this.updateHud();
    this.saveProgress();
    this.refreshMissionsPanel();
    this.showToast(this.t('toast.claimed', {
      reward: this.getMissionRewardText(mission.reward),
    }), 'success');
  }

  private getMissionRewardText(reward: MissionReward): string {
    if (reward.type === 'coins') {
      return this.t('common.coins', {
        amount: this.formatCoinAmount(this.getEffectiveMissionCoinReward(reward.amount)),
      });
    }

    return this.t('common.essence', {
      amount: reward.amount,
    });
  }

  private getEffectiveOrderCoinReward(amount: number): number {
    return getOrderCoinReward(amount, this.getUpgradeLevel('order-bonus'));
  }

  private getEffectiveMissionCoinReward(amount: number): number {
    return getOrderCoinReward(amount, this.getUpgradeLevel('order-bonus'));
  }

  private isSlotUnlocked(slotId: number): boolean {
    return isFarmSlotUnlocked(slotId, this.expansionUnlocked, MAIN_SLOT_COUNT);
  }

  private getUnlockedFarmSlots(): FarmSlotState[] {
    return getUnlockedFarmSlotState(this.farmSlots, this.expansionUnlocked, MAIN_SLOT_COUNT);
  }

  private tryUnlockExpansion(): void {
    if (this.expansionUnlocked) {
      return;
    }

    if (this.currency.coins < EXPANSION_UNLOCK_COST) {
      this.showNotEnoughCoinsMessage();
      return;
    }

    this.currency.coins = this.sanitizeCoins(this.currency.coins - EXPANSION_UNLOCK_COST);
    this.expansionUnlocked = true;
    this.skipSavingUntilProgress = false;
    this.completeMission('unlock-expansion');
    this.createExpansionPlaceholder();
    this.hideFarmMessage();
    this.updateHud();
    this.saveProgress();
    this.showToast(this.t('toast.expansionUnlocked'), 'success');
  }

  private createInitialUpgradeLevels(): Record<UpgradeId, number> {
    return createInitialUpgradeLevelState(UPGRADE_DEFINITIONS);
  }

  private getUpgradeLevel(upgradeId: UpgradeId): number {
    return getUpgradeLevelFromState(UPGRADE_DEFINITIONS, this.upgradeLevels, upgradeId);
  }

  private getSanitizedUpgradeLevels(): Record<UpgradeId, number> {
    return getSanitizedUpgradeLevelsFromState(UPGRADE_DEFINITIONS, this.upgradeLevels);
  }

  private getUpgradeCostForLevel(upgrade: UpgradeDefinition, level: number): number {
    return getUpgradeCostForLevelFromState(upgrade, level);
  }

  private getUpgradeBuyModeLabel(mode: UpgradeBuyMode): string {
    return mode === 'max' ? this.t('ui.upgrades.max') : mode;
  }

  private getUpgradePurchasePreview(upgrade: UpgradeDefinition, currentLevel: number): UpgradePurchasePreview {
    return getUpgradePurchasePreviewFromState(
      upgrade,
      currentLevel,
      this.currency.coins,
      this.upgradeBuyMode,
    );
  }

  private buyUpgrade(upgradeId: UpgradeId): void {
    const upgrade = UPGRADE_DEFINITIONS.find((definition) => definition.id === upgradeId);

    if (!upgrade) {
      return;
    }

    const currentLevel = this.getUpgradeLevel(upgradeId);

    if (isUpgradeMaxed(upgrade, currentLevel)) {
      return;
    }

    const purchasePreview = this.getUpgradePurchasePreview(upgrade, currentLevel);

    if (purchasePreview.levels <= 0) {
      this.showNotEnoughCoinsMessage();
      return;
    }

    this.currency.coins = this.sanitizeCoins(this.currency.coins - purchasePreview.totalCost);
    this.upgradeLevels = applyUpgradePurchase({
      ...this.upgradeLevels,
      [upgradeId]: currentLevel,
    }, upgradeId, purchasePreview.levels);
    this.hatchCooldownMs = getCappedHatchCooldown(this.hatchCooldownMs, this.getHatchCooldownMs());
    this.completeMission('buy-upgrade-1');
    this.hideFarmMessage();
    this.updateHud();
    this.saveProgress();
    this.openUpgradeShopPanel();
    this.showToast(purchasePreview.levels === 1
      ? this.t('toast.upgradePurchased')
      : this.t('toast.upgradePurchasedLevels', { count: purchasePreview.levels }), 'success');
  }

  private buyHatchBlessing(): void {
    const purchaseResult = getEssencePowerPurchaseResult(
      this.monsterEssence,
      this.essencePowerLevel,
      ESSENCE_POWER_COST,
    );

    if (!purchaseResult.success) {
      this.showToast(this.t('toast.notEnoughEssence'), 'warning');
      return;
    }

    this.monsterEssence = purchaseResult.monsterEssence;
    this.essencePowerLevel = purchaseResult.essencePowerLevel;
    this.hasPrestigedOnce = purchaseResult.hasPrestigedOnce;
    this.syncZoneUnlockFromPrestigeProgress();
    this.prestigeConfirmationArmed = false;
    this.updateHud();
    this.saveProgress();
    this.openPrestigePanel();
    this.showToast(this.t('toast.hatchBlessingUpgraded'), 'success');
  }

  private buyRareHatch(): void {
    if (!canAffordRareHatch(this.monsterEssence, RARE_HATCH_COST)) {
      this.showToast(this.t('toast.notEnoughEssence'), 'warning');
      return;
    }

    this.monsterEssence = sanitizePrestigeIntegerState(this.monsterEssence - RARE_HATCH_COST);
    this.rareHatchLevel = sanitizePrestigeIntegerState(this.rareHatchLevel + 1);
    this.hasPrestigedOnce = true;
    this.syncZoneUnlockFromPrestigeProgress();
    this.prestigeConfirmationArmed = false;
    this.updateHud();
    this.saveProgress();
    this.openPrestigePanel();
    this.showToast(this.t('toast.rareHatchUpgraded'), 'success');
  }

  private tryPrestige(): void {
    const ritualResult = getRitualCompletionResult(this.farmSlots, this.totalRitualsPerformed);

    if (!ritualResult.success) {
      this.showRitualBlockedToast(ritualResult);
      return;
    }

    if (!this.prestigeConfirmationArmed) {
      this.prestigeConfirmationArmed = true;
      this.openPrestigePanel();
      return;
    }

    this.performPrestigeReset(ritualResult);
    this.openPrestigePanel();
    this.showToast(this.t('toast.prestigeComplete', { amount: ritualResult.rewardEssence }), 'success');
  }

  private async trySafeRitual(): Promise<void> {
    const ritualResult = getRitualCompletionResult(this.farmSlots, this.totalRitualsPerformed);

    if (!ritualResult.success) {
      this.showRitualBlockedToast(ritualResult);
      return;
    }

    if (this.safeRitualInProgress) {
      return;
    }

    this.safeRitualInProgress = true;
    this.prestigeConfirmationArmed = false;
    this.openPrestigePanel();

    const adCompleted = await showRewardedAd('safe-ritual').catch(() => false);
    this.safeRitualInProgress = false;

    if (!adCompleted) {
      this.openPrestigePanel();
      this.showToast(this.t('toast.adNotCompleted'), 'warning');
      return;
    }

    const latestRitualResult = getRitualCompletionResult(this.farmSlots, this.totalRitualsPerformed);

    if (!latestRitualResult.success) {
      this.openPrestigePanel();
      this.showRitualBlockedToast(latestRitualResult);
      return;
    }

    this.performSafeRitualReward(latestRitualResult);
    this.openPrestigePanel();
    this.showToast(this.t('toast.safeRitualComplete', { amount: latestRitualResult.rewardEssence }), 'success');
  }

  private showRitualBlockedToast(ritualResult: Extract<RitualCompletionResult, { success: false }>): void {
    this.showToast(this.t(ritualResult.reason === 'missing-sacrifice'
      ? 'toast.ritualMissingSacrifice'
      : 'toast.prestigeRequirement'), 'warning');
  }

  private performSafeRitualReward(ritualResult: Extract<RitualCompletionResult, { success: true }>): void {
    this.consumeRitualSacrifice(ritualResult.sacrificeSlotId);
    this.monsterEssence = sanitizePrestigeIntegerState(this.monsterEssence + ritualResult.rewardEssence);
    this.totalRitualsPerformed = ritualResult.nextTotalRitualsPerformed;
    this.hasPrestigedOnce = true;
    this.resetHatchCostForRitual();
    this.syncZoneUnlockFromPrestigeProgress();
    this.skipSavingUntilProgress = false;
    this.prestigeConfirmationArmed = false;
    this.updateHud();
    this.updateHatchCooldownUi();
    this.completeMission('prestige-once');
    this.refreshOrdersPanel();
    this.refreshOrderWidget();
    this.saveProgress();
  }

  private consumeRitualSacrifice(slotId: number): void {
    this.clearSelectedSlot();
    this.cancelActiveDrag();
    this.farmSlots = clearSlotMonster(this.farmSlots, slotId);
    this.clearMonsterVisual(slotId);
  }

  private performPrestigeReset(ritualResult: Extract<RitualCompletionResult, { success: true }>): void {
    this.consumeRitualSacrifice(ritualResult.sacrificeSlotId);
    this.monsterEssence += ritualResult.rewardEssence;
    this.totalRitualsPerformed = ritualResult.nextTotalRitualsPerformed;
    this.hasPrestigedOnce = true;
    this.syncZoneUnlockFromPrestigeProgress();
    this.currency.coins = STARTING_COINS;
    this.nextMonsterId = 1;
    this.incomeAccumulatorMs = 0;
    this.saveThrottleAccumulatorMs = 0;
    this.hasUnsavedProgress = false;
    this.skipSavingUntilProgress = false;
    this.prestigeConfirmationArmed = false;
    this.upgradeLevels = this.createInitialUpgradeLevels();
    this.resetHatchCostForRitual();
    this.hatchCooldownMs = HATCH_COOLDOWN_MS;
    this.expansionUnlocked = false;
    this.farmSlots = this.createInitialFarmSlots();

    this.monsterVisuals.forEach((visual) => {
      visual?.destroy();
    });
    this.monsterDragZones.forEach((zone) => {
      zone?.destroy();
    });
    this.monsterVisuals = Array.from({ length: TOTAL_SLOT_COUNT }, () => null);
    this.monsterDragZones = Array.from({ length: TOTAL_SLOT_COUNT }, () => null);
    this.createExpansionPlaceholder();

    this.hideFarmMessage();
    this.clearSelectedSlot();
    this.updateHatchCooldownUi();
    this.updateHud();
    this.completeMission('prestige-once');
    this.refreshOrdersPanel();
    this.saveProgress();
  }

  private resetHatchCostForRitual(): void {
    this.currentEggCost = STARTING_EGG_COST;
  }

  private scheduleInitialOnboardingHints(): void {
    this.time.delayedCall(450, () => {
      if (this.getUnlockedFarmSlots().some((slot) => slot.monster)) {
        this.showOnboardingHint('income', this.t('hint.income'));
        this.checkMergeOnboardingHint();
        return;
      }

      this.showOnboardingHint('welcome', this.t('hint.welcome'));

      this.time.delayedCall(1500, () => {
        if (this.getUnlockedFarmSlots().every((slot) => slot.monster === null)) {
          this.showOnboardingHint('hatch', this.t('hint.hatch'));
        }
      });
    });
  }

  private updateOnboardingHints(): void {
    if (
      !this.onboardingHintsSeen.has('upgrades')
      && UPGRADE_DEFINITIONS.some((upgrade) => (
        this.getUpgradeLevel(upgrade.id) < upgrade.maxLevel
        && this.currency.coins >= this.getUpgradeCostForLevel(upgrade, this.getUpgradeLevel(upgrade.id))
      ))
    ) {
      this.showOnboardingHint('upgrades', this.t('hint.upgrades'));
    }
  }

  private checkMergeOnboardingHint(): void {
    if (this.hasMergeableMonsterPair()) {
      this.showOnboardingHint('merge', this.t('hint.merge'));
    }
  }

  private hasMergeableMonsterPair(): boolean {
    const monsterCounts = new Map<string, number>();

    this.getUnlockedFarmSlots().forEach((slot) => {
      if (!slot.monster || !getNextMonsterDefinition(slot.monster.family, slot.monster.level)) {
        return;
      }

      const key = `${slot.monster.family}:${slot.monster.level}`;
      monsterCounts.set(key, (monsterCounts.get(key) ?? 0) + 1);
    });

    return Array.from(monsterCounts.values()).some((count) => count >= 2);
  }

  private showOnboardingHint(hintId: OnboardingHintId, message: string): void {
    if (this.onboardingHintsSeen.has(hintId)) {
      return;
    }

    this.onboardingHintsSeen.add(hintId);
    this.showToast(message, 'info');
    this.saveProgress();
  }

  private resetOnboardingHints(): void {
    this.onboardingHintsSeen.clear();
    this.saveProgress();
    this.showToast(this.t('toast.hintsReset'), 'success');
    this.scheduleInitialOnboardingHints();
  }

  private getUpgradeCurrentEffectText(upgradeId: UpgradeId): string {
    if (upgradeId === 'slime-income-boost') {
      return this.t('upgrade.current.slime-income-boost', {
        value: this.getFamilyIncomeMultiplier('Slime').toFixed(2),
      });
    }

    if (upgradeId === 'mushroom-income-boost') {
      return this.t('upgrade.current.mushroom-income-boost', {
        value: this.getFamilyIncomeMultiplier('Mushroom').toFixed(2),
      });
    }

    if (upgradeId === 'cactus-income-boost') {
      return this.t('upgrade.current.cactus-income-boost', {
        value: this.getFamilyIncomeMultiplier('Cactus').toFixed(2),
      });
    }

    if (upgradeId === 'cell-income-boost') {
      return this.t('upgrade.current.cell-income-boost', {
        value: this.getFamilyIncomeMultiplier('Cell').toFixed(2),
      });
    }

    if (upgradeId === 'plant-income-boost') {
      return this.t('upgrade.current.plant-income-boost', {
        value: this.getFamilyIncomeMultiplier('Plant').toFixed(2),
      });
    }

    if (upgradeId === 'hatch-speed') {
      return this.t('upgrade.current.hatch-speed', {
        seconds: (this.getHatchCooldownMs() / MILLISECONDS_PER_SECOND).toFixed(1),
      });
    }

    if (upgradeId === 'mushroom-chance') {
      return this.t('upgrade.current.mushroom-chance', {
        percent: Math.round(this.getHatchChanceForFamily('Mushroom') * 100),
      });
    }

    if (upgradeId === 'egg-discount') {
      return this.t('upgrade.current.egg-discount', {
        amount: this.formatCoinAmount(this.getEffectiveEggCost()),
      });
    }

    if (upgradeId === 'tap-power') {
      return this.t('upgrade.current.tap-power', {
        value: this.getTapPowerMultiplier().toFixed(2),
      });
    }

    if (upgradeId === 'fusion-power') {
      return this.t('upgrade.current.fusion-power', {
        value: this.getSporeIncomeMultiplier().toFixed(2),
      });
    }

    if (upgradeId === 'order-bonus') {
      return this.t('upgrade.current.order-bonus', {
        value: this.getOrderBonusMultiplier().toFixed(2),
      });
    }

    if (upgradeId === 'coin-bug-value') {
      return this.t('upgrade.current.coin-bug-value', {
        value: this.getCoinBugValueMultiplier().toFixed(2),
      });
    }

    return this.t('upgrade.current.offline-storage', {
      duration: this.formatDuration(this.getOfflineCapSeconds()),
    });
  }

  private getFamilyIncomeMultiplier(family: MonsterFamily): number {
    return getFamilyIncomeMultiplier(
      family,
      this.getUpgradeLevel('slime-income-boost'),
      this.getUpgradeLevel('mushroom-income-boost'),
      this.getUpgradeLevel('fusion-power'),
      this.getUpgradeLevel('cactus-income-boost'),
      this.getUpgradeLevel('cell-income-boost'),
      this.getUpgradeLevel('plant-income-boost'),
    );
  }

  private getSporeIncomeMultiplier(): number {
    return getSporeIncomeMultiplier(this.getUpgradeLevel('fusion-power'));
  }

  private getPrestigeIncomeMultiplier(): number {
    return getRitualIncomeMultiplier(this.totalRitualsPerformed);
  }

  private getHatchCooldownMs(): number {
    return getHatchCooldownDurationForState(this.getUpgradeLevel('hatch-speed'));
  }

  private getOfflineCapSeconds(): number {
    return getOfflineCapSeconds(this.getUpgradeLevel('offline-storage'));
  }

  private getCurrentHatchPoolEntries(): HatchPoolEntryState[] {
    return getHatchPoolEntries({
      currentZone: this.currentZone,
      discoveredFamilies: this.getDiscoveredFamilies(),
      mushroomChanceLevel: this.getUpgradeLevel('mushroom-chance'),
      rareHatchLevel: this.rareHatchLevel,
    });
  }

  private getHatchChanceForFamily(family: MonsterFamily): number {
    return this.getCurrentHatchPoolEntries().find((entry) => entry.family === family)?.chance ?? 0;
  }

  private getTapPowerMultiplier(): number {
    return getTapFarmRewardAmount(100, 1, this.getUpgradeLevel('tap-power')) / 100;
  }

  private getOrderBonusMultiplier(): number {
    return getOrderCoinReward(100, this.getUpgradeLevel('order-bonus')) / 100;
  }

  private getCoinBugValueMultiplier(): number {
    return getCoinBugRewardAmount(100, this.getUpgradeLevel('coin-bug-value')) / 100;
  }

  private formatDuration(seconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);

    if (hours > 0 && minutes > 0) {
      return this.t('duration.hoursMinutes', { hours, minutes });
    }

    if (hours > 0) {
      return this.t('duration.hours', { hours });
    }

    return this.t('duration.minutes', { minutes });
  }

  private hatchMonster(): void {
    const emptySlot = findFirstEmptyUnlockedSlot(this.farmSlots, this.expansionUnlocked, MAIN_SLOT_COUNT);
    const hatchAttemptState = getHatchAttemptState({
      availableCoins: this.currency.coins,
      cost: this.getEffectiveEggCost(),
      hasEmptySlot: emptySlot !== undefined,
      hatchCooldownDurationMs: this.getHatchCooldownMs(),
      hatchCooldownMs: this.hatchCooldownMs,
      isFarmFull: this.isFarmFull(),
    });

    if (!hatchAttemptState.canHatch) {
      if (hatchAttemptState.reason === 'not-ready') {
        this.showToast(this.t('ui.hatch.hatching'), 'info');
      } else if (hatchAttemptState.reason === 'not-enough-coins') {
        this.showNotEnoughCoinsMessage();
      } else {
        this.showFullFarmMessage();
      }

      return;
    }

    if (!emptySlot) {
      this.showFullFarmMessage();
      return;
    }

    const hatchDefinition = this.rollHatchMonsterDefinition();

    this.currency.coins = this.sanitizeCoins(this.currency.coins - hatchAttemptState.cost);
    this.farmSlots = setSlotMonster(this.farmSlots, emptySlot.id, this.createMonsterInstance(hatchDefinition));
    this.currentEggCost = getNextHatchCostAfterSuccess(this.currentEggCost);
    audioSystem.playHatch();
    this.discoverMonster(hatchDefinition);
    this.incrementMissionProgress('hatch-3');
    this.maybeShowHatchPoolHint();
    this.evaluateMonsterMissions(hatchDefinition);
    this.hideFarmMessage();
    this.renderMonsterInSlot(this.farmSlots[emptySlot.id]);
    this.updateHud();
    this.showOnboardingHint('income', this.t('hint.income'));
    this.checkMergeOnboardingHint();
    this.hatchCooldownMs = 0;
    this.updateHatchCooldownUi();
    this.skipSavingUntilProgress = false;
    this.saveProgress();
  }

  private maybeShowHatchPoolHint(): void {
    this.successfulHatchesThisSession += 1;

    if (
      this.hatchPoolHintShownThisSession
      || this.successfulHatchesThisSession < HATCH_POOL_HINT_HATCH_COUNT
    ) {
      return;
    }

    this.hatchPoolHintShownThisSession = true;
    this.showToast(this.t('toast.hatchPoolHint'), 'info');
  }

  private rollHatchMonsterDefinition(): MonsterDefinition {
    const hatchPoolEntries = this.getCurrentHatchPoolEntries();
    const family = getWeightedHatchFamily(hatchPoolEntries, Math.random());
    const baseMonster = getMonsterDefinition(family, 1) ?? BABY_SLIME;

    return applyHatchBlessingToMonsterDefinition(
      baseMonster,
      this.essencePowerLevel,
      Math.random(),
      MONSTER_DEFINITIONS,
    );
  }

  private createMonsterInstance(definition = BABY_SLIME): MonsterInstance {
    const monsterId = this.nextMonsterId;
    this.nextMonsterId += 1;

    return {
      ...definition,
      id: `monster-${monsterId}`,
    };
  }

  private isHatchReady(): boolean {
    return isHatchReadyInState(this.hatchCooldownMs, this.getHatchCooldownMs());
  }

  private getEffectiveEggCost(): number {
    return getHatchCost(this.currentEggCost, this.getUpgradeLevel('egg-discount'));
  }

  private sanitizeEggCost(eggCost: number): number {
    return sanitizeEggCost(eggCost);
  }

  private updateHatchCooldown(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0 || this.isHatchReady()) {
      this.updateHatchCooldownUi();
      return;
    }

    this.hatchCooldownMs = getUpdatedHatchCooldown(this.hatchCooldownMs, deltaMs, this.getHatchCooldownMs());
    this.updateHatchCooldownUi();
  }

  private updateHatchCooldownUi(): void {
    this.hatchPanelView.refresh({
      canAfford: canAffordHatchInState(this.currency.coins, this.getEffectiveEggCost()),
      cooldownMs: this.getHatchCooldownMs(),
      effectiveEggCost: this.getEffectiveEggCost(),
      expansionUnlocked: this.expansionUnlocked,
      hatchCooldownMs: this.hatchCooldownMs,
      isFull: this.isFarmFull(),
    });
  }

  private startHatchPanelPress(pointer: Phaser.Input.Pointer): void {
    if (this.isModalOpen()) {
      return;
    }

    this.cancelHatchPoolHold();
    this.hatchPoolHoldPointerId = pointer.id;
    this.hatchPoolHoldTriggered = false;
    this.hatchPanelView.showHoldFeedback(HATCH_POOL_HOLD_MS);
    this.hatchPoolHoldTimer = this.time.delayedCall(HATCH_POOL_HOLD_MS, () => {
      if (this.hatchPoolHoldPointerId !== pointer.id || this.isModalOpen()) {
        return;
      }

      this.hatchPoolHoldTriggered = true;
      this.hatchPoolHoldTimer = undefined;
      this.hatchPanelView.clearHoldFeedback();
      this.playButtonClickSound();
      this.openHatchPoolPanel();
    });
  }

  private finishHatchPanelPress(pointer: Phaser.Input.Pointer): void {
    if (this.hatchPoolHoldPointerId !== pointer.id) {
      return;
    }

    const shouldHatch = !this.hatchPoolHoldTriggered;
    this.cancelHatchPoolHold();

    if (!shouldHatch) {
      return;
    }

    this.playButtonClickSound();
    this.hatchMonster();
  }

  private cancelHatchPoolHold(pointer?: Phaser.Input.Pointer): void {
    if (pointer && this.hatchPoolHoldPointerId !== null && this.hatchPoolHoldPointerId !== pointer.id) {
      return;
    }

    this.hatchPoolHoldTimer?.remove(false);
    this.hatchPoolHoldTimer = undefined;
    this.hatchPoolHoldPointerId = null;
    this.hatchPoolHoldTriggered = false;
    this.hatchPanelView.clearHoldFeedback();
  }

  private openHatchPoolPanel(): void {
    this.closeHatchPoolPanel(false);
    this.closeNavigationMenuPanel();
    this.closeCompendiumPanel();
    this.closeSettingsPanel();
    this.closeHelpPanel();
    this.closePatchNotesPanel();
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeOrdersPanel();
    this.closeBossBattlePanel();
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = getPanelSize(this.scale, 390, 500);
    const contentX = -panelWidth / 2 + 24;
    const contentWidth = panelWidth - 48;
    const hatchPoolEntries = this.getCurrentHatchPoolEntries();
    const hatchBlessingBonus = getHatchBlessingTierBonus(this.essencePowerLevel);
    const compactBlessingText = this.t('ui.prestige.hatchBlessingEffectCompact', {
      plusOne: Math.round(hatchBlessingBonus.plusOneChance * 100),
      plusTwo: Math.round(hatchBlessingBonus.plusTwoChance * 100),
      plusThree: Math.round(hatchBlessingBonus.plusThreeChance * 100),
    });
    const rareBonusPercent = Math.round((getRareHatchWeightMultiplier(this.rareHatchLevel) - 1) * 100);
    const currentZone = this.getCurrentZoneDefinition();

    panel.setDepth(24);
    addPanelBackground(this, panel, panelWidth, panelHeight, THEME);

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 18, this.t('ui.hatchPool.title'), {
      color: THEME.text,
      fontFamily: UI_FONT_FAMILY,
      fontSize: getPanelTitleFontSize(panelWidth, 22),
      fontStyle: 'bold',
    }));

    this.addModalCloseButton(panel, panelWidth, panelHeight, () => this.closeHatchPoolPanel());

    panel.add(this.add.text(contentX, -panelHeight / 2 + 64, this.t('ui.hatchPool.description'), {
      color: THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '12px' : '13px',
      fixedWidth: contentWidth,
      wordWrap: {
        width: contentWidth,
      },
    }));

    panel.add(this.add.text(contentX, -panelHeight / 2 + 92, this.t('ui.hatchPool.zone', {
      zone: this.getLocalizedZoneName(currentZone),
      specialty: this.t(currentZone.hatchSpecialtyKey),
    }), {
      color: '#fff4a8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '11px' : '12px',
      fixedWidth: contentWidth,
      wordWrap: {
        width: contentWidth,
      },
    }));

    hatchPoolEntries.forEach((entry, index) => {
      const rowY = -panelHeight / 2 + 132 + index * 38;
      const chanceText = entry.unlocked
        ? this.t('ui.hatchPool.chanceValue', { percent: Math.round(entry.chance * 100) })
        : this.t(entry.unlockHintKey);
      const zoneText = entry.zoneMultiplier !== 1
        ? this.t('ui.hatchPool.zoneBoost', { multiplier: entry.zoneMultiplier.toFixed(2) })
        : entry.rare
          ? this.t('ui.hatchPool.rare')
          : '';

      panel.add(this.add.rectangle(0, rowY, panelWidth - 48, 31, entry.unlocked ? THEME.panelAlt : 0x29362f, 0.88)
        .setStrokeStyle(1, entry.unlocked ? THEME.lockedBorder : THEME.locked, 0.5));
      panel.add(this.add.text(contentX, rowY - 12, this.getLocalizedFamilyName(entry.family), {
        color: entry.unlocked ? '#f7ffe8' : '#9ca79f',
        fontFamily: UI_FONT_FAMILY,
        fontSize: panelWidth < 390 ? '12px' : '13px',
        fontStyle: 'bold',
        fixedWidth: Math.floor(contentWidth * 0.35),
      }));
      panel.add(this.add.text(contentX + Math.floor(contentWidth * 0.34), rowY - 12, zoneText, {
        color: entry.unlocked ? THEME.mutedText : '#9ca79f',
        fontFamily: UI_FONT_FAMILY,
        fontSize: panelWidth < 390 ? '10px' : '11px',
        fixedWidth: Math.floor(contentWidth * 0.24),
      }));
      panel.add(this.add.text(panelWidth / 2 - 28, rowY - 12, chanceText, {
        color: entry.unlocked ? '#fff4a8' : THEME.mutedText,
        fontFamily: UI_FONT_FAMILY,
        fontSize: panelWidth < 390 ? '10px' : '11px',
        fontStyle: 'bold',
        align: 'right',
        fixedWidth: Math.floor(contentWidth * 0.4),
        wordWrap: {
          width: Math.floor(contentWidth * 0.4),
        },
      }).setOrigin(1, 0).setMaxLines(2));
    });

    panel.add(this.add.text(contentX, panelHeight / 2 - 90, this.t('ui.prestige.rareHatchLevel', {
      level: this.rareHatchLevel,
      percent: rareBonusPercent,
    }), {
      color: '#cdebb3',
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '12px' : '13px',
      fontStyle: 'bold',
      fixedWidth: contentWidth,
    }));

    panel.add(this.add.text(contentX, panelHeight / 2 - 64, this.t('ui.prestige.hatchBlessing'), {
      color: '#f7ffe8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '13px' : '14px',
      fontStyle: 'bold',
      fixedWidth: contentWidth,
    }));

    panel.add(this.add.text(contentX, panelHeight / 2 - 40, compactBlessingText, {
      color: THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '12px' : '13px',
      fixedWidth: contentWidth,
      wordWrap: {
        width: contentWidth,
      },
    }));

    this.hatchPoolPanel = panel;
  }

  private closeHatchPoolPanel(hideOverlay = true): void {
    if (this.hatchPoolPanel) {
      this.hatchPoolPanel.destroy();
      this.hatchPoolPanel = undefined;

      if (hideOverlay) {
        this.hideModalOverlay();
      }
    }
  }

  private discoverMonster(monster: MonsterDefinition): void {
    this.discoveredMonsters = discoverMonsterInState(this.discoveredMonsters, monster);
    this.syncZoneUnlockFromPrestigeProgress();
    this.refreshCompendiumPanel();
    this.refreshOrdersPanel();
    this.refreshOrderWidget();
  }

  private addUpgradeBuyModeControls(
    panel: Phaser.GameObjects.Container,
    panelWidth: number,
    y: number,
  ): void {
    const modes: UpgradeBuyMode[] = ['x1', 'x10', 'x50', 'max'];
    const label = this.add.text(-panelWidth / 2 + 24, y, this.t('ui.upgrades.buyMode'), {
      color: THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 430 ? '11px' : '12px',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    panel.add(label);

    const buttonWidth = panelWidth < 430 ? 38 : 46;
    const gap = panelWidth < 430 ? 5 : 7;
    const totalWidth = modes.length * buttonWidth + (modes.length - 1) * gap;
    const startX = panelWidth / 2 - 24 - totalWidth;

    modes.forEach((mode, index) => {
      const isSelected = this.upgradeBuyMode === mode;
      const button = this.add.text(startX + index * (buttonWidth + gap), y, this.getUpgradeBuyModeLabel(mode), {
        color: '#ffffff',
        fontFamily: UI_FONT_FAMILY,
        fontSize: panelWidth < 430 ? '11px' : '12px',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: `#${(isSelected ? THEME.buttonHover : THEME.lockedInner).toString(16).padStart(6, '0')}`,
        padding: {
          x: 7,
          y: 5,
        },
        fixedWidth: buttonWidth,
      }).setOrigin(0, 0.5);

      button
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          pointer.event?.stopPropagation();
          this.playButtonClickSound();
          this.upgradeBuyMode = mode;
          this.openUpgradeShopPanel();
        });

      panel.add(button);
    });
  }

  private isMonsterDiscovered(monster: MonsterDefinition): boolean {
    return isMonsterDiscoveredInState(this.discoveredMonsters, monster);
  }

  private toggleCompendiumPanel(): void {
    if (this.compendiumPanel) {
      this.closeCompendiumPanel();
      return;
    }

    this.openCompendiumPanel();
  }

  private openCompendiumPanel(resetNavigation = true): void {
    this.closeCompendiumPanel(resetNavigation);
    this.closeNavigationMenuPanel();
    this.closeSettingsPanel();
    this.closeHelpPanel();
    this.closePatchNotesPanel();
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeOrdersPanel();
    this.closeBossBattlePanel();
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = this.getModalSize('compendium', 640, 640);

    panel.setDepth(20);
    addPanelBackground(this, panel, panelWidth, panelHeight, THEME);

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 20, this.t('ui.compendium.title'), {
      color: THEME.text,
      fontFamily: UI_FONT_FAMILY,
      fontSize: getPanelTitleFontSize(panelWidth, 22),
      fontStyle: 'bold',
    }));

    this.addModalCloseButton(panel, panelWidth, panelHeight, () => this.closeCompendiumPanel(), {
      yOffset: 20,
    });

    if (this.selectedCompendiumFamily) {
      this.addCompendiumFamilyDetailContent(panel, panelWidth, panelHeight, this.selectedCompendiumFamily);
    } else {
      this.addCompendiumHomeContent(panel, panelWidth, panelHeight);
    }

    this.compendiumPanel = panel;
  }

  private addCompendiumHomeContent(
    panel: Phaser.GameObjects.Container,
    panelWidth: number,
    panelHeight: number,
  ): void {
    const familyItems = getCompendiumFamilyItems(
      MONSTER_DEFINITIONS,
      this.discoveredMonsters,
      this.getCompendiumFamilyOrder(),
    );
    const pageCount = getCompendiumFamilyPageCount(familyItems, COMPENDIUM_FAMILIES_PER_PAGE);
    const pageIndex = clampCompendiumFamilyPageIndex(this.compendiumFamilyHomePageIndex, pageCount);
    const pageItems = getCompendiumFamilyPageItems(familyItems, pageIndex, COMPENDIUM_FAMILIES_PER_PAGE);
    const isCompactPanel = panelWidth < 390;
    const bodyTopY = -panelHeight / 2 + (isCompactPanel ? 88 : 94);
    const bodyBottomY = panelHeight / 2 - (pageCount > 1 ? 76 : 34);
    const bodyHeight = Math.max(220, bodyBottomY - bodyTopY);
    const columns = pageItems.length <= 1 ? 1 : pageItems.length <= 4 ? 2 : 3;
    const rows = Math.max(1, Math.ceil(pageItems.length / columns));
    const gapX = columns === 3 ? (isCompactPanel ? 8 : 10) : (isCompactPanel ? 10 : 14);
    const gapY = rows === 3 ? (isCompactPanel ? 8 : 10) : (isCompactPanel ? 12 : 16);
    const maxCardHeight = rows === 3 ? (isCompactPanel ? 132 : 148) : (isCompactPanel ? 164 : 178);
    const cardWidth = Math.floor((panelWidth - 48 - gapX * (columns - 1)) / columns);
    const cardHeight = Math.min(maxCardHeight, Math.floor((bodyHeight - gapY * (rows - 1)) / rows));
    const gridWidth = columns * cardWidth + gapX * (columns - 1);
    const gridHeight = rows * cardHeight + gapY * (rows - 1);
    const firstX = -gridWidth / 2 + cardWidth / 2;
    const firstY = bodyTopY + Math.max(0, (bodyHeight - gridHeight) / 2) + cardHeight / 2;

    this.compendiumFamilyHomePageIndex = pageIndex;

    panel.add(this.add.text(0, -panelHeight / 2 + 58, this.t('ui.compendium.chooseFamily'), {
      color: THEME.goldText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '12px' : '14px',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    pageItems.forEach((item, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const centerX = firstX + column * (cardWidth + gapX);
      const centerY = firstY + row * (cardHeight + gapY);

      this.addCompendiumFamilyCard(panel, item, centerX, centerY, cardWidth, cardHeight, isCompactPanel);
    });

    if (pageCount > 1) {
      this.addPaginationControls(panel, panelWidth, panelHeight, pageIndex, pageCount, (nextPageIndex) => {
        this.compendiumFamilyHomePageIndex = nextPageIndex;
        this.openCompendiumPanel(false);
      });
    }
  }

  private addCompendiumFamilyCard(
    panel: Phaser.GameObjects.Container,
    item: CompendiumFamilyItem,
    centerX: number,
    centerY: number,
    cardWidth: number,
    cardHeight: number,
    isCompactPanel: boolean,
  ): void {
    const cardBackground = this.add.rectangle(centerX, centerY, cardWidth, cardHeight, THEME.panelAlt, 0.94)
      .setStrokeStyle(2, THEME.slot, 0.82);
    const familyName = this.getLocalizedFamilyName(item.family);
    const visualMonster = item.representativeMonster;

    panel.add(cardBackground);

    if (visualMonster) {
      const iconScale = Math.min(
        isCompactPanel ? 1.14 : 1.28,
        Math.max(0.76, cardWidth / 112),
        Math.max(0.76, cardHeight / 122),
      );

      this.monsterRenderer.addCompendiumIcon(
        panel,
        visualMonster,
        true,
        centerX,
        centerY - cardHeight * 0.19,
        iconScale,
      );
    }

    const isDenseCard = cardWidth < 112 || cardHeight < 145;

    panel.add(this.add.text(centerX, centerY + cardHeight * 0.24, this.getCompactBossBattleText(familyName, isCompactPanel ? 13 : 16), {
      color: THEME.text,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isDenseCard ? '12px' : isCompactPanel ? '16px' : '18px',
      fontStyle: 'bold',
      align: 'center',
      fixedWidth: cardWidth - (isDenseCard ? 10 : 16),
    }).setOrigin(0.5));

    panel.add(this.add.text(centerX, centerY + cardHeight * 0.42, this.t('ui.compendium.familyProgress', {
      family: familyName,
      discovered: item.discovered,
      total: item.total,
    }), {
      color: THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isDenseCard ? '9px' : isCompactPanel ? '10px' : '11px',
      align: 'center',
      fixedWidth: cardWidth - (isDenseCard ? 10 : 18),
    }).setOrigin(0.5));

    const hitZone = this.add.zone(centerX, centerY, cardWidth, cardHeight)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        this.playButtonClickSound();
        this.openCompendiumFamilyDetail(item.family);
      });

    panel.add(hitZone);
  }

  private addCompendiumFamilyDetailContent(
    panel: Phaser.GameObjects.Container,
    panelWidth: number,
    panelHeight: number,
    family: MonsterFamily,
  ): void {
    const familyMonsters = getCompendiumFamilyMonsters(MONSTER_DEFINITIONS, family);

    if (familyMonsters.length === 0) {
      this.selectedCompendiumFamily = undefined;
      this.addCompendiumHomeContent(panel, panelWidth, panelHeight);
      return;
    }

    const pageCount = getCompendiumFamilyPageCount(familyMonsters, COMPENDIUM_MONSTERS_PER_PAGE);
    const pageIndex = clampCompendiumFamilyPageIndex(this.compendiumFamilyPageIndex, pageCount);
    const pageItems = getCompendiumFamilyPageItems(familyMonsters, pageIndex, COMPENDIUM_MONSTERS_PER_PAGE);
    const progress = getFamilyProgress(MONSTER_DEFINITIONS, this.discoveredMonsters, [family])[0];
    const isCompactPanel = panelWidth < 390;
    const gridColumns = 3;
    const gridRows = 5;
    const gapX = isCompactPanel ? 6 : 8;
    const gapY = isCompactPanel ? 5 : 7;
    const bodyTopY = -panelHeight / 2 + (isCompactPanel ? 112 : 120);
    const bodyBottomY = panelHeight / 2 - (pageCount > 1 ? 76 : 24);
    const bodyHeight = Math.max(380, bodyBottomY - bodyTopY);
    const maxCardHeight = isCompactPanel ? 92 : 108;
    const cardWidth = Math.floor((panelWidth - 48 - gapX * (gridColumns - 1)) / gridColumns);
    const cardHeight = Math.min(maxCardHeight, Math.floor((bodyHeight - gapY * (gridRows - 1)) / gridRows));
    const gridWidth = gridColumns * cardWidth + gapX * (gridColumns - 1);
    const gridHeight = gridRows * cardHeight + gapY * (gridRows - 1);
    const firstX = -gridWidth / 2 + cardWidth / 2;
    const firstY = bodyTopY + Math.max(0, (bodyHeight - gridHeight) / 2) + cardHeight / 2;

    this.compendiumFamilyPageIndex = pageIndex;

    this.addBattleButton(
      panel,
      -panelWidth / 2 + 62,
      -panelHeight / 2 + 66,
      isCompactPanel ? 76 : 88,
      30,
      this.t('ui.compendium.back'),
      THEME.button,
      THEME.text,
      () => this.backToCompendiumHome(),
      true,
    );

    panel.add(this.add.text(0, -panelHeight / 2 + 54, this.t('ui.compendium.familyCollection', {
      family: this.getLocalizedFamilyName(family),
    }), {
      color: THEME.goldText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '14px' : '16px',
      fontStyle: 'bold',
      align: 'center',
      fixedWidth: Math.max(120, panelWidth - 172),
    }).setOrigin(0.5));

    panel.add(this.add.text(0, -panelHeight / 2 + 78, this.t('ui.compendium.familyProgress', {
      family: this.getLocalizedFamilyName(family),
      discovered: progress?.discovered ?? 0,
      total: progress?.total ?? familyMonsters.length,
    }), {
      color: THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '10px' : '12px',
      align: 'center',
      fixedWidth: panelWidth - 48,
    }).setOrigin(0.5));

    pageItems.forEach((monster, index) => {
      const column = index % gridColumns;
      const row = Math.floor(index / gridColumns);
      const centerX = firstX + column * (cardWidth + gapX);
      const centerY = firstY + row * (cardHeight + gapY);

      this.addCompendiumMonsterCard(panel, monster, centerX, centerY, cardWidth, cardHeight, isCompactPanel);
    });

    if (pageCount > 1) {
      this.addPaginationControls(panel, panelWidth, panelHeight, pageIndex, pageCount, (nextPageIndex) => {
        this.compendiumFamilyPageIndex = nextPageIndex;
        this.openCompendiumPanel(false);
      });
    }
  }

  private addCompendiumMonsterCard(
    panel: Phaser.GameObjects.Container,
    monster: MonsterDefinition,
    centerX: number,
    centerY: number,
    cardWidth: number,
    cardHeight: number,
    isCompactPanel: boolean,
  ): void {
    const isDiscovered = this.isMonsterDiscovered(monster);
    const textColor = isDiscovered ? '#f7ffe8' : '#9ca79f';
    const iconScale = Math.min(
      isCompactPanel ? 0.46 : 0.54,
      Math.max(0.38, cardWidth / 184),
      Math.max(0.38, cardHeight / 178),
    );
    const nameText = isDiscovered
      ? this.getCompactBossBattleText(this.getLocalizedMonsterName(monster), isCompactPanel ? 11 : 14)
      : '???';
    const familyLevelText = this.t('common.levelShort', { level: monster.level });
    const incomeText = isDiscovered
      ? this.t('common.perSecond', { amount: this.formatSignedCoinAmount(monster.incomePerSecond) })
      : this.t('common.unknown');

    panel.add(this.add.rectangle(centerX, centerY, cardWidth, cardHeight, isDiscovered ? THEME.panelAlt : 0x29362f, isDiscovered ? 0.94 : 0.78)
      .setStrokeStyle(2, isDiscovered ? THEME.slot : THEME.lockedBorder, 0.78));

    this.monsterRenderer.addCompendiumIcon(panel, monster, isDiscovered, centerX, centerY - cardHeight * 0.28, iconScale);

    panel.add(this.add.text(centerX, centerY - cardHeight * 0.01, nameText, {
      color: textColor,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '9px' : '10px',
      fontStyle: 'bold',
      align: 'center',
      fixedWidth: cardWidth - 10,
    }).setOrigin(0.5));

    panel.add(this.add.text(centerX, centerY + cardHeight * 0.18, familyLevelText, {
      color: textColor,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '8px' : '9px',
      align: 'center',
      fixedWidth: cardWidth - 10,
    }).setOrigin(0.5));

    panel.add(this.add.text(centerX, centerY + cardHeight * 0.36, this.getCompactBossBattleText(incomeText, isCompactPanel ? 12 : 15), {
      color: isDiscovered ? '#fff4a8' : '#9ca79f',
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '8px' : '9px',
      fontStyle: 'bold',
      align: 'center',
      fixedWidth: cardWidth - 10,
    }).setOrigin(0.5));
  }

  private openCompendiumFamilyDetail(family: MonsterFamily): void {
    this.selectedCompendiumFamily = family;
    this.compendiumFamilyPageIndex = 0;
    this.openCompendiumPanel(false);
  }

  private backToCompendiumHome(): void {
    this.selectedCompendiumFamily = undefined;
    this.compendiumFamilyPageIndex = 0;
    this.openCompendiumPanel(false);
  }

  private closeCompendiumPanel(resetNavigation = true): void {
    if (this.compendiumPanel) {
      this.compendiumPanel.destroy();
      this.compendiumPanel = undefined;
      this.hideModalOverlay();
    }

    if (resetNavigation) {
      this.selectedCompendiumFamily = undefined;
      this.compendiumFamilyHomePageIndex = 0;
      this.compendiumFamilyPageIndex = 0;
    }
  }

  private refreshCompendiumPanel(): void {
    if (this.compendiumPanel) {
      this.openCompendiumPanel(false);
    }
  }

  private getCompendiumFamilyOrder(): MonsterFamily[] {
    return MONSTER_FAMILY_DEFINITIONS.map((familyDefinition) => familyDefinition.family);
  }

  private clearSelectedSlot(): void {
    // On-farm monster details are intentionally disabled so tap state never blocks dragging.
  }

  private cancelActiveDrag(): void {
    if (this.activeDragSlotId === null || !this.activeDragVisual) {
      this.hideMonsterRemoveZone();
      return;
    }

    this.activeDragVisual.setScale(1);
    this.activeDragVisual.setDepth(0);
    this.returnMonsterVisualToSlot(this.activeDragSlotId, this.activeDragVisual);
    this.resetManualDragState();
  }

  private startManualMonsterDrag(slotId: number, pointer: Phaser.Input.Pointer): void {
    if (this.isModalOpen()) {
      return;
    }

    const visual = this.monsterVisuals[slotId];

    if (!visual || !this.farmSlots[slotId]?.monster) {
      return;
    }

    if (this.activeDragVisual) {
      this.cancelActiveDrag();
    }

    this.activeDragSlotId = slotId;
    this.activeDragVisual = visual;
    this.activeDragPointerId = pointer.id;
    this.clearSelectedSlot();
    visual.setScale(1.08);
    visual.setDepth(16);
    visual.setPosition(pointer.worldX, pointer.worldY);
    this.showMonsterRemoveZone();
  }

  private updateManualMonsterDrag(pointer: Phaser.Input.Pointer): void {
    if (
      this.activeDragSlotId === null
      || !this.activeDragVisual
      || this.activeDragPointerId !== pointer.id
    ) {
      return;
    }

    pointer.event?.stopPropagation();

    if (this.isModalOpen()) {
      this.cancelActiveDrag();
      return;
    }

    this.activeDragVisual.setPosition(pointer.worldX, pointer.worldY);
    this.setMonsterRemoveZoneHot(this.isPointInMonsterRemoveZone(pointer.worldX, pointer.worldY));
  }

  private finishManualMonsterDrag(pointer: Phaser.Input.Pointer): void {
    if (
      this.activeDragSlotId === null
      || !this.activeDragVisual
      || this.activeDragPointerId !== pointer.id
    ) {
      return;
    }

    pointer.event?.stopPropagation();

    if (this.isModalOpen()) {
      this.cancelActiveDrag();
      return;
    }

    const sourceSlotId = this.activeDragSlotId;
    const visual = this.activeDragVisual;
    const shouldRemoveMonster = this.isPointInMonsterRemoveZone(pointer.worldX, pointer.worldY);

    visual.setScale(1);
    visual.setDepth(0);
    this.resetManualDragState();

    if (shouldRemoveMonster) {
      this.removeMonsterFromSlot(sourceSlotId);
      return;
    }

    this.handleMonsterDrop(sourceSlotId, pointer.worldX, pointer.worldY, visual);
  }

  private resetManualDragState(): void {
    this.activeDragSlotId = null;
    this.activeDragVisual = undefined;
    this.activeDragPointerId = null;
    this.hideMonsterRemoveZone();
  }

  private showMonsterRemoveZone(): void {
    if (this.isModalOpen()) {
      return;
    }

    this.hideMonsterRemoveZone();

    const bounds = this.getMonsterRemoveZoneBounds();
    const container = this.add.container(bounds.centerX, bounds.centerY).setDepth(12);
    const shadow = this.add.rectangle(3, 4, bounds.width, bounds.height, THEME.shadow, 0.32)
      .setOrigin(0.5);
    const background = this.add.rectangle(0, 0, bounds.width, bounds.height, THEME.danger, 0.92)
      .setOrigin(0.5)
      .setStrokeStyle(3, 0xffcfb8, 0.82);
    const titleText = this.add.text(0, -8, this.t('ui.monsterRemove.title'), {
      color: '#ffffff',
      fontFamily: UI_FONT_FAMILY,
      fontSize: bounds.width < 170 ? '16px' : '18px',
      fontStyle: 'bold',
      align: 'center',
      fixedWidth: bounds.width - 20,
    }).setOrigin(0.5);
    const helperText = this.add.text(0, 15, this.t('ui.monsterRemove.dragHere'), {
      color: '#ffe7da',
      fontFamily: UI_FONT_FAMILY,
      fontSize: bounds.width < 170 ? '11px' : '12px',
      align: 'center',
      fixedWidth: bounds.width - 20,
    }).setOrigin(0.5);

    container.add([shadow, background, titleText, helperText]);
    this.monsterRemoveDropZone = {
      background,
      bounds,
      container,
      helperText,
      isHot: false,
      titleText,
    };
  }

  private hideMonsterRemoveZone(): void {
    this.monsterRemoveDropZone?.pulseTween?.stop();
    this.monsterRemoveDropZone?.container.destroy();
    this.monsterRemoveDropZone = undefined;
  }

  private getMonsterRemoveZoneBounds(): Phaser.Geom.Rectangle {
    const layout = this.getLayout();
    const width = layout.isNarrow
      ? Math.min(172, this.scale.width - layout.margin * 4)
      : 208;
    const height = layout.isNarrow ? 54 : 62;
    const bottomLimit = Math.min(layout.hatchY, layout.tapFarmY, layout.actionBarY) - (layout.isNarrow ? 8 : 12);
    const centerY = Math.max(layout.margin + height / 2, bottomLimit - height / 2);
    const centerX = this.scale.width / 2;

    return new Phaser.Geom.Rectangle(
      centerX - width / 2,
      centerY - height / 2,
      width,
      height,
    );
  }

  private isPointInMonsterRemoveZone(worldX: number, worldY: number): boolean {
    return Boolean(
      this.monsterRemoveDropZone
      && Number.isFinite(worldX)
      && Number.isFinite(worldY)
      && Phaser.Geom.Rectangle.Contains(this.monsterRemoveDropZone.bounds, worldX, worldY),
    );
  }

  private setMonsterRemoveZoneHot(isHot: boolean): void {
    const dropZone = this.monsterRemoveDropZone;

    if (!dropZone || dropZone.isHot === isHot) {
      return;
    }

    dropZone.isHot = isHot;
    dropZone.background.setFillStyle(isHot ? 0xb93a48 : THEME.danger, isHot ? 0.98 : 0.92);
    dropZone.background.setStrokeStyle(3, isHot ? 0xfff0a8 : 0xffcfb8, isHot ? 1 : 0.82);
    dropZone.titleText.setText(isHot ? this.t('ui.monsterRemove.release') : this.t('ui.monsterRemove.title'));
    dropZone.helperText.setText(isHot ? '' : this.t('ui.monsterRemove.dragHere'));

    if (isHot) {
      dropZone.pulseTween?.stop();
      dropZone.pulseTween = this.tweens.add({
        targets: dropZone.container,
        scale: 1.04,
        duration: 180,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
      return;
    }

    dropZone.pulseTween?.stop();
    dropZone.pulseTween = undefined;
    dropZone.container.setScale(1);
  }

  private renderMonsterInSlot(slot: FarmSlotState): void {
    if (!slot.monster) {
      return;
    }

    const center = this.slotCenters[slot.id];
    const monster = slot.monster;

    this.clearMonsterVisual(slot.id);

    const visual = this.add.container(center.x, center.y);
    const visualScale = Math.min(1, Math.max(0.72, this.cellSize / CELL_SIZE));

    this.monsterRenderer.addMonsterVisual(visual, monster, 0, 0, visualScale);

    visual.add(this.add.text(0, 27 * visualScale, this.t('common.levelShort', { level: monster.level }), {
      color: '#f7ffe8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: visualScale < 0.9 ? '12px' : '13px',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    this.monsterVisuals[slot.id] = visual;
    this.createMonsterDragZone(slot.id);
  }

  private createMonsterDragZone(slotId: number): void {
    this.clearMonsterDragZone(slotId);

    const center = this.slotCenters[slotId];
    const zone = this.add.zone(center.x, center.y, this.cellSize, this.cellSize)
      .setOrigin(0.5)
      .setDepth(9)
      .setInteractive({ useHandCursor: true });

    zone.on(
      'pointerdown',
      (
        pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
        pointer.event?.stopPropagation();
        this.startManualMonsterDrag(slotId, pointer);
      },
    );

    this.addMonsterHitboxDebugVisual(zone);
    this.monsterDragZones[slotId] = zone;
  }

  private clearMonsterDragZone(slotId: number): void {
    this.monsterDragZones[slotId]?.destroy();
    this.monsterDragZones[slotId] = null;
  }

  private addMonsterHitboxDebugVisual(zone: MonsterDragZone): void {
    if (!SHOW_MONSTER_HITBOX_DEBUG) {
      return;
    }

    const debugOutline = this.add.rectangle(zone.x, zone.y, this.cellSize, this.cellSize, 0xff00ff, 0)
      .setDepth(zone.depth + 0.1)
      .setStrokeStyle(2, 0xff00ff, 0.7);

    zone.once(Phaser.GameObjects.Events.DESTROY, () => {
      debugOutline.destroy();
    });
  }

  private isFarmFull(): boolean {
    return isFarmSlotStateFull(this.farmSlots, this.expansionUnlocked, MAIN_SLOT_COUNT);
  }

  private showFullFarmMessage(): void {
    this.showFarmMessage(this.expansionUnlocked ? this.t('toast.farmFull') : this.t('toast.farmFullUnlock'), 'warning');
  }

  private showNotEnoughCoinsMessage(): void {
    this.showFarmMessage(this.t('toast.notEnoughCoins'), 'warning');
  }

  private showFarmMessage(message: string, variant: ToastVariant = 'info'): void {
    this.showToast(message, variant);
  }

  private hideFarmMessage(): void {
    this.clearToast();
  }

  private showToast(message: string, variant: ToastVariant = 'info'): void {
    this.toastView.show(message, variant);
  }

  private clearToast(): void {
    this.toastView.clear();
  }

  private handleMonsterDrop(
    sourceSlotId: number,
    dropWorldX: number,
    dropWorldY: number,
    visual: MonsterVisual,
  ): void {
    if (this.isModalOpen()) {
      this.returnMonsterVisualToSlot(sourceSlotId, visual);
      return;
    }

    const targetSlotId = this.findSlotIdAtPoint(dropWorldX, dropWorldY);

    if (targetSlotId === null || !this.isSlotUnlocked(targetSlotId)) {
      this.returnMonsterVisualToSlot(sourceSlotId, visual);
      return;
    }

    if (this.canMoveSlots(sourceSlotId, targetSlotId)) {
      this.moveSlotMonster(sourceSlotId, targetSlotId);
      return;
    }

    if (this.canMergeSlots(sourceSlotId, targetSlotId)) {
      this.mergeSlots(sourceSlotId, targetSlotId);
      return;
    }

    this.returnMonsterVisualToSlot(sourceSlotId, visual);
  }

  private findSlotIdAtPoint(worldX: number, worldY: number): number | null {
    if (!Number.isFinite(worldX) || !Number.isFinite(worldY)) {
      return null;
    }

    const slotId = this.slotCenters.findIndex((center) => (
      Math.abs(worldX - center.x) <= this.cellSize / 2
      && Math.abs(worldY - center.y) <= this.cellSize / 2
    ));

    return slotId >= 0 ? slotId : null;
  }

  private canMergeSlots(sourceSlotId: number, targetSlotId: number): boolean {
    return canMergeFarmSlots(
      this.farmSlots,
      sourceSlotId,
      targetSlotId,
      this.expansionUnlocked,
      MAIN_SLOT_COUNT,
    );
  }

  private canMoveSlots(sourceSlotId: number, targetSlotId: number): boolean {
    return canMoveFarmSlots(
      this.farmSlots,
      sourceSlotId,
      targetSlotId,
      this.expansionUnlocked,
      MAIN_SLOT_COUNT,
    );
  }

  private moveSlotMonster(sourceSlotId: number, targetSlotId: number): void {
    const moveResult = moveFarmSlotMonster(
      this.farmSlots,
      sourceSlotId,
      targetSlotId,
      this.expansionUnlocked,
      MAIN_SLOT_COUNT,
    );

    if (!moveResult.success) {
      return;
    }

    this.clearSelectedSlot();
    this.farmSlots = moveResult.slots;

    this.clearMonsterVisual(sourceSlotId);
    this.renderMonsterInSlot(this.farmSlots[targetSlotId]);
    this.updateHud();
    this.skipSavingUntilProgress = false;
    this.saveProgress();
  }

  private removeMonsterFromSlot(slotId: number): void {
    const monster = this.farmSlots[slotId]?.monster;

    if (!monster) {
      return;
    }

    this.clearSelectedSlot();
    this.farmSlots = clearSlotMonster(this.farmSlots, slotId);
    this.clearMonsterVisual(slotId);
    this.updateHud();
    this.skipSavingUntilProgress = false;
    this.saveProgress();
    this.showToast(this.t('toast.monsterRemoved', {
      monster: this.getLocalizedMonsterName(monster),
    }), 'info');
  }

  private mergeSlots(sourceSlotId: number, targetSlotId: number): void {
    const sourceMonster = this.farmSlots[sourceSlotId]?.monster;
    const targetMonster = this.farmSlots[targetSlotId]?.monster;
    const nextMonsterDefinition = getMonsterMergeResult(
      sourceMonster,
      targetMonster,
    );

    if (!nextMonsterDefinition) {
      return;
    }

    this.clearSelectedSlot();
    this.farmSlots = setSlotMonster(
      clearSlotMonster(this.farmSlots, sourceSlotId),
      targetSlotId,
      this.createMonsterInstance(nextMonsterDefinition),
    );
    this.discoverMonster(nextMonsterDefinition);

    this.clearMonsterVisual(sourceSlotId);
    this.renderMonsterInSlot(this.farmSlots[targetSlotId]);
    audioSystem.playMerge();
    this.showMergeFeedback(targetSlotId, sourceMonster?.family !== targetMonster?.family ? this.t('toast.fusion') : this.t('toast.merge'));
    this.incrementMissionProgress('merge-1');
    this.evaluateMonsterMissions(nextMonsterDefinition);
    this.updateHud();
    this.showOnboardingHint('upgrades', this.t('hint.upgrades'));
    this.skipSavingUntilProgress = false;
    this.saveProgress();
  }

  private clearMonsterVisual(slotId: number): void {
    this.clearMonsterDragZone(slotId);
    this.monsterVisuals[slotId]?.destroy();
    this.monsterVisuals[slotId] = null;
  }

  private returnMonsterVisualToSlot(slotId: number, visual: MonsterVisual): void {
    const center = this.slotCenters[slotId];

    this.tweens.add({
      targets: visual,
      x: center.x,
      y: center.y,
      duration: 130,
      ease: 'Sine.easeOut',
    });
  }

  private showMergeFeedback(slotId: number, message = this.t('toast.merge')): void {
    const center = this.slotCenters[slotId];
    const popup = this.add.text(center.x, center.y - 42, message, {
      color: '#ffffff',
      fontFamily: UI_FONT_FAMILY,
      fontSize: '18px',
      fontStyle: 'bold',
      backgroundColor: '#5f8fca',
      padding: {
        x: 8,
        y: 4,
      },
    }).setOrigin(0.5);

    this.tweens.add({
      targets: popup,
      y: popup.y - 18,
      alpha: 0,
      duration: 650,
      ease: 'Sine.easeOut',
      onComplete: () => {
        popup.destroy();
      },
    });
  }

  private loadProgress(): void {
    const saveData = loadSaveData(this.farmSlots.length);

    if (!saveData) {
      return;
    }

    this.currency.coins = sanitizeSavedCoins(saveData.coins);
    this.expansionUnlocked = saveData.expansionUnlocked;
    this.createExpansionPlaceholder();

    saveData.discoveredMonsters.forEach((savedDiscovery) => {
      const monsterDefinition = getMonsterDefinition(savedDiscovery.family, savedDiscovery.level);

      if (monsterDefinition) {
        this.discoverMonster(monsterDefinition);
      }
    });

    saveData.grid.forEach((savedSlot, slotId) => {
      if (!savedSlot) {
        return;
      }

      if (!this.isSlotUnlocked(slotId)) {
        return;
      }

      const monsterDefinition = getMonsterDefinition(savedSlot.family, savedSlot.level);

      if (!monsterDefinition) {
        return;
      }

      this.farmSlots = setSlotMonster(this.farmSlots, slotId, this.createMonsterInstance(monsterDefinition));
      this.discoverMonster(monsterDefinition);
      this.renderMonsterInSlot(this.farmSlots[slotId]);
    });

    this.upgradeLevels = {
      ...this.createInitialUpgradeLevels(),
      ...saveData.upgrades,
    };
    this.monsterEssence = saveData.monsterEssence;
    this.essencePowerLevel = saveData.essencePowerLevel;
    this.rareHatchLevel = saveData.rareHatchLevel;
    this.totalRitualsPerformed = saveData.totalRitualsPerformed;
    this.currentEggCost = this.sanitizeEggCost(saveData.currentEggCost);
    const loadedSets = createLoadedSetsFromSave(saveData);

    this.onboardingHintsSeen = loadedSets.onboardingHintsSeen;
    this.missionProgress = {
      ...this.createInitialMissionProgress(),
      ...saveData.missionProgress,
    };
    this.completedMissionIds = loadedSets.completedMissionIds;
    this.claimedMissionIds = loadedSets.claimedMissionIds;
    this.claimedOrderIds = loadedSets.claimedOrderIds;
    this.claimedBossBattleStageIds = loadedSets.claimedBossBattleStageIds;
    this.elementFragments = { ...saveData.elementFragments };
    this.bossDailyClearCounts = { ...saveData.bossDailyClearCounts };
    this.bossDailyClearLastResetDay = saveData.bossDailyClearLastResetDay;
    this.syncBossDailyClearReset();
    this.syncMissionStateFromCurrentProgress(false);
    this.unlockedZones = getSanitizedUnlockedZones(saveData.unlockedZones, ZONE_IDS, GRASS_FARM_ZONE_ID);
    this.currentZone = saveData.currentZone;
    this.hasPrestigedOnce = saveData.hasPrestigedOnce;
    this.syncZoneUnlockFromPrestigeProgress();
    this.createFarmBackground();
    this.refreshOrdersPanel();
    this.refreshOrderWidget();

    this.applyAwayProgress(saveData.lastActiveAt, Date.now(), true);

    this.ensureStarterCoinsForEmptyFarm();
    this.saveProgress();
  }

  private applyResumeProgress(): void {
    const now = Date.now();
    const saveData = loadSaveData(this.farmSlots.length);
    const lastActiveAt = this.lastHiddenAt ?? saveData?.lastActiveAt ?? now;

    this.lastHiddenAt = null;
    this.applyAwayProgress(lastActiveAt, now, true);
    this.saveProgress();
  }

  private applyAwayProgress(lastActiveAt: number, now: number, showMessage: boolean): void {
    const elapsedMilliseconds = this.getElapsedAwayMilliseconds(lastActiveAt, now);

    if (elapsedMilliseconds <= 0) {
      this.updateHatchCooldownUi();
      return;
    }

    const offlineCoins = this.calculateOfflineCoinsForElapsed(elapsedMilliseconds);

    if (offlineCoins > 0) {
      this.currency.coins = this.sanitizeCoins(this.currency.coins + offlineCoins);
      this.hasUnsavedProgress = true;

      if (showMessage && offlineCoins >= 1) {
        this.showOfflineEarningsMessage(offlineCoins);
        this.time.delayedCall(1800, () => {
          this.showOnboardingHint('offline', this.t('hint.offline'));
        });
      }
    }

    if (!this.isHatchReady()) {
      this.hatchCooldownMs = getAppliedAwayHatchCooldown(
        this.hatchCooldownMs,
        elapsedMilliseconds,
        this.getHatchCooldownMs(),
      );
      this.hasUnsavedProgress = true;
    }

    this.updateHud();
  }

  private saveProgress(): void {
    if (this.skipSavingUntilProgress && !this.hasAnyProgress()) {
      return;
    }

    this.syncBossDailyClearReset();

    writeSaveData(createLocalSaveData({
      version: SAVE_VERSION,
      coins: this.sanitizeCoins(this.currency.coins),
      farmSlots: this.farmSlots,
      lastActiveAt: Date.now(),
      discoveredMonsters: this.discoveredMonsters,
      upgrades: this.getSanitizedUpgradeLevels(),
      monsterEssence: sanitizePrestigeIntegerState(this.monsterEssence),
      essencePowerLevel: sanitizePrestigeIntegerState(this.essencePowerLevel),
      rareHatchLevel: sanitizePrestigeIntegerState(this.rareHatchLevel),
      totalRitualsPerformed: sanitizePrestigeIntegerState(this.totalRitualsPerformed),
      currentEggCost: this.sanitizeEggCost(this.currentEggCost),
      onboardingHintsSeen: this.onboardingHintsSeen,
      expansionUnlocked: this.expansionUnlocked,
      missionProgress: this.getSanitizedMissionProgress(),
      completedMissionIds: this.completedMissionIds,
      claimedMissionIds: this.claimedMissionIds,
      claimedOrderIds: this.claimedOrderIds,
      claimedBossBattleStageIds: this.claimedBossBattleStageIds,
      elementFragments: this.elementFragments,
      bossDailyClearCounts: { ...this.bossDailyClearCounts },
      bossDailyClearLastResetDay: this.bossDailyClearLastResetDay || this.getCurrentLocalDayKey(),
      unlockedZones: this.unlockedZones,
      currentZone: this.currentZone,
      hasPrestigedOnce: this.hasPrestigedOnce,
    }));

    this.hasUnsavedProgress = false;
    this.saveThrottleAccumulatorMs = 0;
  }

  private saveProgressWhenReady(deltaMs: number): void {
    if (!this.hasUnsavedProgress || !Number.isFinite(deltaMs) || deltaMs <= 0) {
      return;
    }

    this.saveThrottleAccumulatorMs += deltaMs;

    if (this.saveThrottleAccumulatorMs >= SAVE_THROTTLE_MS) {
      this.saveProgress();
    }
  }

  private resetProgress(): void {
    clearSaveData();

    this.currency.coins = STARTING_COINS;
    this.nextMonsterId = 1;
    this.incomeAccumulatorMs = 0;
    this.saveThrottleAccumulatorMs = 0;
    this.hasUnsavedProgress = false;
    this.skipSavingUntilProgress = true;
    this.resetConfirmationArmed = false;
    this.prestigeConfirmationArmed = false;
    this.safeRitualInProgress = false;
    this.discoveredMonsters = new Set<DiscoveryKey>();
    this.onboardingHintsSeen = new Set<OnboardingHintId>();
    this.upgradeLevels = this.createInitialUpgradeLevels();
    this.missionProgress = this.createInitialMissionProgress();
    this.completedMissionIds = new Set<MissionId>();
    this.claimedMissionIds = new Set<MissionId>();
    this.claimedOrderIds = new Set<OrderId>();
    this.claimedBossBattleStageIds = new Set<string>();
    this.elementFragments = createInitialElementFragments();
    this.bossDailyClearCounts = {};
    this.bossDailyClearLastResetDay = this.getCurrentLocalDayKey();
    this.selectedBossBattleBossId = undefined;
    this.bossBattleSession = undefined;
    this.bossBattleStatusText = '';
    this.bossBattleLogText = '';
    this.bossBattleTargetMonsterId = undefined;
    this.bossBattleTurnBanner = '';
    this.bossBattlePlayerVisualEffect = undefined;
    this.bossBattleBossVisualEffect = undefined;
    this.bossBattleRewardX2Opportunity = undefined;
    this.nextBossBattleRewardX2OpportunityId = 1;
    this.bossBattleBossPageIndex = 0;
    this.bossBattleStagePageIndex = 0;
    this.bossBattleStageIndex = 0;
    this.unlockedZones = createInitialUnlockedZones(GRASS_FARM_ZONE_ID);
    this.currentZone = GRASS_FARM_ZONE_ID;
    this.hasPrestigedOnce = false;
    this.monsterEssence = 0;
    this.essencePowerLevel = 0;
    this.rareHatchLevel = 0;
    this.totalRitualsPerformed = 0;
    this.currentEggCost = STARTING_EGG_COST;
    this.expansionUnlocked = false;
    this.farmSlots = this.createInitialFarmSlots();

    this.monsterVisuals.forEach((visual) => {
      visual?.destroy();
    });
    this.monsterDragZones.forEach((zone) => {
      zone?.destroy();
    });
    this.clearCoinBugs();
    this.monsterVisuals = Array.from({ length: TOTAL_SLOT_COUNT }, () => null);
    this.monsterDragZones = Array.from({ length: TOTAL_SLOT_COUNT }, () => null);
    this.nextCoinBugId = 1;
    this.scheduleNextCoinBugSpawn();
    this.tapFarmEnergy = 0;
    this.lastTapFarmAt = -TAP_FARM_COOLDOWN_MS;
    this.tapFarmCombo = 0;
    this.lastTapFarmComboAt = -TAP_FARM_COMBO_TIMEOUT_MS;
    this.clearTapFarmReactionStack();
    this.createExpansionPlaceholder();
    this.createFarmBackground();
    this.refreshOrderWidget();

    this.hideFarmMessage();
    this.clearSelectedSlot();
    this.closeCompendiumPanel();
    this.closeHelpPanel();
    this.closePatchNotesPanel();
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeOrdersPanel();
    this.closeBossBattlePanel();
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeHatchPoolPanel();
    this.closeNavigationMenuPanel();
    this.closeEconomyDebugPanel();
    this.updateHatchCooldownUi();
    this.updateTapFarmUi();
    this.updateHud();
  }

  private registerPersistenceEvents(): void {
    window.addEventListener('pagehide', this.handlePageHide);
    window.addEventListener('beforeunload', this.handlePageHide);
    window.addEventListener('blur', this.handleWindowBlur);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.saveProgress();
      this.cancelHatchPoolHold();
      this.cancelActiveDrag();
      this.clearCoinBugs();
      this.clearToast();
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleScaleResize);
      this.input.off('pointermove', this.handleManualDragPointerMove);
      this.input.off('pointerup', this.handleManualDragPointerUp);
      this.input.off('pointerupoutside', this.handleManualDragPointerUp);
      this.input.off('pointerdown', this.handleCoinBugProximityPointerDown);
      window.removeEventListener('pagehide', this.handlePageHide);
      window.removeEventListener('beforeunload', this.handlePageHide);
      window.removeEventListener('blur', this.handleWindowBlur);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    });
  }

  private hasAnyProgress(): boolean {
    return (
      this.currency.coins !== STARTING_COINS
      || this.currentEggCost !== STARTING_EGG_COST
      || this.monsterEssence > 0
      || this.essencePowerLevel > 0
      || this.rareHatchLevel > 0
      || this.totalRitualsPerformed > 0
      || this.expansionUnlocked
      || this.hasPrestigedOnce
      || this.currentZone !== GRASS_FARM_ZONE_ID
      || this.unlockedZones.size > 1
      || this.completedMissionIds.size > 0
      || this.claimedMissionIds.size > 0
      || this.claimedOrderIds.size > 0
      || this.claimedBossBattleStageIds.size > 0
      || Object.values(this.elementFragments).some((amount) => amount > 0)
      || Object.values(this.bossDailyClearCounts).some((count) => count > 0)
      || Object.values(this.missionProgress).some((progress) => progress > 0)
      || this.farmSlots.some((slot) => slot.monster !== null)
    );
  }

  private ensureStarterCoinsForEmptyFarm(): void {
    if (this.getUnlockedFarmSlots().some((slot) => slot.monster !== null) || this.currency.coins >= STARTING_EGG_COST) {
      return;
    }

    this.currency.coins = STARTING_COINS;
  }

  private calculateOfflineCoins(lastActiveAt: number): number {
    return this.calculateOfflineCoinsForElapsed(this.getElapsedAwayMilliseconds(lastActiveAt, Date.now()));
  }

  private getElapsedAwayMilliseconds(lastActiveAt: number, now: number): number {
    if (!Number.isFinite(lastActiveAt) || lastActiveAt < 0 || !Number.isFinite(now)) {
      return 0;
    }

    return Math.max(0, now - lastActiveAt);
  }

  private calculateOfflineCoinsForElapsed(elapsedMilliseconds: number): number {
    return calculateOfflineCoins(
      elapsedMilliseconds,
      this.getOfflineCapSeconds(),
      this.getTotalIncomePerSecond(),
    );
  }

  private showOfflineEarningsMessage(offlineCoins: number): void {
    const layout = this.getLayout();
    const popupWidth = Math.min(layout.isNarrow ? 300 : 380, this.scale.width - 32);
    const popupY = Phaser.Math.Clamp(layout.isNarrow ? 86 : 96, 52, this.scale.height - 52);
    const popup = this.add.text(
      this.scale.width / 2,
      popupY,
      this.t('toast.welcomeBack', {
        amount: this.formatSignedCoinAmount(offlineCoins),
      }),
      {
        color: '#fff4a8',
        fontFamily: UI_FONT_FAMILY,
        fontSize: layout.isNarrow ? '16px' : '19px',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: `#${THEME.panel.toString(16).padStart(6, '0')}`,
        padding: {
          x: layout.isNarrow ? 10 : 14,
          y: layout.isNarrow ? 7 : 8,
        },
        fixedWidth: popupWidth - 20,
        wordWrap: {
          width: popupWidth - 24,
          useAdvancedWrap: true,
        },
      },
    ).setOrigin(0.5).setDepth(85);

    this.tweens.add({
      targets: popup,
      y: popup.y - 16,
      alpha: 0,
      delay: 2200,
      duration: 700,
      ease: 'Sine.easeOut',
      onComplete: () => {
        popup.destroy();
      },
    });
  }

  private addPassiveIncome(deltaMs: number): void {
    const incomePerSecond = this.getTotalIncomePerSecond();

    if (incomePerSecond <= 0 || !Number.isFinite(deltaMs) || deltaMs <= 0) {
      this.updateHud();
      return;
    }

    this.incomeAccumulatorMs += deltaMs;

    if (this.incomeAccumulatorMs < MILLISECONDS_PER_SECOND) {
      this.updateHud();
      return;
    }

    const elapsedSeconds = Math.floor(this.incomeAccumulatorMs / MILLISECONDS_PER_SECOND);
    this.incomeAccumulatorMs -= elapsedSeconds * MILLISECONDS_PER_SECOND;
    this.currency.coins += incomePerSecond * elapsedSeconds;
    this.currency.coins = this.sanitizeCoins(this.currency.coins);
    audioSystem.playCoinTick();
    this.showCoinGainIndicators();
    this.hasUnsavedProgress = true;
    this.updateHud();
  }

  private showCoinGainIndicators(): void {
    this.farmSlots.forEach((slot) => {
      const income = this.getEffectiveMonsterIncome(slot.monster);

      if (!Number.isFinite(income) || income <= 0) {
        return;
      }

      this.showCoinGainIndicator(slot.id, income);
    });
  }

  private showCoinGainIndicator(slotId: number, amount: number): void {
    const center = this.slotCenters[slotId];
    const indicator = this.add.text(center.x, center.y - 34, this.formatSignedCoinAmount(amount), {
      color: '#fff4a8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: '18px',
      fontStyle: 'bold',
      stroke: '#10291a',
      strokeThickness: 4,
    }).setOrigin(0.5);

    indicator.setDepth(12);

    this.tweens.add({
      targets: indicator,
      y: indicator.y - 24,
      alpha: 0,
      duration: 800,
      ease: 'Sine.easeOut',
      onComplete: () => {
        indicator.destroy();
      },
    });
  }

  private getTotalIncomePerSecond(): number {
    return getTotalIncomePerSecond(
      this.farmSlots,
      this.getUpgradeLevel('slime-income-boost'),
      this.getUpgradeLevel('mushroom-income-boost'),
      this.totalRitualsPerformed,
      this.getUpgradeLevel('fusion-power'),
      this.getUpgradeLevel('cactus-income-boost'),
      this.getUpgradeLevel('cell-income-boost'),
      this.getUpgradeLevel('plant-income-boost'),
    );
  }

  private getEffectiveMonsterIncome(monster: MonsterInstance | null | undefined): number {
    return getEffectiveMonsterIncome(
      monster,
      this.getUpgradeLevel('slime-income-boost'),
      this.getUpgradeLevel('mushroom-income-boost'),
      this.totalRitualsPerformed,
      this.getUpgradeLevel('fusion-power'),
      this.getUpgradeLevel('cactus-income-boost'),
      this.getUpgradeLevel('cell-income-boost'),
      this.getUpgradeLevel('plant-income-boost'),
    );
  }

  private sanitizeCoins(coins: number): number {
    if (!Number.isFinite(coins) || coins < 0) {
      return 0;
    }

    return this.roundCurrency(coins);
  }

  private roundCurrency(coins: number): number {
    return Math.round(coins * 100) / 100;
  }

  private formatCoinAmount(coins: number): string {
    const safeCoins = this.sanitizeCoins(coins);

    if (safeCoins >= 1_000_000_000_000) {
      return `${this.formatCompactAmount(safeCoins / 1_000_000_000_000)}T`;
    }

    if (safeCoins >= 1_000_000_000) {
      return `${this.formatCompactAmount(safeCoins / 1_000_000_000)}B`;
    }

    if (safeCoins >= 1_000_000) {
      return `${this.formatCompactAmount(safeCoins / 1_000_000)}M`;
    }

    if (safeCoins >= 1_000) {
      return `${this.formatCompactAmount(safeCoins / 1_000)}K`;
    }

    if (safeCoins < 10 && !Number.isInteger(safeCoins)) {
      return safeCoins.toFixed(1).replace(/\.0$/, '');
    }

    return Math.round(safeCoins).toString();
  }

  private formatSignedCoinAmount(coins: number): string {
    const safeCoins = this.sanitizeCoins(coins);
    const sign = safeCoins > 0 ? '+' : '';

    return `${sign}${this.formatCoinAmount(safeCoins)}`;
  }

  private formatCompactAmount(amount: number): string {
    if (amount >= 100) {
      return Math.floor(amount).toString();
    }

    return amount.toFixed(1).replace(/\.0$/, '');
  }

  private updateHud(): void {
    this.currency.coins = this.sanitizeCoins(this.currency.coins);
    this.hudView.refresh(this.currency.coins);
    this.updateHatchCooldownUi();
    this.updateTapFarmUi();
  }

  private updateTapFarmUi(): void {
    this.tapFarmView.refresh();
  }

  private getTapFarmStatusText(): string {
    const energy = getClampedTapFarmEnergy(this.tapFarmEnergy, TAP_FARM_BURST_THRESHOLD);
    const activeCombo = this.getActiveTapFarmCombo();

    if (activeCombo >= 2) {
      return this.t('ui.tapFarm.comboStatus', {
        combo: activeCombo,
        multiplier: this.formatTapFarmComboMultiplier(this.getTapFarmComboMultiplier(activeCombo)),
      });
    }

    return this.t('ui.tapFarm.status', {
      amount: this.formatSignedCoinAmount(this.getTapFarmReward()),
      energy,
      goal: TAP_FARM_BURST_THRESHOLD,
    });
  }

  private getTapFarmEnergyRatio(): number {
    return getTapFarmEnergyRatioFromState(this.tapFarmEnergy, TAP_FARM_BURST_THRESHOLD);
  }

  private formatTapFarmComboMultiplier(multiplier: number): string {
    return multiplier.toFixed(1).replace(/\.0$/, '');
  }

}
