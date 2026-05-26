import Phaser from 'phaser';

type HudLayout = {
  isNarrow: boolean;
  hudX: number;
  hudY: number;
  hudWidth: number;
  hudHeight: number;
  statsX: number;
  statsY: number;
  statsWidth: number;
  statsHeight: number;
};

type HudTheme = {
  panel: number;
  panelBorder: number;
  shadow: number;
  slot: number;
  text: string;
  mutedText: string;
  goldText: string;
};

type HudViewOptions = {
  fontFamily: string;
  formatCoinAmount: (amount: number) => string;
  formatDuration: (seconds: number) => string;
  getEffectiveEggCost: () => number;
  getLayout: () => HudLayout;
  getOfflineCapSeconds: () => number;
  getTotalIncomePerSecond: () => number;
  t: (key: string, params?: Record<string, string | number>) => string;
  theme: HudTheme;
};

export class HudView {
  private coinText?: Phaser.GameObjects.Text;
  private container?: Phaser.GameObjects.Container;
  private incomeText?: Phaser.GameObjects.Text;
  private productionStatsText?: Phaser.GameObjects.Text;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: HudViewOptions,
  ) {}

  create(currentCoins: number): void {
    this.destroy();

    const { fontFamily, theme } = this.options;
    const layout = this.options.getLayout();
    const coinFontSize = layout.isNarrow ? '18px' : '24px';
    const productionTitleFontSize = layout.isNarrow ? '15px' : '16px';
    const productionTextFontSize = layout.isNarrow ? '12px' : '14px';
    const productionLineSpacing = layout.isNarrow ? 2 : 5;
    const hudContainer = this.scene.add.container(0, 0);

    hudContainer.add(this.scene.add.rectangle(layout.hudX + 3, layout.hudY + 4, layout.hudWidth, layout.hudHeight, theme.shadow, 0.25)
      .setOrigin(0));

    hudContainer.add(this.scene.add.rectangle(layout.hudX, layout.hudY, layout.hudWidth, layout.hudHeight, theme.panel, 0.86)
      .setOrigin(0)
      .setStrokeStyle(2, theme.panelBorder, 0.72));

    this.coinText = this.scene.add.text(layout.hudX + 18, layout.hudY + 10, this.options.t('ui.hud.coins', {
      amount: this.options.formatCoinAmount(currentCoins),
    }), {
      color: theme.goldText,
      fontFamily,
      fontSize: coinFontSize,
      fontStyle: 'bold',
      fixedWidth: layout.hudWidth - 30,
    });
    hudContainer.add(this.coinText);

    this.incomeText = this.scene.add.text(layout.hudX + 18, layout.hudY + (layout.isNarrow ? 36 : 39), this.options.t('common.perSecond', { amount: '+0' }), {
      color: '#d9f6ba',
      fontFamily,
      fontSize: layout.isNarrow ? '13px' : '15px',
      fontStyle: 'bold',
      fixedWidth: layout.hudWidth - 30,
    });
    hudContainer.add(this.incomeText);

    hudContainer.add(this.scene.add.rectangle(layout.statsX + 3, layout.statsY + 4, layout.statsWidth, layout.statsHeight, theme.shadow, 0.2)
      .setOrigin(0));

    hudContainer.add(this.scene.add.rectangle(layout.statsX, layout.statsY, layout.statsWidth, layout.statsHeight, theme.panel, 0.8)
      .setOrigin(0)
      .setStrokeStyle(2, theme.slot, 0.62));

    hudContainer.add(this.scene.add.text(layout.statsX + 18, layout.statsY + 9, this.options.t('ui.hud.production'), {
      color: theme.text,
      fontFamily,
      fontSize: productionTitleFontSize,
      fontStyle: 'bold',
    }));

    this.productionStatsText = this.scene.add.text(layout.statsX + 18, layout.statsY + 32, '', {
      color: theme.mutedText,
      fontFamily,
      fontSize: productionTextFontSize,
      lineSpacing: productionLineSpacing,
      fixedWidth: layout.statsWidth - 30,
      wordWrap: {
        width: layout.statsWidth - 30,
      },
    });
    hudContainer.add(this.productionStatsText);

    this.container = hudContainer;
  }

  destroy(): void {
    this.container?.destroy();
    this.container = undefined;
    this.coinText = undefined;
    this.incomeText = undefined;
    this.productionStatsText = undefined;
  }

  refresh(currentCoins: number): void {
    this.coinText?.setText(this.options.t('ui.hud.coins', {
      amount: this.options.formatCoinAmount(currentCoins),
    }));
    this.incomeText?.setText(this.options.t('common.perSecond', {
      amount: `+${this.options.formatCoinAmount(this.options.getTotalIncomePerSecond())}`,
    }));
    this.productionStatsText?.setText([
      this.options.t('ui.hud.incomePerSecond', {
        amount: this.options.formatCoinAmount(this.options.getTotalIncomePerSecond()),
      }),
      this.options.t('ui.hud.nextEgg', {
        amount: this.options.formatCoinAmount(this.options.getEffectiveEggCost()),
      }),
      this.options.t('ui.hud.offlineCap', {
        duration: this.options.formatDuration(this.options.getOfflineCapSeconds()),
      }),
    ].join('\n'));
  }
}
