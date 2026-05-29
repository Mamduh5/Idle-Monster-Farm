import Phaser from 'phaser';
import { getText } from '../i18n/translations';
import { loadSettings } from '../systems/settingsSystem';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    const { width, height } = this.scale;
    const language = loadSettings().language;

    this.add.text(width / 2, height / 2, getText(language, 'ui.loading'), {
      color: '#f7ffe8',
      fontFamily: '"Noto Sans Thai", Tahoma, Arial, sans-serif',
      fontSize: '24px',
    }).setOrigin(0.5);
  }

  create(): void {
    this.scene.start('FarmScene');
  }
}
