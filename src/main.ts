import Phaser from 'phaser';
import './styles.css';
import { BootScene } from './scenes/BootScene';
import { FarmScene } from './scenes/FarmScene';
import { PreloadScene } from './scenes/PreloadScene';

window.addEventListener('error', (event) => {
  console.error('[IdleMonsterFarm] window error', event.error ?? event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[IdleMonsterFarm] unhandled rejection', event.reason);
});

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

try {
  new Phaser.Game(gameConfig);
} catch (error) {
  console.error('[IdleMonsterFarm] startup failed', error);
  throw error;
}
