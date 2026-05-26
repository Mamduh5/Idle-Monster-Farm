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
  EXPEDITION_DEFINITIONS,
  EXPEDITION_IDS,
  type ExpeditionDefinition,
  type ExpeditionId,
  type ExpeditionReward,
} from '../data/expeditions';
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
  clampCompendiumPageIndex,
  discoverMonster as discoverMonsterInState,
  getCompendiumListItems,
  getCompendiumPageCount,
  getCompendiumPageFamilies,
  getCompendiumPageItems,
  getDiscoveredMonsterCount,
  getFamilyProgress,
  hasDiscoveredFamily,
  isMonsterDiscovered as isMonsterDiscoveredInState,
  type CompendiumListItem,
  type DiscoveryKey,
} from '../state/discoveryState';
import { canAffordHatch as canAffordHatchInState, getAppliedAwayHatchCooldown, getCappedHatchCooldown, getHatchAttemptState, getHatchCooldownDurationForState, getHatchCost, getHatchedMonsterDefinition, getMushroomHatchChanceForState, getNextHatchCostAfterSuccess, getUpdatedHatchCooldown, isHatchReady as isHatchReadyInState } from '../state/hatchState';
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
  canClaimExpedition,
  getBattleDamageTicks,
  getBattlePower,
  getBattleResult,
  getBattleStageStatus,
  getCurrentBattleStage,
  getEnemyHpAfterBattle,
  canClaimBattleReward,
  getExpeditionStatus,
  getMonsterBattlePower,
  getSanitizedClaimedExpeditionIds as getSanitizedClaimedExpeditionIdsFromState,
  getTopBattleMonsters,
  type ExpeditionStatus,
} from '../state/expeditionState';
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
import { canAffordEssencePower, canPerformSafeRitual, canSwitchToZone, createInitialUnlockedZones, getEssencePowerPurchaseResult, getPrestigeReward, getSafeRitualReward, getSanitizedUnlockedZones, getZoneSelectionStatus, sanitizePrestigeInteger as sanitizePrestigeIntegerState, syncZoneUnlockFromPrestigeProgress as syncZoneUnlockFromPrestigeProgressState } from '../state/prestigeZoneState';
import {
  createLoadedSetsFromSave,
  createLocalSaveData,
} from '../state/saveState';
import {
  BABY_SLIME,
  BUTTON_MUSHROOM,
  getMonsterDefinition,
  getNextMonsterDefinition,
  MONSTER_DEFINITIONS,
} from '../data/monsters';
import {
  UPGRADE_DEFINITIONS,
  type UpgradeDefinition,
  type UpgradeId,
} from '../data/upgrades';
import {
  GRASS_FARM_ZONE_ID,
  MUSHROOM_FOREST_ZONE_ID,
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
  getPrestigeIncomeMultiplier,
  getSporeIncomeMultiplier,
  getTotalIncomePerSecond,
  HATCH_COOLDOWN_MS,
  MUSHROOM_FOREST_HATCH_CHANCE_BONUS,
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
const SHOW_DEBUG_PANEL = false;
const SHOW_MONSTER_HITBOX_DEBUG = false;
const MODAL_OVERLAY_DEPTH = 18;
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
type ModalKind = 'compendium' | 'upgrade-shop' | 'goals' | 'orders' | 'expedition' | 'default';
type CoinBug = {
  id: number;
  container: Phaser.GameObjects.Container;
  lifetimeMs: number;
  collected: boolean;
  bobTween?: Phaser.Tweens.Tween;
  sparkleTween?: Phaser.Tweens.Tween;
  ringTween?: Phaser.Tweens.Tween;
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
  private essencePowerLevel = 0;
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
  private zonePanel?: Phaser.GameObjects.Container;
  private missionsPanel?: Phaser.GameObjects.Container;
  private ordersPanel?: Phaser.GameObjects.Container;
  private expeditionPanel?: Phaser.GameObjects.Container;
  private upgradeShopPanel?: Phaser.GameObjects.Container;
  private prestigePanel?: Phaser.GameObjects.Container;
  private modalOverlay?: Phaser.GameObjects.Rectangle;
  private economyDebugPanel?: Phaser.GameObjects.Container;
  private economyDebugText?: Phaser.GameObjects.Text;
  private activeDragSlotId: number | null = null;
  private activeDragVisual?: MonsterVisual;
  private activeDragPointerId: number | null = null;
  private upgradeLevels: Record<UpgradeId, number> = this.createInitialUpgradeLevels();
  private missionProgress: Record<MissionId, number> = this.createInitialMissionProgress();
  private completedMissionIds = new Set<MissionId>();
  private claimedMissionIds = new Set<MissionId>();
  private claimedOrderIds = new Set<OrderId>();
  private claimedExpeditionIds = new Set<ExpeditionId>();
  private unlockedZones = createInitialUnlockedZones(GRASS_FARM_ZONE_ID);
  private currentZone: ZoneId = GRASS_FARM_ZONE_ID;
  private hasPrestigedOnce = false;
  private settings: GameSettings = loadSettings();
  private resetConfirmationArmed = false;
  private prestigeConfirmationArmed = false;
  private safeRitualUsedThisSession = false;
  private safeRitualInProgress = false;
  private compendiumPageIndex = 0;
  private upgradeShopPageIndex = 0;
  private missionsPageIndex = 0;
  private ordersPageIndex = 0;
  private expeditionPageIndex = 0;
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

  private readonly handlePageHide = (): void => {
    this.saveProgress();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.lastHiddenAt = Date.now();
      this.saveProgress();
      return;
    }

    if (document.visibilityState === 'visible') {
      this.applyResumeProgress();
    }
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
      onHatchClick: () => {
        this.playButtonClickSound();
        this.hatchMonster();
      },
      onHoverBlocked: () => this.resetFarmControlHoverState(),
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
    this.zonePanel = undefined;
    this.missionsPanel = undefined;
    this.ordersPanel = undefined;
    this.expeditionPanel = undefined;
    this.upgradeShopPanel = undefined;
    this.prestigePanel = undefined;
    this.navigationMenuPanelView.destroy();
    this.modalOverlay = undefined;
    this.economyDebugPanel = undefined;
    this.economyDebugText = undefined;
    this.activeDragSlotId = null;
    this.activeDragVisual = undefined;
    this.activeDragPointerId = null;
    this.upgradeLevels = this.createInitialUpgradeLevels();
    this.missionProgress = this.createInitialMissionProgress();
    this.completedMissionIds = new Set<MissionId>();
    this.claimedMissionIds = new Set<MissionId>();
    this.claimedOrderIds = new Set<OrderId>();
    this.claimedExpeditionIds = new Set<ExpeditionId>();
    this.unlockedZones = createInitialUnlockedZones(GRASS_FARM_ZONE_ID);
    this.currentZone = GRASS_FARM_ZONE_ID;
    this.hasPrestigedOnce = false;
    this.settings = loadSettings();
    this.syncAudioSettings();
    this.resetConfirmationArmed = false;
    this.prestigeConfirmationArmed = false;
    this.safeRitualUsedThisSession = false;
    this.safeRitualInProgress = false;
    this.compendiumPageIndex = 0;
    this.upgradeShopPageIndex = 0;
    this.missionsPageIndex = 0;
    this.ordersPageIndex = 0;
    this.expeditionPageIndex = 0;
    this.clearBattleAnimationEvents();
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
    const isMushroomForest = this.currentZone === MUSHROOM_FOREST_ZONE_ID;
    const skyColor = isMushroomForest ? 0x637d68 : THEME.sky;
    const groundColor = isMushroomForest ? 0x355f3f : THEME.grass;
    const groundPatchColor = isMushroomForest ? 0x4e7a4a : THEME.grassPatch;
    const lowerGroundColor = isMushroomForest ? 0x3b2f28 : THEME.dirt;
    const lowerGroundDarkColor = isMushroomForest ? 0x231f1b : THEME.dirtDark;

    this.backgroundContainer?.destroy();
    const backgroundContainer = this.add.container(0, 0).setDepth(-30);

    backgroundContainer.add(this.add.rectangle(0, 0, width, height, groundColor).setOrigin(0));
    backgroundContainer.add(this.add.rectangle(0, 0, width, 92, skyColor).setOrigin(0).setAlpha(0.9));
    backgroundContainer.add(this.add.rectangle(0, 92, width, 18, groundPatchColor).setOrigin(0).setAlpha(0.7));
    backgroundContainer.add(this.add.rectangle(0, height - 96, width, 96, lowerGroundColor).setOrigin(0).setAlpha(0.56));
    backgroundContainer.add(this.add.rectangle(0, height - 96, width, 8, lowerGroundDarkColor).setOrigin(0).setAlpha(0.3));

    const graphics = this.add.graphics();

    for (let x = 24; x < width; x += 72) {
      const y = 116 + ((x / 24) % 5) * 34;
      graphics.fillStyle(groundPatchColor, isMushroomForest ? 0.32 : 0.24);
      graphics.fillEllipse(x, y, 34, 10);
    }

    for (let x = 36; x < width; x += 92) {
      graphics.fillStyle(lowerGroundDarkColor, 0.18);
      graphics.fillEllipse(x, height - 52 + (x % 3) * 5, 26, 8);
    }

    if (isMushroomForest) {
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
    }

    backgroundContainer.add(graphics);
    this.backgroundContainer = backgroundContainer;
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
      this.openExpeditionPanel();
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
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeOrdersPanel();
    this.closeExpeditionPanel();
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const menuItems: NavigationMenuPanelItem[] = [
      { label: this.t('ui.menu.settings'), openPanel: () => this.openSettingsPanel() },
      { label: this.t('ui.menu.help'), openPanel: () => this.openHelpPanel() },
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
      const isListModal = kind === 'compendium' || kind === 'upgrade-shop' || kind === 'goals' || kind === 'orders' || kind === 'expedition';
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
      || this.zonePanel
      || this.missionsPanel
      || this.ordersPanel
      || this.expeditionPanel
      || this.upgradeShopPanel
      || this.prestigePanel
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

    if (this.expeditionPanel) {
      this.closeExpeditionPanel();
      return;
    }

    if (this.helpPanel) {
      this.closeHelpPanel();
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
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeOrdersPanel();
    this.closeExpeditionPanel();
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
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeOrdersPanel();
    this.closeExpeditionPanel();
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = getPanelSize(this.scale, 500, 430);

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
    this.closeMissionsPanel();
    this.closeOrdersPanel();
    this.closeExpeditionPanel();
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = getPanelSize(this.scale, 460, 360);
    const firstRowY = -panelHeight / 2 + 104;
    const rowGap = Math.min(96, Math.max(78, (panelHeight - 128) / ZONE_DEFINITIONS.length));
    const rowHeight = Math.min(84, rowGap - 8);

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
    const bonusText = zone.id === MUSHROOM_FOREST_ZONE_ID
      ? this.t('ui.zone.mushroomBonus', { percent: Math.round(MUSHROOM_FOREST_HATCH_CHANCE_BONUS * 100) })
      : this.t('ui.zone.defaultFarm');

    panel.add(this.add.rectangle(0, rowY, panelWidth - 48, rowHeight, isUnlocked ? THEME.panelAlt : 0x29362f, 0.92)
      .setStrokeStyle(2, isCurrent ? THEME.panelBorder : canSelect ? THEME.slot : THEME.lockedBorder, 0.78));

    panel.add(this.add.text(-panelWidth / 2 + 42, rowTop + 9, this.getLocalizedZoneName(zone), {
      color: isUnlocked ? THEME.text : '#9ca79f',
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '15px' : '17px',
      fontStyle: 'bold',
    }));

    panel.add(this.add.text(-panelWidth / 2 + 42, rowTop + 33, statusText, {
      color: isUnlocked ? '#cdebb3' : THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '12px' : '13px',
      wordWrap: {
        width: panelWidth - 170,
      },
    }));

    panel.add(this.add.text(-panelWidth / 2 + 42, rowTop + 51, bonusText, {
      color: zone.id === MUSHROOM_FOREST_ZONE_ID ? '#fff4a8' : THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '11px' : '12px',
      wordWrap: {
        width: panelWidth - 170,
      },
    }));

    const actionText = this.add.text(panelWidth / 2 - 42, rowY, isCurrent ? this.t('ui.zone.current') : isUnlocked ? this.t('ui.zone.switch') : this.t('ui.zone.locked'), {
      color: isUnlocked ? '#ffffff' : '#9ca79f',
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '13px' : '14px',
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
      GRASS_FARM_ZONE_ID,
      MUSHROOM_FOREST_ZONE_ID,
    );

    this.unlockedZones = syncResult.unlockedZones;
    this.currentZone = syncResult.currentZone;
    this.hasPrestigedOnce = syncResult.hasPrestigedOnce;
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
    this.closeZonePanel();
    this.closeOrdersPanel();
    this.closeExpeditionPanel();
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
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeExpeditionPanel();
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

  private toggleExpeditionPanel(): void {
    if (this.expeditionPanel) {
      this.closeExpeditionPanel();
      return;
    }

    this.openExpeditionPanel();
  }

  private openExpeditionPanel(): void {
    this.closeExpeditionPanel();
    this.closeNavigationMenuPanel();
    this.closeCompendiumPanel();
    this.closeSettingsPanel();
    this.closeHelpPanel();
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
    const { width: panelWidth, height: panelHeight } = this.getModalSize('expedition', 560, 540);
    const stage = getCurrentBattleStage(EXPEDITION_DEFINITIONS, this.claimedExpeditionIds);
    const isCompactPanel = panelWidth < 420;
    const contentLeft = -panelWidth / 2 + 24;
    const contentWidth = panelWidth - 48;

    panel.setDepth(24);
    addPanelBackground(this, panel, panelWidth, panelHeight, THEME);

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 20, this.t('ui.expedition.title'), {
      color: THEME.text,
      fontFamily: UI_FONT_FAMILY,
      fontSize: getPanelTitleFontSize(panelWidth),
      fontStyle: 'bold',
    }));

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 54, this.t('ui.expedition.description'), {
      color: THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '12px' : '13px',
      fixedWidth: panelWidth - 48,
      wordWrap: {
        width: panelWidth - 48,
        useAdvancedWrap: true,
      },
    }));

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 92, this.t('ui.expedition.power', {
      amount: this.getCurrentExpeditionPower(),
    }), {
      color: '#fff4a8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '15px' : '17px',
      fontStyle: 'bold',
    }));

    this.addModalCloseButton(panel, panelWidth, panelHeight, () => this.closeExpeditionPanel(), {
      stopPropagation: true,
    });

    if (!stage) {
      panel.add(this.add.text(contentLeft, -panelHeight / 2 + 86, this.t('ui.expedition.allClaimed'), {
        color: THEME.mutedText,
        fontFamily: UI_FONT_FAMILY,
        fontSize: isCompactPanel ? '13px' : '15px',
        fixedWidth: contentWidth,
        wordWrap: { width: contentWidth },
      }));
      this.expeditionPanel = panel;
      return;
    }

    this.addBattleTrainingContent(panel, stage, panelWidth, panelHeight);

    this.expeditionPanel = panel;
  }

  private addBattleTrainingContent(
    panel: Phaser.GameObjects.Container,
    stage: ExpeditionDefinition,
    panelWidth: number,
    panelHeight: number,
  ): void {
    const isCompactPanel = panelWidth < 420;
    const contentLeft = -panelWidth / 2 + 24;
    const contentWidth = panelWidth - 48;
    const stageStatus = getBattleStageStatus(stage, this.farmSlots, this.claimedExpeditionIds);
    const isClaimed = stageStatus === 'claimed';
    const battlePower = this.getCurrentExpeditionPower();
    const finalHp = isClaimed ? 0 : getEnemyHpAfterBattle(battlePower, stage.requiredPower);
    const initialHpRatio = isClaimed ? 0 : 1;
    const teamMonsters = getTopBattleMonsters(this.farmSlots, 3);
    const arenaTop = -panelHeight / 2 + (isCompactPanel ? 96 : 104);
    const arenaHeight = Math.min(isCompactPanel ? 204 : 224, panelHeight * 0.38);
    const arenaCenterY = arenaTop + arenaHeight / 2;
    const playerX = -panelWidth * 0.23;
    const enemyX = panelWidth * 0.24;
    const enemyY = arenaCenterY + (isCompactPanel ? 6 : 0);
    const hpWidth = Math.min(isCompactPanel ? 138 : 170, contentWidth * 0.48);
    const hpY = arenaTop + 16;

    panel.add(this.add.text(contentLeft, -panelHeight / 2 + 54, this.getLocalizedExpeditionName(stage), {
      color: THEME.goldText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '17px' : '19px',
      fontStyle: 'bold',
      fixedWidth: contentWidth,
    }));

    panel.add(this.add.rectangle(0, arenaCenterY, contentWidth, arenaHeight, 0x102a1c, 0.42)
      .setStrokeStyle(2, THEME.panelBorder, 0.34));

    panel.add(this.add.text(playerX, arenaTop + 14, this.t('ui.battle.yourTeam'), {
      color: THEME.text,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '12px' : '13px',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    panel.add(this.add.text(enemyX, arenaTop + 14, this.t('ui.battle.enemy'), {
      color: THEME.text,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '12px' : '13px',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    const hpTrack = this.add.rectangle(enemyX - hpWidth / 2, hpY + 14, hpWidth, 12, 0x14231a, 0.9)
      .setOrigin(0)
      .setStrokeStyle(1, THEME.panelBorder, 0.76);
    const hpFill = this.add.rectangle(enemyX - hpWidth / 2 + 2, hpY + 16, Math.max(1, hpWidth - 4), 8, 0xd9574f, 0.96)
      .setOrigin(0, 0.5)
      .setScale(initialHpRatio, 1);
    const hpText = this.add.text(enemyX, hpY - 2, this.t('ui.battle.enemyHp', {
      current: finalHp,
      max: stage.requiredPower,
    }), {
      color: THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '10px' : '11px',
    }).setOrigin(0.5);
    panel.add([hpTrack, hpFill, hpText]);

    this.addBattleTeamVisuals(panel, teamMonsters, playerX, arenaCenterY, isCompactPanel);
    const enemyContainer = this.add.container(enemyX, enemyY);
    this.addBattleEnemyVisual(enemyContainer, stage, isCompactPanel ? 0.86 : 1);
    panel.add(enemyContainer);

    const damageText = this.add.text(enemyX + (isCompactPanel ? 38 : 48), enemyY - 40, '', {
      color: '#fff0a8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '21px' : '25px',
      fontStyle: 'bold',
      stroke: '#8f3044',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);
    panel.add(damageText);

    const powerY = arenaTop + arenaHeight + (isCompactPanel ? 12 : 14);
    panel.add(this.add.text(contentLeft, powerY, this.t('ui.battle.yourPower', {
      amount: battlePower,
    }), {
      color: '#fff4a8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '13px' : '15px',
      fontStyle: 'bold',
    }));
    panel.add(this.add.text(contentLeft + contentWidth, powerY, this.t('ui.battle.enemyPower', {
      amount: stage.requiredPower,
    }), {
      color: THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '13px' : '15px',
      fontStyle: 'bold',
    }).setOrigin(1, 0));

    const resultText = this.add.text(0, powerY + (isCompactPanel ? 26 : 30), isClaimed ? this.t('ui.battle.claimed') : this.t('ui.battle.ready'), {
      align: 'center',
      color: isClaimed ? '#cdebb3' : THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '13px' : '15px',
      fontStyle: 'bold',
      fixedWidth: contentWidth,
      wordWrap: { width: contentWidth },
    }).setOrigin(0.5, 0);
    panel.add(resultText);

    const buttonY = panelHeight / 2 - (isCompactPanel ? 38 : 44);
    const buttonHeight = isCompactPanel ? 34 : 38;
    const buttonGap = 10;
    const buttonWidth = Math.min(isCompactPanel ? 126 : 150, (contentWidth - buttonGap) / 2);
    const fightButton = this.addBattleButton(
      panel,
      -buttonWidth / 2 - buttonGap / 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      this.t('ui.battle.fight'),
      isClaimed ? THEME.lockedInner : THEME.buttonWarm,
      isClaimed ? '#9ca79f' : '#ffffff',
      () => {
        this.startBattleTrainingAnimation({
          battlePower,
          damageText,
          enemyContainer,
          fightButton,
          hpFill,
          hpText,
          resultText,
          stage,
          claimButton,
        });
      },
      !isClaimed,
    );

    const claimButton = this.addBattleButton(
      panel,
      buttonWidth / 2 + buttonGap / 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      isClaimed ? this.t('ui.battle.claimed') : this.t('ui.battle.claimReward'),
      isClaimed ? THEME.lockedInner : THEME.buttonHover,
      isClaimed ? '#cdebb3' : '#ffffff',
      () => {
        this.claimExpeditionReward(stage.id);
      },
      !isClaimed,
    );
    claimButton.setVisible(isClaimed);

    if (isClaimed) {
      hpText.setText(this.t('ui.battle.enemyHp', {
        current: 0,
        max: stage.requiredPower,
      }));
    }
  }

  private addBattleTeamVisuals(
    panel: Phaser.GameObjects.Container,
    monsters: MonsterInstance[],
    centerX: number,
    centerY: number,
    isCompactPanel: boolean,
  ): void {
    if (monsters.length === 0) {
      panel.add(this.add.text(centerX, centerY, this.t('ui.battle.noTeam'), {
        align: 'center',
        color: THEME.mutedText,
        fontFamily: UI_FONT_FAMILY,
        fontSize: isCompactPanel ? '11px' : '13px',
        fixedWidth: isCompactPanel ? 108 : 130,
        wordWrap: { width: isCompactPanel ? 108 : 130 },
      }).setOrigin(0.5));
      return;
    }

    const spacing = isCompactPanel ? 38 : 46;
    const cardWidth = isCompactPanel ? 34 : 40;
    const cardHeight = isCompactPanel ? 52 : 60;
    const startX = centerX - spacing * (monsters.length - 1) / 2;

    monsters.forEach((monster, index) => {
      const x = startX + index * spacing;
      const cardY = centerY + (isCompactPanel ? 20 : 24);

      panel.add(this.add.rectangle(x, cardY, cardWidth, cardHeight, THEME.slot, 0.88)
        .setStrokeStyle(2, THEME.slotBorder, 0.72));
      this.monsterRenderer.addMonsterVisual(panel, monster, x, cardY - (isCompactPanel ? 8 : 10), isCompactPanel ? 0.38 : 0.44);
      panel.add(this.add.text(x, cardY + cardHeight / 2 - 11, this.t('common.levelShort', {
        level: monster.level,
      }), {
        align: 'center',
        color: '#173c27',
        fontFamily: UI_FONT_FAMILY,
        fontSize: isCompactPanel ? '9px' : '10px',
        fontStyle: 'bold',
      }).setOrigin(0.5));
      panel.add(this.add.text(x, cardY + cardHeight / 2, getMonsterBattlePower(monster).toString(), {
        align: 'center',
        color: '#173c27',
        fontFamily: UI_FONT_FAMILY,
        fontSize: isCompactPanel ? '8px' : '9px',
        fontStyle: 'bold',
      }).setOrigin(0.5));
    });
  }

  private addBattleEnemyVisual(
    container: Phaser.GameObjects.Container,
    stage: ExpeditionDefinition,
    scale: number,
  ): void {
    const shadow = this.add.ellipse(0, 36 * scale, 82 * scale, 18 * scale, THEME.shadow, 0.24);
    container.add(shadow);

    if (stage.id === 'training-dummy') {
      container.add(this.add.rectangle(0, 4 * scale, 24 * scale, 62 * scale, 0x9b7446, 0.96)
        .setStrokeStyle(3, 0x5b3a21, 0.85));
      container.add(this.add.circle(0, -34 * scale, 20 * scale, 0xc68a4c, 0.96)
        .setStrokeStyle(3, 0x5b3a21, 0.85));
      container.add(this.add.rectangle(0, -4 * scale, 64 * scale, 10 * scale, 0xc68a4c, 0.96)
        .setStrokeStyle(2, 0x5b3a21, 0.75));
      return;
    }

    if (stage.id === 'wobbly-sprout') {
      container.add(this.add.ellipse(0, 12 * scale, 44 * scale, 48 * scale, 0x75c85b, 0.96)
        .setStrokeStyle(3, 0x2f6d35, 0.85));
      container.add(this.add.ellipse(-16 * scale, -18 * scale, 22 * scale, 36 * scale, 0x9de06f, 0.9).setAngle(-26));
      container.add(this.add.ellipse(17 * scale, -18 * scale, 22 * scale, 36 * scale, 0x9de06f, 0.9).setAngle(26));
      return;
    }

    if (stage.id === 'forest-guardian') {
      container.add(this.add.rectangle(0, 8 * scale, 44 * scale, 70 * scale, 0x76512d, 0.96)
        .setStrokeStyle(3, 0x3d2615, 0.86));
      container.add(this.add.circle(-22 * scale, -24 * scale, 28 * scale, 0x4f944b, 0.95));
      container.add(this.add.circle(18 * scale, -32 * scale, 32 * scale, 0x5da957, 0.95));
      container.add(this.add.circle(0, -46 * scale, 28 * scale, 0x6fbd64, 0.95));
      return;
    }

    if (stage.id === 'ancient-stump') {
      container.add(this.add.ellipse(0, 5 * scale, 62 * scale, 74 * scale, 0x7a5734, 0.96)
        .setStrokeStyle(4, 0x3d2615, 0.86));
      container.add(this.add.ellipse(0, -24 * scale, 52 * scale, 20 * scale, 0xb58650, 0.94)
        .setStrokeStyle(2, 0x3d2615, 0.7));
      container.add(this.add.circle(-13 * scale, 1 * scale, 4 * scale, 0x14351f));
      container.add(this.add.circle(13 * scale, 1 * scale, 4 * scale, 0x14351f));
      return;
    }

    const dragonScale = stage.id === 'tiny-dragon' ? 1.12 * scale : scale;
    const bodyColor = stage.id === 'tiny-dragon' ? 0x5a54c8 : 0x7554c8;
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

  private startBattleTrainingAnimation(options: {
    battlePower: number;
    claimButton: Phaser.GameObjects.Text;
    damageText: Phaser.GameObjects.Text;
    enemyContainer: Phaser.GameObjects.Container;
    fightButton: Phaser.GameObjects.Text;
    hpFill: Phaser.GameObjects.Rectangle;
    hpText: Phaser.GameObjects.Text;
    resultText: Phaser.GameObjects.Text;
    stage: ExpeditionDefinition;
  }): void {
    if (this.battleAnimationInProgress || this.claimedExpeditionIds.has(options.stage.id)) {
      return;
    }

    this.clearBattleAnimationEvents();
    this.battleAnimationInProgress = true;
    options.claimButton.setVisible(false);
    options.fightButton.disableInteractive();
    options.fightButton.setAlpha(0.62);
    options.resultText.setColor(THEME.mutedText);
    options.resultText.setText(this.t('ui.battle.fighting'));
    options.hpFill.setScale(1, 1);
    options.hpText.setText(this.t('ui.battle.enemyHp', {
      current: options.stage.requiredPower,
      max: options.stage.requiredPower,
    }));

    const tickCount = 4;
    const damageTicks = getBattleDamageTicks(options.battlePower, options.stage.requiredPower, tickCount);
    const finalHp = getEnemyHpAfterBattle(options.battlePower, options.stage.requiredPower);
    let currentHp = options.stage.requiredPower;

    damageTicks.forEach((damage, index) => {
      const event = this.time.delayedCall(220 + index * 260, () => {
        currentHp = index === damageTicks.length - 1
          ? finalHp
          : Math.max(finalHp, currentHp - damage);
        const hpRatio = Phaser.Math.Clamp(currentHp / options.stage.requiredPower, 0, 1);

        this.tweens.add({
          duration: 180,
          ease: 'Sine.easeOut',
          scaleX: hpRatio,
          targets: options.hpFill,
        });
        options.hpText.setText(this.t('ui.battle.enemyHp', {
          current: currentHp,
          max: options.stage.requiredPower,
        }));

        if (damage > 0) {
          options.damageText.setText(`-${damage}`);
          options.damageText.setAlpha(1);
          options.damageText.setY(options.enemyContainer.y - 40);
          this.tweens.add({
            alpha: 0,
            duration: 360,
            ease: 'Sine.easeOut',
            targets: options.damageText,
            y: options.enemyContainer.y - 64,
          });
        }

        this.tweens.add({
          duration: 90,
          ease: 'Sine.easeOut',
          scaleX: 1.06,
          scaleY: 0.94,
          targets: options.enemyContainer,
          yoyo: true,
        });
      });
      this.battleAnimationEvents.push(event);
    });

    const finishEvent = this.time.delayedCall(220 + tickCount * 260 + 160, () => {
      const result = getBattleResult(options.battlePower, options.stage.requiredPower);

      this.battleAnimationInProgress = false;
      options.fightButton.setAlpha(1);
      options.fightButton.setInteractive({ useHandCursor: true });

      if (result === 'victory') {
        options.resultText.setColor('#fff4a8');
        options.resultText.setText(this.t('ui.battle.victory'));
        options.claimButton.setVisible(canClaimBattleReward(options.stage, this.farmSlots, this.claimedExpeditionIds));
        return;
      }

      options.resultText.setColor('#fff4a8');
      options.resultText.setText(this.t('ui.battle.needMorePower'));
    });
    this.battleAnimationEvents.push(finishEvent);
  }

  private clearBattleAnimationEvents(): void {
    this.battleAnimationEvents.forEach((event) => {
      event.remove(false);
    });
    this.battleAnimationEvents = [];
    this.battleAnimationInProgress = false;
  }

  private addExpeditionRow(
    panel: Phaser.GameObjects.Container,
    expedition: ExpeditionDefinition,
    rowY: number,
    panelWidth: number,
    rowHeight: number,
  ): Phaser.GameObjects.Text {
    const status = this.getExpeditionStatus(expedition);
    const canClaim = status === 'ready';
    const isClaimed = status === 'claimed';
    const isCompactPanel = panelWidth < 420 || rowHeight < 64;
    const rowTop = rowY - rowHeight / 2;
    const rowWidth = panelWidth - 48;
    const leftX = -panelWidth / 2 + 42;
    const leftTextWidth = panelWidth - (isCompactPanel ? 166 : 196);

    panel.add(this.add.rectangle(0, rowY, rowWidth, rowHeight, isClaimed ? 0x29362f : THEME.panelAlt, 0.92)
      .setStrokeStyle(2, canClaim ? THEME.slot : THEME.lockedBorder, 0.72));

    panel.add(this.add.text(leftX, rowTop + 7, this.getLocalizedExpeditionName(expedition), {
      color: isClaimed ? '#cdebb3' : THEME.text,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '13px' : '15px',
      fontStyle: 'bold',
      wordWrap: {
        width: leftTextWidth,
      },
    }));

    panel.add(this.add.text(leftX, rowTop + (isCompactPanel ? 27 : 29), this.t('ui.expedition.requiredPower', {
      amount: expedition.requiredPower,
    }), {
      color: canClaim ? '#fff4a8' : THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '11px' : '12px',
      wordWrap: {
        width: leftTextWidth,
      },
    }));

    panel.add(this.add.text(leftX, rowTop + (isCompactPanel ? 44 : 47), this.t('common.reward', {
      reward: this.getExpeditionRewardText(expedition.reward),
    }), {
      color: canClaim ? '#fff4a8' : THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '11px' : '12px',
      wordWrap: {
        width: leftTextWidth,
      },
    }));

    const actionText = this.add.text(panelWidth / 2 - 42, rowY, this.getExpeditionStatusText(status), {
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
          this.claimExpeditionReward(expedition.id);
        });
    }

    panel.add(actionText);
    return actionText;
  }

  private closeExpeditionPanel(): void {
    if (this.expeditionPanel) {
      this.clearBattleAnimationEvents();
      this.expeditionPanel.destroy();
      this.expeditionPanel = undefined;
      this.hideModalOverlay();
    }
  }

  private refreshExpeditionPanel(): void {
    if (this.expeditionPanel) {
      this.openExpeditionPanel();
    }
  }

  private getExpeditionDefinition(expeditionId: ExpeditionId): ExpeditionDefinition | undefined {
    return EXPEDITION_DEFINITIONS.find((expedition) => expedition.id === expeditionId);
  }

  private getLocalizedExpeditionName(expedition: ExpeditionDefinition): string {
    return this.t(`expedition.${expedition.id}.name`);
  }

  private getCurrentExpeditionPower(): number {
    return getBattlePower(this.farmSlots);
  }

  private getExpeditionStatus(expedition: ExpeditionDefinition): ExpeditionStatus {
    return getExpeditionStatus(expedition, this.farmSlots, this.claimedExpeditionIds);
  }

  private getExpeditionStatusText(status: ExpeditionStatus): string {
    if (status === 'claimed') {
      return this.t('ui.expedition.claimed');
    }

    if (status === 'ready') {
      return this.t('ui.expedition.claim');
    }

    return this.t('ui.expedition.needPower');
  }

  private claimExpeditionReward(expeditionId: ExpeditionId): void {
    const expedition = this.getExpeditionDefinition(expeditionId);

    if (!expedition || !canClaimExpedition(expedition, this.farmSlots, this.claimedExpeditionIds)) {
      return;
    }

    if (expedition.reward.type === 'coins') {
      this.currency.coins = this.sanitizeCoins(this.currency.coins + expedition.reward.amount);
    } else {
      this.monsterEssence = sanitizePrestigeIntegerState(this.monsterEssence + expedition.reward.amount);
      this.syncZoneUnlockFromPrestigeProgress();
    }

    this.claimedExpeditionIds.add(expeditionId);
    this.skipSavingUntilProgress = false;
    this.updateHud();
    this.saveProgress();
    this.refreshExpeditionPanel();
    this.showToast(this.t('toast.expeditionCleared', {
      reward: this.getExpeditionRewardText(expedition.reward),
    }), 'success');
  }

  private getExpeditionRewardText(reward: ExpeditionReward): string {
    if (reward.type === 'coins') {
      return this.t('common.coins', {
        amount: this.formatCoinAmount(reward.amount),
      });
    }

    return this.t('common.essence', {
      amount: reward.amount,
    });
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
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeOrdersPanel();
    this.closeExpeditionPanel();
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
    const hatchState = this.isHatchReady()
      ? 'Ready'
      : `${(remainingMs / MILLISECONDS_PER_SECOND).toFixed(1)}s remaining`;
    const upgradeLines = UPGRADE_DEFINITIONS
      .map((upgrade) => `${upgrade.name}: Lv ${this.getUpgradeLevel(upgrade.id)}/${upgrade.maxLevel}`)
      .join('\n');

    return [
      `Egg cost: ${this.getEffectiveEggCost()} effective / ${this.currentEggCost} raw`,
      `Income/sec: ${this.formatCoinAmount(this.getTotalIncomePerSecond())}`,
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
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeOrdersPanel();
    this.closeExpeditionPanel();
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
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeOrdersPanel();
    this.closeExpeditionPanel();
    this.closeUpgradeShopPanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = getPanelSize(this.scale, 430, 430);
    const reward = getPrestigeReward(this.farmSlots);
    const canPrestige = reward > 0;
    const canSafeRitual = canPerformSafeRitual(this.farmSlots, this.safeRitualUsedThisSession)
      && !this.safeRitualInProgress;
    const canBuyEssencePower = canAffordEssencePower(this.monsterEssence, ESSENCE_POWER_COST);

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

    panel.add(this.add.text(contentX, -panelHeight / 2 + 108, statusText, {
      color: canPrestige ? '#cdebb3' : THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '13px' : '14px',
      fixedWidth: contentWidth,
      wordWrap: {
        width: contentWidth,
      },
    }));

    panel.add(this.add.text(contentX, -panelHeight / 2 + 134, this.t('ui.prestige.reward', {
      amount: reward,
    }), {
      color: canPrestige ? '#fff4a8' : '#9ca79f',
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '13px' : '14px',
      fontStyle: 'bold',
      fixedWidth: contentWidth,
    }));

    panel.add(this.add.text(contentX, -panelHeight / 2 + 160, this.t('ui.prestige.permanentPower'), {
      color: THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: '13px',
      wordWrap: {
        width: contentWidth,
      },
    }));

    this.addEssencePowerSection(panel, panelWidth, panelHeight, canBuyEssencePower);
    this.addPrestigeAction(panel, panelWidth, panelHeight, canPrestige, canSafeRitual);

    this.prestigePanel = panel;
  }

  private addEssencePowerSection(
    panel: Phaser.GameObjects.Container,
    panelWidth: number,
    panelHeight: number,
    canBuyEssencePower: boolean,
  ): void {
    const y = panelHeight / 2 - 126;
    const rowWidth = panelWidth - 52;

    panel.add(this.add.rectangle(0, y, rowWidth, 74, THEME.panelAlt, 0.92)
      .setStrokeStyle(2, canBuyEssencePower ? THEME.slot : THEME.lockedBorder, 0.78));

    panel.add(this.add.text(-panelWidth / 2 + 42, y - 27, this.t('ui.prestige.essencePower'), {
      color: '#f7ffe8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '15px' : '17px',
      fontStyle: 'bold',
    }));

    panel.add(this.add.text(-panelWidth / 2 + 42, y - 4, this.t('common.level', {
      level: this.essencePowerLevel,
    }), {
      color: '#cdebb3',
      fontFamily: UI_FONT_FAMILY,
      fontSize: '13px',
      fontStyle: 'bold',
    }));

    panel.add(this.add.text(-panelWidth / 2 + 42, y + 18, this.t('ui.prestige.globalIncome', {
      multiplier: this.getPrestigeIncomeMultiplier().toFixed(2),
    }), {
      color: THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: '12px',
    }));

    panel.add(this.add.text(panelWidth / 2 - 42, y - 30, this.t('common.cost', {
      amount: this.formatCoinAmount(ESSENCE_POWER_COST),
    }), {
      color: '#fff4a8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: '13px',
      fontStyle: 'bold',
    }).setOrigin(1, 0));

    const buyText = this.add.text(panelWidth / 2 - 42, y - 6, this.t('common.buy'), {
      color: '#ffffff',
      fontFamily: UI_FONT_FAMILY,
      fontSize: '15px',
      fontStyle: 'bold',
      backgroundColor: `#${(canBuyEssencePower ? THEME.buttonHover : THEME.danger).toString(16).padStart(6, '0')}`,
      padding: {
        x: 13,
        y: 6,
      },
    }).setOrigin(1, 0);

    buyText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.playButtonClickSound();
        this.buyEssencePower();
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

    const safeDetail = this.safeRitualUsedThisSession
      ? this.t('ui.prestige.safeUsed')
      : this.t('ui.prestige.safeDetail');

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

    if (this.monsterEssence > 0 || this.essencePowerLevel > 0) {
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

  private buyEssencePower(): void {
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
    this.showToast(this.t('toast.essencePowerUpgraded'), 'success');
  }

  private tryPrestige(): void {
    const reward = getPrestigeReward(this.farmSlots);

    if (reward <= 0) {
      this.showToast(this.t('toast.prestigeRequirement'), 'warning');
      return;
    }

    if (!this.prestigeConfirmationArmed) {
      this.prestigeConfirmationArmed = true;
      this.openPrestigePanel();
      return;
    }

    this.performPrestigeReset(reward);
    this.openPrestigePanel();
    this.showToast(this.t('toast.prestigeComplete', { amount: reward }), 'success');
  }

  private async trySafeRitual(): Promise<void> {
    const reward = getSafeRitualReward(this.farmSlots);

    if (reward <= 0) {
      this.showToast(this.t('toast.prestigeRequirement'), 'warning');
      return;
    }

    if (!canPerformSafeRitual(this.farmSlots, this.safeRitualUsedThisSession)) {
      this.showToast(this.t('toast.safeRitualUsed'), 'warning');
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

    const latestReward = getSafeRitualReward(this.farmSlots);

    if (latestReward <= 0) {
      this.openPrestigePanel();
      this.showToast(this.t('toast.prestigeRequirement'), 'warning');
      return;
    }

    this.performSafeRitualReward(latestReward);
    this.openPrestigePanel();
    this.showToast(this.t('toast.safeRitualComplete', { amount: latestReward }), 'success');
  }

  private performSafeRitualReward(essenceReward: number): void {
    this.monsterEssence = sanitizePrestigeIntegerState(this.monsterEssence + essenceReward);
    this.hasPrestigedOnce = true;
    this.safeRitualUsedThisSession = true;
    this.syncZoneUnlockFromPrestigeProgress();
    this.skipSavingUntilProgress = false;
    this.prestigeConfirmationArmed = false;
    this.updateHud();
    this.completeMission('prestige-once');
    this.refreshOrdersPanel();
    this.refreshOrderWidget();
    this.saveProgress();
  }

  private performPrestigeReset(essenceReward: number): void {
    this.monsterEssence += essenceReward;
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
    this.currentEggCost = STARTING_EGG_COST;
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

    if (upgradeId === 'hatch-speed') {
      return this.t('upgrade.current.hatch-speed', {
        seconds: (this.getHatchCooldownMs() / MILLISECONDS_PER_SECOND).toFixed(1),
      });
    }

    if (upgradeId === 'mushroom-chance') {
      return this.t('upgrade.current.mushroom-chance', {
        percent: Math.round(this.getMushroomHatchChance() * 100),
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
    );
  }

  private getSporeIncomeMultiplier(): number {
    return getSporeIncomeMultiplier(this.getUpgradeLevel('fusion-power'));
  }

  private getPrestigeIncomeMultiplier(): number {
    return getPrestigeIncomeMultiplier(this.essencePowerLevel);
  }

  private getHatchCooldownMs(): number {
    return getHatchCooldownDurationForState(this.getUpgradeLevel('hatch-speed'));
  }

  private getOfflineCapSeconds(): number {
    return getOfflineCapSeconds(this.getUpgradeLevel('offline-storage'));
  }

  private getMushroomHatchChance(): number {
    return getMushroomHatchChanceForState(this.getUpgradeLevel('mushroom-chance'), this.currentZone);
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

  private rollHatchMonsterDefinition(): MonsterDefinition {
    return getHatchedMonsterDefinition(Math.random(), this.getMushroomHatchChance(), BABY_SLIME, BUTTON_MUSHROOM);
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

  private discoverMonster(monster: MonsterDefinition): void {
    this.discoveredMonsters = discoverMonsterInState(this.discoveredMonsters, monster);
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

  private openCompendiumPanel(): void {
    this.closeCompendiumPanel();
    this.closeNavigationMenuPanel();
    this.closeSettingsPanel();
    this.closeHelpPanel();
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeOrdersPanel();
    this.closeExpeditionPanel();
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const familyOrder: MonsterFamily[] = ['Slime', 'Mushroom', 'Spore'];
    const listItems = getCompendiumListItems(MONSTER_DEFINITIONS, familyOrder);
    const { width: panelWidth, height: panelHeight } = this.getModalSize('compendium', 640, 640);
    const rowGap = panelWidth < 390 ? 34 : 38;
    const rowHeight = Math.min(34, rowGap - 3);
    const bodyTopY = -panelHeight / 2 + (panelWidth < 390 ? 122 : 118);
    const bodyBottomY = panelHeight / 2 - 72;
    const bodyHeight = Math.max(rowGap, bodyBottomY - bodyTopY);
    const rowsPerPage = this.getRowsPerPage(rowGap, bodyHeight, listItems.length, 8, 12);
    const pageCount = getCompendiumPageCount(listItems, rowsPerPage);
    const pageIndex = clampCompendiumPageIndex(this.compendiumPageIndex, pageCount);
    const pageItems = getCompendiumPageItems(listItems, pageIndex, rowsPerPage);
    const visibleRowsHeight = Math.max(rowHeight, (pageItems.length - 1) * rowGap + rowHeight);
    const firstRowY = bodyTopY + Math.max(0, (bodyHeight - visibleRowsHeight) / 2);

    this.compendiumPageIndex = pageIndex;

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

    this.addCompendiumSummary(panel, panelWidth, panelHeight, pageItems);

    pageItems.forEach((item, index) => {
      const rowY = firstRowY + index * rowGap;

      if (item.type === 'family') {
        this.addCompendiumFamilyLabel(panel, item.family, rowY, panelWidth);
        return;
      }

      this.addCompendiumRow(panel, item.monster, rowY, panelWidth, rowHeight);
    });

    this.addPaginationControls(panel, panelWidth, panelHeight, pageIndex, pageCount, (nextPageIndex) => {
      this.compendiumPageIndex = nextPageIndex;
      this.openCompendiumPanel();
    });

    this.compendiumPanel = panel;
  }

  private addCompendiumSummary(
    panel: Phaser.GameObjects.Container,
    panelWidth: number,
    panelHeight: number,
    pageItems: CompendiumListItem[],
  ): void {
    const familyOrder: MonsterFamily[] = ['Slime', 'Mushroom', 'Spore'];
    const discoveredCount = getDiscoveredMonsterCount(MONSTER_DEFINITIONS, this.discoveredMonsters);
    const pageSubtitle = this.getCompendiumPageSubtitle(pageItems);
    const summaryY = -panelHeight / 2 + 54;
    const familyProgress = getFamilyProgress(MONSTER_DEFINITIONS, this.discoveredMonsters, familyOrder)
      .map((progress) => this.t('ui.compendium.familyProgress', {
        family: this.getLocalizedFamilyName(progress.family),
        discovered: progress.discovered,
        total: progress.total,
      }))
      .join('  |  ');

    panel.add(this.add.text(-panelWidth / 2 + 24, summaryY, pageSubtitle, {
      color: THEME.goldText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '12px' : '14px',
      fontStyle: 'bold',
    }));

    panel.add(this.add.text(-panelWidth / 2 + 24, summaryY + 18, this.t('ui.compendium.summary', {
      discovered: discoveredCount,
      total: MONSTER_DEFINITIONS.length,
      familyProgress,
    }), {
      color: THEME.mutedText,
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '10px' : '12px',
      wordWrap: {
        width: panelWidth - 48,
      },
    }));
  }

  private getCompendiumPageSubtitle(pageItems: CompendiumListItem[]): string {
    const visibleFamilies = getCompendiumPageFamilies(pageItems);

    if (visibleFamilies.length === 1) {
      return this.t('ui.compendium.familyCollection', {
        family: this.getLocalizedFamilyName(visibleFamilies[0]),
      });
    }

    return this.t('ui.compendium.mixedCollection');
  }

  private closeCompendiumPanel(): void {
    if (this.compendiumPanel) {
      this.compendiumPanel.destroy();
      this.compendiumPanel = undefined;
      this.hideModalOverlay();
    }
  }

  private refreshCompendiumPanel(): void {
    if (this.compendiumPanel) {
      this.openCompendiumPanel();
    }
  }

  private addCompendiumFamilyLabel(
    panel: Phaser.GameObjects.Container,
    family: MonsterFamily,
    rowY: number,
    panelWidth: number,
  ): void {
    panel.add(this.add.text(-panelWidth / 2 + 28, rowY - 8, this.getLocalizedFamilyName(family), {
      color: '#fff4a8',
      fontFamily: UI_FONT_FAMILY,
      fontSize: panelWidth < 390 ? '13px' : '14px',
      fontStyle: 'bold',
    }));
  }

  private addCompendiumRow(
    panel: Phaser.GameObjects.Container,
    monster: MonsterDefinition,
    rowY: number,
    panelWidth: number,
    rowHeight: number,
  ): void {
    const isDiscovered = this.isMonsterDiscovered(monster);
    const rowColor = isDiscovered ? THEME.panelAlt : 0x29362f;
    const textColor = isDiscovered ? '#f7ffe8' : '#9ca79f';
    const isCompactPanel = panelWidth < 390 || rowHeight < 38;
    const iconX = -panelWidth / 2 + (isCompactPanel ? 38 : 56);
    const textX = -panelWidth / 2 + (isCompactPanel ? 66 : 94);
    const nameY = rowY - (isCompactPanel ? 10 : 16);
    const detailY = rowY + (isCompactPanel ? 5 : 5);
    const iconScale = isCompactPanel ? 0.72 : 1;

    panel.add(this.add.rectangle(0, rowY, panelWidth - 48, rowHeight, rowColor, 0.92)
      .setStrokeStyle(2, isDiscovered ? THEME.slot : THEME.lockedBorder, 0.75));

    this.monsterRenderer.addCompendiumIcon(panel, monster, isDiscovered, iconX, rowY, iconScale);

    panel.add(this.add.text(textX, nameY, isDiscovered ? this.getLocalizedMonsterName(monster) : '???', {
      color: textColor,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '13px' : '16px',
      fontStyle: 'bold',
      wordWrap: {
        width: Math.max(108, panelWidth - (isCompactPanel ? 164 : 220)),
      },
    }));

    panel.add(this.add.text(textX, detailY, this.t('common.level', { level: monster.level }), {
      color: textColor,
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '11px' : '13px',
    }));

    panel.add(this.add.text(panelWidth / 2 - 42, rowY - (isCompactPanel ? 7 : 8), isDiscovered ? this.t('common.perSecond', {
      amount: this.formatSignedCoinAmount(monster.incomePerSecond),
    }) : this.t('common.unknown'), {
      color: isDiscovered ? '#fff4a8' : '#9ca79f',
      fontFamily: UI_FONT_FAMILY,
      fontSize: isCompactPanel ? '12px' : '14px',
      fontStyle: 'bold',
    }).setOrigin(1, 0));
  }

  private clearSelectedSlot(): void {
    // On-farm monster details are intentionally disabled so tap state never blocks dragging.
  }

  private cancelActiveDrag(): void {
    if (this.activeDragSlotId === null || !this.activeDragVisual) {
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
    visual.setDepth(10);
    visual.setPosition(pointer.worldX, pointer.worldY);
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

    const sourceSlotId = this.activeDragSlotId;
    const visual = this.activeDragVisual;

    visual.setScale(1);
    visual.setDepth(0);
    this.resetManualDragState();

    this.handleMonsterDrop(sourceSlotId, pointer.worldX, pointer.worldY, visual);
  }

  private resetManualDragState(): void {
    this.activeDragSlotId = null;
    this.activeDragVisual = undefined;
    this.activeDragPointerId = null;
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

  private mergeSlots(sourceSlotId: number, targetSlotId: number): void {
    const nextMonsterDefinition = getMonsterMergeResult(
      this.farmSlots[sourceSlotId]?.monster,
      this.farmSlots[targetSlotId]?.monster,
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
    this.showMergeFeedback(targetSlotId, nextMonsterDefinition.family === 'Spore' ? this.t('toast.fusion') : this.t('toast.merge'));
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
    this.claimedExpeditionIds = getSanitizedClaimedExpeditionIdsFromState(saveData.claimedExpeditionIds, EXPEDITION_IDS);
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

    writeSaveData(createLocalSaveData({
      version: SAVE_VERSION,
      coins: this.sanitizeCoins(this.currency.coins),
      farmSlots: this.farmSlots,
      lastActiveAt: Date.now(),
      discoveredMonsters: this.discoveredMonsters,
      upgrades: this.getSanitizedUpgradeLevels(),
      monsterEssence: sanitizePrestigeIntegerState(this.monsterEssence),
      essencePowerLevel: sanitizePrestigeIntegerState(this.essencePowerLevel),
      currentEggCost: this.sanitizeEggCost(this.currentEggCost),
      onboardingHintsSeen: this.onboardingHintsSeen,
      expansionUnlocked: this.expansionUnlocked,
      missionProgress: this.getSanitizedMissionProgress(),
      completedMissionIds: this.completedMissionIds,
      claimedMissionIds: this.claimedMissionIds,
      claimedOrderIds: this.claimedOrderIds,
      claimedExpeditionIds: this.claimedExpeditionIds,
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
    this.safeRitualUsedThisSession = false;
    this.safeRitualInProgress = false;
    this.discoveredMonsters = new Set<DiscoveryKey>();
    this.onboardingHintsSeen = new Set<OnboardingHintId>();
    this.upgradeLevels = this.createInitialUpgradeLevels();
    this.missionProgress = this.createInitialMissionProgress();
    this.completedMissionIds = new Set<MissionId>();
    this.claimedMissionIds = new Set<MissionId>();
    this.claimedOrderIds = new Set<OrderId>();
    this.claimedExpeditionIds = new Set<ExpeditionId>();
    this.unlockedZones = createInitialUnlockedZones(GRASS_FARM_ZONE_ID);
    this.currentZone = GRASS_FARM_ZONE_ID;
    this.hasPrestigedOnce = false;
    this.monsterEssence = 0;
    this.essencePowerLevel = 0;
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
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeOrdersPanel();
    this.closeExpeditionPanel();
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeNavigationMenuPanel();
    this.closeEconomyDebugPanel();
    this.updateHatchCooldownUi();
    this.updateTapFarmUi();
    this.updateHud();
  }

  private registerPersistenceEvents(): void {
    window.addEventListener('pagehide', this.handlePageHide);
    window.addEventListener('beforeunload', this.handlePageHide);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.saveProgress();
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
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    });
  }

  private hasAnyProgress(): boolean {
    return (
      this.currency.coins !== STARTING_COINS
      || this.currentEggCost !== STARTING_EGG_COST
      || this.monsterEssence > 0
      || this.essencePowerLevel > 0
      || this.expansionUnlocked
      || this.hasPrestigedOnce
      || this.currentZone !== GRASS_FARM_ZONE_ID
      || this.unlockedZones.size > 1
      || this.completedMissionIds.size > 0
      || this.claimedMissionIds.size > 0
      || this.claimedOrderIds.size > 0
      || this.claimedExpeditionIds.size > 0
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
      this.essencePowerLevel,
      this.getUpgradeLevel('fusion-power'),
    );
  }

  private getEffectiveMonsterIncome(monster: MonsterInstance | null | undefined): number {
    return getEffectiveMonsterIncome(
      monster,
      this.getUpgradeLevel('slime-income-boost'),
      this.getUpgradeLevel('mushroom-income-boost'),
      this.essencePowerLevel,
      this.getUpgradeLevel('fusion-power'),
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
