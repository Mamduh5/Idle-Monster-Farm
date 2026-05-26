import Phaser from 'phaser';
import {
  addPanelBackground,
  getPanelSize,
  getPanelTitleFontSize,
  type PanelChromeTheme,
} from './PanelChrome';
import { addCloseButton } from './PanelControls';

type NavigationMenuLayout = {
  isNarrow: boolean;
  margin: number;
  menuX: number;
  menuY: number;
};

type NavigationMenuTheme = PanelChromeTheme & {
  button: number;
  buttonHover: number;
  text: string;
};

export type NavigationMenuPanelItem = {
  label: string;
  openPanel: () => void;
};

type NavigationMenuPanelViewOptions = {
  fontFamily: string;
  getLayout: () => NavigationMenuLayout;
  onButtonClickSound: () => void;
  onClose: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  theme: NavigationMenuTheme;
};

export class NavigationMenuPanelView {
  private panel?: Phaser.GameObjects.Container;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: NavigationMenuPanelViewOptions,
  ) {}

  create(menuItems: NavigationMenuPanelItem[]): void {
    this.destroy();

    const { fontFamily, theme } = this.options;
    const layout = this.options.getLayout();
    const preferredPanelWidth = layout.isNarrow ? 260 : 280;
    const preferredPanelHeight = Math.max(220, 96 + menuItems.length * 40);
    const { width: panelWidth, height: panelHeight } = getPanelSize(this.scene.scale, preferredPanelWidth, preferredPanelHeight);
    const panelX = layout.isNarrow
      ? Math.min(this.scene.scale.width - layout.margin - panelWidth / 2, Math.max(layout.margin + panelWidth / 2, layout.menuX - panelWidth / 2))
      : this.scene.scale.width - layout.margin - panelWidth / 2;
    const panelY = Math.min(
      this.scene.scale.height - layout.margin - panelHeight / 2,
      layout.menuY + 42 + panelHeight / 2,
    );
    const panel = this.scene.add.container(panelX, panelY);

    panel.setDepth(26);
    addPanelBackground(this.scene, panel, panelWidth, panelHeight, theme);

    panel.add(this.scene.add.text(-panelWidth / 2 + 22, -panelHeight / 2 + 18, this.options.t('ui.menu'), {
      color: theme.text,
      fontFamily,
      fontSize: getPanelTitleFontSize(panelWidth, 23),
      fontStyle: 'bold',
    }));

    addCloseButton(this.scene, panel, {
      color: theme.text,
      fontFamily,
      fontSize: '14px',
      label: this.options.t('common.close'),
      onPointerDown: () => {
        this.options.onButtonClickSound();
        this.options.onClose();
      },
      stopPropagation: true,
      x: panelWidth / 2 - 20,
      y: -panelHeight / 2 + 20,
    });

    const itemWidth = panelWidth - 42;
    const itemHeight = 32;
    const itemGap = 8;
    const firstItemY = -panelHeight / 2 + 72;

    menuItems.forEach((item, index) => {
      this.addMenuItem(
        panel,
        item,
        -panelWidth / 2 + 21,
        firstItemY + index * (itemHeight + itemGap),
        itemWidth,
        itemHeight,
      );
    });

    this.panel = panel;
  }

  destroy(): void {
    this.panel?.destroy();
    this.panel = undefined;
  }

  isOpen(): boolean {
    return Boolean(this.panel);
  }

  private addMenuItem(
    panel: Phaser.GameObjects.Container,
    item: NavigationMenuPanelItem,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const { fontFamily, theme } = this.options;
    const itemBackground = this.scene.add.rectangle(x, y, width, height, theme.button, 0.96)
      .setOrigin(0)
      .setStrokeStyle(1, theme.panelBorder, 0.34)
      .setInteractive({ useHandCursor: true });
    const itemLabel = this.scene.add.text(x + 14, y + height / 2, item.label, {
      color: theme.text,
      fontFamily,
      fontSize: '15px',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    itemBackground
      .on('pointerover', () => {
        itemBackground.setFillStyle(theme.buttonHover, 0.98);
      })
      .on('pointerout', () => {
        itemBackground.setFillStyle(theme.button, 0.96);
      })
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        this.options.onButtonClickSound();
        this.options.onClose();
        item.openPanel();
      });

    panel.add([itemBackground, itemLabel]);
  }
}
