import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2, 'Loading...', {
      color: '#f7ffe8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
    }).setOrigin(0.5);
  }

  create(): void {
    this.scene.start('FarmScene');
  }
}
