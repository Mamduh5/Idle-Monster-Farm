import Phaser from 'phaser';
import { EGG_COST_MULTIPLIER, STARTING_EGG_COST } from '../data/economy';
import {
  BABY_SLIME,
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
const MILLISECONDS_PER_SECOND = 1000;
const SAVE_THROTTLE_MS = 5000;
const MAX_OFFLINE_SECONDS = 7200;
const HATCH_COOLDOWN_MS = 3000;
const HATCH_PROGRESS_WIDTH = 142;
const STARTING_COINS = STARTING_EGG_COST;
const MIN_HATCH_COOLDOWN_MS = 1200;
const INCOME_BOOST_PER_LEVEL = 0.1;
const HATCH_SPEED_REDUCTION_PER_LEVEL = 0.05;
const OFFLINE_STORAGE_SECONDS_PER_LEVEL = 1800;
const SHOW_DEBUG_PANEL = false;
const EXPANSION_COLUMNS = 3;
const EXPANSION_ROWS = 1;
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
type MonsterVisualStyle = {
  bodyColor: number;
  strokeColor: number;
  bodyWidth: number;
  bodyHeight: number;
};
type DiscoveryKey = `${MonsterFamily}:${number}`;
type ToastVariant = 'info' | 'success' | 'warning';
type MenuButtonVisual = {
  text: Phaser.GameObjects.Text;
  defaultBackgroundColor: string;
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
  private toastContainer?: Phaser.GameObjects.Container;
  private toastTween?: Phaser.Tweens.Tween;
  private farmSlots: FarmSlotState[] = [];
  private slotCenters: Phaser.Math.Vector2[] = [];
  private monsterVisuals: Array<MonsterVisual | null> = [];
  private selectedSlotId: number | null = null;
  private selectionHighlight?: Phaser.GameObjects.Rectangle;
  private monsterTooltip?: Phaser.GameObjects.Container;
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
  private upgradeShopPanel?: Phaser.GameObjects.Container;
  private modalOverlay?: Phaser.GameObjects.Rectangle;
  private economyDebugPanel?: Phaser.GameObjects.Container;
  private economyDebugText?: Phaser.GameObjects.Text;
  private activeDragSlotId: number | null = null;
  private activeDragVisual?: MonsterVisual;
  private upgradeLevels: Record<UpgradeId, number> = this.createInitialUpgradeLevels();
  private settings: GameSettings = loadSettings();
  private resetConfirmationArmed = false;
  private lastBlockedOutsideTapToastAt = 0;

  private readonly handlePageHide = (): void => {
    this.saveProgress();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.saveProgress();
    }
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
    this.upgradeShopPanel = undefined;
    this.modalOverlay = undefined;
    this.economyDebugPanel = undefined;
    this.economyDebugText = undefined;
    this.activeDragSlotId = null;
    this.activeDragVisual = undefined;
    this.upgradeLevels = this.createInitialUpgradeLevels();
    this.settings = loadSettings();
    this.syncAudioSettings();
    this.resetConfirmationArmed = false;
    this.lastBlockedOutsideTapToastAt = 0;
    this.selectedSlotId = null;
    this.selectionHighlight = undefined;
    this.monsterTooltip = undefined;
    this.hatchCooldownMs = HATCH_COOLDOWN_MS;
    this.hatchLabelText = undefined;
    this.hatchStatusText = undefined;
    this.hatchProgressFill = undefined;
    this.hatchPanel = undefined;
    this.menuButtons = [];
    this.productionStatsText = undefined;
    this.currentEggCost = STARTING_EGG_COST;
    this.clearToast();
    this.farmSlots = this.createInitialFarmSlots();
    this.monsterVisuals = Array.from({ length: GRID_COLUMNS * GRID_ROWS }, () => null);
    this.createFarmBackground();
    this.createFarmGrid();
    this.createExpansionPlaceholder();
    this.createHud();
    this.createHatchArea();
    this.createSettingsControl();
    this.createCompendiumControl();
    this.createHelpControl();
    this.createUpgradeShopControl();
    this.createEconomyDebugControl();
    this.registerKeyboardShortcuts();
    this.loadProgress();
    this.registerPersistenceEvents();
    this.updateHud();
    this.scheduleInitialOnboardingHints();
  }

  update(_time: number, delta: number): void {
    this.updateHatchCooldown(delta);
    this.addPassiveIncome(delta);
    this.updateOnboardingHints();
    this.saveProgressWhenReady(delta);
    this.refreshEconomyDebugPanel();
  }

  private createFarmBackground(): void {
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, THEME.grass).setOrigin(0);
    this.add.rectangle(0, 0, width, 92, THEME.sky).setOrigin(0).setAlpha(0.9);
    this.add.rectangle(0, 92, width, 18, THEME.grassPatch).setOrigin(0).setAlpha(0.7);
    this.add.rectangle(0, height - 96, width, 96, THEME.dirt).setOrigin(0).setAlpha(0.56);
    this.add.rectangle(0, height - 96, width, 8, THEME.dirtDark).setOrigin(0).setAlpha(0.3);

    const graphics = this.add.graphics();
    graphics.setDepth(-1);

    for (let x = 24; x < width; x += 72) {
      const y = 116 + ((x / 24) % 5) * 34;
      graphics.fillStyle(THEME.grassPatch, 0.24);
      graphics.fillEllipse(x, y, 34, 10);
    }

    for (let x = 36; x < width; x += 92) {
      graphics.fillStyle(THEME.dirtDark, 0.18);
      graphics.fillEllipse(x, height - 52 + (x % 3) * 5, 26, 8);
    }
  }

  private getLayout(): FarmSceneLayout {
    const width = this.scale.width;
    const height = this.scale.height;
    const isNarrow = width < 700;
    const margin = isNarrow ? 12 : 24;
    const gridGap = GRID_GAP;
    const cellSize = Math.max(
      56,
      Math.min(CELL_SIZE, Math.floor((width - margin * 2 - (GRID_COLUMNS - 1) * gridGap) / GRID_COLUMNS)),
    );
    const gridWidth = GRID_COLUMNS * cellSize + (GRID_COLUMNS - 1) * gridGap;
    const gridHeight = GRID_ROWS * cellSize + (GRID_ROWS - 1) * gridGap;
    const hudWidth = isNarrow ? 158 : 220;
    const hudHeight = isNarrow ? 56 : 64;
    const hudX = margin;
    const hudY = isNarrow ? 10 : 20;
    const statsWidth = hudWidth;
    const statsHeight = isNarrow ? 94 : 104;
    const statsX = margin;
    const statsY = isNarrow ? hudY + hudHeight + 8 : 94;
    const menuX = width - margin;
    const menuY = isNarrow ? 10 : 22;
    const menuGap = isNarrow ? 34 : 40;
    const menuButtonCount = SHOW_DEBUG_PANEL ? 5 : 4;
    const menuBottom = menuY + (menuButtonCount - 1) * menuGap + 30;
    const topContentBottom = isNarrow ? Math.max(statsY + statsHeight, menuBottom) : 126;
    const hatchWidth = Math.min(260, width - margin * 2);
    const hatchHeight = 76;
    const hatchX = isNarrow ? (width - hatchWidth) / 2 : width - hatchWidth - margin;
    const hatchY = height - hatchHeight - (isNarrow ? 12 : 18);
    const expansionHeight = (isNarrow ? 12 : 20) + (isNarrow ? 24 : 34) + cellSize;
    const maxGridStartY = hatchY - gridHeight - expansionHeight - 12;
    const minGridStartY = topContentBottom + (isNarrow ? 12 : 0);
    const gridStartY = isNarrow
      ? Math.max(minGridStartY, Math.min(minGridStartY, maxGridStartY))
      : 126;
    const expansionLabelY = gridStartY + gridHeight + (isNarrow ? 12 : 20);
    const expansionStartY = expansionLabelY + (isNarrow ? 24 : 34);

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
    const layout = this.getLayout();
    const startX = layout.gridStartX;
    const startY = layout.gridStartY;

    this.cellSize = layout.cellSize;
    this.gridGap = layout.gridGap;

    this.slotCenters = [];

    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let column = 0; column < GRID_COLUMNS; column += 1) {
        const x = startX + column * (this.cellSize + this.gridGap);
        const y = startY + row * (this.cellSize + this.gridGap);

        const slotId = this.slotCenters.length;
        this.add.rectangle(x + 4, y + 5, this.cellSize, this.cellSize, THEME.shadow, 0.24)
          .setOrigin(0);

        const slotTile = this.add.rectangle(x, y, this.cellSize, this.cellSize, THEME.slot)
          .setOrigin(0)
          .setStrokeStyle(3, THEME.slotBorder, 0.9);

        this.add.rectangle(x + 8, y + 8, this.cellSize - 16, this.cellSize - 16, THEME.slotInner, 0.22)
          .setOrigin(0);

        slotTile
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => {
            if (this.isModalOpen()) {
              return;
            }

            this.selectSlot(slotId);
          });

        this.slotCenters.push(new Phaser.Math.Vector2(x + this.cellSize / 2, y + this.cellSize / 2));
      }
    }
  }

  private createExpansionPlaceholder(): void {
    const layout = this.getLayout();
    const startX = layout.expansionStartX;
    const labelY = layout.expansionLabelY;
    const startY = layout.expansionStartY;

    this.add.text(this.scale.width / 2, labelY, layout.isNarrow ? 'Expansion - Coming soon' : 'Farm Expansion - Coming soon', {
      color: '#d9d6ec',
      fontFamily: 'Arial, sans-serif',
      fontSize: layout.isNarrow ? '14px' : '16px',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    for (let row = 0; row < EXPANSION_ROWS; row += 1) {
      for (let column = 0; column < EXPANSION_COLUMNS; column += 1) {
        const x = startX + column * (this.cellSize + this.gridGap);
        const y = startY + row * (this.cellSize + this.gridGap);

        this.add.rectangle(x + 3, y + 4, this.cellSize, this.cellSize, THEME.shadow, 0.22)
          .setOrigin(0);

        this.add.rectangle(x, y, this.cellSize, this.cellSize, THEME.locked, 0.72)
          .setOrigin(0)
          .setStrokeStyle(3, THEME.lockedBorder, 0.72);

        this.add.rectangle(x + 8, y + 8, this.cellSize - 16, this.cellSize - 16, THEME.lockedInner, 0.22)
          .setOrigin(0);

        this.add.text(x + this.cellSize / 2, y + this.cellSize / 2 - 8, 'LOCK', {
          color: '#d1d9d2',
          fontFamily: 'Arial, sans-serif',
          fontSize: layout.isNarrow ? '12px' : '14px',
          fontStyle: 'bold',
        }).setOrigin(0.5);

        this.add.text(x + this.cellSize / 2, y + this.cellSize / 2 + 13, 'Soon', {
          color: '#b4c1b8',
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
        }).setOrigin(0.5);
      }
    }
  }

  private createHud(): void {
    const layout = this.getLayout();
    const coinFontSize = layout.isNarrow ? '20px' : '24px';

    this.add.rectangle(layout.hudX + 3, layout.hudY + 4, layout.hudWidth, layout.hudHeight, THEME.shadow, 0.25)
      .setOrigin(0);

    this.add.rectangle(layout.hudX, layout.hudY, layout.hudWidth, layout.hudHeight, THEME.panel, 0.86)
      .setOrigin(0)
      .setStrokeStyle(2, THEME.panelBorder, 0.72);

    this.coinText = this.add.text(layout.hudX + 18, layout.hudY + 10, `Coins: ${this.currency.coins}`, {
      color: THEME.goldText,
      fontFamily: 'Arial, sans-serif',
      fontSize: coinFontSize,
      fontStyle: 'bold',
    });

    this.incomeText = this.add.text(layout.hudX + 18, layout.hudY + (layout.isNarrow ? 36 : 39), '+0/sec', {
      color: '#d9f6ba',
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
    });

    this.add.rectangle(layout.statsX + 3, layout.statsY + 4, layout.statsWidth, layout.statsHeight, THEME.shadow, 0.2)
      .setOrigin(0);

    this.add.rectangle(layout.statsX, layout.statsY, layout.statsWidth, layout.statsHeight, THEME.panel, 0.8)
      .setOrigin(0)
      .setStrokeStyle(2, THEME.slot, 0.62);

    this.add.text(layout.statsX + 18, layout.statsY + 10, 'Production', {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
    });

    this.productionStatsText = this.add.text(layout.statsX + 18, layout.statsY + 36, '', {
      color: THEME.mutedText,
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      lineSpacing: 5,
    });
  }

  private createHatchArea(): void {
    const layout = this.getLayout();
    const panelWidth = layout.hatchWidth;
    const panelHeight = layout.hatchHeight;
    const x = layout.hatchX;
    const y = layout.hatchY;
    const eggX = x + Math.min(48, panelWidth * 0.19);
    const textX = x + Math.min(88, panelWidth * 0.34);

    this.add.rectangle(x + 4, y + 5, panelWidth, panelHeight, THEME.shadow, 0.35)
      .setOrigin(0);

    const hatchPanel = this.add.rectangle(x, y, panelWidth, panelHeight, 0x49395d, 0.92)
      .setOrigin(0)
      .setStrokeStyle(3, THEME.panelBorder, 0.9);
    this.hatchPanel = hatchPanel;

    hatchPanel
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.isModalOpen()) {
          return;
        }

        this.playButtonClickSound();
        this.hatchBabySlime();
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

    this.add.ellipse(eggX + 2, y + 40, 44, 56, THEME.shadow, 0.2);
    this.add.ellipse(eggX, y + 38, 44, 56, 0xffe7a8)
      .setStrokeStyle(3, 0x9f6a2a, 0.95);
    this.add.ellipse(eggX - 8, y + 29, 12, 18, 0xffffff, 0.35);

    this.hatchLabelText = this.add.text(textX, y + 16, 'Hatch Egg', {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
    });

    this.hatchStatusText = this.add.text(textX, y + 44, 'Ready', {
      color: '#d9d6ec',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
    });

    this.hatchProgressWidth = Math.min(HATCH_PROGRESS_WIDTH, panelWidth - (textX - x) - 18);

    this.add.rectangle(textX, y + 61, this.hatchProgressWidth, 8, 0x17152a, 0.9)
      .setOrigin(0)
      .setStrokeStyle(1, 0xf3d06b, 0.55);

    this.hatchProgressFill = this.add.rectangle(textX, y + 61, this.hatchProgressWidth, 8, 0x8ecf62, 0.95)
      .setOrigin(0);

    this.updateHatchCooldownUi();
  }

  private createSettingsControl(): void {
    this.createMenuButton('Settings (S)', 0, () => {
      this.toggleSettingsPanel();
    });
  }

  private createCompendiumControl(): void {
    this.createMenuButton('Compendium (C)', 1, () => {
      this.toggleCompendiumPanel();
    });
  }

  private createHelpControl(): void {
    this.createMenuButton('Help (H)', 2, () => {
      this.toggleHelpPanel();
    });
  }

  private createUpgradeShopControl(): void {
    this.createMenuButton('Upgrade Shop', 3, () => {
      this.toggleUpgradeShopPanel();
    });
  }

  private createEconomyDebugControl(): void {
    if (!SHOW_DEBUG_PANEL) {
      return;
    }

    this.createMenuButton('Debug (D)', 4, () => {
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
    return Boolean(this.compendiumPanel || this.settingsPanel || this.helpPanel || this.upgradeShopPanel || this.modalOverlay);
  }

  private handleModalOverlayTap(): void {
    if (this.resetConfirmationArmed) {
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

    if (this.helpPanel) {
      this.closeHelpPanel();
      return;
    }

    if (this.compendiumPanel) {
      this.closeCompendiumPanel();
    }
  }

  private showBlockedOutsideTapToast(): void {
    if (this.time.now - this.lastBlockedOutsideTapToastAt < 1400) {
      return;
    }

    this.lastBlockedOutsideTapToastAt = this.time.now;
    this.showToast('Use Close or Reset', 'warning');
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
      this.toggleCompendiumPanel();
    });

    this.input.keyboard?.on('keydown-S', () => {
      if (this.resetConfirmationArmed) {
        return;
      }

      this.toggleSettingsPanel();
    });

    this.input.keyboard?.on('keydown-H', () => {
      if (this.resetConfirmationArmed) {
        return;
      }

      this.toggleHelpPanel();
    });

    this.input.keyboard?.on('keydown-D', () => {
      if (this.resetConfirmationArmed || !SHOW_DEBUG_PANEL) {
        return;
      }

      this.toggleEconomyDebugPanel();
    });
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
    this.closeCompendiumPanel();
    this.closeHelpPanel();
    this.closeUpgradeShopPanel();
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
      fontSize: '24px',
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
    this.closeCompendiumPanel();
    this.closeSettingsPanel();
    this.closeUpgradeShopPanel();
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
      fontSize: '24px',
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
      ['Compendium', 'Press C or click Compendium.'],
      ['Settings', 'Press S or click Settings.'],
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

  private toggleEconomyDebugPanel(): void {
    if (this.economyDebugPanel) {
      this.closeEconomyDebugPanel();
      return;
    }

    this.openEconomyDebugPanel();
  }

  private openEconomyDebugPanel(): void {
    this.closeEconomyDebugPanel();
    this.closeCompendiumPanel();
    this.closeSettingsPanel();
    this.closeHelpPanel();
    this.closeUpgradeShopPanel();
    this.clearSelectedSlot();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = this.getPanelSize(390, 310);

    panel.setDepth(28);

    this.addPanelBackground(panel, panelWidth, panelHeight, 0x2f2818, THEME.panelBorder);

    panel.add(this.add.text(-panelWidth / 2 + 20, -panelHeight / 2 + 18, 'Economy Debug', {
      color: '#fff4a8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
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
    this.closeCompendiumPanel();
    this.closeSettingsPanel();
    this.closeHelpPanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const { width: panelWidth, height: panelHeight } = this.getPanelSize(580, 390);

    panel.setDepth(24);

    this.addPanelBackground(panel, panelWidth, panelHeight);

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 20, 'Upgrade Shop', {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
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

    UPGRADE_DEFINITIONS.forEach((upgrade, index) => {
      this.addUpgradeRow(panel, upgrade, -panelHeight / 2 + 92 + index * 92, panelWidth);
    });

    this.upgradeShopPanel = panel;
    this.showOnboardingHint('upgrades', 'Upgrade Shop boosts your farm production.');
  }

  private addUpgradeRow(
    panel: Phaser.GameObjects.Container,
    upgrade: UpgradeDefinition,
    rowY: number,
    panelWidth: number,
  ): void {
    const isCompactPanel = panelWidth < 500;
    const level = this.getUpgradeLevel(upgrade.id);
    const isMaxLevel = level >= upgrade.maxLevel;
    const cost = this.getUpgradeCostForLevel(upgrade, level);
    const canAfford = this.currency.coins >= cost && !isMaxLevel;

    panel.add(this.add.rectangle(0, rowY, panelWidth - 48, isCompactPanel ? 84 : 74, THEME.panelAlt, 0.92)
      .setStrokeStyle(2, canAfford ? THEME.slot : THEME.lockedBorder, 0.78));

    panel.add(this.add.text(-panelWidth / 2 + 42, rowY - 28, upgrade.name, {
      color: '#f7ffe8',
      fontFamily: 'Arial, sans-serif',
      fontSize: isCompactPanel ? '15px' : '17px',
      fontStyle: 'bold',
      wordWrap: {
        width: isCompactPanel ? panelWidth - 170 : panelWidth - 210,
      },
    }));

    panel.add(this.add.text(-panelWidth / 2 + 42, rowY - 4, `Level ${level}/${upgrade.maxLevel}`, {
      color: '#cdebb3',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
    }));

    panel.add(this.add.text(
      -panelWidth / 2 + 42,
      rowY + 19,
      isCompactPanel ? this.getUpgradeCurrentEffectText(upgrade.id) : `${upgrade.effect} - ${this.getUpgradeCurrentEffectText(upgrade.id)}`,
      {
      color: '#d9d6ec',
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      wordWrap: {
        width: isCompactPanel ? panelWidth - 160 : Math.max(170, panelWidth - 240),
      },
      },
    ));

    panel.add(this.add.text(panelWidth / 2 - 42, rowY - 34, isMaxLevel ? 'Maxed' : `Cost: ${cost}`, {
      color: isMaxLevel ? '#cdebb3' : '#fff4a8',
      fontFamily: 'Arial, sans-serif',
      fontSize: isCompactPanel ? '13px' : '15px',
      fontStyle: 'bold',
    }).setOrigin(1, 0));

    const buyText = this.add.text(panelWidth / 2 - 42, rowY - 10, isMaxLevel ? 'MAX' : 'Buy', {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      backgroundColor: isMaxLevel
        ? `#${THEME.lockedInner.toString(16).padStart(6, '0')}`
        : canAfford
          ? `#${THEME.buttonHover.toString(16).padStart(6, '0')}`
          : `#${THEME.danger.toString(16).padStart(6, '0')}`,
      padding: {
        x: 15,
        y: 8,
      },
    }).setOrigin(1, 0);

    if (!isMaxLevel) {
      buyText
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.playButtonClickSound();
          this.buyUpgrade(upgrade.id);
        });
    }

    panel.add(buyText);
  }

  private closeUpgradeShopPanel(): void {
    if (this.upgradeShopPanel) {
      this.upgradeShopPanel.destroy();
      this.upgradeShopPanel = undefined;
      this.hideModalOverlay();
    }
  }

  private createInitialFarmSlots(): FarmSlotState[] {
    return Array.from({ length: GRID_COLUMNS * GRID_ROWS }, (_, index) => ({
      id: index,
      monster: null,
    }));
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
    this.hideFarmMessage();
    this.updateHud();
    this.saveProgress();
    this.openUpgradeShopPanel();
    this.showToast('Upgrade purchased', 'success');
  }

  private scheduleInitialOnboardingHints(): void {
    this.time.delayedCall(450, () => {
      if (this.farmSlots.some((slot) => slot.monster)) {
        this.showOnboardingHint('income', 'Monsters earn coins every second.');
        this.checkMergeOnboardingHint();
        return;
      }

      this.showOnboardingHint('welcome', 'Welcome! Build a monster farm.');

      this.time.delayedCall(1500, () => {
        if (this.farmSlots.every((slot) => slot.monster === null)) {
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
      this.showOnboardingHint('merge', 'Drag matching monsters together to merge.');
    }
  }

  private hasMergeableMonsterPair(): boolean {
    const monsterCounts = new Map<string, number>();

    this.farmSlots.forEach((slot) => {
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
      return `current income x${this.getIncomeMultiplier().toFixed(1)}`;
    }

    if (upgradeId === 'hatch-speed') {
      return `cooldown ${(this.getHatchCooldownMs() / MILLISECONDS_PER_SECOND).toFixed(1)}s`;
    }

    return `offline cap ${this.formatDuration(this.getOfflineCapSeconds())}`;
  }

  private getIncomeMultiplier(): number {
    return 1 + this.getUpgradeLevel('slime-income-boost') * INCOME_BOOST_PER_LEVEL;
  }

  private getHatchCooldownMs(): number {
    const reduction = this.getUpgradeLevel('hatch-speed') * HATCH_SPEED_REDUCTION_PER_LEVEL;
    const cooldown = HATCH_COOLDOWN_MS * Math.max(0, 1 - reduction);

    return Math.max(MIN_HATCH_COOLDOWN_MS, Math.floor(cooldown));
  }

  private getOfflineCapSeconds(): number {
    return MAX_OFFLINE_SECONDS + this.getUpgradeLevel('offline-storage') * OFFLINE_STORAGE_SECONDS_PER_LEVEL;
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

  private hatchBabySlime(): void {
    const emptySlot = this.farmSlots.find((slot) => slot.monster === null);

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

    this.currency.coins = this.sanitizeCoins(this.currency.coins - this.currentEggCost);
    emptySlot.monster = this.createMonsterInstance(BABY_SLIME);
    this.currentEggCost = this.getNextEggCost(this.currentEggCost);
    audioSystem.playHatch();
    this.discoverMonster(BABY_SLIME);
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

    if (!isReady) {
      this.hatchLabelText?.setText('Hatching...');
      this.hatchStatusText?.setText(`${Math.ceil((cooldownMs - this.hatchCooldownMs) / 1000)}s - Cost: ${this.currentEggCost}`);
    } else if (isFull) {
      this.hatchLabelText?.setText('Farm Full');
      this.hatchStatusText?.setText('Merge to free a slot');
    } else if (!canAfford) {
      this.hatchLabelText?.setText('Need Coins');
      this.hatchStatusText?.setText(`Cost: ${this.currentEggCost} coins`);
    } else {
      this.hatchLabelText?.setText('Hatch Egg');
      this.hatchStatusText?.setText(`Cost: ${this.currentEggCost} coins`);
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
    this.closeSettingsPanel();
    this.closeHelpPanel();
    this.closeUpgradeShopPanel();
    this.closeEconomyDebugPanel();
    this.cancelActiveDrag();
    this.clearSelectedSlot();
    this.showModalOverlay();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const slimeDefinitions = MONSTER_DEFINITIONS
      .filter((definition) => definition.family === 'Slime')
      .sort((first, second) => first.level - second.level);
    const { width: panelWidth, height: panelHeight } = this.getPanelSize(430, 560);
    const rowGap = Math.min(56, Math.max(44, (panelHeight - 116) / Math.max(1, slimeDefinitions.length)));
    const rowHeight = Math.min(48, rowGap - 4);
    const firstRowY = -panelHeight / 2 + 82;

    panel.setDepth(20);
    this.addPanelBackground(panel, panelWidth, panelHeight);

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 20, 'Monster Compendium', {
      color: THEME.text,
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
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

    slimeDefinitions.forEach((definition, index) => {
      this.addCompendiumRow(panel, definition, firstRowY + index * rowGap, panelWidth, rowHeight);
    });

    this.compendiumPanel = panel;
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
    const isCompactPanel = panelWidth < 390;
    const iconX = -panelWidth / 2 + (isCompactPanel ? 45 : 56);
    const textX = -panelWidth / 2 + (isCompactPanel ? 78 : 94);

    panel.add(this.add.rectangle(0, rowY, panelWidth - 48, rowHeight, rowColor, 0.92)
      .setStrokeStyle(2, isDiscovered ? THEME.slot : THEME.lockedBorder, 0.75));

    this.addCompendiumIcon(panel, monster, isDiscovered, iconX, rowY);

    panel.add(this.add.text(textX, rowY - 16, isDiscovered ? monster.name : '???', {
      color: textColor,
      fontFamily: 'Arial, sans-serif',
      fontSize: isCompactPanel ? '15px' : '16px',
      fontStyle: 'bold',
      wordWrap: {
        width: Math.max(120, panelWidth - (isCompactPanel ? 190 : 220)),
      },
    }));

    panel.add(this.add.text(textX, rowY + 5, `Level ${monster.level}`, {
      color: textColor,
      fontFamily: 'Arial, sans-serif',
      fontSize: isCompactPanel ? '12px' : '13px',
    }));

    panel.add(this.add.text(panelWidth / 2 - 42, rowY - 8, isDiscovered ? `+${monster.incomePerSecond}/sec` : 'Unknown', {
      color: isDiscovered ? '#fff4a8' : '#9ca79f',
      fontFamily: 'Arial, sans-serif',
      fontSize: isCompactPanel ? '13px' : '14px',
      fontStyle: 'bold',
    }).setOrigin(1, 0));
  }

  private addCompendiumIcon(
    panel: Phaser.GameObjects.Container,
    monster: MonsterDefinition,
    isDiscovered: boolean,
    iconX: number,
    iconY: number,
  ): void {
    if (!isDiscovered) {
      panel.add(this.add.circle(iconX, iconY, 18, 0x303735)
        .setStrokeStyle(2, 0x707a73, 0.85));
      panel.add(this.add.text(iconX, iconY - 11, '?', {
        color: '#d9d6ec',
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0));
      return;
    }

    const visualStyle = this.getMonsterVisualStyle(monster.level);

    panel.add(this.add.ellipse(iconX, iconY, 34, 28, visualStyle.bodyColor)
      .setStrokeStyle(2, visualStyle.strokeColor, 0.95));
    panel.add(this.add.circle(iconX - 7, iconY - 3, 3, 0x10291a));
    panel.add(this.add.circle(iconX + 7, iconY - 3, 3, 0x10291a));
    this.addSlimeDecorations(panel, monster.level, visualStyle, iconX, iconY, 0.55);
  }

  private selectSlot(slotId: number): void {
    const slot = this.farmSlots[slotId];

    if (!slot?.monster) {
      this.clearSelectedSlot();
      return;
    }

    this.selectedSlotId = slotId;
    this.showSelectionHighlight(slotId);
    this.showMonsterTooltip(slotId, slot.monster);
  }

  private clearSelectedSlot(): void {
    this.selectedSlotId = null;
    this.selectionHighlight?.destroy();
    this.selectionHighlight = undefined;
    this.monsterTooltip?.destroy();
    this.monsterTooltip = undefined;
  }

  private cancelActiveDrag(): void {
    if (this.activeDragSlotId === null || !this.activeDragVisual) {
      return;
    }

    this.activeDragVisual.setScale(1);
    this.activeDragVisual.setDepth(0);
    this.returnMonsterVisualToSlot(this.activeDragSlotId, this.activeDragVisual);
    this.activeDragSlotId = null;
    this.activeDragVisual = undefined;
  }

  private showSelectionHighlight(slotId: number): void {
    const center = this.slotCenters[slotId];

    this.selectionHighlight?.destroy();
    this.selectionHighlight = this.add.rectangle(center.x, center.y, this.cellSize + 8, this.cellSize + 8, 0xfff4a8, 0)
      .setStrokeStyle(4, 0xfff4a8, 0.95)
      .setDepth(4);
  }

  private showMonsterTooltip(slotId: number, monster: MonsterInstance): void {
    const definition = getMonsterDefinition(monster.family, monster.level) ?? monster;
    const center = this.slotCenters[slotId];
    const tooltipWidth = Math.min(220, this.scale.width - 24);
    const tooltipHeight = 88;
    const preferredTooltipX = center.x < this.scale.width / 2
      ? center.x + tooltipWidth / 2 + this.cellSize / 2 + 14
      : center.x - tooltipWidth / 2 - this.cellSize / 2 - 14;
    const tooltipX = Phaser.Math.Clamp(
      preferredTooltipX,
      tooltipWidth / 2 + 12,
      this.scale.width - tooltipWidth / 2 - 12,
    );
    const tooltipY = Phaser.Math.Clamp(center.y, tooltipHeight / 2 + 12, this.scale.height - tooltipHeight / 2 - 12);

    this.monsterTooltip?.destroy();

    const tooltip = this.add.container(tooltipX, tooltipY);
    tooltip.setDepth(30);
    tooltip.add(this.add.rectangle(3, 4, tooltipWidth, tooltipHeight, THEME.shadow, 0.25));
    tooltip.add(this.add.rectangle(0, 0, tooltipWidth, tooltipHeight, THEME.panel, 0.95)
      .setStrokeStyle(2, THEME.panelBorder, 0.75));
    tooltip.add(this.add.text(-tooltipWidth / 2 + 14, -tooltipHeight / 2 + 12, definition.name, {
      color: '#f7ffe8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
    }));
    tooltip.add(this.add.text(-tooltipWidth / 2 + 14, -tooltipHeight / 2 + 40, `Level ${definition.level}`, {
      color: '#cdebb3',
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
    }));
    tooltip.add(this.add.text(-tooltipWidth / 2 + 14, -tooltipHeight / 2 + 62, `Income: +${definition.incomePerSecond}/sec`, {
      color: '#fff4a8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
    }));

    this.monsterTooltip = tooltip;
  }

  private renderMonsterInSlot(slot: FarmSlotState): void {
    if (!slot.monster) {
      return;
    }

    const center = this.slotCenters[slot.id];
    const monster = slot.monster;

    this.clearMonsterVisual(slot.id);

    const visual = this.add.container(center.x, center.y);
    const visualStyle = this.getMonsterVisualStyle(monster.level);

    visual.add(this.add.ellipse(0, 8, visualStyle.bodyWidth + 6, visualStyle.bodyHeight - 2, 0x2f7d40, 0.26));
    visual.add(this.add.ellipse(0, 0, visualStyle.bodyWidth, visualStyle.bodyHeight, visualStyle.bodyColor)
      .setStrokeStyle(3, visualStyle.strokeColor, 0.95));
    visual.add(this.add.ellipse(-12, -12, 14, 9, 0xffffff, 0.28));
    visual.add(this.add.circle(-11, -4, 4, 0x10291a));
    visual.add(this.add.circle(11, -4, 4, 0x10291a));
    visual.add(this.add.circle(-10, -5, 1.5, 0xffffff, 0.85));
    visual.add(this.add.circle(12, -5, 1.5, 0xffffff, 0.85));
    visual.add(this.add.ellipse(-17, 4, 6, 4, 0xff9fb1, 0.35));
    visual.add(this.add.ellipse(17, 4, 6, 4, 0xff9fb1, 0.35));

    this.addSlimeDecorations(visual, monster.level, visualStyle);

    visual.add(this.add.text(0, 27, `Lv ${monster.level}`, {
      color: '#f7ffe8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    visual.setSize(this.cellSize, this.cellSize);
    visual.setInteractive(
      new Phaser.Geom.Rectangle(-this.cellSize / 2, -this.cellSize / 2, this.cellSize, this.cellSize),
      Phaser.Geom.Rectangle.Contains,
    );

    this.input.setDraggable(visual);

    let pointerDownX = 0;
    let pointerDownY = 0;
    let wasDragged = false;

    visual
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (this.isModalOpen()) {
          return;
        }

        pointerDownX = pointer.worldX;
        pointerDownY = pointer.worldY;
        wasDragged = false;
      })
      .on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (this.isModalOpen()) {
          return;
        }

        const movedDistance = Phaser.Math.Distance.Between(
          pointerDownX,
          pointerDownY,
          pointer.worldX,
          pointer.worldY,
        );

        if (!wasDragged && movedDistance < 8) {
          this.selectSlot(slot.id);
        }
      })
      .on('dragstart', () => {
        if (this.isModalOpen()) {
          this.returnMonsterVisualToSlot(slot.id, visual);
          return;
        }

        wasDragged = true;
        this.activeDragSlotId = slot.id;
        this.activeDragVisual = visual;
        this.clearSelectedSlot();
        visual.setScale(1.08);
        visual.setDepth(10);
      })
      .on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        if (this.isModalOpen()) {
          this.cancelActiveDrag();
          return;
        }

        visual.setPosition(dragX, dragY);
      })
      .on('dragend', (pointer: Phaser.Input.Pointer) => {
        visual.setScale(1);
        visual.setDepth(0);

        if (this.isModalOpen()) {
          this.returnMonsterVisualToSlot(slot.id, visual);
          this.activeDragSlotId = null;
          this.activeDragVisual = undefined;
          return;
        }

        this.handleMonsterDrop(slot.id, pointer.worldX, pointer.worldY, visual);
        this.activeDragSlotId = null;
        this.activeDragVisual = undefined;
      });

    this.monsterVisuals[slot.id] = visual;
  }

  private getMonsterVisualStyle(level: number): MonsterVisualStyle {
    if (level >= 8) {
      return {
        bodyColor: 0x4f4bb8,
        strokeColor: 0x24205f,
        bodyWidth: 64,
        bodyHeight: 52,
      };
    }

    if (level === 7) {
      return {
        bodyColor: 0x7bb36a,
        strokeColor: 0x395e32,
        bodyWidth: 62,
        bodyHeight: 52,
      };
    }

    if (level === 6) {
      return {
        bodyColor: 0x8ae8f2,
        strokeColor: 0x267c94,
        bodyWidth: 60,
        bodyHeight: 50,
      };
    }

    if (level === 5) {
      return {
        bodyColor: 0xf0a45d,
        strokeColor: 0x945024,
        bodyWidth: 62,
        bodyHeight: 50,
      };
    }

    if (level === 4) {
      return {
        bodyColor: 0x9ee45d,
        strokeColor: 0x4b8732,
        bodyWidth: 58,
        bodyHeight: 48,
      };
    }

    if (level === 3) {
      return {
        bodyColor: 0xb28df0,
        strokeColor: 0x6543a1,
        bodyWidth: 60,
        bodyHeight: 50,
      };
    }

    if (level === 2) {
      return {
        bodyColor: 0x66d8e7,
        strokeColor: 0x247a8d,
        bodyWidth: 54,
        bodyHeight: 46,
      };
    }

    return {
      bodyColor: 0x80e278,
      strokeColor: 0x2e7a35,
      bodyWidth: 46,
      bodyHeight: 38,
    };
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

    if (level >= 8) {
      container.add(this.add.ellipse(x, y - 3 * scale, 52 * scale, 18 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, 0xb9d9ff, 0.78));
      container.add(this.add.star(x - 12 * scale, y - 13 * scale, 5, 3 * scale, 6 * scale, 0xfff4a8, 0.95));
      container.add(this.add.star(x + 14 * scale, y + 3 * scale, 5, 3 * scale, 6 * scale, 0xd7f5ff, 0.95));
      container.add(this.add.circle(x + 22 * scale, y - 7 * scale, 3.5 * scale, 0xff8bc8, 0.95)
        .setStrokeStyle(1, 0xffffff, 0.65));
    }
  }

  private isFarmFull(): boolean {
    return this.farmSlots.every((slot) => slot.monster !== null);
  }

  private showFullFarmMessage(): void {
    this.showFarmMessage('Farm is full', 'warning');
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
    const toastHeight = 38;
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
      fontSize: this.scale.width < 380 ? '14px' : '15px',
      fontStyle: 'bold',
      align: 'center',
      fixedWidth: toastWidth - 24,
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

    if (targetSlotId === null || !this.canMergeSlots(sourceSlotId, targetSlotId)) {
      this.returnMonsterVisualToSlot(sourceSlotId, visual);
      return;
    }

    this.mergeSlots(sourceSlotId, targetSlotId);
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
    if (sourceSlotId === targetSlotId || targetSlotId < 0) {
      return false;
    }

    const sourceMonster = this.farmSlots[sourceSlotId]?.monster;
    const targetMonster = this.farmSlots[targetSlotId]?.monster;

    return Boolean(this.getMergeResultDefinition(sourceMonster, targetMonster));
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
    this.updateHud();
    this.selectSlot(targetSlotId);
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
    this.currentEggCost = this.sanitizeEggCost(saveData.currentEggCost);
    this.onboardingHintsSeen = new Set(saveData.onboardingHintsSeen);

    const offlineCoins = this.calculateOfflineCoins(saveData.lastActiveAt);

    if (offlineCoins > 0) {
      this.currency.coins = this.sanitizeCoins(this.currency.coins + offlineCoins);
      this.showOfflineEarningsMessage(offlineCoins);
      this.time.delayedCall(1800, () => {
        this.showOnboardingHint('offline', 'Your monsters can earn while you are away.');
      });
    }

    this.ensureStarterCoinsForEmptyFarm();
    this.saveProgress();
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
      currentEggCost: this.sanitizeEggCost(this.currentEggCost),
      onboardingHintsSeen: Array.from(this.onboardingHintsSeen),
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
    this.discoveredMonsters = new Set<DiscoveryKey>();
    this.onboardingHintsSeen = new Set<OnboardingHintId>();
    this.upgradeLevels = this.createInitialUpgradeLevels();
    this.currentEggCost = STARTING_EGG_COST;
    this.farmSlots = this.createInitialFarmSlots();

    this.monsterVisuals.forEach((visual) => {
      visual?.destroy();
    });
    this.monsterVisuals = Array.from({ length: GRID_COLUMNS * GRID_ROWS }, () => null);

    this.hideFarmMessage();
    this.clearSelectedSlot();
    this.closeCompendiumPanel();
    this.closeHelpPanel();
    this.closeUpgradeShopPanel();
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
      this.clearToast();
      window.removeEventListener('pagehide', this.handlePageHide);
      window.removeEventListener('beforeunload', this.handlePageHide);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    });
  }

  private hasAnyProgress(): boolean {
    return (
      this.currency.coins !== STARTING_COINS
      || this.currentEggCost !== STARTING_EGG_COST
      || this.farmSlots.some((slot) => slot.monster !== null)
    );
  }

  private ensureStarterCoinsForEmptyFarm(): void {
    if (this.farmSlots.some((slot) => slot.monster !== null) || this.currency.coins >= STARTING_EGG_COST) {
      return;
    }

    this.currency.coins = STARTING_COINS;
  }

  private calculateOfflineCoins(lastActiveAt: number): number {
    if (!Number.isFinite(lastActiveAt) || lastActiveAt < 0) {
      return 0;
    }

    const elapsedMilliseconds = Date.now() - lastActiveAt;

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
    const popup = this.add.text(
      this.scale.width / 2,
      96,
      `Welcome back! You earned ${this.formatCoinAmount(offlineCoins)} coins while away.`,
      {
        color: '#fff4a8',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        backgroundColor: `#${THEME.panel.toString(16).padStart(6, '0')}`,
        padding: {
          x: 14,
          y: 8,
        },
      },
    ).setOrigin(0.5);

    this.tweens.add({
      targets: popup,
      y: popup.y - 20,
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
    const indicator = this.add.text(center.x, center.y - 34, `+${this.formatCoinAmount(amount)}`, {
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
    const baseIncome = this.farmSlots.reduce((totalIncome, slot) => {
      const income = slot.monster?.incomePerSecond ?? 0;

      if (!Number.isFinite(income) || income <= 0) {
        return totalIncome;
      }

      return totalIncome + income;
    }, 0);

    return this.roundCurrency(baseIncome * this.getIncomeMultiplier());
  }

  private getEffectiveMonsterIncome(monster: MonsterInstance | null | undefined): number {
    if (!monster || !Number.isFinite(monster.incomePerSecond) || monster.incomePerSecond <= 0) {
      return 0;
    }

    return this.roundCurrency(monster.incomePerSecond * this.getIncomeMultiplier());
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

    if (Number.isInteger(safeCoins)) {
      return `${safeCoins}`;
    }

    return safeCoins.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
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
      `Next Egg: ${this.currentEggCost} coins`,
      `Offline Cap: ${this.formatDuration(this.getOfflineCapSeconds())}`,
    ].join('\n'));
  }
}
