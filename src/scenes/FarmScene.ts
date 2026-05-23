import Phaser from 'phaser';
import { BABY_SLIME, getNextMonsterDefinition } from '../data/monsters';
import type {
  CurrencyState,
  FarmSlotState,
  MonsterDefinition,
  MonsterInstance,
} from '../types/game-state';

const GRID_COLUMNS = 3;
const GRID_ROWS = 3;
const CELL_SIZE = 72;
const GRID_GAP = 10;
const MILLISECONDS_PER_SECOND = 1000;

type MonsterVisual = Phaser.GameObjects.Container;

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
  private nextMonsterId = 1;
  private incomeAccumulatorMs = 0;

  constructor() {
    super('FarmScene');
  }

  create(): void {
    this.nextMonsterId = 1;
    this.incomeAccumulatorMs = 0;
    this.fullFarmText = undefined;
    this.farmSlots = this.createInitialFarmSlots();
    this.monsterVisuals = Array.from({ length: GRID_COLUMNS * GRID_ROWS }, () => null);
    this.createFarmBackground();
    this.createFarmGrid();
    this.createHud();
    this.createHatchArea();
  }

  update(_time: number, delta: number): void {
    this.addPassiveIncome(delta);
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

        this.add.rectangle(x, y, CELL_SIZE, CELL_SIZE, 0x8ecf62)
          .setOrigin(0)
          .setStrokeStyle(3, 0x3c7a3f, 0.95);

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
    this.hideFullFarmMessage();
    this.renderMonsterInSlot(emptySlot);
    this.updateHud();
  }

  private createMonsterInstance(definition = BABY_SLIME): MonsterInstance {
    const monsterId = this.nextMonsterId;
    this.nextMonsterId += 1;

    return {
      ...definition,
      id: `monster-${monsterId}`,
    };
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

    visual
      .on('dragstart', () => {
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

    this.farmSlots[sourceSlotId].monster = null;
    this.farmSlots[targetSlotId].monster = this.createMonsterInstance(nextMonsterDefinition);

    this.clearMonsterVisual(sourceSlotId);
    this.renderMonsterInSlot(this.farmSlots[targetSlotId]);
    this.showMergeFeedback(targetSlotId);
    this.updateHud();
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
    this.updateHud();
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
