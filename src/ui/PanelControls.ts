import Phaser from 'phaser';

type PanelButtonPadding = {
  x: number;
  y: number;
};

type PanelButtonOptions = {
  backgroundColor: string;
  color: string;
  fontFamily: string;
  fontSize: string;
  label: string;
  padding: PanelButtonPadding;
  x: number;
  y: number;
  fontStyle?: string;
  onPointerDown?: (pointer: Phaser.Input.Pointer) => void;
  originX?: number;
  originY?: number;
  stopPropagation?: boolean;
};

type CloseButtonOptions = Omit<PanelButtonOptions, 'backgroundColor' | 'fontSize' | 'originX' | 'originY' | 'padding'> & {
  backgroundColor?: string;
  fontSize?: string;
  padding?: PanelButtonPadding;
};

type PaginationControlsOptions = {
  buttonColor: number;
  disabledButtonColor: number;
  disabledTextColor: string;
  fontFamily: string;
  mutedTextColor: string;
  nextEnabled: boolean;
  nextLabel: string;
  onNext: () => void;
  onPrevious: () => void;
  pageCount: number;
  pageIndex: number;
  panelHeight: number;
  panelWidth: number;
  previousEnabled: boolean;
  previousLabel: string;
  textColor: string;
};

export function createPanelButton(
  scene: Phaser.Scene,
  options: PanelButtonOptions,
): Phaser.GameObjects.Text {
  const button = scene.add.text(options.x, options.y, options.label, {
    color: options.color,
    fontFamily: options.fontFamily,
    fontSize: options.fontSize,
    fontStyle: options.fontStyle,
    backgroundColor: options.backgroundColor,
    padding: options.padding,
  }).setOrigin(options.originX ?? 0.5, options.originY ?? 0.5);

  button
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (options.stopPropagation) {
        pointer.event?.stopPropagation();
      }

      options.onPointerDown?.(pointer);
    });

  return button;
}

export function createDisabledPanelButton(
  scene: Phaser.Scene,
  options: Omit<PanelButtonOptions, 'onPointerDown' | 'stopPropagation'>,
): Phaser.GameObjects.Text {
  return scene.add.text(options.x, options.y, options.label, {
    color: options.color,
    fontFamily: options.fontFamily,
    fontSize: options.fontSize,
    fontStyle: options.fontStyle,
    backgroundColor: options.backgroundColor,
    padding: options.padding,
  }).setOrigin(options.originX ?? 0.5, options.originY ?? 0.5);
}

export function addCloseButton(
  scene: Phaser.Scene,
  panel: Phaser.GameObjects.Container,
  options: CloseButtonOptions,
): Phaser.GameObjects.Text {
  const closeButton = createPanelButton(scene, {
    ...options,
    backgroundColor: options.backgroundColor ?? '#49395d',
    fontSize: options.fontSize ?? '15px',
    fontStyle: options.fontStyle ?? 'bold',
    originX: 1,
    originY: 0,
    padding: options.padding ?? {
      x: 9,
      y: 5,
    },
  });

  panel.add(closeButton);

  return closeButton;
}

export function addPaginationControls(
  scene: Phaser.Scene,
  panel: Phaser.GameObjects.Container,
  options: PaginationControlsOptions,
): void {
  if (options.pageCount <= 1) {
    return;
  }

  const y = options.panelHeight / 2 - 32;
  const buttonFontSize = options.panelWidth < 390 ? '14px' : '15px';
  const buttonPadding = {
    x: options.panelWidth < 390 ? 13 : 15,
    y: 7,
  };
  const previousText = createPaginationButton(scene, {
    enabled: options.previousEnabled,
    label: options.previousLabel,
    x: -options.panelWidth / 2 + 24,
    y,
    originX: 0,
    originY: 0.5,
    fontFamily: options.fontFamily,
    fontSize: buttonFontSize,
    padding: buttonPadding,
    textColor: options.textColor,
    disabledTextColor: options.disabledTextColor,
    buttonColor: options.buttonColor,
    disabledButtonColor: options.disabledButtonColor,
    onPointerDown: options.onPrevious,
  });
  const nextText = createPaginationButton(scene, {
    enabled: options.nextEnabled,
    label: options.nextLabel,
    x: options.panelWidth / 2 - 24,
    y,
    originX: 1,
    originY: 0.5,
    fontFamily: options.fontFamily,
    fontSize: buttonFontSize,
    padding: buttonPadding,
    textColor: options.textColor,
    disabledTextColor: options.disabledTextColor,
    buttonColor: options.buttonColor,
    disabledButtonColor: options.disabledButtonColor,
    onPointerDown: options.onNext,
  });
  const pageLabel = scene.add.text(0, y, `${options.pageIndex + 1}/${options.pageCount}`, {
    color: options.mutedTextColor,
    fontFamily: options.fontFamily,
    fontSize: options.panelWidth < 390 ? '13px' : '14px',
    fontStyle: 'bold',
  }).setOrigin(0.5);

  panel.add([previousText, nextText, pageLabel]);
}

function createPaginationButton(
  scene: Phaser.Scene,
  options: {
    buttonColor: number;
    disabledButtonColor: number;
    disabledTextColor: string;
    enabled: boolean;
    fontFamily: string;
    fontSize: string;
    label: string;
    onPointerDown: () => void;
    originX: number;
    originY: number;
    padding: PanelButtonPadding;
    textColor: string;
    x: number;
    y: number;
  },
): Phaser.GameObjects.Text {
  const buttonOptions = {
    backgroundColor: `#${(options.enabled ? options.buttonColor : options.disabledButtonColor).toString(16).padStart(6, '0')}`,
    color: options.enabled ? options.textColor : options.disabledTextColor,
    fontFamily: options.fontFamily,
    fontSize: options.fontSize,
    fontStyle: 'bold',
    label: options.label,
    originX: options.originX,
    originY: options.originY,
    padding: options.padding,
    x: options.x,
    y: options.y,
  };

  if (!options.enabled) {
    return createDisabledPanelButton(scene, buttonOptions);
  }

  return createPanelButton(scene, {
    ...buttonOptions,
    onPointerDown: () => {
      options.onPointerDown();
    },
    stopPropagation: true,
  });
}
