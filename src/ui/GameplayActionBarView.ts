import Phaser from 'phaser';

export type GameplayActionBarAction = 'shop' | 'battle' | 'quests' | 'ritual';

type GameplayActionBarLayout = {
  actionBarButtonGap: number;
  actionBarHeight: number;
  actionBarWidth: number;
  actionBarX: number;
  actionBarY: number;
  isNarrow: boolean;
};

type GameplayActionBarTheme = {
  button: number;
  buttonHover: number;
  buttonRitual: number;
  buttonRitualHover: number;
  buttonWarm: number;
  buttonWarmHover: number;
  panel: number;
  panelBorder: number;
  shadow: number;
  text: string;
};

type GameplayActionBarViewOptions = {
  fontFamily: string;
  getLayout: () => GameplayActionBarLayout;
  isModalOpen: () => boolean;
  onAction: (action: GameplayActionBarAction) => void;
  onButtonClickSound: () => void;
  onHoverBlocked: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  theme: GameplayActionBarTheme;
};

type ActionButtonDefinition = {
  action: GameplayActionBarAction;
  labelKey: string;
};

type ActionButtonVisual = {
  action: GameplayActionBarAction;
  defaultFill: number;
  graphics: Phaser.GameObjects.Graphics;
  hoverFill: number;
};

const ACTION_BUTTONS: ActionButtonDefinition[] = [
  { action: 'shop', labelKey: 'ui.action.shop' },
  { action: 'battle', labelKey: 'ui.action.battle' },
  { action: 'quests', labelKey: 'ui.action.quests' },
  { action: 'ritual', labelKey: 'ui.action.ritual' },
];

