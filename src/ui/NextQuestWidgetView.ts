import Phaser from 'phaser';
import type { QuestDefinition, QuestId, QuestReward } from '../data/quests';

type NextQuestWidgetLayout = {
  isNarrow: boolean;
  questWidgetHeight: number;
  questWidgetWidth: number;
  questWidgetX: number;
  questWidgetY: number;
};

type NextQuestWidgetTheme = {
  buttonHover: number;
  goldText: string;
  mutedText: string;
  panel: number;
  panelBorder: number;
  shadow: number;
  slot: number;
  text: string;
};

type NextQuestWidgetViewOptions = {
  fontFamily: string;
  getLayout: () => NextQuestWidgetLayout;
  getNextQuest: () => QuestDefinition | undefined;
  getQuestProgressText: (quest: QuestDefinition) => string;
  getQuestRewardText: (reward: QuestReward) => string;
  isModalOpen: () => boolean;
  isQuestClaimed: (questId: QuestId) => boolean;
  isQuestComplete: (quest: QuestDefinition) => boolean;
  onButtonClickSound: () => void;
  onClaimQuest: (questId: QuestId) => void;
  onFocusQuest: (quest: QuestDefinition | undefined) => void;
  onOpenQuestsPanel: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  theme: NextQuestWidgetTheme;
};

