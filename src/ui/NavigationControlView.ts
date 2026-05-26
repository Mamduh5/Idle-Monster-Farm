import Phaser from 'phaser';

type NavigationLayout = {
  menuFontSize: string;
  menuGap: number;
  menuX: number;
  menuY: number;
};

type NavigationTheme = {
  button: number;
  buttonHover: number;
  buttonWarm: number;
};

type NavigationButtonVisual = {
  defaultBackgroundColor: string;
  text: Phaser.GameObjects.Text;
};

type NavigationControlViewOptions = {
  fontFamily: string;
  getLayout: () => NavigationLayout;
  isModalOpen: () => boolean;
  onButtonClickSound: () => void;
  onDebugClick: () => void;
  onHoverBlocked: () => void;
  onMenuClick: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  theme: NavigationTheme;
};

export class NavigationControlView {
  private buttons: NavigationButtonVisual[] = [];
  private container?: Phaser.GameObjects.Container;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: NavigationControlViewOptions,
  ) {}

  createMenuControl(): void {
    this.destroy();
    this.container = this.scene.add.container(0, 0);
    this.addButton(this.options.t('ui.menu'), 0, this.options.onMenuClick);
  }

  addDebugControl(): void {
    if (!this.container) {
      this.container = this.scene.add.container(0, 0);
    }

    this.addButton(
      'Debug (D)',
      1,
      this.options.onDebugClick,
      `#${this.options.theme.buttonWarm.toString(16).padStart(6, '0')}`,
    );
  }

  containsPoint(x: number, y: number): boolean {
    return this.buttons.some(({ text }) => text.getBounds().contains(x, y));
  }

  destroy(): void {
    this.container?.destroy();
    this.container = undefined;
    this.buttons = [];
  }

  resetHoverState(): void {
    this.buttons.forEach(({ text, defaultBackgroundColor }) => {
      text.setBackgroundColor(defaultBackgroundColor);
    });
  }

  setModalOpenVisualState(isOpen: boolean): void {
    this.buttons.forEach(({ text }) => {
      text.setAlpha(isOpen ? 0.72 : 1);
    });
  }

  private addButton(
    label: string,
    index: number,
    onClick: () => void,
    backgroundColor = `#${this.options.theme.button.toString(16).padStart(6, '0')}`,
  ): void {
    const layout = this.options.getLayout();
    const button = this.scene.add.text(layout.menuX, layout.menuY + index * layout.menuGap, label, {
      color: '#f7ffe8',
      fontFamily: this.options.fontFamily,
      fontSize: layout.menuFontSize,
      fontStyle: 'bold',
      backgroundColor,
      padding: {
        x: 10,
        y: 6,
      },
    }).setOrigin(1, 0);

    this.buttons.push({
      text: button,
      defaultBackgroundColor: backgroundColor,
    });
    this.container?.add(button);

    button
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        if (this.options.isModalOpen()) {
          this.options.onHoverBlocked();
          return;
        }

        button.setBackgroundColor(`#${this.options.theme.buttonHover.toString(16).padStart(6, '0')}`);
      })
      .on('pointerout', () => {
        button.setBackgroundColor(backgroundColor);
      })
      .on('pointerdown', () => {
        if (this.options.isModalOpen()) {
          return;
        }

        this.options.onButtonClickSound();
        onClick();
      });
  }
}
