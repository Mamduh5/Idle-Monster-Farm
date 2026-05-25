import Phaser from 'phaser';
import { EGG_COST_MULTIPLIER, EXPANSION_UNLOCK_COST, STARTING_EGG_COST } from '../data/economy';
import { MISSION_DEFINITIONS, type MissionDefinition, type MissionId, type MissionReward } from '../data/missions';
import {
  BABY_SLIME,
  BUTTON_MUSHROOM,
  getMonsterDefinition,
  getNextMonsterDefinition,
  MONSTER_DEFINITIONS,
} from '../data/monsters';
import {
  getUpgradeCost,
  UPGRADE_DEFINITIONS,
  type UpgradeDefinition,
  type UpgradeId,
} from '../data/upgrades';
import {
  GRASS_FARM_ZONE_ID,
  MUSHROOM_FOREST_ZONE_ID,
  ZONE_DEFINITIONS,
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
import { audioSystem } from '../systems/audioSystem';
import { loadSettings, writeSettings, type GameSettings } from '../systems/settingsSystem';
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
const MAX_OFFLINE_SECONDS = 7200;
const HATCH_COOLDOWN_MS = 3000;
const BASE_MUSHROOM_HATCH_CHANCE = 0.2;
const MUSHROOM_FOREST_HATCH_CHANCE_BONUS = 0.05;
const MUSHROOM_HATCH_CHANCE_PER_LEVEL = 0.04;
const HATCH_PROGRESS_WIDTH = 142;
const STARTING_COINS = STARTING_EGG_COST;
const MIN_HATCH_COOLDOWN_MS = 1200;
const SLIME_INCOME_BOOST_PER_LEVEL = 0.2;
const MUSHROOM_INCOME_BOOST_PER_LEVEL = 0.22;
const ESSENCE_POWER_INCOME_BOOST_PER_LEVEL = 0.15;
const ESSENCE_POWER_COST = 1;
const HATCH_SPEED_REDUCTION_PER_LEVEL = 0.07;
const OFFLINE_STORAGE_SECONDS_PER_LEVEL = 1800;
const COIN_BUG_SPAWN_MIN_MS = 20_000;
const COIN_BUG_SPAWN_MAX_MS = 35_000;
const COIN_BUG_MIN_LIFETIME_MS = 8_000;
const COIN_BUG_MAX_LIFETIME_MS = 12_000;
const COIN_BUG_MAX_ACTIVE = 3;
const COIN_BUG_REWARD_SECONDS = 10;
const COIN_BUG_MIN_REWARD = 25;
const COIN_BUG_HITBOX_SIZE = 56;
const SHOW_DEBUG_PANEL = false;
const SHOW_MONSTER_HITBOX_DEBUG = false;
const MODAL_OVERLAY_DEPTH = 18;
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

type MonsterVisual = Phaser.GameObjects.Container;
type MonsterDragZone = Phaser.GameObjects.Zone;
type MonsterVisualStyle = {
  bodyColor: number;
  baseColor: number;
  strokeColor: number;
  accentColor: number;
  secondaryAccentColor: number;
  bodyWidth: number;
  bodyHeight: number;
  silhouetteVariant: string;
  patternVariant: string;
  accessories: string[];
  auraType: string;
  visualIntensity: MonsterVisualIntensity;
  stemColor?: number;
  stemStrokeColor?: number;
};
type MonsterVisualIdentity = MonsterVisualStyle & {
  family: MonsterFamily;
  level: number;
};
type MonsterVisualIntensity = {
  tier: number;
  glowAlpha: number;
  glowScale: number;
  outlineWidth: number;
  detailScale: number;
  sparkleCount: number;
};
type DiscoveryKey = `${MonsterFamily}:${number}`;
type ToastVariant = 'info' | 'success' | 'warning';
type UiLayoutMode = 'mobile' | 'desktop';
type ModalKind = 'compendium' | 'upgrade-shop' | 'goals' | 'default';
type MenuButtonVisual = {
  text: Phaser.GameObjects.Text;
  defaultBackgroundColor: string;
};
type NavigationMenuItem = {
  label: string;
  openPanel: () => void;
};
type CompendiumListItem =
  | {
    type: 'family';
    family: MonsterFamily;
  }
  | {
    type: 'monster';
    monster: MonsterDefinition;
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
  menuX: number;
  menuY: number;
  menuGap: number;
  menuFontSize: string;
  bottomSafePadding: number;
  expansionLabelY: number;
  expansionStartX: number;
  expansionStartY: number;
  hatchX: number;
  hatchY: number;
  hatchWidth: number;
  hatchHeight: number;
};

export class FarmScene extends Phaser.Scene {
  private currency: CurrencyState = {
    coins: STARTING_COINS,
  };

  private coinText?: Phaser.GameObjects.Text;
  private incomeText?: Phaser.GameObjects.Text;
  private productionStatsText?: Phaser.GameObjects.Text;
  private backgroundContainer?: Phaser.GameObjects.Container;
  private farmGridContainer?: Phaser.GameObjects.Container;
  private hudContainer?: Phaser.GameObjects.Container;
  private expansionContainer?: Phaser.GameObjects.Container;
  private hatchContainer?: Phaser.GameObjects.Container;
  private menuControlsContainer?: Phaser.GameObjects.Container;
  private toastContainer?: Phaser.GameObjects.Container;
  private toastTween?: Phaser.Tweens.Tween;
  private activeCoinBugs: CoinBug[] = [];
  private farmSlots: FarmSlotState[] = [];
  private slotCenters: Phaser.Math.Vector2[] = [];
  private monsterVisuals: Array<MonsterVisual | null> = [];
  private monsterDragZones: Array<MonsterDragZone | null> = [];
  private hatchCooldownMs = HATCH_COOLDOWN_MS;
  private hatchLabelText?: Phaser.GameObjects.Text;
  private hatchStatusText?: Phaser.GameObjects.Text;
  private hatchProgressFill?: Phaser.GameObjects.Rectangle;
  private hatchPanel?: Phaser.GameObjects.Rectangle;
  private menuButtons: MenuButtonVisual[] = [];
  private hatchProgressWidth = HATCH_PROGRESS_WIDTH;
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
  private upgradeShopPanel?: Phaser.GameObjects.Container;
  private prestigePanel?: Phaser.GameObjects.Container;
  private navigationMenuPanel?: Phaser.GameObjects.Container;
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
  private unlockedZones = new Set<ZoneId>([GRASS_FARM_ZONE_ID]);
  private currentZone: ZoneId = GRASS_FARM_ZONE_ID;
  private hasPrestigedOnce = false;
  private settings: GameSettings = loadSettings();
  private resetConfirmationArmed = false;
  private prestigeConfirmationArmed = false;
  private compendiumPageIndex = 0;
  private upgradeShopPageIndex = 0;
  private missionsPageIndex = 0;
  private lastBlockedOutsideTapToastAt = 0;
  private lastHiddenAt: number | null = null;
  private nextCoinBugId = 1;
  private coinBugSpawnAccumulatorMs = 0;
  private nextCoinBugSpawnMs = 0;

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

  private readonly handleScaleResize = (): void => {
    this.rebuildResponsiveFarmView();
  };

  constructor() {
    super('FarmScene');
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
    this.upgradeShopPanel = undefined;
    this.prestigePanel = undefined;
    this.navigationMenuPanel = undefined;
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
    this.unlockedZones = new Set<ZoneId>([GRASS_FARM_ZONE_ID]);
    this.currentZone = GRASS_FARM_ZONE_ID;
    this.hasPrestigedOnce = false;
    this.settings = loadSettings();
    this.syncAudioSettings();
    this.resetConfirmationArmed = false;
    this.prestigeConfirmationArmed = false;
    this.compendiumPageIndex = 0;
    this.upgradeShopPageIndex = 0;
    this.missionsPageIndex = 0;
    this.lastBlockedOutsideTapToastAt = 0;
    this.lastHiddenAt = null;
    this.nextCoinBugId = 1;
    this.coinBugSpawnAccumulatorMs = 0;
    this.nextCoinBugSpawnMs = this.getNextCoinBugSpawnDelayMs();
    this.validateMonsterVisualIdentities();
    this.clearCoinBugs();
    this.hatchCooldownMs = HATCH_COOLDOWN_MS;
    this.hatchLabelText = undefined;
    this.hatchStatusText = undefined;
    this.hatchProgressFill = undefined;
    this.hatchPanel = undefined;
    this.backgroundContainer = undefined;
    this.farmGridContainer = undefined;
    this.hudContainer = undefined;
    this.expansionContainer = undefined;
    this.hatchContainer = undefined;
    this.menuControlsContainer = undefined;
    this.menuButtons = [];
    this.productionStatsText = undefined;
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
    this.createHatchArea();
    this.createNavigationControl();
    this.createEconomyDebugControl();
    this.registerKeyboardShortcuts();
    this.registerManualDragInput();
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
    this.createHatchArea();
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
    const topContentBottom = isNarrow ? Math.max(statsY + statsHeight, menuBottom) : 126;
    const hatchWidth = Math.min(260, width - margin * 2);
    const hatchHeight = 76;
    const bottomSafePadding = isNarrow ? (height < 700 ? 24 : 18) : 18;
    const hatchX = isNarrow ? (width - hatchWidth) / 2 : width - hatchWidth - margin;
    const hatchY = height - hatchHeight - bottomSafePadding;
    const gridTopGap = isNarrow ? (height < 680 ? 6 : 10) : 0;
    const gridToExpansionLabelGap = isNarrow ? (height < 680 ? 8 : 12) : 20;
    const expansionLabelToRowGap = isNarrow ? (height < 680 ? 18 : 24) : 34;
    const expansionToHatchGap = isNarrow ? (height < 680 ? 8 : 12) : 12;
    const minGridStartY = topContentBottom + gridTopGap;
    const widthLimitedCellSize = Math.floor((width - margin * 2 - (GRID_COLUMNS - 1) * gridGap) / GRID_COLUMNS);
    const availableStackHeight = Math.max(0, hatchY - minGridStartY);
    const heightLimitedCellSize = Math.floor(
      (
        availableStackHeight
        - (GRID_ROWS - 1) * gridGap
        - gridToExpansionLabelGap
        - expansionLabelToRowGap
        - expansionToHatchGap
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
    const maxGridStartY = hatchY - gridHeight - expansionHeight - expansionToHatchGap;
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
      menuX,
      menuY,
      menuGap,
      menuFontSize: isNarrow ? '13px' : '15px',
      bottomSafePadding,
      expansionLabelY,
      expansionStartX: (width - gridWidth) / 2,
      expansionStartY,
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
      expansionContainer.add(this.add.text(this.scale.width / 2, labelY, 'Expansion Slots', {
        color: '#d9d6ec',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.isNarrow ? '14px' : '16px',
        fontStyle: 'bold',
      }).setOrigin(0.5));
    } else {
      const unlockText = this.add.text(this.scale.width / 2, labelY, `Unlock +3 slots - ${this.formatCoinAmount(EXPANSION_UNLOCK_COST)}`, {
        color: THEME.text,
        fontFamily: 'Arial, sans-serif',
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

    container.add(this.add.text(x + this.cellSize / 2, y + this.cellSize / 2 - 8, 'LOCK', {
      color: '#d1d9d2',
      fontFamily: 'Arial, sans-serif',
      fontSize: isNarrow ? '12px' : '14px',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    container.add(this.add.text(x + this.cellSize / 2, y + this.cellSize / 2 + 13, this.formatCoinAmount(EXPANSION_UNLOCK_COST), {
      color: '#fff4a8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
    }).setOrigin(0.5));
  }

  private createHud(): void {
    this.hudContainer?.destroy();

    const layout = this.getLayout();
    const coinFontSize = layout.isNarrow ? '18px' : '24px';
    const productionTitleFontSize = layout.isNarrow ? '15px' : '16px';
    const productionTextFontSize = layout.isNarrow ? '12px' : '14px';
    const productionLineSpacing = layout.isNarrow ? 2 : 5;
    const hudContainer = this.add.container(0, 0);

    hudContainer.add(this.add.rectangle(layout.hudX + 3, layout.hudY + 4, layout.hudWidth, layout.hudHeight, THEME.shadow, 0.25)
      .setOrigin(0));

    hudContainer.add(this.add.rectangle(layout.hudX, layout.hudY, layout.hudWidth, layout.hudHeight, THEME.panel, 0.86)
      .setOrigin(0)
      .setStrokeStyle(2, THEME.panelBorder, 0.72));

    this.coinText = this.add.text(layout.hudX + 18, layout.hudY + 10, `Coins: ${this.currency.coins}`, {
      color: THEME.goldText,
      fontFamily: 'Arial, sans-serif',
      fontSize: coinFontSize,
      fontStyle: 'bold',
      fixedWidth: layout.hudWidth - 30,
    });
    hudContainer.add(this.coinText);

    this.incomeText = this.add.text(layout.hudX + 18, layout.hudY + (layout.isNarrow ? 36 : 39), '+0/sec', {
      color: '#d9f6ba',
      fontFamily: 'Arial, sans-serif',
      fontSize: layout.isNarrow ? '13px' : '15px',
      fontStyle: 'bold',
      fixedWidth: layout.hudWidth - 30,
    });
    hudContainer.add(this.incomeText);

    hudContainer.add(this.add.rectangle(layout.statsX + 3, layout.statsY + 4, layout.statsWidth, layout.statsHeight, THEME.shadow, 0.2)
      .setOrigin(0));

    hudContainer.add(this.add.rectangle(layout.statsX, layout.statsY, layout.statsWidth, layout.statsHeight, THEME.panel, 0.8)
      .setOrigin(0)
      .setStrokeStyle(2, THEME.slot, 0.62));

    hudContainer.add(this.add.text(layout.statsX + 18, layout.statsY + 9, 'Production', {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: productionTitleFontSize,
      fontStyle: 'bold',
    }));

    this.productionStatsText = this.add.text(layout.statsX + 18, layout.statsY + 32, '', {
      color: THEME.mutedText,
      fontFamily: 'Arial, sans-serif',
      fontSize: productionTextFontSize,
      lineSpacing: productionLineSpacing,
      fixedWidth: layout.statsWidth - 30,
      wordWrap: {
        width: layout.statsWidth - 30,
      },
    });
    hudContainer.add(this.productionStatsText);

    this.hudContainer = hudContainer;
  }

  private createHatchArea(): void {
    this.hatchContainer?.destroy();

    const layout = this.getLayout();
    const panelWidth = layout.hatchWidth;
    const panelHeight = layout.hatchHeight;
    const x = layout.hatchX;
    const y = layout.hatchY;
    const eggX = x + Math.min(48, panelWidth * 0.19);
    const textX = x + Math.min(88, panelWidth * 0.34);
    const hatchContainer = this.add.container(0, 0);

    hatchContainer.add(this.add.rectangle(x + 4, y + 5, panelWidth, panelHeight, THEME.shadow, 0.35)
      .setOrigin(0));

    const hatchPanel = this.add.rectangle(x, y, panelWidth, panelHeight, 0x49395d, 0.92)
      .setOrigin(0)
      .setStrokeStyle(3, THEME.panelBorder, 0.9);
    this.hatchPanel = hatchPanel;
    hatchContainer.add(hatchPanel);

    hatchPanel
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.isModalOpen()) {
          return;
        }

        this.playButtonClickSound();
        this.hatchMonster();
      })
      .on('pointerover', () => {
        if (this.isModalOpen()) {
          this.resetFarmControlHoverState();
          return;
        }

        hatchPanel.setFillStyle(0x58456f, 0.96);
      })
      .on('pointerout', () => {
        hatchPanel.setFillStyle(0x49395d, 0.92);
      });

    hatchContainer.add(this.add.ellipse(eggX + 2, y + 40, 44, 56, THEME.shadow, 0.2));
    hatchContainer.add(this.add.ellipse(eggX, y + 38, 44, 56, 0xffe7a8)
      .setStrokeStyle(3, 0x9f6a2a, 0.95));
    hatchContainer.add(this.add.ellipse(eggX - 8, y + 29, 12, 18, 0xffffff, 0.35));

    this.hatchLabelText = this.add.text(textX, y + 16, 'Hatch Egg', {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: layout.isNarrow ? '21px' : '24px',
      fontStyle: 'bold',
      fixedWidth: panelWidth - (textX - x) - 16,
    });
    hatchContainer.add(this.hatchLabelText);

    this.hatchStatusText = this.add.text(textX, y + 44, 'Ready', {
      color: '#d9d6ec',
      fontFamily: 'Arial, sans-serif',
      fontSize: layout.isNarrow ? '12px' : '14px',
      fixedWidth: panelWidth - (textX - x) - 16,
      wordWrap: {
        width: panelWidth - (textX - x) - 16,
      },
    });
    hatchContainer.add(this.hatchStatusText);

    this.hatchProgressWidth = Math.min(HATCH_PROGRESS_WIDTH, panelWidth - (textX - x) - 18);

    hatchContainer.add(this.add.rectangle(textX, y + 61, this.hatchProgressWidth, 8, 0x17152a, 0.9)
      .setOrigin(0)
      .setStrokeStyle(1, 0xf3d06b, 0.55));

    this.hatchProgressFill = this.add.rectangle(textX, y + 61, this.hatchProgressWidth, 8, 0x8ecf62, 0.95)
      .setOrigin(0);
    hatchContainer.add(this.hatchProgressFill);

    this.hatchContainer = hatchContainer;

    this.updateHatchCooldownUi();
  }

  private createNavigationControl(): void {
    this.menuControlsContainer?.destroy();
    this.menuControlsContainer = this.add.container(0, 0);
    this.menuButtons = [];

    this.createMenuButton('Menu', 0, () => {
      this.toggleNavigationMenuPanel();
    });
  }

  private createEconomyDebugControl(): void {
    if (!SHOW_DEBUG_PANEL) {
      return;
    }

    this.createMenuButton('Debug (D)', 1, () => {
      this.toggleEconomyDebugPanel();
    }, `#${THEME.buttonWarm.toString(16).padStart(6, '0')}`);
  }

  private createMenuButton(
    label: string,
    index: number,
    onClick: () => void,
    backgroundColor = `#${THEME.button.toString(16).padStart(6, '0')}`,
  ): void {
    const layout = this.getLayout();
    const button = this.add.text(layout.menuX, layout.menuY + index * layout.menuGap, label, {
      color: '#f7ffe8',
      fontFamily: 'Arial, sans-serif',
      fontSize: layout.menuFontSize,
      fontStyle: 'bold',
      backgroundColor,
      padding: {
        x: 10,
        y: 6,
      },
    }).setOrigin(1, 0);

    this.menuButtons.push({
      text: button,
      defaultBackgroundColor: backgroundColor,
    });
    this.menuControlsContainer?.add(button);

    button
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        if (this.isModalOpen()) {
          this.resetFarmControlHoverState();
          return;
        }

        button.setBackgroundColor(`#${THEME.buttonHover.toString(16).padStart(6, '0')}`);
      })
      .on('pointerout', () => {
        button.setBackgroundColor(backgroundColor);
      })
      .on('pointerdown', () => {
        if (this.isModalOpen()) {
          return;
        }

        this.playButtonClickSound();
        onClick();
      });
  }

  private toggleNavigationMenuPanel(): void {
    if (this.navigationMenuPanel) {
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
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const layout = this.getLayout();
    const preferredPanelWidth = layout.isNarrow ? 260 : 280;
    const preferredPanelHeight = 358;
    const { width: panelWidth, height: panelHeight } = this.getPanelSize(preferredPanelWidth, preferredPanelHeight);
    const panelX = layout.isNarrow
      ? Math.min(this.scale.width - layout.margin - panelWidth / 2, Math.max(layout.margin + panelWidth / 2, layout.menuX - panelWidth / 2))
      : this.scale.width - layout.margin - panelWidth / 2;
    const panelY = Math.min(
      this.scale.height - layout.margin - panelHeight / 2,
      layout.menuY + 42 + panelHeight / 2,
    );
    const panel = this.add.container(panelX, panelY);

    panel.setDepth(26);
    this.addPanelBackground(panel, panelWidth, panelHeight);

    panel.add(this.add.text(-panelWidth / 2 + 22, -panelHeight / 2 + 18, 'Menu', {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: this.getPanelTitleFontSize(panelWidth, 23),
      fontStyle: 'bold',
    }));

    const closeText = this.add.text(panelWidth / 2 - 20, -panelHeight / 2 + 20, 'Close', {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      backgroundColor: '#49395d',
      padding: {
        x: 9,
        y: 5,
      },
    }).setOrigin(1, 0);

    closeText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        this.playButtonClickSound();
        this.closeNavigationMenuPanel();
      });

    panel.add(closeText);

    const menuItems: NavigationMenuItem[] = [
      { label: 'Upgrades', openPanel: () => this.openUpgradeShopPanel() },
      { label: 'Goals', openPanel: () => this.openMissionsPanel() },
      { label: 'Prestige', openPanel: () => this.openPrestigePanel() },
      { label: 'Zone', openPanel: () => this.openZonePanel() },
      { label: 'Compendium', openPanel: () => this.openCompendiumPanel() },
      { label: 'Help', openPanel: () => this.openHelpPanel() },
      { label: 'Settings', openPanel: () => this.openSettingsPanel() },
    ];

    const itemWidth = panelWidth - 42;
    const itemHeight = 32;
    const itemGap = 8;
    const firstItemY = -panelHeight / 2 + 72;

    menuItems.forEach((item, index) => {
      this.addNavigationMenuItem(
        panel,
        item,
        -panelWidth / 2 + 21,
        firstItemY + index * (itemHeight + itemGap),
        itemWidth,
        itemHeight,
      );
    });

    this.navigationMenuPanel = panel;
  }

  private addNavigationMenuItem(
    panel: Phaser.GameObjects.Container,
    item: NavigationMenuItem,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const itemBackground = this.add.rectangle(x, y, width, height, THEME.button, 0.96)
      .setOrigin(0)
      .setStrokeStyle(1, THEME.panelBorder, 0.34)
      .setInteractive({ useHandCursor: true });
    const itemLabel = this.add.text(x + 14, y + height / 2, item.label, {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    itemBackground
      .on('pointerover', () => {
        itemBackground.setFillStyle(THEME.buttonHover, 0.98);
      })
      .on('pointerout', () => {
        itemBackground.setFillStyle(THEME.button, 0.96);
      })
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        this.playButtonClickSound();
        this.closeNavigationMenuPanel();
        item.openPanel();
      });

    panel.add([itemBackground, itemLabel]);
  }

  private closeNavigationMenuPanel(): void {
    if (this.navigationMenuPanel) {
      this.navigationMenuPanel.destroy();
      this.navigationMenuPanel = undefined;
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

  private getPanelSize(preferredWidth: number, preferredHeight: number): { width: number; height: number } {
    return {
      width: Math.min(preferredWidth, this.scale.width - 24),
      height: Math.min(preferredHeight, this.scale.height - 24),
    };
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
      const isListModal = kind === 'compendium' || kind === 'upgrade-shop' || kind === 'goals';
      const mobileMaxWidth = isListModal ? 390 : preferredWidth;

      return {
        width: Math.min(mobileMaxWidth, this.scale.width - inset * 2),
        height: isListModal
          ? this.scale.height - inset * 2
          : Math.min(preferredHeight, this.scale.height - inset * 2),
      };
    }

    const inset = 36;

    return {
      width: Math.min(preferredWidth, this.scale.width - inset * 2),
      height: Math.min(preferredHeight, this.scale.height - inset * 2),
    };
  }

  private getPanelTitleFontSize(panelWidth: number, desktopSize = 24): string {
    return `${panelWidth < 390 ? Math.min(desktopSize, 21) : desktopSize}px`;
  }

  private addPanelBackground(
    panel: Phaser.GameObjects.Container,
    width: number,
    height: number,
    fill = THEME.panel,
    border = THEME.panelBorder,
  ): Phaser.GameObjects.Rectangle {
    panel.add(this.add.rectangle(4, 5, width, height, THEME.shadow, 0.25));

    const panelBackground = this.add.rectangle(0, 0, width, height, fill, 0.97)
      .setStrokeStyle(3, border, 0.78)
      .setInteractive();

    panelBackground.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
    });

    panel.add(panelBackground);

    return panelBackground;
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

  private addPaginationControls(
    panel: Phaser.GameObjects.Container,
    panelWidth: number,
    panelHeight: number,
    pageIndex: number,
    pageCount: number,
    onPageChange: (nextPageIndex: number) => void,
  ): void {
    if (pageCount <= 1) {
      return;
    }

    const y = panelHeight / 2 - 32;
    const previousText = this.add.text(-panelWidth / 2 + 24, y, 'Prev', {
      color: pageIndex > 0 ? THEME.text : '#9ca79f',
      fontFamily: 'Arial, sans-serif',
      fontSize: panelWidth < 390 ? '14px' : '15px',
      fontStyle: 'bold',
      backgroundColor: `#${(pageIndex > 0 ? THEME.button : THEME.lockedInner).toString(16).padStart(6, '0')}`,
      padding: {
        x: panelWidth < 390 ? 13 : 15,
        y: 7,
      },
    }).setOrigin(0, 0.5);

    if (pageIndex > 0) {
      previousText
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          pointer.event?.stopPropagation();
          this.playButtonClickSound();
          onPageChange(pageIndex - 1);
        });
    }

    const nextText = this.add.text(panelWidth / 2 - 24, y, 'Next', {
      color: pageIndex < pageCount - 1 ? THEME.text : '#9ca79f',
      fontFamily: 'Arial, sans-serif',
      fontSize: panelWidth < 390 ? '14px' : '15px',
      fontStyle: 'bold',
      backgroundColor: `#${(pageIndex < pageCount - 1 ? THEME.button : THEME.lockedInner).toString(16).padStart(6, '0')}`,
      padding: {
        x: panelWidth < 390 ? 13 : 15,
        y: 7,
      },
    }).setOrigin(1, 0.5);

    if (pageIndex < pageCount - 1) {
      nextText
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          pointer.event?.stopPropagation();
          this.playButtonClickSound();
          onPageChange(pageIndex + 1);
        });
    }

    const pageLabel = this.add.text(0, y, `${pageIndex + 1}/${pageCount}`, {
      color: THEME.mutedText,
      fontFamily: 'Arial, sans-serif',
      fontSize: panelWidth < 390 ? '13px' : '14px',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    panel.add([previousText, nextText, pageLabel]);
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
      || this.upgradeShopPanel
      || this.prestigePanel
      || this.navigationMenuPanel
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

    if (this.helpPanel) {
      this.closeHelpPanel();
      return;
    }

    if (this.compendiumPanel) {
      this.closeCompendiumPanel();
      return;
    }

    if (this.navigationMenuPanel) {
      this.closeNavigationMenuPanel();
    }
  }

  private showBlockedOutsideTapToast(): void {
    if (this.time.now - this.lastBlockedOutsideTapToastAt < 1400) {
      return;
    }

    this.lastBlockedOutsideTapToastAt = this.time.now;
    this.showToast('Use Close or confirm', 'warning');
  }

  private setModalOpenVisualState(isOpen: boolean): void {
    this.resetFarmControlHoverState();
    this.hatchPanel?.setAlpha(isOpen ? 0.82 : 1);

    this.menuButtons.forEach(({ text }) => {
      text.setAlpha(isOpen ? 0.72 : 1);
    });
  }

  private resetFarmControlHoverState(): void {
    this.hatchPanel?.setFillStyle(0x49395d, 0.92);

    this.menuButtons.forEach(({ text, defaultBackgroundColor }) => {
      text.setBackgroundColor(defaultBackgroundColor);
    });
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
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = this.getPanelSize(360, 320);

    panel.setDepth(25);

    this.addPanelBackground(panel, panelWidth, panelHeight);

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 20, 'Settings', {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: this.getPanelTitleFontSize(panelWidth),
      fontStyle: 'bold',
    }));

    const closeText = this.add.text(panelWidth / 2 - 24, -panelHeight / 2 + 22, 'Close', {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      backgroundColor: '#49395d',
      padding: {
        x: 9,
        y: 5,
      },
    }).setOrigin(1, 0);

    closeText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.playButtonClickSound();
        this.closeSettingsPanel();
      });

    panel.add(closeText);

    this.addSettingsToggle(panel, 'Music', this.settings.musicEnabled, -70, () => {
      this.settings.musicEnabled = !this.settings.musicEnabled;
      writeSettings(this.settings);
      this.syncAudioSettings();
      this.openSettingsPanel();
      this.showToast(this.settings.musicEnabled ? 'Music on' : 'Music off', this.settings.musicEnabled ? 'success' : 'info');
    });

    this.addSettingsToggle(panel, 'Sound', this.settings.soundEnabled, -18, () => {
      this.settings.soundEnabled = !this.settings.soundEnabled;
      writeSettings(this.settings);
      this.syncAudioSettings();
      this.openSettingsPanel();
      this.showToast(this.settings.soundEnabled ? 'Sound on' : 'Sound off', this.settings.soundEnabled ? 'success' : 'info');
    });

    this.addSettingsToggle(panel, 'Outside tap', this.settings.outsideTapClosesPanels, 34, () => {
      this.settings.outsideTapClosesPanels = !this.settings.outsideTapClosesPanels;
      writeSettings(this.settings);
      this.openSettingsPanel();
      this.showToast(
        this.settings.outsideTapClosesPanels ? 'Outside tap close on' : 'Outside tap close off',
        this.settings.outsideTapClosesPanels ? 'success' : 'info',
      );
    });

    panel.add(this.add.text(-132, 52, 'closes panels', {
      color: THEME.mutedText,
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
    }));

    const resetText = this.add.text(0, 116, this.resetConfirmationArmed ? 'Click again to confirm reset' : 'Reset Save', {
      color: this.resetConfirmationArmed ? '#fff4a8' : '#ffffff',
      fontFamily: 'Arial, sans-serif',
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
        this.showToast('Progress reset', 'success');
      });

    panel.add(resetText);
    this.settingsPanel = panel;
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
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
    }));

    const toggleColor = isEnabled ? THEME.buttonHover : THEME.danger;
    const toggleText = this.add.text(132, y - 14, isEnabled ? 'ON' : 'OFF', {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
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
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = this.getPanelSize(500, 390);

    panel.setDepth(26);

    this.addPanelBackground(panel, panelWidth, panelHeight);

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 20, 'Help', {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: this.getPanelTitleFontSize(panelWidth),
      fontStyle: 'bold',
    }));

    const closeText = this.add.text(panelWidth / 2 - 24, -panelHeight / 2 + 22, 'Close', {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      backgroundColor: '#49395d',
      padding: {
        x: 9,
        y: 5,
      },
    }).setOrigin(1, 0);

    closeText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.playButtonClickSound();
        this.closeHelpPanel();
      });

    panel.add(closeText);

    const helpLines = [
      ['Hatch Egg', 'Click/tap Hatch Egg when ready.'],
      ['Drag-to-merge', 'Drag matching same-family, same-level monsters onto each other.'],
      ['Monster info', 'Click/tap a monster to show its tooltip.'],
      ['Compendium', 'Open Menu or press C.'],
      ['Settings', 'Open Menu or press S.'],
    ];

    const lineGap = panelWidth < 420 ? 52 : 44;

    helpLines.forEach(([label, description], index) => {
      this.addHelpLine(panel, label, description, -panelHeight / 2 + 82 + index * lineGap, panelWidth);
    });

    const resetHintsText = this.add.text(0, panelHeight / 2 - 30, 'Reset hints', {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
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
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5));

    panel.add(this.add.text(descriptionX, y, description, {
      color: '#f7ffe8',
      fontFamily: 'Arial, sans-serif',
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
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = this.getPanelSize(460, 360);
    const firstRowY = -panelHeight / 2 + 104;
    const rowGap = Math.min(96, Math.max(78, (panelHeight - 128) / ZONE_DEFINITIONS.length));
    const rowHeight = Math.min(84, rowGap - 8);

    panel.setDepth(24);
    this.addPanelBackground(panel, panelWidth, panelHeight);

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 20, 'Zone', {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: this.getPanelTitleFontSize(panelWidth),
      fontStyle: 'bold',
    }));

    const closeText = this.add.text(panelWidth / 2 - 24, -panelHeight / 2 + 22, 'Close', {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      backgroundColor: '#49395d',
      padding: {
        x: 9,
        y: 5,
      },
    }).setOrigin(1, 0);

    closeText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.playButtonClickSound();
        this.closeZonePanel();
      });

    panel.add(closeText);

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
    const isUnlocked = this.unlockedZones.has(zone.id);
    const isCurrent = this.currentZone === zone.id;
    const canSelect = isUnlocked && !isCurrent;
    const rowTop = rowY - rowHeight / 2;
    const statusText = isCurrent
      ? 'Selected'
      : isUnlocked
        ? 'Unlocked'
        : 'Locked - Prestige once';
    const bonusText = zone.id === MUSHROOM_FOREST_ZONE_ID
      ? `Mushroom hatch +${Math.round(MUSHROOM_FOREST_HATCH_CHANCE_BONUS * 100)}%`
      : 'Default farm';

    panel.add(this.add.rectangle(0, rowY, panelWidth - 48, rowHeight, isUnlocked ? THEME.panelAlt : 0x29362f, 0.92)
      .setStrokeStyle(2, isCurrent ? THEME.panelBorder : canSelect ? THEME.slot : THEME.lockedBorder, 0.78));

    panel.add(this.add.text(-panelWidth / 2 + 42, rowTop + 9, zone.name, {
      color: isUnlocked ? THEME.text : '#9ca79f',
      fontFamily: 'Arial, sans-serif',
      fontSize: isCompactPanel ? '15px' : '17px',
      fontStyle: 'bold',
    }));

    panel.add(this.add.text(-panelWidth / 2 + 42, rowTop + 33, statusText, {
      color: isUnlocked ? '#cdebb3' : THEME.mutedText,
      fontFamily: 'Arial, sans-serif',
      fontSize: isCompactPanel ? '12px' : '13px',
      wordWrap: {
        width: panelWidth - 170,
      },
    }));

    panel.add(this.add.text(-panelWidth / 2 + 42, rowTop + 51, bonusText, {
      color: zone.id === MUSHROOM_FOREST_ZONE_ID ? '#fff4a8' : THEME.mutedText,
      fontFamily: 'Arial, sans-serif',
      fontSize: isCompactPanel ? '11px' : '12px',
      wordWrap: {
        width: panelWidth - 170,
      },
    }));

    const actionText = this.add.text(panelWidth / 2 - 42, rowY, isCurrent ? 'Current' : isUnlocked ? 'Switch' : 'Locked', {
      color: isUnlocked ? '#ffffff' : '#9ca79f',
      fontFamily: 'Arial, sans-serif',
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
    if (!this.unlockedZones.has(zoneId) || this.currentZone === zoneId) {
      return;
    }

    this.currentZone = zoneId;
    this.createFarmBackground();
    this.updateHud();
    this.skipSavingUntilProgress = false;
    this.saveProgress();
    this.openZonePanel();
    this.showToast(`${this.getCurrentZoneDefinition().name} selected`, 'success');
  }

  private syncZoneUnlockFromPrestigeProgress(): void {
    if (this.hasPrestigedOnce || this.monsterEssence > 0 || this.essencePowerLevel > 0) {
      this.hasPrestigedOnce = true;
      this.unlockedZones.add(MUSHROOM_FOREST_ZONE_ID);
    }

    this.unlockedZones.add(GRASS_FARM_ZONE_ID);

    if (!this.unlockedZones.has(this.currentZone)) {
      this.currentZone = GRASS_FARM_ZONE_ID;
    }
  }

  private getCurrentZoneMushroomHatchBonus(): number {
    return this.currentZone === MUSHROOM_FOREST_ZONE_ID ? MUSHROOM_FOREST_HATCH_CHANCE_BONUS : 0;
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
    this.addPanelBackground(panel, panelWidth, panelHeight);

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 20, 'Goals', {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: this.getPanelTitleFontSize(panelWidth),
      fontStyle: 'bold',
    }));

    const closeText = this.add.text(panelWidth / 2 - 24, -panelHeight / 2 + 22, 'Close', {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      backgroundColor: '#49395d',
      padding: {
        x: 9,
        y: 5,
      },
    }).setOrigin(1, 0);

    closeText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.playButtonClickSound();
        this.closeMissionsPanel();
      });

    panel.add(closeText);

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
    const statusText = isClaimed ? 'Claimed' : isCompleted ? 'Complete' : `${progress}/${mission.goal}`;
    const detailText = `${statusText} - Reward: ${this.getMissionRewardText(mission.reward)}`;

    panel.add(this.add.rectangle(0, rowY, rowWidth, rowHeight, isClaimed ? 0x29362f : THEME.panelAlt, 0.92)
      .setStrokeStyle(2, canClaim ? THEME.slot : THEME.lockedBorder, 0.72));

    panel.add(this.add.text(-panelWidth / 2 + 42, rowTop + 7, mission.name, {
      color: isClaimed ? '#cdebb3' : THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: isCompactPanel ? '14px' : '16px',
      fontStyle: 'bold',
      wordWrap: {
        width: panelWidth - (isCompactPanel ? 150 : 176),
      },
    }));

    panel.add(this.add.text(-panelWidth / 2 + 42, rowTop + (isCompactPanel ? 28 : 30), detailText, {
      color: canClaim ? '#fff4a8' : THEME.mutedText,
      fontFamily: 'Arial, sans-serif',
      fontSize: isCompactPanel ? '12px' : '13px',
      wordWrap: {
        width: panelWidth - (isCompactPanel ? 150 : 176),
      },
    }));

    const actionText = this.add.text(panelWidth / 2 - 42, rowY, isClaimed ? 'Done' : canClaim ? 'Claim' : `${progress}/${mission.goal}`, {
      color: isClaimed ? '#cdebb3' : '#ffffff',
      fontFamily: 'Arial, sans-serif',
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
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.clearSelectedSlot();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = this.getPanelSize(390, 310);

    panel.setDepth(28);

    this.addPanelBackground(panel, panelWidth, panelHeight, 0x2f2818, THEME.panelBorder);

    panel.add(this.add.text(-panelWidth / 2 + 20, -panelHeight / 2 + 18, 'Economy Debug', {
      color: '#fff4a8',
      fontFamily: 'Arial, sans-serif',
      fontSize: this.getPanelTitleFontSize(panelWidth, 22),
      fontStyle: 'bold',
    }));

    panel.add(this.add.text(-panelWidth / 2 + 20, -panelHeight / 2 + 45, 'Development only', {
      color: '#d9d6ec',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
    }));

    const closeText = this.add.text(panelWidth / 2 - 20, -panelHeight / 2 + 20, 'Close', {
      color: '#f7ffe8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      backgroundColor: '#49395d',
      padding: {
        x: 9,
        y: 5,
      },
    }).setOrigin(1, 0);

    closeText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.playButtonClickSound();
        this.closeEconomyDebugPanel();
      });

    panel.add(closeText);

    this.economyDebugText = this.add.text(-panelWidth / 2 + 20, -panelHeight / 2 + 78, '', {
      color: '#f7ffe8',
      fontFamily: 'Consolas, monospace',
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
      `Egg cost: ${this.currentEggCost}`,
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
    this.closePrestigePanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = this.getModalSize('upgrade-shop', 640, 560);
    const rowGap = panelWidth < 500 ? 76 : 82;
    const rowHeight = Math.min(72, rowGap - 8);
    const firstRowY = -panelHeight / 2 + 100;
    const bodyHeight = panelHeight - 150;
    const rowsPerPage = this.getRowsPerPage(rowGap, bodyHeight, UPGRADE_DEFINITIONS.length, 5, 6);
    const pageCount = this.getPageCount(UPGRADE_DEFINITIONS.length, rowsPerPage);
    const pageIndex = Phaser.Math.Clamp(this.upgradeShopPageIndex, 0, pageCount - 1);
    const pageUpgrades = UPGRADE_DEFINITIONS.slice(pageIndex * rowsPerPage, (pageIndex + 1) * rowsPerPage);

    this.upgradeShopPageIndex = pageIndex;

    panel.setDepth(24);

    this.addPanelBackground(panel, panelWidth, panelHeight);

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 20, 'Upgrade Shop', {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: this.getPanelTitleFontSize(panelWidth),
      fontStyle: 'bold',
    }));

    const closeText = this.add.text(panelWidth / 2 - 24, -panelHeight / 2 + 22, 'Close', {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      backgroundColor: '#49395d',
      padding: {
        x: 9,
        y: 5,
      },
    }).setOrigin(1, 0);

    closeText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.playButtonClickSound();
        this.closeUpgradeShopPanel();
      });

    panel.add(closeText);

    pageUpgrades.forEach((upgrade, index) => {
      this.addUpgradeRow(panel, upgrade, firstRowY + index * rowGap, panelWidth, rowHeight);
    });

    this.addPaginationControls(panel, panelWidth, panelHeight, pageIndex, pageCount, (nextPageIndex) => {
      this.upgradeShopPageIndex = nextPageIndex;
      this.openUpgradeShopPanel();
    });

    this.upgradeShopPanel = panel;
    this.showOnboardingHint('upgrades', 'Upgrade Shop boosts your farm production.');
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
    const canAfford = this.currency.coins >= cost && !isMaxLevel;
    const rowTop = rowY - rowHeight / 2;

    panel.add(this.add.rectangle(0, rowY, panelWidth - 48, rowHeight, THEME.panelAlt, 0.92)
      .setStrokeStyle(2, canAfford ? THEME.slot : THEME.lockedBorder, 0.78));

    panel.add(this.add.text(-panelWidth / 2 + 42, rowTop + 8, upgrade.name, {
      color: '#f7ffe8',
      fontFamily: 'Arial, sans-serif',
      fontSize: isCompactPanel ? '15px' : '17px',
      fontStyle: 'bold',
      wordWrap: {
        width: isCompactPanel ? panelWidth - 170 : panelWidth - 210,
      },
    }));

    panel.add(this.add.text(-panelWidth / 2 + 42, rowTop + (isCompactPanel ? 29 : 31), `Level ${level}/${upgrade.maxLevel}`, {
      color: '#cdebb3',
      fontFamily: 'Arial, sans-serif',
      fontSize: isCompactPanel ? '13px' : '14px',
      fontStyle: 'bold',
    }));

    panel.add(this.add.text(
      -panelWidth / 2 + 42,
      rowTop + (isCompactPanel ? 49 : 52),
      isCompactPanel ? this.getUpgradeCurrentEffectText(upgrade.id) : `${upgrade.effect} - ${this.getUpgradeCurrentEffectText(upgrade.id)}`,
      {
      color: '#d9d6ec',
      fontFamily: 'Arial, sans-serif',
      fontSize: isCompactPanel ? '12px' : '13px',
      wordWrap: {
        width: isCompactPanel ? panelWidth - 160 : Math.max(170, panelWidth - 240),
      },
      },
    ));

    panel.add(this.add.text(panelWidth / 2 - 42, rowTop + 6, isMaxLevel ? 'Maxed' : `Cost: ${this.formatCoinAmount(cost)}`, {
      color: isMaxLevel ? '#cdebb3' : '#fff4a8',
      fontFamily: 'Arial, sans-serif',
      fontSize: isCompactPanel ? '13px' : '15px',
      fontStyle: 'bold',
    }).setOrigin(1, 0));

    const buyText = this.add.text(panelWidth / 2 - 42, rowTop + (isCompactPanel ? 30 : 32), isMaxLevel ? 'MAX' : 'Buy', {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
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
    this.closeUpgradeShopPanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = this.getPanelSize(430, 390);
    const reward = this.getPrestigeEssenceReward();
    const canPrestige = reward > 0;
    const canBuyEssencePower = this.monsterEssence >= ESSENCE_POWER_COST;

    panel.setDepth(24);
    this.addPanelBackground(panel, panelWidth, panelHeight);

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 20, 'Prestige', {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: this.getPanelTitleFontSize(panelWidth),
      fontStyle: 'bold',
    }));

    const closeText = this.add.text(panelWidth / 2 - 24, -panelHeight / 2 + 22, 'Close', {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      backgroundColor: '#49395d',
      padding: {
        x: 9,
        y: 5,
      },
    }).setOrigin(1, 0);

    closeText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.playButtonClickSound();
        this.closePrestigePanel();
      });

    panel.add(closeText);

    const contentX = -panelWidth / 2 + 26;
    const contentWidth = panelWidth - 52;
    const statusText = canPrestige
      ? 'Prestige ready: reset farm for +1 Monster Essence.'
      : 'Reach Lv 6 Slime or Lv 5 Mushroom to Prestige.';

    panel.add(this.add.text(contentX, -panelHeight / 2 + 78, `Monster Essence: ${this.monsterEssence}`, {
      color: '#fff4a8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
    }));

    panel.add(this.add.text(contentX, -panelHeight / 2 + 108, statusText, {
      color: canPrestige ? '#cdebb3' : THEME.mutedText,
      fontFamily: 'Arial, sans-serif',
      fontSize: panelWidth < 390 ? '13px' : '14px',
      fixedWidth: contentWidth,
      wordWrap: {
        width: contentWidth,
      },
    }));

    panel.add(this.add.text(contentX, -panelHeight / 2 + 134, `Reward: ${reward} Monster Essence`, {
      color: canPrestige ? '#fff4a8' : '#9ca79f',
      fontFamily: 'Arial, sans-serif',
      fontSize: panelWidth < 390 ? '13px' : '14px',
      fontStyle: 'bold',
      fixedWidth: contentWidth,
    }));

    panel.add(this.add.text(contentX, -panelHeight / 2 + 160, 'Reset farm progress for permanent power.', {
      color: THEME.mutedText,
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      wordWrap: {
        width: contentWidth,
      },
    }));

    this.addEssencePowerSection(panel, panelWidth, panelHeight, canBuyEssencePower);
    this.addPrestigeAction(panel, panelHeight, canPrestige);

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

    panel.add(this.add.text(-panelWidth / 2 + 42, y - 27, 'Essence Power', {
      color: '#f7ffe8',
      fontFamily: 'Arial, sans-serif',
      fontSize: panelWidth < 390 ? '15px' : '17px',
      fontStyle: 'bold',
    }));

    panel.add(this.add.text(-panelWidth / 2 + 42, y - 4, `Level ${this.essencePowerLevel}`, {
      color: '#cdebb3',
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
    }));

    panel.add(this.add.text(-panelWidth / 2 + 42, y + 18, `Global income x${this.getPrestigeIncomeMultiplier().toFixed(2)}`, {
      color: THEME.mutedText,
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
    }));

    panel.add(this.add.text(panelWidth / 2 - 42, y - 30, `Cost: ${this.formatCoinAmount(ESSENCE_POWER_COST)}`, {
      color: '#fff4a8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
    }).setOrigin(1, 0));

    const buyText = this.add.text(panelWidth / 2 - 42, y - 6, 'Buy', {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
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
    panelHeight: number,
    canPrestige: boolean,
  ): void {
    const label = this.prestigeConfirmationArmed
      ? 'Click again to confirm prestige'
      : 'Prestige Reset';
    const backgroundColor = !canPrestige
      ? THEME.lockedInner
      : this.prestigeConfirmationArmed
        ? THEME.warning
        : THEME.danger;

    const prestigeText = this.add.text(0, panelHeight / 2 - 38, label, {
      color: canPrestige ? '#ffffff' : '#9ca79f',
      fontFamily: 'Arial, sans-serif',
      fontSize: this.scale.width < 390 ? '14px' : '16px',
      fontStyle: 'bold',
      backgroundColor: `#${backgroundColor.toString(16).padStart(6, '0')}`,
      padding: {
        x: 13,
        y: 8,
      },
    }).setOrigin(0.5);

    prestigeText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.playButtonClickSound();
        this.tryPrestige();
      });

    panel.add(prestigeText);
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

      bug.lifetimeMs -= deltaMs;

      if (bug.lifetimeMs <= 0) {
        this.expireCoinBug(bug);
      }
    });

    this.activeCoinBugs = this.activeCoinBugs.filter((bug) => bug.container.active);
    this.coinBugSpawnAccumulatorMs += deltaMs;

    if (
      this.coinBugSpawnAccumulatorMs < this.nextCoinBugSpawnMs
      || this.getActiveCoinBugCount() >= COIN_BUG_MAX_ACTIVE
      || this.isModalOpen()
      || this.activeDragSlotId !== null
    ) {
      return;
    }

    if (this.spawnCoinBug()) {
      this.scheduleNextCoinBugSpawn();
      return;
    }

    this.coinBugSpawnAccumulatorMs = 0;
    this.nextCoinBugSpawnMs = 3_000;
  }

  private getActiveCoinBugCount(): number {
    return this.activeCoinBugs.filter((bug) => !bug.collected && bug.container.active).length;
  }

  private scheduleNextCoinBugSpawn(): void {
    this.coinBugSpawnAccumulatorMs = 0;
    this.nextCoinBugSpawnMs = this.getNextCoinBugSpawnDelayMs();
  }

  private getNextCoinBugSpawnDelayMs(): number {
    return Phaser.Math.Between(COIN_BUG_SPAWN_MIN_MS, COIN_BUG_SPAWN_MAX_MS);
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
      lifetimeMs: Phaser.Math.Between(COIN_BUG_MIN_LIFETIME_MS, COIN_BUG_MAX_LIFETIME_MS),
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

  private getCoinBugSpawnPosition(): Phaser.Math.Vector2 | null {
    const layout = this.getLayout();
    const margin = layout.isNarrow ? 28 : 34;
    const minY = Math.max(layout.statsY + layout.statsHeight + 18, layout.gridStartY - 42, 96);
    const maxY = layout.hatchY - 34;

    if (maxY <= minY) {
      return null;
    }

    for (let attempt = 0; attempt < 80; attempt += 1) {
      const point = new Phaser.Math.Vector2(
        Phaser.Math.Between(margin, Math.max(margin, this.scale.width - margin)),
        Phaser.Math.Between(minY, maxY),
      );

      if (this.isCoinBugSpawnPointSafe(point, layout)) {
        return point;
      }
    }

    return null;
  }

  private isCoinBugSpawnPointSafe(point: Phaser.Math.Vector2, layout: FarmSceneLayout): boolean {
    const padding = Math.ceil(COIN_BUG_HITBOX_SIZE / 2);
    const criticalRects = [
      new Phaser.Geom.Rectangle(layout.hudX, layout.hudY, layout.hudWidth, layout.hudHeight),
      new Phaser.Geom.Rectangle(layout.statsX, layout.statsY, layout.statsWidth, layout.statsHeight),
      new Phaser.Geom.Rectangle(layout.hatchX, layout.hatchY, layout.hatchWidth, layout.hatchHeight),
      new Phaser.Geom.Rectangle(layout.menuX - 82, layout.menuY - 6, 92, 42),
      new Phaser.Geom.Rectangle(this.scale.width / 2 - 120, layout.expansionLabelY - 18, 240, 36),
    ];

    if (criticalRects.some((rect) => this.isPointInsideRectWithPadding(point, rect, padding))) {
      return false;
    }

    const slotBuffer = Math.max(52, this.cellSize * 0.84);

    if (this.slotCenters.some((center) => center.x > 0 && Phaser.Math.Distance.Between(point.x, point.y, center.x, center.y) < slotBuffer)) {
      return false;
    }

    return this.activeCoinBugs.every((bug) => (
      bug.collected
      || Phaser.Math.Distance.Between(point.x, point.y, bug.container.x, bug.container.y) >= 58
    ));
  }

  private isPointInsideRectWithPadding(
    point: Phaser.Math.Vector2,
    rect: Phaser.Geom.Rectangle,
    padding: number,
  ): boolean {
    return point.x >= rect.x - padding
      && point.x <= rect.right + padding
      && point.y >= rect.y - padding
      && point.y <= rect.bottom + padding;
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

  private getCoinBugReward(): number {
    return this.sanitizeCoins(Math.max(
      COIN_BUG_MIN_REWARD,
      this.getTotalIncomePerSecond() * COIN_BUG_REWARD_SECONDS,
    ));
  }

  private showFloatingCoinReward(x: number, y: number, amount: number): void {
    const text = this.add.text(x, y, this.formatSignedCoinAmount(amount), {
      color: '#fff4a8',
      fontFamily: 'Arial, sans-serif',
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
    return Array.from({ length: TOTAL_SLOT_COUNT }, (_, index) => ({
      id: index,
      monster: null,
    }));
  }

  private createInitialMissionProgress(): Record<MissionId, number> {
    return Object.fromEntries(
      MISSION_DEFINITIONS.map((mission) => [mission.id, 0]),
    ) as Record<MissionId, number>;
  }

  private getMissionDefinition(missionId: MissionId): MissionDefinition | undefined {
    return MISSION_DEFINITIONS.find((mission) => mission.id === missionId);
  }

  private getMissionProgress(mission: MissionDefinition): number {
    if (this.completedMissionIds.has(mission.id)) {
      return mission.goal;
    }

    const progress = this.missionProgress[mission.id] ?? 0;

    if (!Number.isFinite(progress) || progress < 0) {
      return 0;
    }

    return Math.min(Math.floor(progress), mission.goal);
  }

  private getSanitizedMissionProgress(): Record<MissionId, number> {
    return Object.fromEntries(
      MISSION_DEFINITIONS.map((mission) => [mission.id, this.getMissionProgress(mission)]),
    ) as Record<MissionId, number>;
  }

  private incrementMissionProgress(missionId: MissionId, amount = 1): void {
    const mission = this.getMissionDefinition(missionId);

    if (!mission || this.completedMissionIds.has(missionId) || this.claimedMissionIds.has(missionId)) {
      return;
    }

    const nextProgress = Math.min(this.getMissionProgress(mission) + amount, mission.goal);
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
      this.showToast('Mission complete', 'success');
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
    if (Array.from(this.discoveredMonsters).some((discoveryKey) => discoveryKey.startsWith('Mushroom:'))
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

    if (!mission || !this.completedMissionIds.has(missionId) || this.claimedMissionIds.has(missionId)) {
      return;
    }

    if (mission.reward.type === 'coins') {
      this.currency.coins = this.sanitizeCoins(this.currency.coins + mission.reward.amount);
    } else {
      this.monsterEssence = this.sanitizePrestigeInteger(this.monsterEssence + mission.reward.amount);
    }

    this.claimedMissionIds.add(missionId);
    this.skipSavingUntilProgress = false;
    this.updateHud();
    this.saveProgress();
    this.refreshMissionsPanel();
    this.showToast(`Claimed ${this.getMissionRewardText(mission.reward)}`, 'success');
  }

  private getMissionRewardText(reward: MissionReward): string {
    if (reward.type === 'coins') {
      return `${this.formatCoinAmount(reward.amount)} coins`;
    }

    return `${reward.amount} Essence`;
  }

  private isSlotUnlocked(slotId: number): boolean {
    return slotId >= 0 && (slotId < MAIN_SLOT_COUNT || this.expansionUnlocked);
  }

  private getUnlockedFarmSlots(): FarmSlotState[] {
    return this.farmSlots.filter((slot) => this.isSlotUnlocked(slot.id));
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
    this.showToast('Expansion unlocked', 'success');
  }

  private createInitialUpgradeLevels(): Record<UpgradeId, number> {
    return Object.fromEntries(
      UPGRADE_DEFINITIONS.map((upgrade) => [upgrade.id, 0]),
    ) as Record<UpgradeId, number>;
  }

  private getUpgradeLevel(upgradeId: UpgradeId): number {
    const upgrade = UPGRADE_DEFINITIONS.find((definition) => definition.id === upgradeId);
    const level = this.upgradeLevels[upgradeId] ?? 0;

    if (!upgrade || !Number.isFinite(level)) {
      return 0;
    }

    return Phaser.Math.Clamp(Math.floor(level), 0, upgrade.maxLevel);
  }

  private getSanitizedUpgradeLevels(): Record<UpgradeId, number> {
    return Object.fromEntries(
      UPGRADE_DEFINITIONS.map((upgrade) => [upgrade.id, this.getUpgradeLevel(upgrade.id)]),
    ) as Record<UpgradeId, number>;
  }

  private getUpgradeCostForLevel(upgrade: UpgradeDefinition, level: number): number {
    return getUpgradeCost(upgrade, this.sanitizeUpgradeLevel(level, upgrade.maxLevel));
  }

  private sanitizeUpgradeLevel(level: number, maxLevel: number): number {
    if (!Number.isFinite(level) || level < 0) {
      return 0;
    }

    return Phaser.Math.Clamp(Math.floor(level), 0, maxLevel);
  }

  private buyUpgrade(upgradeId: UpgradeId): void {
    const upgrade = UPGRADE_DEFINITIONS.find((definition) => definition.id === upgradeId);

    if (!upgrade) {
      return;
    }

    const currentLevel = this.getUpgradeLevel(upgradeId);

    if (currentLevel >= upgrade.maxLevel) {
      return;
    }

    const cost = this.getUpgradeCostForLevel(upgrade, currentLevel);

    if (this.currency.coins < cost) {
      this.showNotEnoughCoinsMessage();
      return;
    }

    this.currency.coins = this.sanitizeCoins(this.currency.coins - cost);
    this.upgradeLevels[upgradeId] = currentLevel + 1;
    this.hatchCooldownMs = Math.min(this.hatchCooldownMs, this.getHatchCooldownMs());
    this.completeMission('buy-upgrade-1');
    this.hideFarmMessage();
    this.updateHud();
    this.saveProgress();
    this.openUpgradeShopPanel();
    this.showToast('Upgrade purchased', 'success');
  }

  private buyEssencePower(): void {
    if (this.monsterEssence < ESSENCE_POWER_COST) {
      this.showToast('Not enough Essence', 'warning');
      return;
    }

    this.monsterEssence -= ESSENCE_POWER_COST;
    this.essencePowerLevel += 1;
    this.hasPrestigedOnce = true;
    this.syncZoneUnlockFromPrestigeProgress();
    this.prestigeConfirmationArmed = false;
    this.updateHud();
    this.saveProgress();
    this.openPrestigePanel();
    this.showToast('Essence Power upgraded', 'success');
  }

  private tryPrestige(): void {
    const reward = this.getPrestigeEssenceReward();

    if (reward <= 0) {
      this.showToast('Reach Lv 6 Slime or Lv 5 Mushroom', 'warning');
      return;
    }

    if (!this.prestigeConfirmationArmed) {
      this.prestigeConfirmationArmed = true;
      this.openPrestigePanel();
      return;
    }

    this.performPrestigeReset(reward);
    this.openPrestigePanel();
    this.showToast(`Prestige complete: +${reward} Essence`, 'success');
  }

  private getPrestigeEssenceReward(): number {
    return this.hasPrestigeMilestone() ? 1 : 0;
  }

  private hasPrestigeMilestone(): boolean {
    return this.farmSlots.some((slot) => (
      (slot.monster?.family === 'Slime' && slot.monster.level >= 6)
      || (slot.monster?.family === 'Mushroom' && slot.monster.level >= 5)
    ));
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
    this.saveProgress();
  }

  private scheduleInitialOnboardingHints(): void {
    this.time.delayedCall(450, () => {
      if (this.getUnlockedFarmSlots().some((slot) => slot.monster)) {
        this.showOnboardingHint('income', 'Monsters earn coins every second.');
        this.checkMergeOnboardingHint();
        return;
      }

      this.showOnboardingHint('welcome', 'Welcome! Build a monster farm.');

      this.time.delayedCall(1500, () => {
        if (this.getUnlockedFarmSlots().every((slot) => slot.monster === null)) {
          this.showOnboardingHint('hatch', 'Tap Hatch Egg to create monsters.');
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
      this.showOnboardingHint('upgrades', 'Upgrade Shop boosts your farm production.');
    }
  }

  private checkMergeOnboardingHint(): void {
    if (this.hasMergeableMonsterPair()) {
      this.showOnboardingHint('merge', 'Drag same-family matching monsters together to merge.');
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
    this.showToast('Hints reset', 'success');
    this.scheduleInitialOnboardingHints();
  }

  private getUpgradeCurrentEffectText(upgradeId: UpgradeId): string {
    if (upgradeId === 'slime-income-boost') {
      return `Slime income x${this.getFamilyIncomeMultiplier('Slime').toFixed(2)}`;
    }

    if (upgradeId === 'mushroom-income-boost') {
      return `Mushroom income x${this.getFamilyIncomeMultiplier('Mushroom').toFixed(2)}`;
    }

    if (upgradeId === 'hatch-speed') {
      return `cooldown ${(this.getHatchCooldownMs() / MILLISECONDS_PER_SECOND).toFixed(1)}s`;
    }

    if (upgradeId === 'mushroom-chance') {
      return `Mushroom hatch ${Math.round(this.getMushroomHatchChance() * 100)}%`;
    }

    return `offline cap ${this.formatDuration(this.getOfflineCapSeconds())}`;
  }

  private getFamilyIncomeMultiplier(family: MonsterFamily): number {
    if (family === 'Mushroom') {
      return 1 + this.getUpgradeLevel('mushroom-income-boost') * MUSHROOM_INCOME_BOOST_PER_LEVEL;
    }

    return 1 + this.getUpgradeLevel('slime-income-boost') * SLIME_INCOME_BOOST_PER_LEVEL;
  }

  private getPrestigeIncomeMultiplier(): number {
    return 1 + this.essencePowerLevel * ESSENCE_POWER_INCOME_BOOST_PER_LEVEL;
  }

  private getHatchCooldownMs(): number {
    const reduction = this.getUpgradeLevel('hatch-speed') * HATCH_SPEED_REDUCTION_PER_LEVEL;
    const cooldown = HATCH_COOLDOWN_MS * Math.max(0, 1 - reduction);

    return Math.max(MIN_HATCH_COOLDOWN_MS, Math.floor(cooldown));
  }

  private getOfflineCapSeconds(): number {
    return MAX_OFFLINE_SECONDS + this.getUpgradeLevel('offline-storage') * OFFLINE_STORAGE_SECONDS_PER_LEVEL;
  }

  private getMushroomHatchChance(): number {
    const chance = BASE_MUSHROOM_HATCH_CHANCE
      + this.getCurrentZoneMushroomHatchBonus()
      + this.getUpgradeLevel('mushroom-chance') * MUSHROOM_HATCH_CHANCE_PER_LEVEL;

    return Phaser.Math.Clamp(chance, 0, 1);
  }

  private formatDuration(seconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (hours > 0) {
      return `${hours}h`;
    }

    return `${minutes}m`;
  }

  private hatchMonster(): void {
    const emptySlot = this.getUnlockedFarmSlots().find((slot) => slot.monster === null);

    if (!emptySlot) {
      this.showFullFarmMessage();
      return;
    }

    if (!this.isHatchReady()) {
      this.showToast('Hatching...', 'info');
      return;
    }

    if (!this.canAffordHatch()) {
      this.showNotEnoughCoinsMessage();
      return;
    }

    const hatchDefinition = this.rollHatchMonsterDefinition();

    this.currency.coins = this.sanitizeCoins(this.currency.coins - this.currentEggCost);
    emptySlot.monster = this.createMonsterInstance(hatchDefinition);
    this.currentEggCost = this.getNextEggCost(this.currentEggCost);
    audioSystem.playHatch();
    this.discoverMonster(hatchDefinition);
    this.incrementMissionProgress('hatch-3');
    this.evaluateMonsterMissions(hatchDefinition);
    this.hideFarmMessage();
    this.renderMonsterInSlot(emptySlot);
    this.updateHud();
    this.showOnboardingHint('income', 'Monsters earn coins every second.');
    this.checkMergeOnboardingHint();
    this.hatchCooldownMs = 0;
    this.updateHatchCooldownUi();
    this.skipSavingUntilProgress = false;
    this.saveProgress();
  }

  private rollHatchMonsterDefinition(): MonsterDefinition {
    return Math.random() < this.getMushroomHatchChance() ? BUTTON_MUSHROOM : BABY_SLIME;
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
    return this.hatchCooldownMs >= this.getHatchCooldownMs();
  }

  private canAffordHatch(): boolean {
    return this.currency.coins >= this.currentEggCost;
  }

  private getNextEggCost(currentEggCost: number): number {
    return Math.max(STARTING_EGG_COST, Math.ceil(this.sanitizeEggCost(currentEggCost) * EGG_COST_MULTIPLIER));
  }

  private sanitizeEggCost(eggCost: number): number {
    if (!Number.isFinite(eggCost) || eggCost < STARTING_EGG_COST) {
      return STARTING_EGG_COST;
    }

    return Math.ceil(eggCost);
  }

  private updateHatchCooldown(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0 || this.isHatchReady()) {
      this.updateHatchCooldownUi();
      return;
    }

    this.hatchCooldownMs = Phaser.Math.Clamp(this.hatchCooldownMs + deltaMs, 0, this.getHatchCooldownMs());
    this.updateHatchCooldownUi();
  }

  private updateHatchCooldownUi(): void {
    const cooldownMs = this.getHatchCooldownMs();
    const progress = Phaser.Math.Clamp(this.hatchCooldownMs / cooldownMs, 0, 1);
    const isReady = progress >= 1;
    const isFull = this.isFarmFull();
    const canAfford = this.canAffordHatch();
    const statusColor = isFull || !canAfford ? '#fff4a8' : '#d9d6ec';
    const formattedEggCost = this.formatCoinAmount(this.currentEggCost);

    if (!isReady) {
      this.hatchLabelText?.setText('Hatching...');
      this.hatchStatusText?.setText(`${Math.ceil((cooldownMs - this.hatchCooldownMs) / 1000)}s - Cost: ${formattedEggCost} coins`);
    } else if (isFull) {
      this.hatchLabelText?.setText('Farm Full');
      this.hatchStatusText?.setText(this.expansionUnlocked ? 'Merge to free a slot' : 'Unlock +3 slots');
    } else if (!canAfford) {
      this.hatchLabelText?.setText('Need Coins');
      this.hatchStatusText?.setText(`Cost: ${formattedEggCost} coins`);
    } else {
      this.hatchLabelText?.setText('Hatch Egg');
      this.hatchStatusText?.setText(`Cost: ${formattedEggCost} coins`);
    }

    this.hatchStatusText?.setColor(statusColor);
    this.hatchProgressFill?.setDisplaySize(this.hatchProgressWidth * progress, 8);
    this.hatchProgressFill?.setFillStyle(isReady && canAfford && !isFull ? 0x8ecf62 : 0xf3d06b, 0.95);
  }

  private discoverMonster(monster: MonsterDefinition): void {
    this.discoveredMonsters.add(this.getDiscoveryKey(monster.family, monster.level));
    this.refreshCompendiumPanel();
  }

  private getDiscoveryKey(family: MonsterFamily, level: number): DiscoveryKey {
    return `${family}:${level}`;
  }

  private isMonsterDiscovered(monster: MonsterDefinition): boolean {
    return this.discoveredMonsters.has(this.getDiscoveryKey(monster.family, monster.level));
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
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const familyOrder: MonsterFamily[] = ['Slime', 'Mushroom'];
    const groupedDefinitions = familyOrder.map((family) => ({
      family,
      definitions: MONSTER_DEFINITIONS
        .filter((definition) => definition.family === family)
        .sort((first, second) => first.level - second.level),
    }));
    const listItems = groupedDefinitions.flatMap<CompendiumListItem>((group) => [
      { type: 'family', family: group.family },
      ...group.definitions.map((monster) => ({ type: 'monster' as const, monster })),
    ]);
    const { width: panelWidth, height: panelHeight } = this.getModalSize('compendium', 640, 640);
    const rowGap = panelWidth < 390 ? 34 : 38;
    const rowHeight = Math.min(34, rowGap - 3);
    const bodyTopY = -panelHeight / 2 + (panelWidth < 390 ? 122 : 118);
    const bodyBottomY = panelHeight / 2 - 72;
    const bodyHeight = Math.max(rowGap, bodyBottomY - bodyTopY);
    const rowsPerPage = this.getRowsPerPage(rowGap, bodyHeight, listItems.length, 8, 12);
    const pageCount = this.getPageCount(listItems.length, rowsPerPage);
    const pageIndex = Phaser.Math.Clamp(this.compendiumPageIndex, 0, pageCount - 1);
    const pageItems = listItems.slice(pageIndex * rowsPerPage, (pageIndex + 1) * rowsPerPage);
    const visibleRowsHeight = Math.max(rowHeight, (pageItems.length - 1) * rowGap + rowHeight);
    const firstRowY = bodyTopY + Math.max(0, (bodyHeight - visibleRowsHeight) / 2);

    this.compendiumPageIndex = pageIndex;

    panel.setDepth(20);
    this.addPanelBackground(panel, panelWidth, panelHeight);

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 20, 'Monster Compendium', {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: this.getPanelTitleFontSize(panelWidth, 22),
      fontStyle: 'bold',
    }));

    const closeText = this.add.text(panelWidth / 2 - 24, -panelHeight / 2 + 20, 'Close', {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      backgroundColor: '#49395d',
      padding: {
        x: 9,
        y: 5,
      },
    }).setOrigin(1, 0);

    closeText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.playButtonClickSound();
        this.closeCompendiumPanel();
      });

    panel.add(closeText);

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
    const discoveredCount = MONSTER_DEFINITIONS.filter((monster) => this.isMonsterDiscovered(monster)).length;
    const pageSubtitle = this.getCompendiumPageSubtitle(pageItems);
    const summaryY = -panelHeight / 2 + 54;
    const familyProgress = (['Slime', 'Mushroom'] as MonsterFamily[])
      .map((family) => {
        const familyMonsters = MONSTER_DEFINITIONS.filter((monster) => monster.family === family);
        const familyDiscovered = familyMonsters.filter((monster) => this.isMonsterDiscovered(monster)).length;

        return `${family} ${familyDiscovered}/${familyMonsters.length}`;
      })
      .join('  |  ');

    panel.add(this.add.text(-panelWidth / 2 + 24, summaryY, pageSubtitle, {
      color: THEME.goldText,
      fontFamily: 'Arial, sans-serif',
      fontSize: panelWidth < 390 ? '12px' : '14px',
      fontStyle: 'bold',
    }));

    panel.add(this.add.text(-panelWidth / 2 + 24, summaryY + 18, `Discovered ${discoveredCount}/${MONSTER_DEFINITIONS.length}  |  ${familyProgress}`, {
      color: THEME.mutedText,
      fontFamily: 'Arial, sans-serif',
      fontSize: panelWidth < 390 ? '10px' : '12px',
      wordWrap: {
        width: panelWidth - 48,
      },
    }));
  }

  private getCompendiumPageSubtitle(pageItems: CompendiumListItem[]): string {
    const visibleFamilies = Array.from(new Set(pageItems
      .map((item) => (item.type === 'family' ? item.family : item.monster.family))));

    if (visibleFamilies.length === 1) {
      return `${visibleFamilies[0]} Collection`;
    }

    return 'Monster Family Collection';
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
    panel.add(this.add.text(-panelWidth / 2 + 28, rowY - 8, family, {
      color: '#fff4a8',
      fontFamily: 'Arial, sans-serif',
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

    this.addCompendiumIcon(panel, monster, isDiscovered, iconX, rowY, iconScale);

    panel.add(this.add.text(textX, nameY, isDiscovered ? monster.name : '???', {
      color: textColor,
      fontFamily: 'Arial, sans-serif',
      fontSize: isCompactPanel ? '13px' : '16px',
      fontStyle: 'bold',
      wordWrap: {
        width: Math.max(108, panelWidth - (isCompactPanel ? 164 : 220)),
      },
    }));

    panel.add(this.add.text(textX, detailY, `Level ${monster.level}`, {
      color: textColor,
      fontFamily: 'Arial, sans-serif',
      fontSize: isCompactPanel ? '11px' : '13px',
    }));

    panel.add(this.add.text(panelWidth / 2 - 42, rowY - (isCompactPanel ? 7 : 8), isDiscovered ? `${this.formatSignedCoinAmount(monster.incomePerSecond)}/sec` : 'Unknown', {
      color: isDiscovered ? '#fff4a8' : '#9ca79f',
      fontFamily: 'Arial, sans-serif',
      fontSize: isCompactPanel ? '12px' : '14px',
      fontStyle: 'bold',
    }).setOrigin(1, 0));
  }

  private addCompendiumIcon(
    panel: Phaser.GameObjects.Container,
    monster: MonsterDefinition,
    isDiscovered: boolean,
    iconX: number,
    iconY: number,
    scale = 1,
  ): void {
    if (!isDiscovered) {
      panel.add(this.add.circle(iconX, iconY, 18 * scale, 0x303735)
        .setStrokeStyle(2, 0x707a73, 0.85));
      panel.add(this.add.text(iconX, iconY - 11 * scale, '?', {
        color: '#d9d6ec',
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.round(22 * scale)}px`,
        fontStyle: 'bold',
      }).setOrigin(0.5, 0));
      return;
    }

    const visualStyle = this.getMonsterVisualStyle(monster.family, monster.level);

    if (monster.family === 'Mushroom') {
      this.addMushroomVisual(panel, monster.level, visualStyle, iconX, iconY, 0.58 * scale);
      return;
    }

    this.addSlimeVisual(panel, monster.level, visualStyle, iconX, iconY, 0.58 * scale);
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
    const visualStyle = this.getMonsterVisualStyle(monster.family, monster.level);
    const visualScale = Math.min(1, Math.max(0.72, this.cellSize / CELL_SIZE));

    if (monster.family === 'Mushroom') {
      this.addMushroomVisual(visual, monster.level, visualStyle, 0, 0, visualScale);
    } else {
      this.addSlimeVisual(visual, monster.level, visualStyle, 0, 0, visualScale);
    }

    visual.add(this.add.text(0, 27 * visualScale, `Lv ${monster.level}`, {
      color: '#f7ffe8',
      fontFamily: 'Arial, sans-serif',
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

  private addSlimeVisual(
    container: Phaser.GameObjects.Container,
    level: number,
    visualStyle: MonsterVisualStyle,
    x = 0,
    y = 0,
    scale = 1,
  ): void {
    this.addMonsterAura(container, visualStyle, x, y, scale);

    container.add(this.add.ellipse(
      x,
      y + 8 * scale,
      (visualStyle.bodyWidth + 6) * scale,
      (visualStyle.bodyHeight - 2) * scale,
      0x2f7d40,
      0.26,
    ));
    container.add(this.add.ellipse(
      x,
      y,
      visualStyle.bodyWidth * scale,
      visualStyle.bodyHeight * scale,
      visualStyle.bodyColor,
    ).setStrokeStyle(Math.max(1, Math.round(visualStyle.visualIntensity.outlineWidth * scale)), visualStyle.strokeColor, 0.95));
    container.add(this.add.ellipse(
      x + 3 * scale,
      y - 2 * scale,
      visualStyle.bodyWidth * 0.72 * scale,
      visualStyle.bodyHeight * 0.52 * scale,
      visualStyle.accentColor,
      0.12 + visualStyle.visualIntensity.tier * 0.018,
    ));
    container.add(this.add.ellipse(x - 12 * scale, y - 12 * scale, 14 * scale, 9 * scale, 0xffffff, 0.28));
    container.add(this.add.circle(x - 11 * scale, y - 4 * scale, 4 * scale, 0x10291a));
    container.add(this.add.circle(x + 11 * scale, y - 4 * scale, 4 * scale, 0x10291a));
    container.add(this.add.circle(x - 10 * scale, y - 5 * scale, 1.5 * scale, 0xffffff, 0.85));
    container.add(this.add.circle(x + 12 * scale, y - 5 * scale, 1.5 * scale, 0xffffff, 0.85));
    container.add(this.add.ellipse(x - 17 * scale, y + 4 * scale, 6 * scale, 4 * scale, 0xff9fb1, 0.35));
    container.add(this.add.ellipse(x + 17 * scale, y + 4 * scale, 6 * scale, 4 * scale, 0xff9fb1, 0.35));

    this.addSlimeDecorations(container, level, visualStyle, x, y, scale);
    this.addVisualIntensitySparkles(container, visualStyle, x, y, scale);
  }

  private addMushroomVisual(
    container: Phaser.GameObjects.Container,
    level: number,
    visualStyle: MonsterVisualStyle,
    x = 0,
    y = 0,
    scale = 1,
  ): void {
    this.addMonsterAura(container, visualStyle, x, y - 5 * scale, scale);

    const strokeWidth = Math.max(1, Math.round(visualStyle.visualIntensity.outlineWidth * scale));
    const stemColor = visualStyle.stemColor ?? (level >= 4 ? 0xf0e6c4 : 0xf3d9ad);
    const stemStroke = visualStyle.stemStrokeColor ?? (level >= 4 ? 0x927846 : 0x8a5a30);
    const capWidth = visualStyle.bodyWidth * scale;
    const capHeight = visualStyle.bodyHeight * scale;

    container.add(this.add.ellipse(x, y + 16 * scale, 30 * scale, 10 * scale, 0x2f7d40, 0.24));
    container.add(this.add.rectangle(x, y + 9 * scale, 17 * scale, 30 * scale, stemColor, 0.98)
      .setStrokeStyle(strokeWidth, stemStroke, 0.9));
    container.add(this.add.ellipse(x, y - 7 * scale, capWidth, capHeight, visualStyle.bodyColor, 0.98)
      .setStrokeStyle(strokeWidth, visualStyle.strokeColor, 0.95));
    container.add(this.add.ellipse(x, y + 2 * scale, capWidth * 0.78, capHeight * 0.34, visualStyle.strokeColor, 0.18));
    container.add(this.add.ellipse(x - 8 * scale, y - 15 * scale, capWidth * 0.34, capHeight * 0.18, visualStyle.accentColor, 0.22));
    container.add(this.add.circle(x - 6 * scale, y + 8 * scale, 3.2 * scale, 0x10291a));
    container.add(this.add.circle(x + 6 * scale, y + 8 * scale, 3.2 * scale, 0x10291a));
    container.add(this.add.circle(x - 5.2 * scale, y + 7.2 * scale, 1.1 * scale, 0xffffff, 0.85));
    container.add(this.add.circle(x + 6.8 * scale, y + 7.2 * scale, 1.1 * scale, 0xffffff, 0.85));

    this.addMushroomDecorations(container, level, visualStyle, x, y, scale);
    this.addVisualIntensitySparkles(container, visualStyle, x, y - 5 * scale, scale);
  }

  private addMonsterAura(
    container: Phaser.GameObjects.Container,
    visualStyle: MonsterVisualStyle,
    x: number,
    y: number,
    scale: number,
  ): void {
    const { visualIntensity } = visualStyle;

    if (visualIntensity.glowAlpha <= 0) {
      return;
    }

    const glowWidth = visualStyle.bodyWidth * visualIntensity.glowScale * scale;
    const glowHeight = visualStyle.bodyHeight * visualIntensity.glowScale * scale;

    container.add(this.add.ellipse(x, y, glowWidth, glowHeight, visualStyle.accentColor, visualIntensity.glowAlpha));

    if (visualIntensity.tier >= 3) {
      container.add(this.add.ellipse(x, y, glowWidth * 1.13, glowHeight * 1.16, visualStyle.secondaryAccentColor, 0)
        .setStrokeStyle(Math.max(1, Math.round(1.4 * scale)), visualStyle.secondaryAccentColor, 0.28));
    }
  }

  private addVisualIntensitySparkles(
    container: Phaser.GameObjects.Container,
    visualStyle: MonsterVisualStyle,
    x: number,
    y: number,
    scale: number,
  ): void {
    const sparkleCount = Math.min(scale < 0.55 ? 2 : 4, visualStyle.visualIntensity.sparkleCount);

    if (sparkleCount <= 0) {
      return;
    }

    const sparklePositions = [
      [-25, -16],
      [24, -11],
      [-21, 11],
      [22, 9],
    ];

    sparklePositions.slice(0, sparkleCount).forEach(([sparkleX, sparkleY], index) => {
      container.add(this.add.star(
        x + sparkleX * scale,
        y + sparkleY * scale,
        4,
        Math.max(1.2, 2.2 * scale),
        Math.max(2.2, 4.4 * scale),
        index % 2 === 0 ? visualStyle.accentColor : visualStyle.secondaryAccentColor,
        0.86,
      ));
    });
  }

  private getMonsterVisualStyle(family: MonsterFamily, level: number): MonsterVisualStyle {
    return this.getMonsterVisualIdentity(family, level);
  }

  private getMonsterVisualIdentity(monsterOrFamily: MonsterDefinition | MonsterFamily, level?: number): MonsterVisualIdentity {
    const family = typeof monsterOrFamily === 'string' ? monsterOrFamily : monsterOrFamily.family;
    const monsterLevel = typeof monsterOrFamily === 'string' ? level ?? 1 : monsterOrFamily.level;
    const visualIntensity = this.getMonsterVisualIntensity(family, monsterLevel);

    if (family === 'Mushroom') {
      return this.getMushroomVisualIdentity(monsterLevel, visualIntensity);
    }

    return this.getSlimeVisualIdentity(monsterLevel, visualIntensity);
  }

  private getMonsterVisualIntensity(family: MonsterFamily, level: number): MonsterVisualIntensity {
    const maxLevel = family === 'Mushroom' ? 8 : 12;
    const normalizedLevel = Phaser.Math.Clamp(level, 1, maxLevel);
    const progress = maxLevel <= 1 ? 0 : (normalizedLevel - 1) / (maxLevel - 1);
    const tier = Math.min(5, Math.floor(progress * 6));

    return {
      tier,
      glowAlpha: tier === 0 ? 0 : 0.08 + tier * 0.035,
      glowScale: 1.08 + tier * 0.055,
      outlineWidth: 2 + Math.min(3, Math.floor(tier / 2)),
      detailScale: 1 + tier * 0.055,
      sparkleCount: Math.max(0, tier - 1),
    };
  }

  private getSlimeVisualIdentity(level: number, visualIntensity: MonsterVisualIntensity): MonsterVisualIdentity {
    const paletteByLevel: Record<number, Omit<MonsterVisualIdentity, 'family' | 'level' | 'visualIntensity'>> = {
      1: {
        bodyColor: 0x80e278,
        baseColor: 0x80e278,
        strokeColor: 0x2e7a35,
        accentColor: 0xbaf7a0,
        secondaryAccentColor: 0xff9fb1,
        bodyWidth: 46,
        bodyHeight: 38,
        silhouetteVariant: 'round-drop',
        patternVariant: 'plain',
        accessories: [],
        auraType: 'none',
      },
      2: {
        bodyColor: 0x66d8e7,
        baseColor: 0x66d8e7,
        strokeColor: 0x247a8d,
        accentColor: 0xd7f5ff,
        secondaryAccentColor: 0x8df0ff,
        bodyWidth: 54,
        bodyHeight: 46,
        silhouetteVariant: 'tall-drop',
        patternVariant: 'bubble',
        accessories: ['bubble crest'],
        auraType: 'dew',
      },
      3: {
        bodyColor: 0xb28df0,
        baseColor: 0xb28df0,
        strokeColor: 0x6543a1,
        accentColor: 0xf7e27c,
        secondaryAccentColor: 0xd8bdff,
        bodyWidth: 60,
        bodyHeight: 50,
        silhouetteVariant: 'wide-drop',
        patternVariant: 'star core',
        accessories: ['star core'],
        auraType: 'spark',
      },
      4: {
        bodyColor: 0x9ee45d,
        baseColor: 0x9ee45d,
        strokeColor: 0x4b8732,
        accentColor: 0xffdf9c,
        secondaryAccentColor: 0xf6ffbf,
        bodyWidth: 58,
        bodyHeight: 48,
        silhouetteVariant: 'horned',
        patternVariant: 'leaf glint',
        accessories: ['horns'],
        auraType: 'leaf',
      },
      5: {
        bodyColor: 0xf0a45d,
        baseColor: 0xf0a45d,
        strokeColor: 0x945024,
        accentColor: 0xf7d35f,
        secondaryAccentColor: 0xe94c74,
        bodyWidth: 62,
        bodyHeight: 50,
        silhouetteVariant: 'royal',
        patternVariant: 'gem crown',
        accessories: ['crown'],
        auraType: 'gold',
      },
      6: {
        bodyColor: 0x8ae8f2,
        baseColor: 0x8ae8f2,
        strokeColor: 0x267c94,
        accentColor: 0xd7fbff,
        secondaryAccentColor: 0x5dc3e6,
        bodyWidth: 60,
        bodyHeight: 50,
        silhouetteVariant: 'crystal',
        patternVariant: 'triple crystal',
        accessories: ['crystals'],
        auraType: 'frost',
      },
      7: {
        bodyColor: 0x7bb36a,
        baseColor: 0x7bb36a,
        strokeColor: 0x395e32,
        accentColor: 0xf0dca4,
        secondaryAccentColor: 0xc5f0a0,
        bodyWidth: 62,
        bodyHeight: 52,
        silhouetteVariant: 'ancient',
        patternVariant: 'rune halo',
        accessories: ['runes'],
        auraType: 'rune',
      },
      8: {
        bodyColor: 0x4f4bb8,
        baseColor: 0x4f4bb8,
        strokeColor: 0x24205f,
        accentColor: 0xb9d9ff,
        secondaryAccentColor: 0xfff4a8,
        bodyWidth: 64,
        bodyHeight: 52,
        silhouetteVariant: 'galaxy',
        patternVariant: 'two star orbit',
        accessories: ['orbit stars'],
        auraType: 'galaxy',
      },
      9: {
        bodyColor: 0x7c4fd6,
        baseColor: 0x7c4fd6,
        strokeColor: 0x37216f,
        accentColor: 0xff8bc8,
        secondaryAccentColor: 0xbad7ff,
        bodyWidth: 66,
        bodyHeight: 53,
        silhouetteVariant: 'nebula',
        patternVariant: 'nebula beads',
        accessories: ['orbit beads'],
        auraType: 'nebula',
      },
      10: {
        bodyColor: 0xf2b84f,
        baseColor: 0xf2b84f,
        strokeColor: 0x8f5c18,
        accentColor: 0xfff0a8,
        secondaryAccentColor: 0xff7659,
        bodyWidth: 67,
        bodyHeight: 54,
        silhouetteVariant: 'solar',
        patternVariant: 'solar crown',
        accessories: ['sun rays'],
        auraType: 'solar',
      },
      11: {
        bodyColor: 0x38356f,
        baseColor: 0x38356f,
        strokeColor: 0x171530,
        accentColor: 0xf0e6ff,
        secondaryAccentColor: 0xffb85f,
        bodyWidth: 68,
        bodyHeight: 55,
        silhouetteVariant: 'eclipse',
        patternVariant: 'eclipse ring',
        accessories: ['eclipse ring'],
        auraType: 'eclipse',
      },
      12: {
        bodyColor: 0x2f6fc2,
        baseColor: 0x2f6fc2,
        strokeColor: 0x15315d,
        accentColor: 0xd8fbff,
        secondaryAccentColor: 0xfff19a,
        bodyWidth: 70,
        bodyHeight: 56,
        silhouetteVariant: 'cosmic',
        patternVariant: 'cosmic crown',
        accessories: ['crown ring', 'stars'],
        auraType: 'cosmic',
      },
    };

    return {
      family: 'Slime',
      level,
      visualIntensity,
      ...(paletteByLevel[level] ?? paletteByLevel[12]),
    };
  }

  private getMushroomVisualIdentity(level: number, visualIntensity: MonsterVisualIntensity): MonsterVisualIdentity {
    const paletteByLevel: Record<number, Omit<MonsterVisualIdentity, 'family' | 'level' | 'visualIntensity'>> = {
      1: {
        bodyColor: 0xd8a15e,
        baseColor: 0xd8a15e,
        strokeColor: 0x754523,
        accentColor: 0xffe7bd,
        secondaryAccentColor: 0xf3d9ad,
        bodyWidth: 46,
        bodyHeight: 32,
        silhouetteVariant: 'button-cap',
        patternVariant: 'single spot',
        accessories: ['small spot'],
        auraType: 'none',
        stemColor: 0xf3d9ad,
        stemStrokeColor: 0x8a5a30,
      },
      2: {
        bodyColor: 0xc9534a,
        baseColor: 0xc9534a,
        strokeColor: 0x742922,
        accentColor: 0xffefd2,
        secondaryAccentColor: 0xf7b0a0,
        bodyWidth: 52,
        bodyHeight: 36,
        silhouetteVariant: 'spotted-cap',
        patternVariant: 'four spots',
        accessories: ['spots'],
        auraType: 'none',
        stemColor: 0xf3d9ad,
        stemStrokeColor: 0x8a5a30,
      },
      3: {
        bodyColor: 0xbe8f55,
        baseColor: 0xbe8f55,
        strokeColor: 0x6b4c28,
        accentColor: 0xe6d0a0,
        secondaryAccentColor: 0xd9c08a,
        bodyWidth: 56,
        bodyHeight: 38,
        silhouetteVariant: 'elder-cap',
        patternVariant: 'side gills',
        accessories: ['gills'],
        auraType: 'spore',
        stemColor: 0xf0e6c4,
        stemStrokeColor: 0x927846,
      },
      4: {
        bodyColor: 0x8f65d8,
        baseColor: 0x8f65d8,
        strokeColor: 0x4d347d,
        accentColor: 0xdcc7ff,
        secondaryAccentColor: 0xfff1a8,
        bodyWidth: 60,
        bodyHeight: 40,
        silhouetteVariant: 'mystic-cap',
        patternVariant: 'star veil',
        accessories: ['mystic stars'],
        auraType: 'mystic',
        stemColor: 0xf0e6c4,
        stemStrokeColor: 0x927846,
      },
      5: {
        bodyColor: 0x5d7f3f,
        baseColor: 0x5d7f3f,
        strokeColor: 0x2d4c25,
        accentColor: 0xf2e08f,
        secondaryAccentColor: 0x9fcb73,
        bodyWidth: 64,
        bodyHeight: 42,
        silhouetteVariant: 'giant-cap',
        patternVariant: 'golden nodes',
        accessories: ['gold nodes', 'base band'],
        auraType: 'forest',
        stemColor: 0xf0e6c4,
        stemStrokeColor: 0x927846,
      },
      6: {
        bodyColor: 0x5f8ed8,
        baseColor: 0x5f8ed8,
        strokeColor: 0x28507f,
        accentColor: 0xd8fbff,
        secondaryAccentColor: 0x9bd6ec,
        bodyWidth: 66,
        bodyHeight: 44,
        silhouetteVariant: 'mooncap',
        patternVariant: 'lunar crystals',
        accessories: ['moon crystals', 'silver band'],
        auraType: 'lunar',
        stemColor: 0xf0e6c4,
        stemStrokeColor: 0x927846,
      },
      7: {
        bodyColor: 0x5844b8,
        baseColor: 0x5844b8,
        strokeColor: 0x281d63,
        accentColor: 0xfff1a8,
        secondaryAccentColor: 0xbad7ff,
        bodyWidth: 68,
        bodyHeight: 45,
        silhouetteVariant: 'starlit-cap',
        patternVariant: 'constellation',
        accessories: ['star trail', 'blue band'],
        auraType: 'starlit',
        stemColor: 0xf0e6c4,
        stemStrokeColor: 0x927846,
      },
      8: {
        bodyColor: 0x26796d,
        baseColor: 0x26796d,
        strokeColor: 0x12443f,
        accentColor: 0xffd978,
        secondaryAccentColor: 0x9df5d7,
        bodyWidth: 72,
        bodyHeight: 48,
        silhouetteVariant: 'worldcap',
        patternVariant: 'world crown',
        accessories: ['canopy crown', 'root ring'],
        auraType: 'world',
        stemColor: 0xf0e6c4,
        stemStrokeColor: 0x927846,
      },
    };

    return {
      family: 'Mushroom',
      level,
      visualIntensity,
      ...(paletteByLevel[level] ?? paletteByLevel[8]),
    };
  }

  private validateMonsterVisualIdentities(): void {
    const isLocalDebug = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (!SHOW_DEBUG_PANEL && !isLocalDebug) {
      return;
    }

    const signatures = new Map<string, MonsterDefinition>();

    MONSTER_DEFINITIONS.forEach((monster) => {
      const identity = this.getMonsterVisualIdentity(monster);
      const signature = [
        identity.family,
        identity.bodyColor.toString(16),
        identity.strokeColor.toString(16),
        identity.accentColor.toString(16),
        identity.secondaryAccentColor.toString(16),
        identity.silhouetteVariant,
        identity.patternVariant,
        identity.accessories.join(','),
        identity.auraType,
        identity.visualIntensity.tier,
      ].join('|');
      const matchingMonster = signatures.get(signature);

      if (matchingMonster) {
        console.warn(
          `[Compendium] Visual identity overlap: ${matchingMonster.family} Lv ${matchingMonster.level} and ${monster.family} Lv ${monster.level}`,
        );
        return;
      }

      signatures.set(signature, monster);
    });
  }

  private addMushroomDecorations(
    container: Phaser.GameObjects.Container,
    level: number,
    visualStyle: MonsterVisualStyle,
    x = 0,
    y = 0,
    scale = 1,
  ): void {
    const strokeWidth = Math.max(1, Math.round(2 * scale));

    if (level === 1) {
      container.add(this.add.ellipse(x - 9 * scale, y - 11 * scale, 8 * scale, 5 * scale, 0xffe7bd, 0.9));
      return;
    }

    if (level === 2) {
      [
        [-13, -10, 4],
        [0, -17, 5],
        [13, -8, 4],
        [-3, -3, 3],
      ].forEach(([spotX, spotY, radius]) => {
        container.add(this.add.circle(
          x + spotX * scale,
          y + spotY * scale,
          radius * scale,
          0xffefd2,
          0.95,
        ));
      });
      return;
    }

    if (level === 3) {
      container.add(this.add.ellipse(x - 16 * scale, y - 5 * scale, 9 * scale, 15 * scale, 0xd9c08a, 0)
        .setStrokeStyle(strokeWidth, 0xe6d0a0, 0.82));
      container.add(this.add.ellipse(x + 16 * scale, y - 5 * scale, 9 * scale, 15 * scale, 0xd9c08a, 0)
        .setStrokeStyle(strokeWidth, 0xe6d0a0, 0.82));
      container.add(this.add.circle(x, y - 18 * scale, 4 * scale, 0xf0e0b2, 0.92));
      return;
    }

    if (level === 4) {
      container.add(this.add.ellipse(x, y - 8 * scale, 48 * scale, 18 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, 0xdcc7ff, 0.76));
      container.add(this.add.star(x - 12 * scale, y - 17 * scale, 5, 2.5 * scale, 5 * scale, 0xf4dcff, 0.95));
      container.add(this.add.star(x + 13 * scale, y - 5 * scale, 5, 2.5 * scale, 5 * scale, 0xfff1a8, 0.95));
      return;
    }

    if (level === 6) {
      container.add(this.add.ellipse(x, y - 9 * scale, 58 * scale, 22 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.accentColor, 0.84));
      container.add(this.add.ellipse(x - 7 * scale, y - 12 * scale, 25 * scale, 9 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.secondaryAccentColor, 0.7));
      [
        [-18, -10, -8],
        [0, -20, 0],
        [17, -8, 8],
      ].forEach(([crystalX, crystalY, angle]) => {
        const crystal = this.add.triangle(
          x + crystalX * scale,
          y + crystalY * scale,
          0,
          -8 * scale,
          -5 * scale,
          6 * scale,
          5 * scale,
          6 * scale,
          visualStyle.accentColor,
          0.95,
        ).setStrokeStyle(1, visualStyle.strokeColor, 0.78);

        crystal.setAngle(angle);
        container.add(crystal);
      });
      container.add(this.add.rectangle(x, y + 25 * scale, 22 * scale, 5 * scale, visualStyle.secondaryAccentColor, 0.84)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.62));
      container.add(this.add.circle(x + 10 * scale, y + 10 * scale, 2.2 * scale, visualStyle.bodyColor, 0.5));
      return;
    }

    if (level === 7) {
      container.add(this.add.ellipse(x, y - 9 * scale, 60 * scale, 23 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.accentColor, 0.86));
      [
        [-18, -12],
        [-5, -20],
        [10, -14],
        [21, -6],
      ].forEach(([starX, starY], index) => {
        container.add(this.add.star(
          x + starX * scale,
          y + starY * scale,
          5,
          (2.2 + index * 0.15) * scale,
          (4.7 + index * 0.22) * scale,
          index % 2 === 0 ? visualStyle.accentColor : visualStyle.secondaryAccentColor,
          0.95,
        ));
      });
      container.add(this.add.ellipse(x, y - 7 * scale, 38 * scale, 12 * scale, visualStyle.secondaryAccentColor, 0.16));
      container.add(this.add.rectangle(x, y + 25 * scale, 24 * scale, 5 * scale, visualStyle.secondaryAccentColor, 0.86)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.62));
      container.add(this.add.circle(x - 11 * scale, y + 10 * scale, 2 * scale, visualStyle.accentColor, 0.64));
      container.add(this.add.circle(x + 11 * scale, y + 10 * scale, 2 * scale, visualStyle.accentColor, 0.64));
      return;
    }

    if (level >= 8) {
      container.add(this.add.ellipse(x, y - 9 * scale, 66 * scale, 25 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.accentColor, 0.9));
      container.add(this.add.ellipse(x, y - 8 * scale, 46 * scale, 14 * scale, visualStyle.secondaryAccentColor, 0.18));
      container.add(this.add.rectangle(x, y - 29 * scale, 28 * scale, 6 * scale, visualStyle.accentColor, 0.94)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.72));
      [-13, 0, 13].forEach((crownX, index) => {
        container.add(this.add.triangle(
          x + crownX * scale,
          y - 34 * scale,
          0,
          8 * scale,
          5 * scale,
          -6 * scale,
          10 * scale,
          8 * scale,
          index === 1 ? visualStyle.secondaryAccentColor : visualStyle.accentColor,
          0.95,
        ).setStrokeStyle(1, visualStyle.strokeColor, 0.65));
      });
      container.add(this.add.ellipse(x, y + 25 * scale, 34 * scale, 7 * scale, visualStyle.secondaryAccentColor, 0.9)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.62));
      container.add(this.add.ellipse(x - 17 * scale, y + 12 * scale, 5 * scale, 15 * scale, visualStyle.accentColor, 0)
        .setStrokeStyle(1, visualStyle.accentColor, 0.66));
      container.add(this.add.ellipse(x + 17 * scale, y + 12 * scale, 5 * scale, 15 * scale, visualStyle.accentColor, 0)
        .setStrokeStyle(1, visualStyle.accentColor, 0.66));
      return;
    }

    if (level === 5) {
      container.add(this.add.ellipse(x, y - 9 * scale, 55 * scale, 20 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, 0xf2e08f, 0.8));
      container.add(this.add.circle(x - 16 * scale, y - 11 * scale, 4.2 * scale, 0xf6dc85, 0.95)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.4));
      container.add(this.add.circle(x, y - 18 * scale, 5 * scale, 0xffee9c, 0.95)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.4));
      container.add(this.add.circle(x + 16 * scale, y - 8 * scale, 4.2 * scale, 0xf6dc85, 0.95)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.4));
      container.add(this.add.rectangle(x, y + 25 * scale, 26 * scale, 5 * scale, 0x9fcb73, 0.85)
        .setStrokeStyle(1, 0x3f6a31, 0.65));
    }
  }

  private addSlimeDecorations(
    container: Phaser.GameObjects.Container,
    level: number,
    visualStyle: MonsterVisualStyle,
    x = 0,
    y = 0,
    scale = 1,
  ): void {
    const strokeWidth = Math.max(1, Math.round(2 * scale));

    if (level === 2) {
      container.add(this.add.circle(x, y - 18 * scale, 7 * scale, 0xd7f5ff, 0.95)
        .setStrokeStyle(strokeWidth, visualStyle.strokeColor, 0.8));
      return;
    }

    if (level === 3) {
      container.add(this.add.star(x, y - 2 * scale, 5, 9 * scale, 15 * scale, 0xf7e27c, 0.9)
        .setStrokeStyle(strokeWidth, 0x7d5f16, 0.8));
      return;
    }

    if (level === 4) {
      container.add(this.add.triangle(x - 17 * scale, y - 18 * scale, 0, 13 * scale, 8 * scale, -8 * scale, 16 * scale, 13 * scale, 0xffdf9c, 0.96)
        .setStrokeStyle(strokeWidth, 0x8d5a24, 0.85));
      container.add(this.add.triangle(x + 17 * scale, y - 18 * scale, 0, 13 * scale, 8 * scale, -8 * scale, 16 * scale, 13 * scale, 0xffdf9c, 0.96)
        .setStrokeStyle(strokeWidth, 0x8d5a24, 0.85));
      return;
    }

    if (level === 5) {
      container.add(this.add.rectangle(x, y - 22 * scale, 28 * scale, 8 * scale, 0xf7d35f, 0.98)
        .setStrokeStyle(strokeWidth, 0x8f6b18, 0.9));
      container.add(this.add.triangle(x - 10 * scale, y - 28 * scale, 0, 12 * scale, 6 * scale, -7 * scale, 12 * scale, 12 * scale, 0xf7d35f, 0.98)
        .setStrokeStyle(strokeWidth, 0x8f6b18, 0.85));
      container.add(this.add.triangle(x, y - 31 * scale, 0, 14 * scale, 7 * scale, -8 * scale, 14 * scale, 14 * scale, 0xffe98d, 0.98)
        .setStrokeStyle(strokeWidth, 0x8f6b18, 0.85));
      container.add(this.add.triangle(x + 10 * scale, y - 28 * scale, 0, 12 * scale, 6 * scale, -7 * scale, 12 * scale, 12 * scale, 0xf7d35f, 0.98)
        .setStrokeStyle(strokeWidth, 0x8f6b18, 0.85));
      container.add(this.add.circle(x, y - 23 * scale, 2.4 * scale, 0xe94c74, 0.95));
      return;
    }

    if (level === 6) {
      container.add(this.add.triangle(x - 14 * scale, y - 19 * scale, 0, 17 * scale, 6 * scale, -12 * scale, 12 * scale, 17 * scale, 0xd7fbff, 0.95)
        .setStrokeStyle(strokeWidth, 0x257a93, 0.85));
      container.add(this.add.triangle(x, y - 24 * scale, 0, 20 * scale, 7 * scale, -14 * scale, 14 * scale, 20 * scale, 0xb7f4ff, 0.98)
        .setStrokeStyle(strokeWidth, 0x257a93, 0.9));
      container.add(this.add.triangle(x + 14 * scale, y - 19 * scale, 0, 17 * scale, 6 * scale, -12 * scale, 12 * scale, 17 * scale, 0xd7fbff, 0.95)
        .setStrokeStyle(strokeWidth, 0x257a93, 0.85));
      return;
    }

    if (level === 7) {
      container.add(this.add.ellipse(x - 14 * scale, y + 1 * scale, 9 * scale, 15 * scale, 0xf0dca4, 0)
        .setStrokeStyle(strokeWidth, 0xf0dca4, 0.8));
      container.add(this.add.ellipse(x + 14 * scale, y + 1 * scale, 9 * scale, 15 * scale, 0xf0dca4, 0)
        .setStrokeStyle(strokeWidth, 0xf0dca4, 0.8));
      container.add(this.add.circle(x, y - 13 * scale, 5 * scale, 0xf0dca4, 0)
        .setStrokeStyle(strokeWidth, 0xf0dca4, 0.85));
      container.add(this.add.circle(x, y - 13 * scale, 2 * scale, 0xf0dca4, 0.9));
      return;
    }

    if (level === 8) {
      container.add(this.add.ellipse(x, y - 3 * scale, 52 * scale, 18 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.accentColor, 0.78));
      container.add(this.add.star(x - 12 * scale, y - 13 * scale, 5, 3 * scale, 6 * scale, visualStyle.secondaryAccentColor, 0.95));
      container.add(this.add.star(x + 14 * scale, y + 3 * scale, 5, 3 * scale, 6 * scale, visualStyle.accentColor, 0.95));
      return;
    }

    if (level === 9) {
      container.add(this.add.ellipse(x, y - 3 * scale, 54 * scale, 19 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.accentColor, 0.8));
      [
        [-21, -8, 3.4],
        [-6, -15, 2.7],
        [15, -4, 3.8],
        [23, -14, 2.5],
      ].forEach(([orbX, orbY, radius]) => {
        container.add(this.add.circle(
          x + orbX * scale,
          y + orbY * scale,
          radius * scale,
          visualStyle.accentColor,
          0.94,
        ).setStrokeStyle(1, visualStyle.secondaryAccentColor, 0.62));
      });
      container.add(this.add.ellipse(x, y + 5 * scale, 30 * scale, 8 * scale, visualStyle.secondaryAccentColor, 0.2));
      return;
    }

    if (level === 10) {
      container.add(this.add.star(x, y - 5 * scale, 12, 23 * scale, 30 * scale, visualStyle.secondaryAccentColor, 0.24));
      container.add(this.add.ellipse(x, y - 4 * scale, 52 * scale, 18 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.accentColor, 0.86));
      container.add(this.add.circle(x, y - 18 * scale, 6 * scale, visualStyle.accentColor, 0.96)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.62));
      container.add(this.add.rectangle(x, y - 25 * scale, 30 * scale, 5 * scale, visualStyle.accentColor, 0.88)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.55));
      return;
    }

    if (level === 11) {
      container.add(this.add.ellipse(x, y - 3 * scale, 56 * scale, 21 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.accentColor, 0.84));
      container.add(this.add.ellipse(x, y - 4 * scale, 34 * scale, 13 * scale, visualStyle.secondaryAccentColor, 0.25));
      container.add(this.add.circle(x - 18 * scale, y - 15 * scale, 3.2 * scale, visualStyle.accentColor, 0.95));
      container.add(this.add.circle(x + 20 * scale, y + 2 * scale, 3.2 * scale, visualStyle.secondaryAccentColor, 0.95));
      container.add(this.add.rectangle(x, y - 23 * scale, 28 * scale, 5 * scale, visualStyle.accentColor, 0.82)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.6));
      return;
    }

    if (level >= 12) {
      container.add(this.add.ellipse(x, y - 4 * scale, 60 * scale, 22 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.accentColor, 0.9));
      container.add(this.add.ellipse(x, y - 5 * scale, 44 * scale, 13 * scale, visualStyle.secondaryAccentColor, 0.2));
      container.add(this.add.rectangle(x, y - 25 * scale, 32 * scale, 6 * scale, visualStyle.accentColor, 0.9)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.68));
      [-12, 0, 12].forEach((crownX, index) => {
        container.add(this.add.triangle(
          x + crownX * scale,
          y - 31 * scale,
          0,
          10 * scale,
          5 * scale,
          -7 * scale,
          10 * scale,
          10 * scale,
          index === 1 ? visualStyle.secondaryAccentColor : visualStyle.accentColor,
          0.94,
        ).setStrokeStyle(1, visualStyle.strokeColor, 0.65));
      });
      container.add(this.add.star(x - 20 * scale, y - 12 * scale, 5, 2.8 * scale, 5.8 * scale, visualStyle.secondaryAccentColor, 0.95));
      container.add(this.add.star(x + 23 * scale, y - 2 * scale, 5, 2.8 * scale, 5.8 * scale, visualStyle.accentColor, 0.95));
    }
  }

  private isFarmFull(): boolean {
    return this.getUnlockedFarmSlots().every((slot) => slot.monster !== null);
  }

  private showFullFarmMessage(): void {
    this.showFarmMessage(this.expansionUnlocked ? 'Farm is full' : 'Farm full - unlock slots', 'warning');
  }

  private showNotEnoughCoinsMessage(): void {
    this.showFarmMessage('Not enough coins', 'warning');
  }

  private showFarmMessage(message: string, variant: ToastVariant = 'info'): void {
    this.showToast(message, variant);
  }

  private hideFarmMessage(): void {
    this.clearToast();
  }

  private showToast(message: string, variant: ToastVariant = 'info'): void {
    this.clearToast();

    const fillColor = this.getToastFillColor(variant);
    const borderColor = variant === 'success' ? 0xc9f5b5 : variant === 'warning' ? 0xffe0a0 : THEME.panelBorder;
    const layout = this.getLayout();
    const toastWidth = Math.min(280, Math.max(220, this.scale.width - 28));
    const toastHeight = layout.isNarrow ? 44 : 38;
    const x = this.scale.width / 2;
    const preferredY = layout.isNarrow ? layout.hatchY - 26 : layout.gridStartY - 28;
    const y = Phaser.Math.Clamp(preferredY, 116, this.scale.height - 104);

    const container = this.add.container(x, y).setDepth(80).setAlpha(0);
    const shadow = this.add.rectangle(2, 3, toastWidth, toastHeight, THEME.shadow, 0.28);
    const background = this.add.rectangle(0, 0, toastWidth, toastHeight, fillColor, 0.96)
      .setStrokeStyle(2, borderColor, 0.95)
      .setInteractive({ useHandCursor: false });
    const text = this.add.text(0, 0, message, {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: this.scale.width < 380 ? '13px' : '15px',
      fontStyle: 'bold',
      align: 'center',
      fixedWidth: toastWidth - 24,
      wordWrap: {
        width: toastWidth - 24,
        useAdvancedWrap: true,
      },
    }).setOrigin(0.5);

    background.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
    });

    container.add([shadow, background, text]);
    this.toastContainer = container;

    this.toastTween = this.tweens.add({
      targets: container,
      alpha: 1,
      y: y - 4,
      duration: 120,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.toastTween = this.tweens.add({
          targets: container,
          alpha: 0,
          y: y - 18,
          delay: 1350,
          duration: 260,
          ease: 'Sine.easeIn',
          onComplete: () => {
            if (this.toastContainer === container) {
              this.clearToast();
            }
          },
        });
      },
    });
  }

  private getToastFillColor(variant: ToastVariant): number {
    if (variant === 'success') {
      return THEME.success;
    }

    if (variant === 'warning') {
      return THEME.warning;
    }

    return THEME.panelAlt;
  }

  private clearToast(): void {
    this.toastTween?.stop();
    this.toastTween = undefined;
    this.toastContainer?.destroy();
    this.toastContainer = undefined;
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
    if (
      sourceSlotId === targetSlotId
      || targetSlotId < 0
      || !this.isSlotUnlocked(sourceSlotId)
      || !this.isSlotUnlocked(targetSlotId)
    ) {
      return false;
    }

    const sourceMonster = this.farmSlots[sourceSlotId]?.monster;
    const targetMonster = this.farmSlots[targetSlotId]?.monster;

    return Boolean(this.getMergeResultDefinition(sourceMonster, targetMonster));
  }

  private canMoveSlots(sourceSlotId: number, targetSlotId: number): boolean {
    if (
      sourceSlotId === targetSlotId
      || targetSlotId < 0
      || !this.isSlotUnlocked(sourceSlotId)
      || !this.isSlotUnlocked(targetSlotId)
    ) {
      return false;
    }

    return Boolean(this.farmSlots[sourceSlotId]?.monster && this.farmSlots[targetSlotId]?.monster === null);
  }

  private moveSlotMonster(sourceSlotId: number, targetSlotId: number): void {
    const sourceMonster = this.farmSlots[sourceSlotId]?.monster;

    if (!sourceMonster || !this.isSlotUnlocked(targetSlotId) || this.farmSlots[targetSlotId]?.monster) {
      return;
    }

    this.clearSelectedSlot();
    this.farmSlots[sourceSlotId].monster = null;
    this.farmSlots[targetSlotId].monster = sourceMonster;

    this.clearMonsterVisual(sourceSlotId);
    this.renderMonsterInSlot(this.farmSlots[targetSlotId]);
    this.updateHud();
    this.skipSavingUntilProgress = false;
    this.saveProgress();
  }

  private mergeSlots(sourceSlotId: number, targetSlotId: number): void {
    const nextMonsterDefinition = this.getMergeResultDefinition(
      this.farmSlots[sourceSlotId]?.monster,
      this.farmSlots[targetSlotId]?.monster,
    );

    if (!nextMonsterDefinition) {
      return;
    }

    this.clearSelectedSlot();
    this.farmSlots[sourceSlotId].monster = null;
    this.farmSlots[targetSlotId].monster = this.createMonsterInstance(nextMonsterDefinition);
    this.discoverMonster(nextMonsterDefinition);

    this.clearMonsterVisual(sourceSlotId);
    this.renderMonsterInSlot(this.farmSlots[targetSlotId]);
    audioSystem.playMerge();
    this.showMergeFeedback(targetSlotId);
    this.incrementMissionProgress('merge-1');
    this.evaluateMonsterMissions(nextMonsterDefinition);
    this.updateHud();
    this.showOnboardingHint('upgrades', 'Upgrade Shop boosts your farm production.');
    this.skipSavingUntilProgress = false;
    this.saveProgress();
  }

  private getMergeResultDefinition(
    sourceMonster: MonsterInstance | null | undefined,
    targetMonster: MonsterInstance | null | undefined,
  ): MonsterDefinition | undefined {
    if (!sourceMonster || !targetMonster) {
      return undefined;
    }

    if (sourceMonster.family !== targetMonster.family || sourceMonster.level !== targetMonster.level) {
      return undefined;
    }

    return getNextMonsterDefinition(sourceMonster.family, sourceMonster.level);
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

  private showMergeFeedback(slotId: number): void {
    const center = this.slotCenters[slotId];
    const popup = this.add.text(center.x, center.y - 42, 'Merge!', {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
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

      const slot = this.farmSlots[slotId];
      slot.monster = this.createMonsterInstance(monsterDefinition);
      this.discoverMonster(monsterDefinition);
      this.renderMonsterInSlot(slot);
    });

    this.upgradeLevels = {
      ...this.createInitialUpgradeLevels(),
      ...saveData.upgrades,
    };
    this.monsterEssence = saveData.monsterEssence;
    this.essencePowerLevel = saveData.essencePowerLevel;
    this.currentEggCost = this.sanitizeEggCost(saveData.currentEggCost);
    this.onboardingHintsSeen = new Set(saveData.onboardingHintsSeen);
    this.missionProgress = {
      ...this.createInitialMissionProgress(),
      ...saveData.missionProgress,
    };
    this.completedMissionIds = new Set(saveData.completedMissionIds);
    this.claimedMissionIds = new Set(saveData.claimedMissionIds);
    this.claimedMissionIds.forEach((missionId) => {
      this.completedMissionIds.add(missionId);
    });
    this.syncMissionStateFromCurrentProgress(false);
    this.unlockedZones = new Set(saveData.unlockedZones);
    this.currentZone = saveData.currentZone;
    this.hasPrestigedOnce = saveData.hasPrestigedOnce;
    this.syncZoneUnlockFromPrestigeProgress();
    this.createFarmBackground();

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
          this.showOnboardingHint('offline', 'Your monsters can earn while you are away.');
        });
      }
    }

    if (!this.isHatchReady()) {
      this.hatchCooldownMs = Phaser.Math.Clamp(
        this.hatchCooldownMs + elapsedMilliseconds,
        0,
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

    writeSaveData({
      version: SAVE_VERSION,
      coins: this.sanitizeCoins(this.currency.coins),
      grid: this.farmSlots.map((slot) => {
        if (!slot.monster) {
          return null;
        }

        return {
          family: slot.monster.family,
          level: slot.monster.level,
        };
      }),
      lastActiveAt: Date.now(),
      discoveredMonsters: Array.from(this.discoveredMonsters).map((discoveryKey) => {
        const [family, level] = discoveryKey.split(':');

        return {
          family: family as MonsterFamily,
          level: Number(level),
        };
      }),
      upgrades: this.getSanitizedUpgradeLevels(),
      monsterEssence: this.sanitizePrestigeInteger(this.monsterEssence),
      essencePowerLevel: this.sanitizePrestigeInteger(this.essencePowerLevel),
      currentEggCost: this.sanitizeEggCost(this.currentEggCost),
      onboardingHintsSeen: Array.from(this.onboardingHintsSeen),
      expansionUnlocked: this.expansionUnlocked,
      missionProgress: this.getSanitizedMissionProgress(),
      completedMissionIds: Array.from(this.completedMissionIds),
      claimedMissionIds: Array.from(this.claimedMissionIds),
      unlockedZones: Array.from(this.unlockedZones),
      currentZone: this.currentZone,
      hasPrestigedOnce: this.hasPrestigedOnce,
    });

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
    this.discoveredMonsters = new Set<DiscoveryKey>();
    this.onboardingHintsSeen = new Set<OnboardingHintId>();
    this.upgradeLevels = this.createInitialUpgradeLevels();
    this.missionProgress = this.createInitialMissionProgress();
    this.completedMissionIds = new Set<MissionId>();
    this.claimedMissionIds = new Set<MissionId>();
    this.unlockedZones = new Set<ZoneId>([GRASS_FARM_ZONE_ID]);
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
    this.createExpansionPlaceholder();
    this.createFarmBackground();

    this.hideFarmMessage();
    this.clearSelectedSlot();
    this.closeCompendiumPanel();
    this.closeHelpPanel();
    this.closeZonePanel();
    this.closeMissionsPanel();
    this.closeUpgradeShopPanel();
    this.closePrestigePanel();
    this.closeNavigationMenuPanel();
    this.closeEconomyDebugPanel();
    this.updateHatchCooldownUi();
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
    if (!Number.isFinite(elapsedMilliseconds) || elapsedMilliseconds <= 0) {
      return 0;
    }

    const elapsedSeconds = Math.floor(elapsedMilliseconds / MILLISECONDS_PER_SECOND);
    const cappedElapsedSeconds = Math.min(elapsedSeconds, this.getOfflineCapSeconds());
    const incomePerSecond = this.getTotalIncomePerSecond();
    const offlineCoins = cappedElapsedSeconds * incomePerSecond;

    return this.sanitizeCoins(offlineCoins);
  }

  private showOfflineEarningsMessage(offlineCoins: number): void {
    const layout = this.getLayout();
    const popupWidth = Math.min(layout.isNarrow ? 300 : 380, this.scale.width - 32);
    const popupY = Phaser.Math.Clamp(layout.isNarrow ? 86 : 96, 52, this.scale.height - 52);
    const popup = this.add.text(
      this.scale.width / 2,
      popupY,
      `Welcome back! ${this.formatSignedCoinAmount(offlineCoins)} coins`,
      {
        color: '#fff4a8',
        fontFamily: 'Arial, sans-serif',
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
      fontFamily: 'Arial, sans-serif',
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
    return this.roundCurrency(this.farmSlots.reduce((totalIncome, slot) => {
      const income = this.getEffectiveMonsterIncome(slot.monster);

      if (!Number.isFinite(income) || income <= 0) {
        return totalIncome;
      }

      return totalIncome + income;
    }, 0));
  }

  private getEffectiveMonsterIncome(monster: MonsterInstance | null | undefined): number {
    if (!monster || !Number.isFinite(monster.incomePerSecond) || monster.incomePerSecond <= 0) {
      return 0;
    }

    return this.roundCurrency(
      monster.incomePerSecond
      * this.getFamilyIncomeMultiplier(monster.family)
      * this.getPrestigeIncomeMultiplier(),
    );
  }

  private sanitizeCoins(coins: number): number {
    if (!Number.isFinite(coins) || coins < 0) {
      return 0;
    }

    return this.roundCurrency(coins);
  }

  private sanitizePrestigeInteger(value: number): number {
    if (!Number.isFinite(value) || value < 0) {
      return 0;
    }

    return Math.floor(value);
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
    this.coinText?.setText(`Coins: ${this.formatCoinAmount(this.currency.coins)}`);
    this.incomeText?.setText(`+${this.formatCoinAmount(this.getTotalIncomePerSecond())}/sec`);
    this.updateProductionStatsUi();
    this.updateHatchCooldownUi();
  }

  private updateProductionStatsUi(): void {
    this.productionStatsText?.setText([
      `Income/sec: ${this.formatCoinAmount(this.getTotalIncomePerSecond())}`,
      `Next Egg: ${this.formatCoinAmount(this.currentEggCost)} coins`,
      `Offline Cap: ${this.formatDuration(this.getOfflineCapSeconds())}`,
    ].join('\n'));
  }
}
