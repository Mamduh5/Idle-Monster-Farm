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
    this.addIcon(container, x + 20, y + height / 2, quest?.icon ?? 'done', isClaimable);

    container.add(this.scene.add.text(x + 42, y + 7, this.options.t('ui.questWidget.title'), {
      color: isClaimable ? '#fff4a8' : theme.goldText,
      fontFamily,
      fontSize: isCompact ? '12px' : '13px',
      fontStyle: 'bold',
      fixedWidth: width - 52,
    }));

    if (!quest) {
      container.add(this.scene.add.text(x + 42, y + 30, this.options.t('ui.questWidget.allDone'), {
        color: theme.text,
        fontFamily,
        fontSize: isCompact ? '11px' : '12px',
        fontStyle: 'bold',
        fixedWidth: width - 52,
        wordWrap: { width: width - 52 },
      }));

      this.container = container;
      return;
    }

    container.add(this.scene.add.text(x + 42, y + (isCompact ? 25 : 27), quest.name, {
      color: theme.text,
      fontFamily,
      fontSize: isCompact ? '11px' : '12px',
      fontStyle: 'bold',
      fixedWidth: isClaimable ? width - 112 : width - 52,
      wordWrap: { width: isClaimable ? width - 112 : width - 52 },
    }));

    container.add(this.scene.add.text(x + 42, y + (isCompact ? 45 : 49), isClaimable
      ? this.options.t('ui.questWidget.ready')
      : this.options.getQuestProgressText(quest), {
      color: isClaimable ? '#d9f6ba' : theme.mutedText,
      fontFamily,
      fontSize: isCompact ? '10px' : '11px',
      fontStyle: isClaimable ? 'bold' : 'normal',
      fixedWidth: isClaimable ? width - 112 : width - 52,
      wordWrap: { width: isClaimable ? width - 112 : width - 52 },
    }));

    if (isClaimable) {
      const claimText = this.scene.add.text(x + width - 10, y + height / 2 + 8, this.options.t('ui.quests.claim'), {
        color: '#ffffff',
        fontFamily,
        fontSize: isCompact ? '11px' : '12px',
        fontStyle: 'bold',
        backgroundColor: `#${theme.buttonHover.toString(16).padStart(6, '0')}`,
        padding: { x: isCompact ? 7 : 9, y: 5 },
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
      container.add(this.scene.add.text(x + width - 10, y + height - 12, this.options.getQuestRewardText(quest.reward), {
        color: theme.goldText,
        fontFamily,
        fontSize: isCompact ? '9px' : '10px',
        fontStyle: 'bold',
      }).setOrigin(1, 1));
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

  private addIcon(container: Phaser.GameObjects.Container, x: number, y: number, icon: string, isReady: boolean): void {
    const graphics = this.scene.add.graphics();
    const fill = isReady ? 0xffd36a : 0xa4dc72;

    graphics.fillStyle(fill, 0.9);
    graphics.lineStyle(2, 0xf4e6a6, 0.75);
    graphics.fillRoundedRect(x - 15, y - 15, 30, 30, 8);
    graphics.strokeRoundedRect(x - 15, y - 15, 30, 30, 8);
    graphics.lineStyle(2, 0x173c27, 0.9);

    if (icon === 'merge') {
      graphics.lineBetween(x - 9, y, x + 9, y);
      graphics.lineBetween(x + 4, y - 5, x + 9, y);
      graphics.lineBetween(x + 4, y + 5, x + 9, y);
    } else if (icon === 'battle') {
      graphics.lineBetween(x - 8, y + 7, x + 7, y - 8);
      graphics.lineBetween(x + 8, y + 7, x - 7, y - 8);
    } else if (icon === 'forge') {
      graphics.strokeTriangle(x, y - 10, x + 9, y + 8, x - 9, y + 8);
    } else if (icon === 'ritual') {
      graphics.strokeCircle(x, y, 8);
      graphics.lineBetween(x, y - 11, x, y + 11);
      graphics.lineBetween(x - 11, y, x + 11, y);
    } else if (icon === 'done') {
      graphics.lineBetween(x - 9, y, x - 2, y + 7);
      graphics.lineBetween(x - 2, y + 7, x + 10, y - 8);
    } else {
      graphics.strokeEllipse(x, y + 1, 16, 22);
    }

    container.add(graphics);
  }
}
