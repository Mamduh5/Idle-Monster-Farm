import Phaser from 'phaser';
import type { OrderDefinition, OrderId, OrderReward } from '../data/orders';

type OrderWidgetLayout = {
  isNarrow: boolean;
  orderWidgetHeight: number;
  orderWidgetWidth: number;
  orderWidgetX: number;
  orderWidgetY: number;
};

type OrderWidgetTheme = {
  buttonHover: number;
  goldText: string;
  mutedText: string;
  panel: number;
  panelBorder: number;
  shadow: number;
  slot: number;
  text: string;
};

type OrderWidgetViewOptions = {
  fontFamily: string;
  getLayout: () => OrderWidgetLayout;
  getOrderRequirementText: (order: OrderDefinition) => string;
  getOrderRewardText: (reward: OrderReward) => string;
  getOrderWidgetStatusText: (order: OrderDefinition) => string;
  getRecommendedOrder: () => OrderDefinition | undefined;
  isModalOpen: () => boolean;
  isOrderClaimed: (orderId: OrderId) => boolean;
  isOrderComplete: (order: OrderDefinition) => boolean;
  onButtonClickSound: () => void;
  onClaimOrder: (orderId: OrderId) => void;
  onOpenOrdersPanel: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  theme: OrderWidgetTheme;
};

export class OrderWidgetView {
  private container?: Phaser.GameObjects.Container;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: OrderWidgetViewOptions,
  ) {}

  create(): void {
    this.destroy();

    const order = this.options.getRecommendedOrder();

    if (!order) {
      return;
    }

    const { fontFamily, theme } = this.options;
    const layout = this.options.getLayout();
    const x = layout.orderWidgetX;
    const y = layout.orderWidgetY;
    const width = layout.orderWidgetWidth;
    const height = layout.orderWidgetHeight;
    const isCompact = layout.isNarrow || width < 190;
    const isClaimable = this.options.isOrderComplete(order) && !this.options.isOrderClaimed(order.id);
    const container = this.scene.add.container(0, 0).setDepth(7);

    container.add(this.scene.add.rectangle(x + 3, y + 4, width, height, theme.shadow, 0.22)
      .setOrigin(0));

    const background = this.scene.add.rectangle(x, y, width, height, isClaimable ? 0x365b32 : theme.panel, 0.88)
      .setOrigin(0)
      .setStrokeStyle(2, isClaimable ? theme.slot : theme.panelBorder, 0.72)
      .setInteractive({ useHandCursor: true });

    background.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();

      if (this.options.isModalOpen()) {
        return;
      }

      this.options.onButtonClickSound();
      this.options.onOpenOrdersPanel();
    });

    container.add(background);

    container.add(this.scene.add.text(x + 10, y + 6, this.options.t('ui.orderWidget.title'), {
      color: isClaimable ? '#fff4a8' : theme.goldText,
      fontFamily,
      fontSize: isCompact ? '12px' : '13px',
      fontStyle: 'bold',
      fixedWidth: width - 20,
    }));

    container.add(this.scene.add.text(x + 10, y + (isCompact ? 23 : 25), this.options.getOrderRequirementText(order), {
      color: theme.text,
      fontFamily,
      fontSize: isCompact ? '11px' : '12px',
      fontStyle: 'bold',
      fixedWidth: isClaimable ? width - 68 : width - 20,
      wordWrap: {
        width: isClaimable ? width - 68 : width - 20,
      },
    }));

    container.add(this.scene.add.text(x + 10, y + (isCompact ? 43 : 47), this.options.t('ui.orderWidget.reward', {
      reward: this.options.getOrderRewardText(order.reward),
    }), {
      color: isClaimable ? '#fff4a8' : theme.mutedText,
      fontFamily,
      fontSize: isCompact ? '10px' : '11px',
      fixedWidth: isClaimable ? width - 70 : width - 20,
      wordWrap: {
        width: isClaimable ? width - 70 : width - 20,
      },
    }));

    container.add(this.scene.add.text(x + 10, y + height - 18, this.options.getOrderWidgetStatusText(order), {
      color: isClaimable ? '#d9f6ba' : '#cdebb3',
      fontFamily,
      fontSize: isCompact ? '10px' : '11px',
      fontStyle: 'bold',
      fixedWidth: isClaimable ? width - 70 : width - 20,
    }));

    if (isClaimable) {
      const claimText = this.scene.add.text(x + width - 10, y + height / 2 + 8, this.options.t('ui.orders.claim'), {
        color: '#ffffff',
        fontFamily,
        fontSize: isCompact ? '11px' : '12px',
        fontStyle: 'bold',
        backgroundColor: `#${theme.buttonHover.toString(16).padStart(6, '0')}`,
        padding: {
          x: isCompact ? 7 : 9,
          y: 5,
        },
      }).setOrigin(1, 0.5);

      claimText
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          pointer.event?.stopPropagation();

          if (this.options.isModalOpen()) {
            return;
          }

          this.options.onButtonClickSound();
          this.options.onClaimOrder(order.id);
        });

      container.add(claimText);
    }

    this.container = container;
  }

  destroy(): void {
    this.container?.destroy();
    this.container = undefined;
  }

  setModalOpenVisualState(isOpen: boolean): void {
    this.container?.setAlpha(isOpen ? 0.72 : 1);
  }
}
