import Phaser from 'phaser';

type HudLayout = {
  isNarrow: boolean;
  hudX: number;
  hudY: number;
  hudWidth: number;
  hudHeight: number;
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
  getLayout: () => HudLayout;
  getMonsterEssence: () => number;
  getTotalIncomePerSecond: () => number;
  t: (key: string, params?: Record<string, string | number>) => string;
  theme: HudTheme;
};

export class HudView {
  private coinText?: Phaser.GameObjects.Text;
  private container?: Phaser.GameObjects.Container;
  private essenceText?: Phaser.GameObjects.Text;
  private incomeText?: Phaser.GameObjects.Text;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: HudViewOptions,
  ) {}

  create(currentCoins: number): void {
    this.destroy();

    const { fontFamily, theme } = this.options;
    const layout = this.options.getLayout();
    const coinFontSize = layout.isNarrow ? '17px' : '22px';
    const essenceFontSize = layout.isNarrow ? '12px' : '14px';
    const hudContainer = this.scene.add.container(0, 0);

    hudContainer.add(this.scene.add.rectangle(layout.hudX + 3, layout.hudY + 4, layout.hudWidth, layout.hudHeight, theme.shadow, 0.25)
      .setOrigin(0));

    hudContainer.add(this.scene.add.rectangle(layout.hudX, layout.hudY, layout.hudWidth, layout.hudHeight, theme.panel, 0.86)
      .setOrigin(0)
      .setStrokeStyle(2, theme.panelBorder, 0.72));

    this.addCoinIcon(hudContainer, layout.hudX + 20, layout.hudY + 19);
    this.coinText = this.scene.add.text(layout.hudX + 38, layout.hudY + 8, this.options.t('ui.hud.coins', {
      amount: this.options.formatCoinAmount(currentCoins),
    }), {
      color: theme.goldText,
      fontFamily,
      fontSize: coinFontSize,
      fontStyle: 'bold',
      fixedWidth: layout.hudWidth - 48,
    });
    hudContainer.add(this.coinText);

    this.addEssenceIcon(hudContainer, layout.hudX + 20, layout.hudY + (layout.isNarrow ? 43 : 48));
    this.essenceText = this.scene.add.text(layout.hudX + 38, layout.hudY + (layout.isNarrow ? 34 : 38), this.options.t('ui.hud.essence', {
      amount: this.options.getMonsterEssence(),
    }), {
      color: '#d9f6ff',
      fontFamily,
      fontSize: essenceFontSize,
      fontStyle: 'bold',
      fixedWidth: layout.hudWidth - 48,
    });
    hudContainer.add(this.essenceText);

    this.incomeText = this.scene.add.text(layout.hudX + layout.hudWidth - 10, layout.hudY + (layout.isNarrow ? 12 : 15), this.options.t('common.perSecond', { amount: '+0' }), {
      align: 'right',
      color: '#d9f6ba',
      fontFamily,
      fontSize: layout.isNarrow ? '10px' : '12px',
      fontStyle: 'bold',
      fixedWidth: layout.hudWidth - 72,
    }).setOrigin(1, 0);
    hudContainer.add(this.incomeText);

    this.container = hudContainer;
  }

  destroy(): void {
    this.container?.destroy();
    this.container = undefined;
    this.coinText = undefined;
    this.essenceText = undefined;
    this.incomeText = undefined;
  }

  refresh(currentCoins: number): void {
    this.coinText?.setText(this.options.t('ui.hud.coins', {
      amount: this.options.formatCoinAmount(currentCoins),
    }));
    this.essenceText?.setText(this.options.t('ui.hud.essence', {
      amount: this.options.getMonsterEssence(),
    }));
    this.incomeText?.setText(this.options.t('common.perSecond', {
      amount: `+${this.options.formatCoinAmount(this.options.getTotalIncomePerSecond())}`,
    }));
  }

  private addCoinIcon(container: Phaser.GameObjects.Container, x: number, y: number): void {
    const icon = this.scene.add.graphics();
    icon.fillStyle(0xffcf54, 0.95);
    icon.fillCircle(x, y, 8);
    icon.lineStyle(2, 0xfff1a6, 0.95);
    icon.strokeCircle(x, y, 8);
    icon.lineStyle(2, 0x8a5b12, 0.7);
    icon.lineBetween(x - 3, y, x + 3, y);
    container.add(icon);
  }

  private addEssenceIcon(container: Phaser.GameObjects.Container, x: number, y: number): void {
    const icon = this.scene.add.graphics();
    icon.fillStyle(0x89d8ff, 0.88);
    icon.fillPoints([
      new Phaser.Math.Vector2(x, y - 8),
      new Phaser.Math.Vector2(x + 7, y),
      new Phaser.Math.Vector2(x, y + 8),
      new Phaser.Math.Vector2(x - 7, y),
    ], true);
    icon.lineStyle(2, 0xe6fbff, 0.9);
    icon.strokePoints([
      new Phaser.Math.Vector2(x, y - 8),
      new Phaser.Math.Vector2(x + 7, y),
      new Phaser.Math.Vector2(x, y + 8),
      new Phaser.Math.Vector2(x - 7, y),
    ], true);
    container.add(icon);
  }
}
