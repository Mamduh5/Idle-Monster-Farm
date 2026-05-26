import Phaser from 'phaser';

export type PanelChromeTheme = {
  panel: number;
  panelBorder: number;
  shadow: number;
};

export function getPanelSize(
  scale: Phaser.Scale.ScaleManager,
  preferredWidth: number,
  preferredHeight: number,
): { width: number; height: number } {
  return {
    width: Math.min(preferredWidth, scale.width - 24),
    height: Math.min(preferredHeight, scale.height - 24),
  };
}

export function getInsetPanelSize(
  scale: Phaser.Scale.ScaleManager,
  preferredWidth: number,
  preferredHeight: number,
  inset: number,
): { width: number; height: number } {
  return {
    width: Math.min(preferredWidth, scale.width - inset * 2),
    height: Math.min(preferredHeight, scale.height - inset * 2),
  };
}

export function getPanelTitleFontSize(panelWidth: number, desktopSize = 24): string {
  return `${panelWidth < 390 ? Math.min(desktopSize, 21) : desktopSize}px`;
}

export function addPanelBackground(
  scene: Phaser.Scene,
  panel: Phaser.GameObjects.Container,
  width: number,
  height: number,
  theme: PanelChromeTheme,
  fill = theme.panel,
  border = theme.panelBorder,
): Phaser.GameObjects.Rectangle {
  panel.add(scene.add.rectangle(4, 5, width, height, theme.shadow, 0.25));

  const panelBackground = scene.add.rectangle(0, 0, width, height, fill, 0.97)
    .setStrokeStyle(3, border, 0.78)
    .setInteractive();

  panelBackground.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    pointer.event.stopPropagation();
  });

  panel.add(panelBackground);

  return panelBackground;
}
