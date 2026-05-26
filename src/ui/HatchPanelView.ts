import Phaser from 'phaser';

const HATCH_PROGRESS_WIDTH = 142;

type HatchLayout = {
  hatchHeight: number;
  hatchWidth: number;
  hatchX: number;
  hatchY: number;
  isNarrow: boolean;
};

type HatchTheme = {
  panelBorder: number;
  shadow: number;
};

type HatchPanelViewOptions = {
  fontFamily: string;
  formatCoinAmount: (amount: number) => string;
  getLayout: () => HatchLayout;
  isModalOpen: () => boolean;
  onHatchClick: () => void;
  onHoverBlocked: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  theme: HatchTheme;
};

type HatchPanelState = {
  canAfford: boolean;
  cooldownMs: number;
  effectiveEggCost: number;
  expansionUnlocked: boolean;
  hatchCooldownMs: number;
  isFull: boolean;
};

export class HatchPanelView {
  private container?: Phaser.GameObjects.Container;
  private hatchPanel?: Phaser.GameObjects.Rectangle;
  private labelText?: Phaser.GameObjects.Text;
  private progressFill?: Phaser.GameObjects.Rectangle;
  private progressHeight = 8;
  private progressWidth = HATCH_PROGRESS_WIDTH;
  private statusText?: Phaser.GameObjects.Text;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: HatchPanelViewOptions,
  ) {}

  create(): void {
    this.destroy();

    const { fontFamily, theme } = this.options;
    const layout = this.options.getLayout();
    const panelWidth = layout.hatchWidth;
    const panelHeight = layout.hatchHeight;
    const x = layout.hatchX;
    const y = layout.hatchY;
    const eggX = x + Math.min(layout.isNarrow ? 40 : 48, panelWidth * 0.17);
    const eggY = y + panelHeight / 2;
    const eggWidth = layout.isNarrow ? 36 : 44;
    const eggHeight = layout.isNarrow ? 46 : 56;
    const textX = x + Math.min(layout.isNarrow ? 74 : 88, panelWidth * 0.31);
    const labelY = y + (layout.isNarrow ? 10 : 16);
    const statusY = y + (layout.isNarrow ? 32 : 44);
    const progressY = y + panelHeight - (layout.isNarrow ? 11 : 15);
    const hatchContainer = this.scene.add.container(0, 0);

    hatchContainer.add(this.scene.add.rectangle(x + 4, y + 5, panelWidth, panelHeight, theme.shadow, 0.35)
      .setOrigin(0));

    const hatchPanel = this.scene.add.rectangle(x, y, panelWidth, panelHeight, 0x49395d, 0.92)
      .setOrigin(0)
      .setStrokeStyle(3, theme.panelBorder, 0.9);
    this.hatchPanel = hatchPanel;
    hatchContainer.add(hatchPanel);

    hatchPanel
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.options.isModalOpen()) {
          return;
        }

        this.options.onHatchClick();
      })
      .on('pointerover', () => {
        if (this.options.isModalOpen()) {
          this.options.onHoverBlocked();
          return;
        }

        hatchPanel.setFillStyle(0x58456f, 0.96);
      })
      .on('pointerout', () => {
        hatchPanel.setFillStyle(0x49395d, 0.92);
      });

    hatchContainer.add(this.scene.add.ellipse(eggX + 2, eggY + 2, eggWidth, eggHeight, theme.shadow, 0.2));
    hatchContainer.add(this.scene.add.ellipse(eggX, eggY, eggWidth, eggHeight, 0xffe7a8)
      .setStrokeStyle(3, 0x9f6a2a, 0.95));
    hatchContainer.add(this.scene.add.ellipse(eggX - eggWidth * 0.18, eggY - eggHeight * 0.16, eggWidth * 0.26, eggHeight * 0.32, 0xffffff, 0.35));

    this.labelText = this.scene.add.text(textX, labelY, this.options.t('ui.hatch.label'), {
      color: '#ffffff',
      fontFamily,
      fontSize: layout.isNarrow ? '18px' : '24px',
      fontStyle: 'bold',
      fixedWidth: panelWidth - (textX - x) - 16,
    });
    hatchContainer.add(this.labelText);

    this.statusText = this.scene.add.text(textX, statusY, this.options.t('ui.hatch.ready'), {
      color: '#d9d6ec',
      fontFamily,
      fontSize: layout.isNarrow ? '11px' : '14px',
      fixedWidth: panelWidth - (textX - x) - 16,
      wordWrap: {
        width: panelWidth - (textX - x) - 16,
      },
    });
    hatchContainer.add(this.statusText);

    this.progressWidth = Math.min(HATCH_PROGRESS_WIDTH, panelWidth - (textX - x) - 18);
    this.progressHeight = layout.isNarrow ? 6 : 8;

    hatchContainer.add(this.scene.add.rectangle(textX, progressY, this.progressWidth, this.progressHeight, 0x17152a, 0.9)
      .setOrigin(0)
      .setStrokeStyle(1, 0xf3d06b, 0.55));

    this.progressFill = this.scene.add.rectangle(textX, progressY, this.progressWidth, this.progressHeight, 0x8ecf62, 0.95)
      .setOrigin(0);
    hatchContainer.add(this.progressFill);

    this.container = hatchContainer;
  }

  destroy(): void {
    this.container?.destroy();
    this.container = undefined;
    this.hatchPanel = undefined;
    this.labelText = undefined;
    this.progressFill = undefined;
    this.progressHeight = 8;
    this.progressWidth = HATCH_PROGRESS_WIDTH;
    this.statusText = undefined;
  }

  refresh(state: HatchPanelState): void {
    const progress = Phaser.Math.Clamp(state.hatchCooldownMs / state.cooldownMs, 0, 1);
    const isReady = progress >= 1;
    const statusColor = state.isFull || !state.canAfford ? '#fff4a8' : '#d9d6ec';
    const formattedEggCost = this.options.formatCoinAmount(state.effectiveEggCost);

    if (!isReady) {
      this.labelText?.setText(this.options.t('ui.hatch.hatching'));
      this.statusText?.setText(this.options.t('ui.hatch.hatchingStatus', {
        seconds: Math.ceil((state.cooldownMs - state.hatchCooldownMs) / 1000),
        amount: formattedEggCost,
      }));
    } else if (state.isFull) {
      this.labelText?.setText(this.options.t('ui.hatch.farmFull'));
      this.statusText?.setText(state.expansionUnlocked ? this.options.t('ui.hatch.mergeFreeSlot') : this.options.t('ui.hatch.unlockSlots'));
    } else if (!state.canAfford) {
      this.labelText?.setText(this.options.t('ui.hatch.needCoins'));
      this.statusText?.setText(this.options.t('ui.hatch.cost', { amount: formattedEggCost }));
    } else {
      this.labelText?.setText(this.options.t('ui.hatch.label'));
      this.statusText?.setText(this.options.t('ui.hatch.cost', { amount: formattedEggCost }));
    }

    this.statusText?.setColor(statusColor);
    this.progressFill?.setDisplaySize(this.progressWidth * progress, this.progressHeight);
    this.progressFill?.setFillStyle(isReady && state.canAfford && !state.isFull ? 0x8ecf62 : 0xf3d06b, 0.95);
  }

  resetHoverState(): void {
    this.hatchPanel?.setFillStyle(0x49395d, 0.92);
  }

  setModalOpenVisualState(isOpen: boolean): void {
    this.hatchPanel?.setAlpha(isOpen ? 0.82 : 1);
  }
}
