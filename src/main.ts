import Phaser from 'phaser';
import './styles.css';
import { BootScene } from './scenes/BootScene';
import { FarmScene } from './scenes/FarmScene';
import { PreloadScene } from './scenes/PreloadScene';

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#16381f',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
  },
  scene: [BootScene, PreloadScene, FarmScene],
};

new Phaser.Game(gameConfig);