export class GameplayActionBarView {
  private buttonVisuals: ActionButtonVisual[] = [];
  private container?: Phaser.GameObjects.Container;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: GameplayActionBarViewOptions,
  ) {}

  create(): void {
    this.destroy();

    const layout = this.options.getLayout();
    const { theme } = this.options;
    const container = this.scene.add.container(0, 0).setDepth(8);
    const background = this.scene.add.graphics();

    background.fillStyle(theme.shadow, 0.3);
    background.fillRoundedRect(
      layout.actionBarX + 4,
      layout.actionBarY + 5,
      layout.actionBarWidth,
      layout.actionBarHeight,
      layout.isNarrow ? 14 : 16,
    );
    background.fillStyle(theme.panel, 0.92);
    background.lineStyle(2, theme.panelBorder, 0.72);
    background.fillRoundedRect(
      layout.actionBarX,
      layout.actionBarY,
      layout.actionBarWidth,
      layout.actionBarHeight,
      layout.isNarrow ? 14 : 16,
    );
    background.strokeRoundedRect(
      layout.actionBarX,
      layout.actionBarY,
      layout.actionBarWidth,
      layout.actionBarHeight,
      layout.isNarrow ? 14 : 16,
    );
    container.add(background);

    const backgroundZone = this.scene.add.zone(
      layout.actionBarX,
      layout.actionBarY,
      layout.actionBarWidth,
      layout.actionBarHeight,
    ).setOrigin(0).setInteractive();

    backgroundZone.on('pointerdown', this.stopPointerPropagation);
    backgroundZone.on('pointerup', this.stopPointerPropagation);
    backgroundZone.on('pointermove', this.stopPointerPropagation);
    container.add(backgroundZone);

    const padding = layout.isNarrow ? 6 : 8;
    const buttonGap = layout.actionBarButtonGap;
    const buttonWidth = (
      layout.actionBarWidth
      - padding * 2
      - buttonGap * (ACTION_BUTTONS.length - 1)
    ) / ACTION_BUTTONS.length;
    const buttonHeight = layout.actionBarHeight - padding * 2;
    const buttonY = layout.actionBarY + padding;

    ACTION_BUTTONS.forEach((button, index) => {
      const buttonX = layout.actionBarX + padding + index * (buttonWidth + buttonGap);
      this.addActionButton(container, button, buttonX, buttonY, buttonWidth, buttonHeight);
    });

    this.container = container;
  }

  destroy(): void {
    this.container?.destroy();
    this.container = undefined;
    this.buttonVisuals = [];
  }

  resetHoverState(): void {
    this.buttonVisuals.forEach((visual) => {
      this.drawButtonBackground(visual, visual.defaultFill);
    });
  }

  setModalOpenVisualState(isOpen: boolean): void {
    this.container?.setAlpha(isOpen ? 0.58 : 1);
  }

  private addActionButton(
    container: Phaser.GameObjects.Container,
    button: ActionButtonDefinition,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const { fontFamily, theme } = this.options;
    const fill = this.getButtonFill(button.action);
    const hoverFill = this.getButtonHoverFill(button.action);
    const graphics = this.scene.add.graphics();
    const visual: ActionButtonVisual = {
      action: button.action,
      defaultFill: fill,
      graphics,
      hoverFill,
    };

    this.drawButtonBackground(visual, fill, x, y, width, height);
    container.add(graphics);
    this.addButtonIcon(container, button.action, x + width / 2, y + height * (this.options.getLayout().isNarrow ? 0.34 : 0.35), height);

    const layout = this.options.getLayout();
    const labelFontSize = width < 76 ? '10px' : layout.isNarrow ? '11px' : '13px';
    container.add(this.scene.add.text(x + width / 2, y + height - (layout.isNarrow ? 6 : 7), this.options.t(button.labelKey), {
      align: 'center',
      color: theme.text,
      fixedWidth: width,
      fontFamily,
      fontSize: labelFontSize,
      fontStyle: 'bold',
    }).setOrigin(0.5, 1));

    const hitZone = this.scene.add.zone(x, y, width, height).setOrigin(0).setInteractive({ useHandCursor: true });

    hitZone
      .on('pointerover', () => {
        if (this.options.isModalOpen()) {
          this.options.onHoverBlocked();
          return;
        }

        this.drawButtonBackground(visual, hoverFill, x, y, width, height);
      })
      .on('pointerout', () => {
        this.drawButtonBackground(visual, fill, x, y, width, height);
      })
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

          if (this.options.isModalOpen()) {
            return;
          }

          this.options.onButtonClickSound();
          this.options.onAction(button.action);
        },
      );

    container.add(hitZone);
    this.buttonVisuals.push(visual);
  }

  private drawButtonBackground(
    visual: ActionButtonVisual,
    fill: number,
    x?: number,
    y?: number,
    width?: number,
    height?: number,
  ): void {
    const bounds = x === undefined || y === undefined || width === undefined || height === undefined
      ? visual.graphics.getData('bounds') as { x: number; y: number; width: number; height: number } | undefined
      : { x, y, width, height };

    if (!bounds) {
      return;
    }

    visual.graphics.setData('bounds', bounds);
    visual.graphics.clear();
    visual.graphics.fillStyle(fill, 0.96);
    visual.graphics.lineStyle(1, this.options.theme.panelBorder, 0.34);
    visual.graphics.fillRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, this.options.getLayout().isNarrow ? 10 : 12);
    visual.graphics.strokeRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, this.options.getLayout().isNarrow ? 10 : 12);
    visual.graphics.fillStyle(this.options.theme.shadow, 0.18);
    visual.graphics.fillRoundedRect(bounds.x, bounds.y + bounds.height - 5, bounds.width, 5, 3);
  }

  private addButtonIcon(
    container: Phaser.GameObjects.Container,
    action: GameplayActionBarAction,
    centerX: number,
    centerY: number,
    buttonHeight: number,
  ): void {
    const icon = this.scene.add.graphics();
    const size = Math.max(12, Math.min(this.options.getLayout().isNarrow ? 15 : 19, buttonHeight * 0.26));
    const accent = action === 'battle'
      ? 0xffd28a
      : action === 'ritual'
        ? 0xf4e6ff
        : 0xfff0a8;

    icon.lineStyle(2, accent, 0.95);
    icon.fillStyle(accent, 0.22);

    if (action === 'shop') {
      icon.strokeRoundedRect(centerX - size * 0.7, centerY - size * 0.3, size * 1.4, size, 4);
      icon.lineBetween(centerX - size * 0.48, centerY - size * 0.3, centerX - size * 0.3, centerY - size * 0.78);
      icon.lineBetween(centerX + size * 0.48, centerY - size * 0.3, centerX + size * 0.3, centerY - size * 0.78);
      icon.fillCircle(centerX - size * 0.35, centerY + size * 0.85, 2);
      icon.fillCircle(centerX + size * 0.35, centerY + size * 0.85, 2);
    } else if (action === 'battle') {
      icon.lineBetween(centerX - size * 0.62, centerY + size * 0.46, centerX + size * 0.58, centerY - size * 0.74);
      icon.lineBetween(centerX + size * 0.62, centerY + size * 0.46, centerX - size * 0.58, centerY - size * 0.74);
      icon.fillCircle(centerX - size * 0.68, centerY + size * 0.52, 2.4);
      icon.fillCircle(centerX + size * 0.68, centerY + size * 0.52, 2.4);
    } else if (action === 'quests') {
      icon.strokeRoundedRect(centerX - size * 0.55, centerY - size * 0.7, size * 1.1, size * 1.38, 4);
      icon.lineBetween(centerX - size * 0.34, centerY - size * 0.24, centerX + size * 0.34, centerY - size * 0.24);
      icon.lineBetween(centerX - size * 0.34, centerY + size * 0.1, centerX + size * 0.28, centerY + size * 0.1);
      icon.lineBetween(centerX - size * 0.34, centerY + size * 0.42, centerX + size * 0.16, centerY + size * 0.42);
    } else {
      icon.fillCircle(centerX, centerY, size * 0.28);
      icon.lineBetween(centerX, centerY - size, centerX, centerY + size);
      icon.lineBetween(centerX - size, centerY, centerX + size, centerY);
      icon.lineBetween(centerX - size * 0.62, centerY - size * 0.62, centerX + size * 0.62, centerY + size * 0.62);
      icon.lineBetween(centerX + size * 0.62, centerY - size * 0.62, centerX - size * 0.62, centerY + size * 0.62);
    }

    container.add(icon);
  }

  private getButtonFill(action: GameplayActionBarAction): number {
    if (action === 'battle') {
      return this.options.theme.buttonWarm;
    }

    if (action === 'ritual') {
      return this.options.theme.buttonRitual;
    }

    return this.options.theme.button;
  }

  private getButtonHoverFill(action: GameplayActionBarAction): number {
    if (action === 'battle') {
      return this.options.theme.buttonWarmHover;
    }

    if (action === 'ritual') {
      return this.options.theme.buttonRitualHover;
    }

    return this.options.theme.buttonHover;
  }

  private stopPointerPropagation(pointer: Phaser.Input.Pointer): void {
    pointer.event?.stopPropagation();
  }
}
