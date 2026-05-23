import Phaser from 'phaser';
import {
  BABY_SLIME,
  getMonsterDefinition,
  getNextMonsterDefinition,
  MONSTER_DEFINITIONS,
} from '../data/monsters';
import {
  clearSaveData,
  loadSaveData,
  sanitizeSavedCoins,
  SAVE_VERSION,
  writeSaveData,
} from '../systems/saveSystem';
import type {
  CurrencyState,
  FarmSlotState,
  MonsterDefinition,
  MonsterFamily,
  MonsterInstance,
} from '../types/game-state';

const GRID_COLUMNS = 3;
const GRID_ROWS = 3;
const CELL_SIZE = 72;
const GRID_GAP = 10;
const MILLISECONDS_PER_SECOND = 1000;
const SAVE_THROTTLE_MS = 5000;
const MAX_OFFLINE_SECONDS = 7200;

type MonsterVisual = Phaser.GameObjects.Container;
type DiscoveryKey = `${MonsterFamily}:${number}`;

export class FarmScene extends Phaser.Scene {
  private currency: CurrencyState = {
    coins: 0,
  };

  private coinText?: Phaser.GameObjects.Text;
  private incomeText?: Phaser.GameObjects.Text;
  private fullFarmText?: Phaser.GameObjects.Text;
  private farmSlots: FarmSlotState[] = [];
  private slotCenters: Phaser.Math.Vector2[] = [];
  private monsterVisuals: Array<MonsterVisual | null> = [];
  private selectedSlotId: number | null = null;
  private selectionHighlight?: Phaser.GameObjects.Rectangle;
  private monsterTooltip?: Phaser.GameObjects.Container;
  private nextMonsterId = 1;
  private incomeAccumulatorMs = 0;
  private saveThrottleAccumulatorMs = 0;
  private hasUnsavedProgress = false;
  private skipSavingUntilProgress = false;
  private discoveredMonsters = new Set<DiscoveryKey>();
  private compendiumPanel?: Phaser.GameObjects.Container;

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
      coins: 0,
    };
    this.nextMonsterId = 1;
    this.incomeAccumulatorMs = 0;
    this.saveThrottleAccumulatorMs = 0;
    this.hasUnsavedProgress = false;
    this.skipSavingUntilProgress = false;
    this.discoveredMonsters = new Set<DiscoveryKey>();
    this.compendiumPanel = undefined;
    this.selectedSlotId = null;
    this.selectionHighlight = undefined;
    this.monsterTooltip = undefined;
    this.fullFarmText = undefined;
    this.farmSlots = this.createInitialFarmSlots();
    this.monsterVisuals = Array.from({ length: GRID_COLUMNS * GRID_ROWS }, () => null);
    this.createFarmBackground();
    this.createFarmGrid();
    this.createHud();
    this.createHatchArea();
    this.createResetSaveControl();
    this.createCompendiumControl();
    this.loadProgress();
    this.registerPersistenceEvents();
    this.updateHud();
  }

  update(_time: number, delta: number): void {
    this.addPassiveIncome(delta);
    this.saveProgressWhenReady(delta);
  }

  private createFarmBackground(): void {
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x1f5a32).setOrigin(0);
    this.add.rectangle(0, 0, width, 92, 0x264f7a).setOrigin(0).setAlpha(0.92);
    this.add.rectangle(0, height - 96, width, 96, 0x6a4a2b).setOrigin(0).setAlpha(0.45);
  }

  private createFarmGrid(): void {
    const totalWidth = GRID_COLUMNS * CELL_SIZE + (GRID_COLUMNS - 1) * GRID_GAP;
    const startX = (this.scale.width - totalWidth) / 2;
    const startY = 126;

    this.slotCenters = [];

    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let column = 0; column < GRID_COLUMNS; column += 1) {
        const x = startX + column * (CELL_SIZE + GRID_GAP);
        const y = startY + row * (CELL_SIZE + GRID_GAP);

        const slotId = this.slotCenters.length;
        const slotTile = this.add.rectangle(x, y, CELL_SIZE, CELL_SIZE, 0x8ecf62)
          .setOrigin(0)
          .setStrokeStyle(3, 0x3c7a3f, 0.95);

        slotTile
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => {
            this.selectSlot(slotId);
          });

        this.slotCenters.push(new Phaser.Math.Vector2(x + CELL_SIZE / 2, y + CELL_SIZE / 2));
      }
    }
  }

  private createHud(): void {
    this.add.rectangle(24, 20, 220, 64, 0x10291a, 0.82)
      .setOrigin(0)
      .setStrokeStyle(2, 0xd7f5a2, 0.6);

    this.coinText = this.add.text(44, 31, `Coins: ${this.currency.coins}`, {
      color: '#fff4a8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
    });

    this.incomeText = this.add.text(44, 59, '+0/sec', {
      color: '#cdebb3',
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
    });
  }

  private createHatchArea(): void {
    const panelWidth = 260;
    const panelHeight = 76;
    const x = this.scale.width - panelWidth - 24;
    const y = this.scale.height - panelHeight - 18;

    const hatchPanel = this.add.rectangle(x, y, panelWidth, panelHeight, 0x2f2a45, 0.9)
      .setOrigin(0)
      .setStrokeStyle(3, 0xf3d06b, 0.85);

    hatchPanel
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.hatchBabySlime();
      })
      .on('pointerover', () => {
        hatchPanel.setFillStyle(0x3b3458, 0.95);
      })
      .on('pointerout', () => {
        hatchPanel.setFillStyle(0x2f2a45, 0.9);
      });

    this.add.ellipse(x + 48, y + 38, 44, 56, 0xf7e2a1)
      .setStrokeStyle(3, 0x9f6a2a, 0.95);

    this.add.text(x + 88, y + 20, 'Hatch Egg', {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
    });

    this.add.text(x + 88, y + 48, 'Placeholder button area', {
      color: '#d9d6ec',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
    });
  }

  private createResetSaveControl(): void {
    const resetText = this.add.text(this.scale.width - 24, 22, 'Reset Save', {
      color: '#f7ffe8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      backgroundColor: '#10291a',
      padding: {
        x: 10,
        y: 6,
      },
    }).setOrigin(1, 0);

    resetText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.resetProgress();
      });

    this.input.keyboard?.on('keydown-R', () => {
      this.resetProgress();
    });
  }

  private createCompendiumControl(): void {
    const compendiumText = this.add.text(this.scale.width - 24, 62, 'Compendium', {
      color: '#f7ffe8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      backgroundColor: '#10291a',
      padding: {
        x: 10,
        y: 6,
      },
    }).setOrigin(1, 0);

    compendiumText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.toggleCompendiumPanel();
      });
  }

  private createInitialFarmSlots(): FarmSlotState[] {
    return Array.from({ length: GRID_COLUMNS * GRID_ROWS }, (_, index) => ({
      id: index,
      monster: null,
    }));
  }

  private hatchBabySlime(): void {
    const emptySlot = this.farmSlots.find((slot) => slot.monster === null);

    if (!emptySlot) {
      this.showFullFarmMessage();
      return;
    }

    emptySlot.monster = this.createMonsterInstance(BABY_SLIME);
    this.discoverMonster(BABY_SLIME);
    this.hideFullFarmMessage();
    this.renderMonsterInSlot(emptySlot);
    this.updateHud();
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
    this.clearSelectedSlot();

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const panelWidth = 430;
    const panelHeight = 310;

    panel.setDepth(20);
    const panelBackground = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x14291d, 0.96)
      .setStrokeStyle(3, 0xd7f5a2, 0.75)
      .setInteractive();

    panelBackground.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
    });

    panel.add(panelBackground);

    panel.add(this.add.text(-panelWidth / 2 + 24, -panelHeight / 2 + 20, 'Monster Compendium', {
      color: '#f7ffe8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
    }));

    const closeText = this.add.text(panelWidth / 2 - 24, -panelHeight / 2 + 20, 'Close', {
      color: '#f7ffe8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      backgroundColor: '#2f2a45',
      padding: {
        x: 9,
        y: 5,
      },
    }).setOrigin(1, 0);

    closeText
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.closeCompendiumPanel();
      });

    panel.add(closeText);

    MONSTER_DEFINITIONS
      .filter((definition) => definition.family === 'Slime')
      .sort((first, second) => first.level - second.level)
      .forEach((definition, index) => {
        this.addCompendiumRow(panel, definition, -panelHeight / 2 + 78 + index * 68);
      });

    this.compendiumPanel = panel;
  }

  private closeCompendiumPanel(): void {
    this.compendiumPanel?.destroy();
    this.compendiumPanel = undefined;
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
  ): void {
    const panelWidth = 430;
    const isDiscovered = this.isMonsterDiscovered(monster);
    const rowColor = isDiscovered ? 0x234936 : 0x202726;
    const textColor = isDiscovered ? '#f7ffe8' : '#9ca79f';

    panel.add(this.add.rectangle(0, rowY, panelWidth - 48, 52, rowColor, 0.92)
      .setStrokeStyle(2, isDiscovered ? 0x8ecf62 : 0x46524b, 0.8));

    this.addCompendiumIcon(panel, monster, isDiscovered, -panelWidth / 2 + 56, rowY);

    panel.add(this.add.text(-panelWidth / 2 + 94, rowY - 17, isDiscovered ? monster.name : '???', {
      color: textColor,
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      fontStyle: 'bold',
    }));

    panel.add(this.add.text(-panelWidth / 2 + 94, rowY + 6, `Level ${monster.level}`, {
      color: textColor,
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
    }));

    panel.add(this.add.text(panelWidth / 2 - 42, rowY - 8, isDiscovered ? `+${monster.incomePerSecond}/sec` : 'Unknown', {
      color: isDiscovered ? '#fff4a8' : '#9ca79f',
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
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

    if (monster.level >= 2) {
      panel.add(this.add.circle(iconX, iconY - 14, 5, 0xd7f5ff, 0.95)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.8));
    }

    if (monster.level >= 3) {
      panel.add(this.add.star(iconX, iconY, 5, 5, 10, 0xf7e27c, 0.9)
        .setStrokeStyle(1, 0x7d5f16, 0.8));
    }
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

  private showSelectionHighlight(slotId: number): void {
    const center = this.slotCenters[slotId];

    this.selectionHighlight?.destroy();
    this.selectionHighlight = this.add.rectangle(center.x, center.y, CELL_SIZE + 8, CELL_SIZE + 8, 0xfff4a8, 0)
      .setStrokeStyle(4, 0xfff4a8, 0.95)
      .setDepth(4);
  }

  private showMonsterTooltip(slotId: number, monster: MonsterInstance): void {
    const definition = getMonsterDefinition(monster.family, monster.level) ?? monster;
    const center = this.slotCenters[slotId];
    const tooltipWidth = 220;
    const tooltipHeight = 88;
    const tooltipX = center.x + tooltipWidth + 30 > this.scale.width
      ? center.x - tooltipWidth / 2 - CELL_SIZE / 2 - 18
      : center.x + tooltipWidth / 2 + CELL_SIZE / 2 + 18;
    const tooltipY = Phaser.Math.Clamp(center.y, 72, this.scale.height - tooltipHeight / 2 - 18);

    this.monsterTooltip?.destroy();

    const tooltip = this.add.container(tooltipX, tooltipY);
    tooltip.setDepth(30);
    tooltip.add(this.add.rectangle(0, 0, tooltipWidth, tooltipHeight, 0x10291a, 0.95)
      .setStrokeStyle(2, 0xd7f5a2, 0.75));
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

    visual.add(this.add.ellipse(0, 6, visualStyle.bodyWidth, visualStyle.bodyHeight - 4, 0x2f7d40, 0.35));
    visual.add(this.add.ellipse(0, 0, visualStyle.bodyWidth, visualStyle.bodyHeight, visualStyle.bodyColor)
      .setStrokeStyle(3, visualStyle.strokeColor, 0.95));
    visual.add(this.add.circle(-11, -4, 4, 0x10291a));
    visual.add(this.add.circle(11, -4, 4, 0x10291a));

    if (monster.level >= 2) {
      visual.add(this.add.circle(0, -18, 7, 0xd7f5ff, 0.95)
        .setStrokeStyle(2, visualStyle.strokeColor, 0.8));
    }

    if (monster.level >= 3) {
      visual.add(this.add.star(0, -1, 5, 9, 15, 0xf7e27c, 0.9)
        .setStrokeStyle(2, 0x7d5f16, 0.8));
    }

    visual.add(this.add.text(0, 27, `Lv ${monster.level}`, {
      color: '#f7ffe8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    visual.setSize(CELL_SIZE, CELL_SIZE);
    visual.setInteractive(
      new Phaser.Geom.Rectangle(-CELL_SIZE / 2, -CELL_SIZE / 2, CELL_SIZE, CELL_SIZE),
      Phaser.Geom.Rectangle.Contains,
    );

    this.input.setDraggable(visual);

    let pointerDownX = 0;
    let pointerDownY = 0;
    let wasDragged = false;

    visual
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointerDownX = pointer.worldX;
        pointerDownY = pointer.worldY;
        wasDragged = false;
      })
      .on('pointerup', (pointer: Phaser.Input.Pointer) => {
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
        wasDragged = true;
        this.clearSelectedSlot();
        visual.setScale(1.08);
        visual.setDepth(10);
      })
      .on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        visual.setPosition(dragX, dragY);
      })
      .on('dragend', (pointer: Phaser.Input.Pointer) => {
        visual.setScale(1);
        visual.setDepth(0);
        this.handleMonsterDrop(slot.id, pointer.worldX, pointer.worldY, visual);
      });

    this.monsterVisuals[slot.id] = visual;
  }

  private getMonsterVisualStyle(level: number): {
    bodyColor: number;
    strokeColor: number;
    bodyWidth: number;
    bodyHeight: number;
  } {
    if (level >= 3) {
      return {
        bodyColor: 0x9c77e5,
        strokeColor: 0x523c93,
        bodyWidth: 60,
        bodyHeight: 50,
      };
    }

    if (level === 2) {
      return {
        bodyColor: 0x54c6d8,
        strokeColor: 0x1e6d83,
        bodyWidth: 54,
        bodyHeight: 46,
      };
    }

    return {
      bodyColor: 0x75d96d,
      strokeColor: 0x22692d,
      bodyWidth: 46,
      bodyHeight: 38,
    };
  }

  private showFullFarmMessage(): void {
    if (!this.fullFarmText) {
      this.fullFarmText = this.add.text(this.scale.width / 2, 96, 'Farm is full!', {
        color: '#fff4a8',
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        backgroundColor: '#10291a',
        padding: {
          x: 14,
          y: 8,
        },
      }).setOrigin(0.5);
    }

    this.fullFarmText.setVisible(true);
  }

  private hideFullFarmMessage(): void {
    this.fullFarmText?.setVisible(false);
  }

  private handleMonsterDrop(
    sourceSlotId: number,
    dropWorldX: number,
    dropWorldY: number,
    visual: MonsterVisual,
  ): void {
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
      Math.abs(worldX - center.x) <= CELL_SIZE / 2
      && Math.abs(worldY - center.y) <= CELL_SIZE / 2
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
    this.showMergeFeedback(targetSlotId);
    this.updateHud();
    this.selectSlot(targetSlotId);
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
      backgroundColor: '#1e6d83',
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

    const offlineCoins = this.calculateOfflineCoins(saveData.lastActiveAt);

    if (offlineCoins > 0) {
      this.currency.coins = this.sanitizeCoins(this.currency.coins + offlineCoins);
      this.showOfflineEarningsMessage(offlineCoins);
    }

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

    this.currency.coins = 0;
    this.nextMonsterId = 1;
    this.incomeAccumulatorMs = 0;
    this.saveThrottleAccumulatorMs = 0;
    this.hasUnsavedProgress = false;
    this.skipSavingUntilProgress = true;
    this.discoveredMonsters = new Set<DiscoveryKey>();
    this.farmSlots = this.createInitialFarmSlots();

    this.monsterVisuals.forEach((visual) => {
      visual?.destroy();
    });
    this.monsterVisuals = Array.from({ length: GRID_COLUMNS * GRID_ROWS }, () => null);

    this.hideFullFarmMessage();
    this.clearSelectedSlot();
    this.closeCompendiumPanel();
    this.updateHud();
  }

  private registerPersistenceEvents(): void {
    window.addEventListener('pagehide', this.handlePageHide);
    window.addEventListener('beforeunload', this.handlePageHide);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.saveProgress();
      window.removeEventListener('pagehide', this.handlePageHide);
      window.removeEventListener('beforeunload', this.handlePageHide);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    });
  }

  private hasAnyProgress(): boolean {
    return this.currency.coins > 0 || this.farmSlots.some((slot) => slot.monster !== null);
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
    const cappedElapsedSeconds = Math.min(elapsedSeconds, MAX_OFFLINE_SECONDS);
    const incomePerSecond = this.getTotalIncomePerSecond();
    const offlineCoins = cappedElapsedSeconds * incomePerSecond;

    return this.sanitizeCoins(offlineCoins);
  }

  private showOfflineEarningsMessage(offlineCoins: number): void {
    const popup = this.add.text(
      this.scale.width / 2,
      96,
      `Welcome back! You earned ${offlineCoins} coins while away.`,
      {
        color: '#fff4a8',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        backgroundColor: '#10291a',
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
    this.showCoinGainIndicators();
    this.hasUnsavedProgress = true;
    this.updateHud();
  }

  private showCoinGainIndicators(): void {
    this.farmSlots.forEach((slot) => {
      const income = slot.monster?.incomePerSecond ?? 0;

      if (!slot.monster || !Number.isFinite(income) || income <= 0) {
        return;
      }

      this.showCoinGainIndicator(slot.id, income);
    });
  }

  private showCoinGainIndicator(slotId: number, amount: number): void {
    const center = this.slotCenters[slotId];
    const indicator = this.add.text(center.x, center.y - 34, `+${amount}`, {
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
    return this.farmSlots.reduce((totalIncome, slot) => {
      const income = slot.monster?.incomePerSecond ?? 0;

      if (!Number.isFinite(income) || income <= 0) {
        return totalIncome;
      }

      return totalIncome + income;
    }, 0);
  }

  private sanitizeCoins(coins: number): number {
    if (!Number.isFinite(coins) || coins < 0) {
      return 0;
    }

    return Math.floor(coins);
  }

  private updateHud(): void {
    this.currency.coins = this.sanitizeCoins(this.currency.coins);
    this.coinText?.setText(`Coins: ${this.currency.coins}`);
    this.incomeText?.setText(`+${this.getTotalIncomePerSecond()}/sec`);
  }
}
