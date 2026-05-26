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
    const eggX = x + Math.min(48, panelWidth * 0.19);
    const textX = x + Math.min(88, panelWidth * 0.34);
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

    hatchContainer.add(this.scene.add.ellipse(eggX + 2, y + 40, 44, 56, theme.shadow, 0.2));
    hatchContainer.add(this.scene.add.ellipse(eggX, y + 38, 44, 56, 0xffe7a8)
      .setStrokeStyle(3, 0x9f6a2a, 0.95));
    hatchContainer.add(this.scene.add.ellipse(eggX - 8, y + 29, 12, 18, 0xffffff, 0.35));

    this.labelText = this.scene.add.text(textX, y + 16, this.options.t('ui.hatch.label'), {
      color: '#ffffff',
      fontFamily,
      fontSize: layout.isNarrow ? '21px' : '24px',
      fontStyle: 'bold',
      fixedWidth: panelWidth - (textX - x) - 16,
    });
    hatchContainer.add(this.labelText);

    this.statusText = this.scene.add.text(textX, y + 44, this.options.t('ui.hatch.ready'), {
      color: '#d9d6ec',
      fontFamily,
      fontSize: layout.isNarrow ? '12px' : '14px',
      fixedWidth: panelWidth - (textX - x) - 16,
      wordWrap: {
        width: panelWidth - (textX - x) - 16,
      },
    });
    hatchContainer.add(this.statusText);

    this.progressWidth = Math.min(HATCH_PROGRESS_WIDTH, panelWidth - (textX - x) - 18);

    hatchContainer.add(this.scene.add.rectangle(textX, y + 61, this.progressWidth, 8, 0x17152a, 0.9)
      .setOrigin(0)
      .setStrokeStyle(1, 0xf3d06b, 0.55));

    this.progressFill = this.scene.add.rectangle(textX, y + 61, this.progressWidth, 8, 0x8ecf62, 0.95)
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
    this.progressFill?.setDisplaySize(this.progressWidth * progress, 8);
    this.progressFill?.setFillStyle(isReady && state.canAfford && !state.isFull ? 0x8ecf62 : 0xf3d06b, 0.95);
  }

  resetHoverState(): void {
    this.hatchPanel?.setFillStyle(0x49395d, 0.92);
  }

  setModalOpenVisualState(isOpen: boolean): void {
    this.hatchPanel?.setAlpha(isOpen ? 0.82 : 1);
  }
}