export class NextQuestWidgetView {
  private container?: Phaser.GameObjects.Container;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: NextQuestWidgetViewOptions,
  ) {}

  create(): void {
    this.destroy();

    const quest = this.options.getNextQuest();
    const { fontFamily, theme } = this.options;
    const layout = this.options.getLayout();
    const x = layout.questWidgetX;
    const y = layout.questWidgetY;
    const width = layout.questWidgetWidth;
    const height = layout.questWidgetHeight;
    const isCompact = layout.isNarrow || width < 190;
    const isClaimable = quest ? this.options.isQuestComplete(quest) && !this.options.isQuestClaimed(quest.id) : false;
    const inset = isCompact ? 8 : 10;
    const contentX = x + inset;
    const contentWidth = width - inset * 2;
    const rightActionWidth = isCompact ? 54 : 70;
    const titleWidth = contentWidth - (isCompact ? 30 : 36);
    const container = this.scene.add.container(0, 0).setDepth(7);

    container.add(this.scene.add.rectangle(x + 3, y + 4, width, height, theme.shadow, 0.22)
      .setOrigin(0));

    const background = this.scene.add.rectangle(x, y, width, height, isClaimable ? 0x365b32 : theme.panel, 0.9)
      .setOrigin(0)
      .setStrokeStyle(2, isClaimable ? theme.slot : theme.panelBorder, 0.76)
      .setInteractive({ useHandCursor: true });

    background.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();

      if (this.options.isModalOpen()) {
        return;
      }

      this.options.onButtonClickSound();
      if (quest && !isClaimable) {
        this.options.onFocusQuest(quest);
        return;
      }

      this.options.onOpenQuestsPanel();
    });

    container.add(background);
    this.addIcon(container, x + width - (isCompact ? 18 : 22), y + (isCompact ? 18 : 20), quest?.icon ?? 'done', isClaimable, isCompact ? 0.78 : 0.9);

    container.add(this.scene.add.text(contentX, y + 6, this.options.t('ui.questWidget.title'), {
      color: isClaimable ? '#fff4a8' : theme.goldText,
      fontFamily,
      fontSize: isCompact ? '12px' : '13px',
      fontStyle: 'bold',
      fixedWidth: titleWidth,
    }));

    if (!quest) {
      container.add(this.scene.add.text(contentX, y + 28, this.options.t('ui.questWidget.allDone'), {
        color: theme.text,
        fontFamily,
        fontSize: isCompact ? '11px' : '12px',
        fontStyle: 'bold',
        fixedWidth: contentWidth,
        fixedHeight: height - 34,
        wordWrap: {
          width: contentWidth,
          useAdvancedWrap: true,
        },
      }));

      this.container = container;
      return;
    }

    container.add(this.scene.add.text(contentX, y + (isCompact ? 24 : 26), quest.name, {
      color: theme.text,
      fontFamily,
      fontSize: isCompact ? '11px' : '12px',
      fontStyle: 'bold',
      fixedWidth: contentWidth,
      fixedHeight: isCompact ? 26 : 28,
      wordWrap: {
        width: contentWidth,
        useAdvancedWrap: true,
      },
    }));

    const statusWidth = isClaimable ? contentWidth - rightActionWidth - 6 : Math.floor(contentWidth * 0.48);
    container.add(this.scene.add.text(contentX, y + height - (isCompact ? 22 : 24), isClaimable
      ? this.options.t('ui.questWidget.readyShort')
      : this.options.getQuestProgressText(quest), {
      color: isClaimable ? '#d9f6ba' : theme.mutedText,
      fontFamily,
      fontSize: isCompact ? '10px' : '11px',
      fontStyle: isClaimable ? 'bold' : 'normal',
      fixedWidth: statusWidth,
      fixedHeight: isCompact ? 18 : 20,
      wordWrap: {
        width: statusWidth,
        useAdvancedWrap: true,
      },
    }));

    if (isClaimable) {
      const claimText = this.scene.add.text(x + width - inset, y + height - (isCompact ? 15 : 16), this.options.t('ui.quests.claim'), {
        color: '#ffffff',
        fontFamily,
        fontSize: isCompact ? '10px' : '12px',
        fontStyle: 'bold',
        backgroundColor: `#${theme.buttonHover.toString(16).padStart(6, '0')}`,
        padding: { x: isCompact ? 8 : 10, y: 5 },
      }).setOrigin(1, 0.5);

      claimText
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          pointer.event?.stopPropagation();

          if (this.options.isModalOpen()) {
            return;
          }

          this.options.onButtonClickSound();
          this.options.onClaimQuest(quest.id);
        });

      container.add(claimText);
    } else {
      const rewardWidth = contentWidth - statusWidth - 6;
      container.add(this.scene.add.text(x + width - inset, y + height - (isCompact ? 14 : 16), this.options.getQuestRewardText(quest.reward), {
        color: theme.goldText,
        fontFamily,
        fontSize: isCompact ? '9px' : '10px',
        fontStyle: 'bold',
        fixedWidth: rewardWidth,
        fixedHeight: isCompact ? 16 : 18,
        align: 'right',
        wordWrap: {
          width: rewardWidth,
          useAdvancedWrap: true,
        },
      }).setOrigin(1, 0.5));
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

  private addIcon(container: Phaser.GameObjects.Container, x: number, y: number, icon: string, isReady: boolean, scale = 1): void {
    const graphics = this.scene.add.graphics();
    const fill = isReady ? 0xffd36a : 0xa4dc72;
    const radius = 15 * scale;

    graphics.fillStyle(fill, 0.9);
    graphics.lineStyle(2, 0xf4e6a6, 0.75);
    graphics.fillRoundedRect(x - radius, y - radius, radius * 2, radius * 2, 8 * scale);
    graphics.strokeRoundedRect(x - radius, y - radius, radius * 2, radius * 2, 8 * scale);
    graphics.lineStyle(2, 0x173c27, 0.9);

    if (icon === 'merge') {
      graphics.lineBetween(x - 9 * scale, y, x + 9 * scale, y);
      graphics.lineBetween(x + 4 * scale, y - 5 * scale, x + 9 * scale, y);
      graphics.lineBetween(x + 4 * scale, y + 5 * scale, x + 9 * scale, y);
    } else if (icon === 'battle') {
      graphics.lineBetween(x - 8 * scale, y + 7 * scale, x + 7 * scale, y - 8 * scale);
      graphics.lineBetween(x + 8 * scale, y + 7 * scale, x - 7 * scale, y - 8 * scale);
    } else if (icon === 'forge') {
      graphics.strokeTriangle(x, y - 10 * scale, x + 9 * scale, y + 8 * scale, x - 9 * scale, y + 8 * scale);
    } else if (icon === 'ritual') {
      graphics.strokeCircle(x, y, 8 * scale);
      graphics.lineBetween(x, y - 11 * scale, x, y + 11 * scale);
      graphics.lineBetween(x - 11 * scale, y, x + 11 * scale, y);
    } else if (icon === 'done') {
      graphics.lineBetween(x - 9 * scale, y, x - 2 * scale, y + 7 * scale);
      graphics.lineBetween(x - 2 * scale, y + 7 * scale, x + 10 * scale, y - 8 * scale);
    } else {
      graphics.strokeEllipse(x, y + 1 * scale, 16 * scale, 22 * scale);
    }

    container.add(graphics);
  }
}
