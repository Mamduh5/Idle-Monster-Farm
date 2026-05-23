import Phaser from 'phaser';
import { BABY_SLIME } from '../data/monsters';
import type { CurrencyState, FarmSlotState, MonsterInstance } from '../types/game-state';

const GRID_COLUMNS = 3;
const GRID_ROWS = 3;
const CELL_SIZE = 72;
const GRID_GAP = 10;

export class FarmScene extends Phaser.Scene {
  private currency: CurrencyState = {
    coins: 0,
  };

  private coinText?: Phaser.GameObjects.Text;
  private fullFarmText?: Phaser.GameObjects.Text;
  private farmSlots: FarmSlotState[] = [];
  private slotCenters: Phaser.Math.Vector2[] = [];
  private nextMonsterId = 1;

  constructor() {
    super('FarmScene');
  }

  create(): void {
    this.nextMonsterId = 1;
    this.fullFarmText = undefined;
    this.farmSlots = this.createInitialFarmSlots();
    this.createFarmBackground();
    this.createFarmGrid();
    this.createHud();
    this.createHatchArea();
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
    this.add.rectangle(24, 20, 220, 48, 0x10291a, 0.82)
      .setOrigin(0)
      .setStrokeStyle(2, 0xd7f5a2, 0.6);

    this.coinText = this.add.text(44, 31, `Coins: ${this.currency.coins}`, {
      color: '#fff4a8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
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

    emptySlot.monster = this.createMonsterInstance();
    this.hideFullFarmMessage();
    this.renderMonsterInSlot(emptySlot);
  }

  private createMonsterInstance(): MonsterInstance {
    const monsterId = this.nextMonsterId;
    this.nextMonsterId += 1;

    return {
      ...BABY_SLIME,
      id: `monster-${monsterId}`,
    };
  }

  private renderMonsterInSlot(slot: FarmSlotState): void {
    if (!slot.monster) {
      return;
    }

    const center = this.slotCenters[slot.id];

    this.add.ellipse(center.x, center.y + 6, 44, 34, 0x2f7d40, 0.35);
    this.add.ellipse(center.x, center.y, 46, 38, 0x75d96d)
      .setStrokeStyle(3, 0x22692d, 0.95);
    this.add.circle(center.x - 11, center.y - 4, 4, 0x10291a);
    this.add.circle(center.x + 11, center.y - 4, 4, 0x10291a);

    this.add.text(center.x, center.y + 27, 'Lv 1', {
      color: '#f7ffe8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
    }).setOrigin(0.5);
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
}
