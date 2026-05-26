import Phaser from 'phaser';

type TapFarmLayout = {
  isNarrow: boolean;
  tapFarmHeight: number;
  tapFarmWidth: number;
  tapFarmX: number;
  tapFarmY: number;
};

type TapFarmTheme = {
  button: number;
  buttonHover: number;
  panelBorder: number;
  shadow: number;
};

type TapFarmViewOptions = {
  fontFamily: string;
  getLayout: () => TapFarmLayout;
  getTapFarmEnergyRatio: () => number;
  getTapFarmStatusText: () => string;
  isDraggingMonster: () => boolean;
  isModalOpen: () => boolean;
  onHoverBlocked: () => void;
  onTapFarmClick: (pointer: Phaser.Input.Pointer) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  theme: TapFarmTheme;
};

export class TapFarmView {
  private container?: Phaser.GameObjects.Container;
  private energyFill?: Phaser.GameObjects.Rectangle;
  private panel?: Phaser.GameObjects.Rectangle;
  private statusText?: Phaser.GameObjects.Text;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: TapFarmViewOptions,
  ) {}

  create(): void {
    this.destroy();

    const { fontFamily, theme } = this.options;
    const layout = this.options.getLayout();
    const x = layout.tapFarmX;
    const y = layout.tapFarmY;
    const panelWidth = layout.tapFarmWidth;
    const panelHeight = layout.tapFarmHeight;
    const iconRadius = layout.isNarrow ? 10 : 12;
    const coinX = x + (layout.isNarrow ? 24 : 28);
    const textX = x + (layout.isNarrow ? 44 : 50);
    const progressHeight = layout.isNarrow ? 4 : 5;
    const tapFarmContainer = this.scene.add.container(0, 0);

    tapFarmContainer.add(this.scene.add.rectangle(x + 3, y + 4, panelWidth, panelHeight, theme.shadow, 0.28)
      .setOrigin(0));

    const tapFarmPanel = this.scene.add.rectangle(x, y, panelWidth, panelHeight, theme.button, 0.94)
      .setOrigin(0)
      .setStrokeStyle(2, theme.panelBorder, 0.78);
    this.panel = tapFarmPanel;
    tapFarmContainer.add(tapFarmPanel);

    const centerY = y + panelHeight / 2;
    tapFarmContainer.add(this.scene.add.circle(coinX + 1, centerY + 1, iconRadius, theme.shadow, 0.22));
    tapFarmContainer.add(this.scene.add.circle(coinX, centerY, iconRadius, 0xf3d06b, 0.96)
      .setStrokeStyle(2, 0x8a6221, 0.9));
    tapFarmContainer.add(this.scene.add.text(coinX, centerY, '+', {
      color: '#6b4a16',
      fontFamily,
      fontSize: layout.isNarrow ? '13px' : '17px',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    tapFarmContainer.add(this.scene.add.text(textX, y + (layout.isNarrow ? 5 : 8), this.options.t('ui.tapFarm.label'), {
      color: '#ffffff',
      fontFamily,
      fontSize: layout.isNarrow ? '15px' : '19px',
      fontStyle: 'bold',
      fixedWidth: panelWidth - (textX - x) - 14,
    }));

    this.statusText = this.scene.add.text(textX, y + panelHeight - (layout.isNarrow ? 16 : 18), '', {
      color: '#d9f6ba',
      fontFamily,
      fontSize: layout.isNarrow ? '10px' : '12px',
      fontStyle: 'bold',
      fixedWidth: panelWidth - (textX - x) - 14,
    });
    tapFarmContainer.add(this.statusText);

    const energyTrackWidth = Math.max(58, panelWidth - (layout.isNarrow ? 164 : 184));
    const energyTrackX = x + panelWidth - energyTrackWidth - 14;
    const energyTrackY = y + panelHeight - (layout.isNarrow ? 8 : 10);
    tapFarmContainer.add(this.scene.add.rectangle(energyTrackX, energyTrackY, energyTrackWidth, progressHeight, 0x14351f, 0.84)
      .setOrigin(0)
      .setStrokeStyle(1, 0xf4e6a6, 0.4));

    this.energyFill = this.scene.add.rectangle(energyTrackX, energyTrackY, energyTrackWidth, progressHeight, 0xf3d06b, 0.96)
      .setOrigin(0);
    tapFarmContainer.add(this.energyFill);

    tapFarmPanel
      .setInteractive({ useHandCursor: true })
      .on(
        'pointerdown',
        (
          pointer: Phaser.Input.Pointer,
          _localX: number,
          _localY: number,
          event: Phaser.Types.Input.EventData,
        ) => {
          event.stopPropagation();
          pointer.event?.stopPropagation();

          if (this.options.isModalOpen() || this.options.isDraggingMonster()) {
            return;
          }

          this.options.onTapFarmClick(pointer);
        },
      )
      .on('pointerover', () => {
        if (this.options.isModalOpen()) {
          this.options.onHoverBlocked();
          return;
        }

        tapFarmPanel.setFillStyle(theme.buttonHover, 0.98);
      })
      .on('pointerout', () => {
        tapFarmPanel.setFillStyle(theme.button, 0.94);
      });

    this.container = tapFarmContainer;
  }

  destroy(): void {
    this.container?.destroy();
    this.container = undefined;
    this.energyFill = undefined;
    this.panel = undefined;
    this.statusText = undefined;
  }

  refresh(): void {
    const layout = this.options.getLayout();
    const progress = Phaser.Math.Clamp(this.options.getTapFarmEnergyRatio(), 0, 1);
    const energyTrackWidth = Math.max(58, layout.tapFarmWidth - (layout.isNarrow ? 164 : 184));
    const energyTrackHeight = layout.isNarrow ? 4 : 5;

    this.statusText?.setText(this.options.getTapFarmStatusText());
    this.energyFill?.setVisible(progress > 0);
    this.energyFill?.setDisplaySize(energyTrackWidth * progress, energyTrackHeight);
  }

  resetHoverState(): void {
    this.panel?.setFillStyle(this.options.theme.button, 0.94);
  }

  setModalOpenVisualState(isOpen: boolean): void {
    this.panel?.setAlpha(isOpen ? 0.82 : 1);
  }
}
