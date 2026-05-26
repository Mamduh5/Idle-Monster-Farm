import Phaser from 'phaser';

export type ToastVariant = 'info' | 'success' | 'warning';

type ToastLayout = {
  isNarrow: boolean;
  hatchY: number;
  gridStartY: number;
};

type ToastTheme = {
  panelAlt: number;
  panelBorder: number;
  shadow: number;
  success: number;
  warning: number;
  text: string;
};

type ToastViewOptions = {
  fontFamily: string;
  getLayout: () => ToastLayout;
  theme: ToastTheme;
};

export class ToastView {
  private toastContainer?: Phaser.GameObjects.Container;
  private toastTween?: Phaser.Tweens.Tween;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: ToastViewOptions,
  ) {}

  show(message: string, variant: ToastVariant = 'info'): void {
    this.clear();

    const { theme } = this.options;
    const fillColor = this.getFillColor(variant);
    const borderColor = variant === 'success' ? 0xc9f5b5 : variant === 'warning' ? 0xffe0a0 : theme.panelBorder;
    const layout = this.options.getLayout();
    const toastWidth = Math.min(280, Math.max(220, this.scene.scale.width - 28));
    const toastHeight = layout.isNarrow ? 44 : 38;
    const x = this.scene.scale.width / 2;
    const preferredY = layout.isNarrow ? layout.hatchY - 26 : layout.gridStartY - 28;
    const y = Phaser.Math.Clamp(preferredY, 116, this.scene.scale.height - 104);

    const container = this.scene.add.container(x, y).setDepth(80).setAlpha(0);
    const shadow = this.scene.add.rectangle(2, 3, toastWidth, toastHeight, theme.shadow, 0.28);
    const background = this.scene.add.rectangle(0, 0, toastWidth, toastHeight, fillColor, 0.96)
      .setStrokeStyle(2, borderColor, 0.95)
      .setInteractive({ useHandCursor: false });
    const text = this.scene.add.text(0, 0, message, {
      color: theme.text,
      fontFamily: this.options.fontFamily,
      fontSize: this.scene.scale.width < 380 ? '13px' : '15px',
      fontStyle: 'bold',
      align: 'center',
      fixedWidth: toastWidth - 24,
      wordWrap: {
        width: toastWidth - 24,
        useAdvancedWrap: true,
      },
    }).setOrigin(0.5);

    background.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
    });

    container.add([shadow, background, text]);
    this.toastContainer = container;

    this.toastTween = this.scene.tweens.add({
      targets: container,
      alpha: 1,
      y: y - 4,
      duration: 120,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.toastTween = this.scene.tweens.add({
          targets: container,
          alpha: 0,
          y: y - 18,
          delay: 1350,
          duration: 260,
          ease: 'Sine.easeIn',
          onComplete: () => {
            if (this.toastContainer === container) {
              this.clear();
            }
          },
        });
      },
    });
  }

  clear(): void {
    this.toastTween?.stop();
    this.toastTween = undefined;
    this.toastContainer?.destroy();
    this.toastContainer = undefined;
  }

  private getFillColor(variant: ToastVariant): number {
    if (variant === 'success') {
      return this.options.theme.success;
    }

    if (variant === 'warning') {
      return this.options.theme.warning;
    }

    return this.options.theme.panelAlt;
  }
}