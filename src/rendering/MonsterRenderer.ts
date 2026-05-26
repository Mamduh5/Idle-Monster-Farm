import Phaser from 'phaser';
import { MONSTER_DEFINITIONS } from '../data/monsters';
import type { MonsterDefinition, MonsterFamily } from '../types/game-state';

export type MonsterVisual = Phaser.GameObjects.Container;

type MonsterVisualStyle = {
  bodyColor: number;
  baseColor: number;
  strokeColor: number;
  accentColor: number;
  secondaryAccentColor: number;
  bodyWidth: number;
  bodyHeight: number;
  silhouetteVariant: string;
  patternVariant: string;
  accessories: string[];
  auraType: string;
  visualIntensity: MonsterVisualIntensity;
  stemColor?: number;
  stemStrokeColor?: number;
};

type MonsterVisualIdentity = MonsterVisualStyle & {
  family: MonsterFamily;
  level: number;
};

type MonsterVisualIntensity = {
  tier: number;
  glowAlpha: number;
  glowScale: number;
  outlineWidth: number;
  detailScale: number;
  sparkleCount: number;
};

export class MonsterRenderer {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly fontFamily: string,
    private readonly debugEnabled: boolean,
  ) {}

  addCompendiumIcon(
    container: Phaser.GameObjects.Container,
    monster: MonsterDefinition,
    isDiscovered: boolean,
    iconX: number,
    iconY: number,
    scale = 1,
  ): void {
    if (!isDiscovered) {
      container.add(this.scene.add.circle(iconX, iconY, 18 * scale, 0x303735)
        .setStrokeStyle(2, 0x707a73, 0.85));
      container.add(this.scene.add.text(iconX, iconY - 11 * scale, '?', {
        color: '#d9d6ec',
        fontFamily: this.fontFamily,
        fontSize: `${Math.round(22 * scale)}px`,
        fontStyle: 'bold',
      }).setOrigin(0.5, 0));
      return;
    }

    this.addMonsterVisual(container, monster, iconX, iconY, 0.58 * scale);
  }

  addMonsterVisual(
    container: Phaser.GameObjects.Container,
    monster: MonsterDefinition,
    x = 0,
    y = 0,
    scale = 1,
  ): void {
    const visualStyle = this.getMonsterVisualStyle(monster.family, monster.level);

    if (monster.family === 'Mushroom') {
      this.addMushroomVisual(container, monster.level, visualStyle, x, y, scale);
      return;
    }

    if (monster.family === 'Spore') {
      this.addSporeVisual(container, monster.level, visualStyle, x, y, scale);
      return;
    }

    this.addSlimeVisual(container, monster.level, visualStyle, x, y, scale);
  }
  private addSlimeVisual(
    container: Phaser.GameObjects.Container,
    level: number,
    visualStyle: MonsterVisualStyle,
    x = 0,
    y = 0,
    scale = 1,
  ): void {
    this.addMonsterAura(container, visualStyle, x, y, scale);

    container.add(this.scene.add.ellipse(
      x,
      y + 8 * scale,
      (visualStyle.bodyWidth + 6) * scale,
      (visualStyle.bodyHeight - 2) * scale,
      0x2f7d40,
      0.26,
    ));
    container.add(this.scene.add.ellipse(
      x,
      y,
      visualStyle.bodyWidth * scale,
      visualStyle.bodyHeight * scale,
      visualStyle.bodyColor,
    ).setStrokeStyle(Math.max(1, Math.round(visualStyle.visualIntensity.outlineWidth * scale)), visualStyle.strokeColor, 0.95));
    container.add(this.scene.add.ellipse(
      x + 3 * scale,
      y - 2 * scale,
      visualStyle.bodyWidth * 0.72 * scale,
      visualStyle.bodyHeight * 0.52 * scale,
      visualStyle.accentColor,
      0.12 + visualStyle.visualIntensity.tier * 0.018,
    ));
    container.add(this.scene.add.ellipse(x - 12 * scale, y - 12 * scale, 14 * scale, 9 * scale, 0xffffff, 0.28));
    container.add(this.scene.add.circle(x - 11 * scale, y - 4 * scale, 4 * scale, 0x10291a));
    container.add(this.scene.add.circle(x + 11 * scale, y - 4 * scale, 4 * scale, 0x10291a));
    container.add(this.scene.add.circle(x - 10 * scale, y - 5 * scale, 1.5 * scale, 0xffffff, 0.85));
    container.add(this.scene.add.circle(x + 12 * scale, y - 5 * scale, 1.5 * scale, 0xffffff, 0.85));
    container.add(this.scene.add.ellipse(x - 17 * scale, y + 4 * scale, 6 * scale, 4 * scale, 0xff9fb1, 0.35));
    container.add(this.scene.add.ellipse(x + 17 * scale, y + 4 * scale, 6 * scale, 4 * scale, 0xff9fb1, 0.35));

    this.addSlimeDecorations(container, level, visualStyle, x, y, scale);
    this.addVisualIntensitySparkles(container, visualStyle, x, y, scale);
  }

  private addMushroomVisual(
    container: Phaser.GameObjects.Container,
    level: number,
    visualStyle: MonsterVisualStyle,
    x = 0,
    y = 0,
    scale = 1,
  ): void {
    this.addMonsterAura(container, visualStyle, x, y - 5 * scale, scale);

    const strokeWidth = Math.max(1, Math.round(visualStyle.visualIntensity.outlineWidth * scale));
    const stemColor = visualStyle.stemColor ?? (level >= 4 ? 0xf0e6c4 : 0xf3d9ad);
    const stemStroke = visualStyle.stemStrokeColor ?? (level >= 4 ? 0x927846 : 0x8a5a30);
    const capWidth = visualStyle.bodyWidth * scale;
    const capHeight = visualStyle.bodyHeight * scale;

    container.add(this.scene.add.ellipse(x, y + 16 * scale, 30 * scale, 10 * scale, 0x2f7d40, 0.24));
    container.add(this.scene.add.rectangle(x, y + 9 * scale, 17 * scale, 30 * scale, stemColor, 0.98)
      .setStrokeStyle(strokeWidth, stemStroke, 0.9));
    container.add(this.scene.add.ellipse(x, y - 7 * scale, capWidth, capHeight, visualStyle.bodyColor, 0.98)
      .setStrokeStyle(strokeWidth, visualStyle.strokeColor, 0.95));
    container.add(this.scene.add.ellipse(x, y + 2 * scale, capWidth * 0.78, capHeight * 0.34, visualStyle.strokeColor, 0.18));
    container.add(this.scene.add.ellipse(x - 8 * scale, y - 15 * scale, capWidth * 0.34, capHeight * 0.18, visualStyle.accentColor, 0.22));
    container.add(this.scene.add.circle(x - 6 * scale, y + 8 * scale, 3.2 * scale, 0x10291a));
    container.add(this.scene.add.circle(x + 6 * scale, y + 8 * scale, 3.2 * scale, 0x10291a));
    container.add(this.scene.add.circle(x - 5.2 * scale, y + 7.2 * scale, 1.1 * scale, 0xffffff, 0.85));
    container.add(this.scene.add.circle(x + 6.8 * scale, y + 7.2 * scale, 1.1 * scale, 0xffffff, 0.85));

    this.addMushroomDecorations(container, level, visualStyle, x, y, scale);
    this.addVisualIntensitySparkles(container, visualStyle, x, y - 5 * scale, scale);
  }

  private addSporeVisual(
    container: Phaser.GameObjects.Container,
    level: number,
    visualStyle: MonsterVisualStyle,
    x = 0,
    y = 0,
    scale = 1,
  ): void {
    this.addMonsterAura(container, visualStyle, x, y - 4 * scale, scale);

    const strokeWidth = Math.max(1, Math.round(visualStyle.visualIntensity.outlineWidth * scale));
    const bodyWidth = visualStyle.bodyWidth * scale;
    const bodyHeight = visualStyle.bodyHeight * scale;
    const capWidth = bodyWidth * 0.96;
    const capHeight = bodyHeight * 0.56;

    container.add(this.scene.add.ellipse(x, y + 18 * scale, bodyWidth * 0.76, 10 * scale, 0x2f7d40, 0.24));
    container.add(this.scene.add.ellipse(x, y + 8 * scale, bodyWidth * 0.74, bodyHeight * 0.62, visualStyle.baseColor, 0.98)
      .setStrokeStyle(strokeWidth, visualStyle.strokeColor, 0.95));
    container.add(this.scene.add.rectangle(x, y + 4 * scale, 15 * scale, 20 * scale, visualStyle.secondaryAccentColor, 0.86)
      .setStrokeStyle(Math.max(1, Math.round(1.4 * scale)), visualStyle.strokeColor, 0.58));
    container.add(this.scene.add.ellipse(x, y - 9 * scale, capWidth, capHeight, visualStyle.bodyColor, 0.98)
      .setStrokeStyle(strokeWidth, visualStyle.strokeColor, 0.95));
    container.add(this.scene.add.ellipse(x, y + 1 * scale, capWidth * 0.76, capHeight * 0.34, visualStyle.strokeColor, 0.18));
    container.add(this.scene.add.ellipse(x - 9 * scale, y - 15 * scale, capWidth * 0.3, capHeight * 0.2, visualStyle.accentColor, 0.36));
    container.add(this.scene.add.circle(x - 7 * scale, y + 8 * scale, 3.1 * scale, 0x10291a));
    container.add(this.scene.add.circle(x + 7 * scale, y + 8 * scale, 3.1 * scale, 0x10291a));
    container.add(this.scene.add.circle(x - 6.2 * scale, y + 7 * scale, 1.1 * scale, 0xffffff, 0.85));
    container.add(this.scene.add.circle(x + 7.8 * scale, y + 7 * scale, 1.1 * scale, 0xffffff, 0.85));
    container.add(this.scene.add.ellipse(x - 13 * scale, y + 13 * scale, 6 * scale, 4 * scale, 0xff9fb1, 0.28));
    container.add(this.scene.add.ellipse(x + 13 * scale, y + 13 * scale, 6 * scale, 4 * scale, 0xff9fb1, 0.28));

    this.addSporeDecorations(container, level, visualStyle, x, y, scale);
    this.addVisualIntensitySparkles(container, visualStyle, x, y - 4 * scale, scale);
  }

  private addMonsterAura(
    container: Phaser.GameObjects.Container,
    visualStyle: MonsterVisualStyle,
    x: number,
    y: number,
    scale: number,
  ): void {
    const { visualIntensity } = visualStyle;

    if (visualIntensity.glowAlpha <= 0) {
      return;
    }

    const glowWidth = visualStyle.bodyWidth * visualIntensity.glowScale * scale;
    const glowHeight = visualStyle.bodyHeight * visualIntensity.glowScale * scale;

    container.add(this.scene.add.ellipse(x, y, glowWidth, glowHeight, visualStyle.accentColor, visualIntensity.glowAlpha));

    if (visualIntensity.tier >= 3) {
      container.add(this.scene.add.ellipse(x, y, glowWidth * 1.13, glowHeight * 1.16, visualStyle.secondaryAccentColor, 0)
        .setStrokeStyle(Math.max(1, Math.round(1.4 * scale)), visualStyle.secondaryAccentColor, 0.28));
    }
  }

  private addVisualIntensitySparkles(
    container: Phaser.GameObjects.Container,
    visualStyle: MonsterVisualStyle,
    x: number,
    y: number,
    scale: number,
  ): void {
    const sparkleCount = Math.min(scale < 0.55 ? 2 : 4, visualStyle.visualIntensity.sparkleCount);

    if (sparkleCount <= 0) {
      return;
    }

    const sparklePositions = [
      [-25, -16],
      [24, -11],
      [-21, 11],
      [22, 9],
    ];

    sparklePositions.slice(0, sparkleCount).forEach(([sparkleX, sparkleY], index) => {
      container.add(this.scene.add.star(
        x + sparkleX * scale,
        y + sparkleY * scale,
        4,
        Math.max(1.2, 2.2 * scale),
        Math.max(2.2, 4.4 * scale),
        index % 2 === 0 ? visualStyle.accentColor : visualStyle.secondaryAccentColor,
        0.86,
      ));
    });
  }

  private getMonsterVisualStyle(family: MonsterFamily, level: number): MonsterVisualStyle {
    return this.getMonsterVisualIdentity(family, level);
  }

  private getMonsterVisualIdentity(monsterOrFamily: MonsterDefinition | MonsterFamily, level?: number): MonsterVisualIdentity {
    const family = typeof monsterOrFamily === 'string' ? monsterOrFamily : monsterOrFamily.family;
    const monsterLevel = typeof monsterOrFamily === 'string' ? level ?? 1 : monsterOrFamily.level;
    const visualIntensity = this.getMonsterVisualIntensity(family, monsterLevel);

    if (family === 'Mushroom') {
      return this.getMushroomVisualIdentity(monsterLevel, visualIntensity);
    }

    if (family === 'Spore') {
      return this.getSporeVisualIdentity(monsterLevel, visualIntensity);
    }

    return this.getSlimeVisualIdentity(monsterLevel, visualIntensity);
  }

  private getMonsterVisualIntensity(family: MonsterFamily, level: number): MonsterVisualIntensity {
    const maxLevel = family === 'Mushroom' ? 8 : family === 'Spore' ? 10 : 12;
    const normalizedLevel = Phaser.Math.Clamp(level, 1, maxLevel);
    const progress = maxLevel <= 1 ? 0 : (normalizedLevel - 1) / (maxLevel - 1);
    const tier = Math.min(5, Math.floor(progress * 6));

    return {
      tier,
      glowAlpha: tier === 0 ? 0 : 0.08 + tier * 0.035,
      glowScale: 1.08 + tier * 0.055,
      outlineWidth: 2 + Math.min(3, Math.floor(tier / 2)),
      detailScale: 1 + tier * 0.055,
      sparkleCount: Math.max(0, tier - 1),
    };
  }

  private getSlimeVisualIdentity(level: number, visualIntensity: MonsterVisualIntensity): MonsterVisualIdentity {
    const paletteByLevel: Record<number, Omit<MonsterVisualIdentity, 'family' | 'level' | 'visualIntensity'>> = {
      1: {
        bodyColor: 0x80e278,
        baseColor: 0x80e278,
        strokeColor: 0x2e7a35,
        accentColor: 0xbaf7a0,
        secondaryAccentColor: 0xff9fb1,
        bodyWidth: 46,
        bodyHeight: 38,
        silhouetteVariant: 'round-drop',
        patternVariant: 'plain',
        accessories: [],
        auraType: 'none',
      },
      2: {
        bodyColor: 0x66d8e7,
        baseColor: 0x66d8e7,
        strokeColor: 0x247a8d,
        accentColor: 0xd7f5ff,
        secondaryAccentColor: 0x8df0ff,
        bodyWidth: 54,
        bodyHeight: 46,
        silhouetteVariant: 'tall-drop',
        patternVariant: 'bubble',
        accessories: ['bubble crest'],
        auraType: 'dew',
      },
      3: {
        bodyColor: 0xb28df0,
        baseColor: 0xb28df0,
        strokeColor: 0x6543a1,
        accentColor: 0xf7e27c,
        secondaryAccentColor: 0xd8bdff,
        bodyWidth: 60,
        bodyHeight: 50,
        silhouetteVariant: 'wide-drop',
        patternVariant: 'star core',
        accessories: ['star core'],
        auraType: 'spark',
      },
      4: {
        bodyColor: 0x9ee45d,
        baseColor: 0x9ee45d,
        strokeColor: 0x4b8732,
        accentColor: 0xffdf9c,
        secondaryAccentColor: 0xf6ffbf,
        bodyWidth: 58,
        bodyHeight: 48,
        silhouetteVariant: 'horned',
        patternVariant: 'leaf glint',
        accessories: ['horns'],
        auraType: 'leaf',
      },
      5: {
        bodyColor: 0xf0a45d,
        baseColor: 0xf0a45d,
        strokeColor: 0x945024,
        accentColor: 0xf7d35f,
        secondaryAccentColor: 0xe94c74,
        bodyWidth: 62,
        bodyHeight: 50,
        silhouetteVariant: 'royal',
        patternVariant: 'gem crown',
        accessories: ['crown'],
        auraType: 'gold',
      },
      6: {
        bodyColor: 0x8ae8f2,
        baseColor: 0x8ae8f2,
        strokeColor: 0x267c94,
        accentColor: 0xd7fbff,
        secondaryAccentColor: 0x5dc3e6,
        bodyWidth: 60,
        bodyHeight: 50,
        silhouetteVariant: 'crystal',
        patternVariant: 'triple crystal',
        accessories: ['crystals'],
        auraType: 'frost',
      },
      7: {
        bodyColor: 0x7bb36a,
        baseColor: 0x7bb36a,
        strokeColor: 0x395e32,
        accentColor: 0xf0dca4,
        secondaryAccentColor: 0xc5f0a0,
        bodyWidth: 62,
        bodyHeight: 52,
        silhouetteVariant: 'ancient',
        patternVariant: 'rune halo',
        accessories: ['runes'],
        auraType: 'rune',
      },
      8: {
        bodyColor: 0x4f4bb8,
        baseColor: 0x4f4bb8,
        strokeColor: 0x24205f,
        accentColor: 0xb9d9ff,
        secondaryAccentColor: 0xfff4a8,
        bodyWidth: 64,
        bodyHeight: 52,
        silhouetteVariant: 'galaxy',
        patternVariant: 'two star orbit',
        accessories: ['orbit stars'],
        auraType: 'galaxy',
      },
      9: {
        bodyColor: 0x7c4fd6,
        baseColor: 0x7c4fd6,
        strokeColor: 0x37216f,
        accentColor: 0xff8bc8,
        secondaryAccentColor: 0xbad7ff,
        bodyWidth: 66,
        bodyHeight: 53,
        silhouetteVariant: 'nebula',
        patternVariant: 'nebula beads',
        accessories: ['orbit beads'],
        auraType: 'nebula',
      },
      10: {
        bodyColor: 0xf2b84f,
        baseColor: 0xf2b84f,
        strokeColor: 0x8f5c18,
        accentColor: 0xfff0a8,
        secondaryAccentColor: 0xff7659,
        bodyWidth: 67,
        bodyHeight: 54,
        silhouetteVariant: 'solar',
        patternVariant: 'solar crown',
        accessories: ['sun rays'],
        auraType: 'solar',
      },
      11: {
        bodyColor: 0x38356f,
        baseColor: 0x38356f,
        strokeColor: 0x171530,
        accentColor: 0xf0e6ff,
        secondaryAccentColor: 0xffb85f,
        bodyWidth: 68,
        bodyHeight: 55,
        silhouetteVariant: 'eclipse',
        patternVariant: 'eclipse ring',
        accessories: ['eclipse ring'],
        auraType: 'eclipse',
      },
      12: {
        bodyColor: 0x2f6fc2,
        baseColor: 0x2f6fc2,
        strokeColor: 0x15315d,
        accentColor: 0xd8fbff,
        secondaryAccentColor: 0xfff19a,
        bodyWidth: 70,
        bodyHeight: 56,
        silhouetteVariant: 'cosmic',
        patternVariant: 'cosmic crown',
        accessories: ['crown ring', 'stars'],
        auraType: 'cosmic',
      },
    };

    return {
      family: 'Slime',
      level,
      visualIntensity,
      ...(paletteByLevel[level] ?? paletteByLevel[12]),
    };
  }

  private getMushroomVisualIdentity(level: number, visualIntensity: MonsterVisualIntensity): MonsterVisualIdentity {
    const paletteByLevel: Record<number, Omit<MonsterVisualIdentity, 'family' | 'level' | 'visualIntensity'>> = {
      1: {
        bodyColor: 0xd8a15e,
        baseColor: 0xd8a15e,
        strokeColor: 0x754523,
        accentColor: 0xffe7bd,
        secondaryAccentColor: 0xf3d9ad,
        bodyWidth: 46,
        bodyHeight: 32,
        silhouetteVariant: 'button-cap',
        patternVariant: 'single spot',
        accessories: ['small spot'],
        auraType: 'none',
        stemColor: 0xf3d9ad,
        stemStrokeColor: 0x8a5a30,
      },
      2: {
        bodyColor: 0xc9534a,
        baseColor: 0xc9534a,
        strokeColor: 0x742922,
        accentColor: 0xffefd2,
        secondaryAccentColor: 0xf7b0a0,
        bodyWidth: 52,
        bodyHeight: 36,
        silhouetteVariant: 'spotted-cap',
        patternVariant: 'four spots',
        accessories: ['spots'],
        auraType: 'none',
        stemColor: 0xf3d9ad,
        stemStrokeColor: 0x8a5a30,
      },
      3: {
        bodyColor: 0xbe8f55,
        baseColor: 0xbe8f55,
        strokeColor: 0x6b4c28,
        accentColor: 0xe6d0a0,
        secondaryAccentColor: 0xd9c08a,
        bodyWidth: 56,
        bodyHeight: 38,
        silhouetteVariant: 'elder-cap',
        patternVariant: 'side gills',
        accessories: ['gills'],
        auraType: 'spore',
        stemColor: 0xf0e6c4,
        stemStrokeColor: 0x927846,
      },
      4: {
        bodyColor: 0x8f65d8,
        baseColor: 0x8f65d8,
        strokeColor: 0x4d347d,
        accentColor: 0xdcc7ff,
        secondaryAccentColor: 0xfff1a8,
        bodyWidth: 60,
        bodyHeight: 40,
        silhouetteVariant: 'mystic-cap',
        patternVariant: 'star veil',
        accessories: ['mystic stars'],
        auraType: 'mystic',
        stemColor: 0xf0e6c4,
        stemStrokeColor: 0x927846,
      },
      5: {
        bodyColor: 0x5d7f3f,
        baseColor: 0x5d7f3f,
        strokeColor: 0x2d4c25,
        accentColor: 0xf2e08f,
        secondaryAccentColor: 0x9fcb73,
        bodyWidth: 64,
        bodyHeight: 42,
        silhouetteVariant: 'giant-cap',
        patternVariant: 'golden nodes',
        accessories: ['gold nodes', 'base band'],
        auraType: 'forest',
        stemColor: 0xf0e6c4,
        stemStrokeColor: 0x927846,
      },
      6: {
        bodyColor: 0x5f8ed8,
        baseColor: 0x5f8ed8,
        strokeColor: 0x28507f,
        accentColor: 0xd8fbff,
        secondaryAccentColor: 0x9bd6ec,
        bodyWidth: 66,
        bodyHeight: 44,
        silhouetteVariant: 'mooncap',
        patternVariant: 'lunar crystals',
        accessories: ['moon crystals', 'silver band'],
        auraType: 'lunar',
        stemColor: 0xf0e6c4,
        stemStrokeColor: 0x927846,
      },
      7: {
        bodyColor: 0x5844b8,
        baseColor: 0x5844b8,
        strokeColor: 0x281d63,
        accentColor: 0xfff1a8,
        secondaryAccentColor: 0xbad7ff,
        bodyWidth: 68,
        bodyHeight: 45,
        silhouetteVariant: 'starlit-cap',
        patternVariant: 'constellation',
        accessories: ['star trail', 'blue band'],
        auraType: 'starlit',
        stemColor: 0xf0e6c4,
        stemStrokeColor: 0x927846,
      },
      8: {
        bodyColor: 0x26796d,
        baseColor: 0x26796d,
        strokeColor: 0x12443f,
        accentColor: 0xffd978,
        secondaryAccentColor: 0x9df5d7,
        bodyWidth: 72,
        bodyHeight: 48,
        silhouetteVariant: 'worldcap',
        patternVariant: 'world crown',
        accessories: ['canopy crown', 'root ring'],
        auraType: 'world',
        stemColor: 0xf0e6c4,
        stemStrokeColor: 0x927846,
      },
    };

    return {
      family: 'Mushroom',
      level,
      visualIntensity,
      ...(paletteByLevel[level] ?? paletteByLevel[8]),
    };
  }

  private getSporeVisualIdentity(level: number, visualIntensity: MonsterVisualIntensity): MonsterVisualIdentity {
    const paletteByLevel: Record<number, Omit<MonsterVisualIdentity, 'family' | 'level' | 'visualIntensity'>> = {
      1: {
        bodyColor: 0xa6d86a,
        baseColor: 0x7fdc86,
        strokeColor: 0x3f7a42,
        accentColor: 0xe8ffd0,
        secondaryAccentColor: 0xf3d9ad,
        bodyWidth: 50,
        bodyHeight: 42,
        silhouetteVariant: 'sporeling-cap-blob',
        patternVariant: 'soft spots',
        accessories: ['spore dots'],
        auraType: 'none',
        stemColor: 0xf3d9ad,
        stemStrokeColor: 0x8a5a30,
      },
      2: {
        bodyColor: 0x72d9c1,
        baseColor: 0x65d8e7,
        strokeColor: 0x267a70,
        accentColor: 0xd7fff0,
        secondaryAccentColor: 0xffd48f,
        bodyWidth: 55,
        bodyHeight: 46,
        silhouetteVariant: 'bouncy-spore',
        patternVariant: 'bounce rings',
        accessories: ['spring spores'],
        auraType: 'dew',
        stemColor: 0xf2dfb6,
        stemStrokeColor: 0x8a6a35,
      },
      3: {
        bodyColor: 0xd49ae8,
        baseColor: 0x94df72,
        strokeColor: 0x6a4384,
        accentColor: 0xfff0a8,
        secondaryAccentColor: 0xbff7a2,
        bodyWidth: 59,
        bodyHeight: 49,
        silhouetteVariant: 'bloom-spore',
        patternVariant: 'petal bloom',
        accessories: ['bloom petals'],
        auraType: 'spore',
        stemColor: 0xf0e6c4,
        stemStrokeColor: 0x927846,
      },
      4: {
        bodyColor: 0x9f7edb,
        baseColor: 0x7fc875,
        strokeColor: 0x4d347d,
        accentColor: 0xf0df9a,
        secondaryAccentColor: 0xdcc7ff,
        bodyWidth: 62,
        bodyHeight: 51,
        silhouetteVariant: 'elder-spore',
        patternVariant: 'elder gills',
        accessories: ['side gills', 'vine band'],
        auraType: 'mystic',
        stemColor: 0xf0e6c4,
        stemStrokeColor: 0x927846,
      },
      5: {
        bodyColor: 0xe0b453,
        baseColor: 0x79c45f,
        strokeColor: 0x835d1f,
        accentColor: 0xfff2a8,
        secondaryAccentColor: 0xe94c74,
        bodyWidth: 65,
        bodyHeight: 53,
        silhouetteVariant: 'royal-spore',
        patternVariant: 'crowned cap',
        accessories: ['cap crown'],
        auraType: 'gold',
        stemColor: 0xf0e6c4,
        stemStrokeColor: 0x927846,
      },
      6: {
        bodyColor: 0x5967d8,
        baseColor: 0x4fd0c4,
        strokeColor: 0x24205f,
        accentColor: 0xd8fbff,
        secondaryAccentColor: 0xfff19a,
        bodyWidth: 68,
        bodyHeight: 55,
        silhouetteVariant: 'cosmic-spore',
        patternVariant: 'cosmic spores',
        accessories: ['orbit spores', 'star cap'],
        auraType: 'cosmic',
        stemColor: 0xe9e2ff,
        stemStrokeColor: 0x5a4a8f,
      },
      7: {
        bodyColor: 0x5b42c8,
        baseColor: 0x4fd6b6,
        strokeColor: 0x1d174f,
        accentColor: 0xbff8ff,
        secondaryAccentColor: 0xffe38a,
        bodyWidth: 71,
        bodyHeight: 57,
        silhouetteVariant: 'astral-spore',
        patternVariant: 'astral orbit',
        accessories: ['orbit spores', 'astral halo'],
        auraType: 'astral',
        stemColor: 0xe9e2ff,
        stemStrokeColor: 0x514184,
      },
      8: {
        bodyColor: 0xa676e8,
        baseColor: 0x68d7e6,
        strokeColor: 0x4c2d7a,
        accentColor: 0xffd6f5,
        secondaryAccentColor: 0xbff8ff,
        bodyWidth: 74,
        bodyHeight: 59,
        silhouetteVariant: 'dream-spore',
        patternVariant: 'dream moons',
        accessories: ['moon spots', 'dream bubbles'],
        auraType: 'dream',
        stemColor: 0xf4e7ff,
        stemStrokeColor: 0x704d92,
      },
      9: {
        bodyColor: 0xd44d9c,
        baseColor: 0x69d077,
        strokeColor: 0x6d1d56,
        accentColor: 0xfff0a8,
        secondaryAccentColor: 0x9ff7ff,
        bodyWidth: 77,
        bodyHeight: 61,
        silhouetteVariant: 'mythic-spore',
        patternVariant: 'mythic runes',
        accessories: ['rune crown', 'mythic spores'],
        auraType: 'mythic',
        stemColor: 0xf4e7ff,
        stemStrokeColor: 0x7a3f82,
      },
      10: {
        bodyColor: 0xf4f0ff,
        baseColor: 0x65e0b9,
        strokeColor: 0x33577f,
        accentColor: 0xfff4a8,
        secondaryAccentColor: 0x8ff7ff,
        bodyWidth: 80,
        bodyHeight: 64,
        silhouetteVariant: 'eternal-spore',
        patternVariant: 'eternal halo',
        accessories: ['halo crown', 'radiant spores'],
        auraType: 'eternal',
        stemColor: 0xfff0d0,
        stemStrokeColor: 0x7d6d35,
      },
    };

    return {
      family: 'Spore',
      level,
      visualIntensity,
      ...(paletteByLevel[level] ?? paletteByLevel[10]),
    };
  }

  validateMonsterVisualIdentities(): void {
    const isLocalDebug = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (!this.debugEnabled && !isLocalDebug) {
      return;
    }

    const signatures = new Map<string, MonsterDefinition>();

    MONSTER_DEFINITIONS.forEach((monster) => {
      const identity = this.getMonsterVisualIdentity(monster);
      const signature = [
        identity.family,
        identity.bodyColor.toString(16),
        identity.strokeColor.toString(16),
        identity.accentColor.toString(16),
        identity.secondaryAccentColor.toString(16),
        identity.silhouetteVariant,
        identity.patternVariant,
        identity.accessories.join(','),
        identity.auraType,
        identity.visualIntensity.tier,
      ].join('|');
      const matchingMonster = signatures.get(signature);

      if (matchingMonster) {
        console.warn(
          `[Compendium] Visual identity overlap: ${matchingMonster.family} Lv ${matchingMonster.level} and ${monster.family} Lv ${monster.level}`,
        );
        return;
      }

      signatures.set(signature, monster);
    });
  }

  private addSporeDecorations(
    container: Phaser.GameObjects.Container,
    level: number,
    visualStyle: MonsterVisualStyle,
    x = 0,
    y = 0,
    scale = 1,
  ): void {
    const strokeWidth = Math.max(1, Math.round(2 * scale));

    [
      [-13, -10, 3.2],
      [10, -15, 4],
      [0, -5, 2.6],
    ].forEach(([spotX, spotY, radius]) => {
      container.add(this.scene.add.circle(
        x + spotX * scale,
        y + spotY * scale,
        radius * scale,
        visualStyle.accentColor,
        0.82,
      ));
    });

    if (level === 1) {
      container.add(this.scene.add.circle(x + 18 * scale, y - 2 * scale, 2.4 * scale, visualStyle.secondaryAccentColor, 0.76));
      return;
    }

    if (level === 2) {
      container.add(this.scene.add.ellipse(x, y + 10 * scale, 38 * scale, 19 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.accentColor, 0.55));
      container.add(this.scene.add.ellipse(x, y + 12 * scale, 48 * scale, 23 * scale, 0xffffff, 0)
        .setStrokeStyle(Math.max(1, Math.round(1.4 * scale)), visualStyle.secondaryAccentColor, 0.38));
      return;
    }

    if (level === 3) {
      [
        [-18, -18, -20],
        [0, -24, 0],
        [18, -18, 20],
      ].forEach(([petalX, petalY, angle]) => {
        const petal = this.scene.add.ellipse(
          x + petalX * scale,
          y + petalY * scale,
          10 * scale,
          16 * scale,
          visualStyle.accentColor,
          0.84,
        );
        petal.setAngle(angle);
        container.add(petal);
      });
      return;
    }

    if (level === 4) {
      container.add(this.scene.add.ellipse(x - 20 * scale, y - 7 * scale, 8 * scale, 18 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.secondaryAccentColor, 0.74));
      container.add(this.scene.add.ellipse(x + 20 * scale, y - 7 * scale, 8 * scale, 18 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.secondaryAccentColor, 0.74));
      container.add(this.scene.add.ellipse(x, y + 4 * scale, 42 * scale, 8 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.accentColor, 0.52));
      return;
    }

    if (level === 5) {
      container.add(this.scene.add.rectangle(x, y - 25 * scale, 28 * scale, 6 * scale, visualStyle.accentColor, 0.9)
        .setStrokeStyle(strokeWidth, visualStyle.strokeColor, 0.75));
      [-11, 0, 11].forEach((crownX, index) => {
        container.add(this.scene.add.triangle(
          x + crownX * scale,
          y - 31 * scale,
          0,
          -8 * scale,
          -5 * scale,
          5 * scale,
          5 * scale,
          5 * scale,
          index === 1 ? visualStyle.secondaryAccentColor : visualStyle.accentColor,
          0.92,
        ).setStrokeStyle(Math.max(1, Math.round(1.2 * scale)), visualStyle.strokeColor, 0.54));
      });
      return;
    }

    if (level === 6) {
      container.add(this.scene.add.ellipse(x, y - 5 * scale, 62 * scale, 30 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.accentColor, 0.48));
      [
        [-24, -3, 3.2],
        [24, -7, 3.4],
        [0, -27, 3.8],
      ].forEach(([sporeX, sporeY, radius], index) => {
        container.add(this.scene.add.star(
          x + sporeX * scale,
          y + sporeY * scale,
          5,
          Math.max(1.4, radius * 0.46 * scale),
          radius * scale,
          index === 1 ? visualStyle.secondaryAccentColor : visualStyle.accentColor,
          0.92,
        ));
      });
      return;
    }

    if (level === 7) {
      container.add(this.scene.add.ellipse(x, y - 6 * scale, 70 * scale, 34 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.accentColor, 0.6));
      container.add(this.scene.add.ellipse(x, y - 6 * scale, 48 * scale, 60 * scale, 0xffffff, 0)
        .setStrokeStyle(Math.max(1, Math.round(1.3 * scale)), visualStyle.secondaryAccentColor, 0.36));
      [
        [-29, -8, 3.4],
        [29, -3, 3.2],
        [0, -32, 4],
        [14, -25, 2.8],
      ].forEach(([sporeX, sporeY, radius], index) => {
        container.add(this.scene.add.star(
          x + sporeX * scale,
          y + sporeY * scale,
          5,
          Math.max(1.4, radius * 0.45 * scale),
          radius * scale,
          index % 2 === 0 ? visualStyle.accentColor : visualStyle.secondaryAccentColor,
          0.92,
        ));
      });
      return;
    }

    if (level === 8) {
      container.add(this.scene.add.arc(x - 18 * scale, y - 26 * scale, 8 * scale, 55, 300, false, visualStyle.accentColor, 0.88));
      [
        [-27, -7, 4.4],
        [26, -12, 3.6],
        [12, -30, 3],
        [-6, -24, 2.6],
      ].forEach(([bubbleX, bubbleY, radius], index) => {
        container.add(this.scene.add.circle(
          x + bubbleX * scale,
          y + bubbleY * scale,
          radius * scale,
          index % 2 === 0 ? visualStyle.accentColor : visualStyle.secondaryAccentColor,
          0.52,
        ).setStrokeStyle(Math.max(1, Math.round(1.1 * scale)), visualStyle.strokeColor, 0.28));
      });
      return;
    }

    if (level === 9) {
      container.add(this.scene.add.rectangle(x, y - 28 * scale, 34 * scale, 6 * scale, visualStyle.accentColor, 0.88)
        .setStrokeStyle(strokeWidth, visualStyle.strokeColor, 0.72));
      [-16, 0, 16].forEach((runeX, index) => {
        container.add(this.scene.add.star(
          x + runeX * scale,
          y - (index === 1 ? 35 : 31) * scale,
          6,
          2.2 * scale,
          6.2 * scale,
          index === 1 ? visualStyle.secondaryAccentColor : visualStyle.accentColor,
          0.92,
        ).setStrokeStyle(Math.max(1, Math.round(1.1 * scale)), visualStyle.strokeColor, 0.46));
      });
      [
        [-23, -3],
        [23, -4],
        [0, 3],
      ].forEach(([runeX, runeY]) => {
        container.add(this.scene.add.rectangle(x + runeX * scale, y + runeY * scale, 8 * scale, 3 * scale, visualStyle.secondaryAccentColor, 0.72));
      });
      return;
    }

    container.add(this.scene.add.ellipse(x, y - 9 * scale, 78 * scale, 40 * scale, 0xffffff, 0)
      .setStrokeStyle(strokeWidth, visualStyle.accentColor, 0.72));
    container.add(this.scene.add.ellipse(x, y - 9 * scale, 54 * scale, 68 * scale, 0xffffff, 0)
      .setStrokeStyle(Math.max(1, Math.round(1.4 * scale)), visualStyle.secondaryAccentColor, 0.48));
    [
      [-31, -9, 4],
      [31, -9, 4],
      [-18, -28, 3.4],
      [18, -28, 3.4],
      [0, -39, 4.8],
    ].forEach(([sporeX, sporeY, radius], index) => {
      container.add(this.scene.add.star(
        x + sporeX * scale,
        y + sporeY * scale,
        6,
        Math.max(1.6, radius * 0.42 * scale),
        radius * scale,
        index === 4 ? visualStyle.secondaryAccentColor : visualStyle.accentColor,
        0.94,
      ));
    });
  }

  private addMushroomDecorations(
    container: Phaser.GameObjects.Container,
    level: number,
    visualStyle: MonsterVisualStyle,
    x = 0,
    y = 0,
    scale = 1,
  ): void {
    const strokeWidth = Math.max(1, Math.round(2 * scale));

    if (level === 1) {
      container.add(this.scene.add.ellipse(x - 9 * scale, y - 11 * scale, 8 * scale, 5 * scale, 0xffe7bd, 0.9));
      return;
    }

    if (level === 2) {
      [
        [-13, -10, 4],
        [0, -17, 5],
        [13, -8, 4],
        [-3, -3, 3],
      ].forEach(([spotX, spotY, radius]) => {
        container.add(this.scene.add.circle(
          x + spotX * scale,
          y + spotY * scale,
          radius * scale,
          0xffefd2,
          0.95,
        ));
      });
      return;
    }

    if (level === 3) {
      container.add(this.scene.add.ellipse(x - 16 * scale, y - 5 * scale, 9 * scale, 15 * scale, 0xd9c08a, 0)
        .setStrokeStyle(strokeWidth, 0xe6d0a0, 0.82));
      container.add(this.scene.add.ellipse(x + 16 * scale, y - 5 * scale, 9 * scale, 15 * scale, 0xd9c08a, 0)
        .setStrokeStyle(strokeWidth, 0xe6d0a0, 0.82));
      container.add(this.scene.add.circle(x, y - 18 * scale, 4 * scale, 0xf0e0b2, 0.92));
      return;
    }

    if (level === 4) {
      container.add(this.scene.add.ellipse(x, y - 8 * scale, 48 * scale, 18 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, 0xdcc7ff, 0.76));
      container.add(this.scene.add.star(x - 12 * scale, y - 17 * scale, 5, 2.5 * scale, 5 * scale, 0xf4dcff, 0.95));
      container.add(this.scene.add.star(x + 13 * scale, y - 5 * scale, 5, 2.5 * scale, 5 * scale, 0xfff1a8, 0.95));
      return;
    }

    if (level === 6) {
      container.add(this.scene.add.ellipse(x, y - 9 * scale, 58 * scale, 22 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.accentColor, 0.84));
      container.add(this.scene.add.ellipse(x - 7 * scale, y - 12 * scale, 25 * scale, 9 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.secondaryAccentColor, 0.7));
      [
        [-18, -10, -8],
        [0, -20, 0],
        [17, -8, 8],
      ].forEach(([crystalX, crystalY, angle]) => {
        const crystal = this.scene.add.triangle(
          x + crystalX * scale,
          y + crystalY * scale,
          0,
          -8 * scale,
          -5 * scale,
          6 * scale,
          5 * scale,
          6 * scale,
          visualStyle.accentColor,
          0.95,
        ).setStrokeStyle(1, visualStyle.strokeColor, 0.78);

        crystal.setAngle(angle);
        container.add(crystal);
      });
      container.add(this.scene.add.rectangle(x, y + 25 * scale, 22 * scale, 5 * scale, visualStyle.secondaryAccentColor, 0.84)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.62));
      container.add(this.scene.add.circle(x + 10 * scale, y + 10 * scale, 2.2 * scale, visualStyle.bodyColor, 0.5));
      return;
    }

    if (level === 7) {
      container.add(this.scene.add.ellipse(x, y - 9 * scale, 60 * scale, 23 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.accentColor, 0.86));
      [
        [-18, -12],
        [-5, -20],
        [10, -14],
        [21, -6],
      ].forEach(([starX, starY], index) => {
        container.add(this.scene.add.star(
          x + starX * scale,
          y + starY * scale,
          5,
          (2.2 + index * 0.15) * scale,
          (4.7 + index * 0.22) * scale,
          index % 2 === 0 ? visualStyle.accentColor : visualStyle.secondaryAccentColor,
          0.95,
        ));
      });
      container.add(this.scene.add.ellipse(x, y - 7 * scale, 38 * scale, 12 * scale, visualStyle.secondaryAccentColor, 0.16));
      container.add(this.scene.add.rectangle(x, y + 25 * scale, 24 * scale, 5 * scale, visualStyle.secondaryAccentColor, 0.86)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.62));
      container.add(this.scene.add.circle(x - 11 * scale, y + 10 * scale, 2 * scale, visualStyle.accentColor, 0.64));
      container.add(this.scene.add.circle(x + 11 * scale, y + 10 * scale, 2 * scale, visualStyle.accentColor, 0.64));
      return;
    }

    if (level >= 8) {
      container.add(this.scene.add.ellipse(x, y - 9 * scale, 66 * scale, 25 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.accentColor, 0.9));
      container.add(this.scene.add.ellipse(x, y - 8 * scale, 46 * scale, 14 * scale, visualStyle.secondaryAccentColor, 0.18));
      container.add(this.scene.add.rectangle(x, y - 29 * scale, 28 * scale, 6 * scale, visualStyle.accentColor, 0.94)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.72));
      [-13, 0, 13].forEach((crownX, index) => {
        container.add(this.scene.add.triangle(
          x + crownX * scale,
          y - 34 * scale,
          0,
          8 * scale,
          5 * scale,
          -6 * scale,
          10 * scale,
          8 * scale,
          index === 1 ? visualStyle.secondaryAccentColor : visualStyle.accentColor,
          0.95,
        ).setStrokeStyle(1, visualStyle.strokeColor, 0.65));
      });
      container.add(this.scene.add.ellipse(x, y + 25 * scale, 34 * scale, 7 * scale, visualStyle.secondaryAccentColor, 0.9)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.62));
      container.add(this.scene.add.ellipse(x - 17 * scale, y + 12 * scale, 5 * scale, 15 * scale, visualStyle.accentColor, 0)
        .setStrokeStyle(1, visualStyle.accentColor, 0.66));
      container.add(this.scene.add.ellipse(x + 17 * scale, y + 12 * scale, 5 * scale, 15 * scale, visualStyle.accentColor, 0)
        .setStrokeStyle(1, visualStyle.accentColor, 0.66));
      return;
    }

    if (level === 5) {
      container.add(this.scene.add.ellipse(x, y - 9 * scale, 55 * scale, 20 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, 0xf2e08f, 0.8));
      container.add(this.scene.add.circle(x - 16 * scale, y - 11 * scale, 4.2 * scale, 0xf6dc85, 0.95)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.4));
      container.add(this.scene.add.circle(x, y - 18 * scale, 5 * scale, 0xffee9c, 0.95)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.4));
      container.add(this.scene.add.circle(x + 16 * scale, y - 8 * scale, 4.2 * scale, 0xf6dc85, 0.95)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.4));
      container.add(this.scene.add.rectangle(x, y + 25 * scale, 26 * scale, 5 * scale, 0x9fcb73, 0.85)
        .setStrokeStyle(1, 0x3f6a31, 0.65));
    }
  }

  private addSlimeDecorations(
    container: Phaser.GameObjects.Container,
    level: number,
    visualStyle: MonsterVisualStyle,
    x = 0,
    y = 0,
    scale = 1,
  ): void {
    const strokeWidth = Math.max(1, Math.round(2 * scale));

    if (level === 2) {
      container.add(this.scene.add.circle(x, y - 18 * scale, 7 * scale, 0xd7f5ff, 0.95)
        .setStrokeStyle(strokeWidth, visualStyle.strokeColor, 0.8));
      return;
    }

    if (level === 3) {
      container.add(this.scene.add.star(x, y - 2 * scale, 5, 9 * scale, 15 * scale, 0xf7e27c, 0.9)
        .setStrokeStyle(strokeWidth, 0x7d5f16, 0.8));
      return;
    }

    if (level === 4) {
      container.add(this.scene.add.triangle(x - 17 * scale, y - 18 * scale, 0, 13 * scale, 8 * scale, -8 * scale, 16 * scale, 13 * scale, 0xffdf9c, 0.96)
        .setStrokeStyle(strokeWidth, 0x8d5a24, 0.85));
      container.add(this.scene.add.triangle(x + 17 * scale, y - 18 * scale, 0, 13 * scale, 8 * scale, -8 * scale, 16 * scale, 13 * scale, 0xffdf9c, 0.96)
        .setStrokeStyle(strokeWidth, 0x8d5a24, 0.85));
      return;
    }

    if (level === 5) {
      container.add(this.scene.add.rectangle(x, y - 22 * scale, 28 * scale, 8 * scale, 0xf7d35f, 0.98)
        .setStrokeStyle(strokeWidth, 0x8f6b18, 0.9));
      container.add(this.scene.add.triangle(x - 10 * scale, y - 28 * scale, 0, 12 * scale, 6 * scale, -7 * scale, 12 * scale, 12 * scale, 0xf7d35f, 0.98)
        .setStrokeStyle(strokeWidth, 0x8f6b18, 0.85));
      container.add(this.scene.add.triangle(x, y - 31 * scale, 0, 14 * scale, 7 * scale, -8 * scale, 14 * scale, 14 * scale, 0xffe98d, 0.98)
        .setStrokeStyle(strokeWidth, 0x8f6b18, 0.85));
      container.add(this.scene.add.triangle(x + 10 * scale, y - 28 * scale, 0, 12 * scale, 6 * scale, -7 * scale, 12 * scale, 12 * scale, 0xf7d35f, 0.98)
        .setStrokeStyle(strokeWidth, 0x8f6b18, 0.85));
      container.add(this.scene.add.circle(x, y - 23 * scale, 2.4 * scale, 0xe94c74, 0.95));
      return;
    }

    if (level === 6) {
      container.add(this.scene.add.triangle(x - 14 * scale, y - 19 * scale, 0, 17 * scale, 6 * scale, -12 * scale, 12 * scale, 17 * scale, 0xd7fbff, 0.95)
        .setStrokeStyle(strokeWidth, 0x257a93, 0.85));
      container.add(this.scene.add.triangle(x, y - 24 * scale, 0, 20 * scale, 7 * scale, -14 * scale, 14 * scale, 20 * scale, 0xb7f4ff, 0.98)
        .setStrokeStyle(strokeWidth, 0x257a93, 0.9));
      container.add(this.scene.add.triangle(x + 14 * scale, y - 19 * scale, 0, 17 * scale, 6 * scale, -12 * scale, 12 * scale, 17 * scale, 0xd7fbff, 0.95)
        .setStrokeStyle(strokeWidth, 0x257a93, 0.85));
      return;
    }

    if (level === 7) {
      container.add(this.scene.add.ellipse(x - 14 * scale, y + 1 * scale, 9 * scale, 15 * scale, 0xf0dca4, 0)
        .setStrokeStyle(strokeWidth, 0xf0dca4, 0.8));
      container.add(this.scene.add.ellipse(x + 14 * scale, y + 1 * scale, 9 * scale, 15 * scale, 0xf0dca4, 0)
        .setStrokeStyle(strokeWidth, 0xf0dca4, 0.8));
      container.add(this.scene.add.circle(x, y - 13 * scale, 5 * scale, 0xf0dca4, 0)
        .setStrokeStyle(strokeWidth, 0xf0dca4, 0.85));
      container.add(this.scene.add.circle(x, y - 13 * scale, 2 * scale, 0xf0dca4, 0.9));
      return;
    }

    if (level === 8) {
      container.add(this.scene.add.ellipse(x, y - 3 * scale, 52 * scale, 18 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.accentColor, 0.78));
      container.add(this.scene.add.star(x - 12 * scale, y - 13 * scale, 5, 3 * scale, 6 * scale, visualStyle.secondaryAccentColor, 0.95));
      container.add(this.scene.add.star(x + 14 * scale, y + 3 * scale, 5, 3 * scale, 6 * scale, visualStyle.accentColor, 0.95));
      return;
    }

    if (level === 9) {
      container.add(this.scene.add.ellipse(x, y - 3 * scale, 54 * scale, 19 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.accentColor, 0.8));
      [
        [-21, -8, 3.4],
        [-6, -15, 2.7],
        [15, -4, 3.8],
        [23, -14, 2.5],
      ].forEach(([orbX, orbY, radius]) => {
        container.add(this.scene.add.circle(
          x + orbX * scale,
          y + orbY * scale,
          radius * scale,
          visualStyle.accentColor,
          0.94,
        ).setStrokeStyle(1, visualStyle.secondaryAccentColor, 0.62));
      });
      container.add(this.scene.add.ellipse(x, y + 5 * scale, 30 * scale, 8 * scale, visualStyle.secondaryAccentColor, 0.2));
      return;
    }

    if (level === 10) {
      container.add(this.scene.add.star(x, y - 5 * scale, 12, 23 * scale, 30 * scale, visualStyle.secondaryAccentColor, 0.24));
      container.add(this.scene.add.ellipse(x, y - 4 * scale, 52 * scale, 18 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.accentColor, 0.86));
      container.add(this.scene.add.circle(x, y - 18 * scale, 6 * scale, visualStyle.accentColor, 0.96)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.62));
      container.add(this.scene.add.rectangle(x, y - 25 * scale, 30 * scale, 5 * scale, visualStyle.accentColor, 0.88)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.55));
      return;
    }

    if (level === 11) {
      container.add(this.scene.add.ellipse(x, y - 3 * scale, 56 * scale, 21 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.accentColor, 0.84));
      container.add(this.scene.add.ellipse(x, y - 4 * scale, 34 * scale, 13 * scale, visualStyle.secondaryAccentColor, 0.25));
      container.add(this.scene.add.circle(x - 18 * scale, y - 15 * scale, 3.2 * scale, visualStyle.accentColor, 0.95));
      container.add(this.scene.add.circle(x + 20 * scale, y + 2 * scale, 3.2 * scale, visualStyle.secondaryAccentColor, 0.95));
      container.add(this.scene.add.rectangle(x, y - 23 * scale, 28 * scale, 5 * scale, visualStyle.accentColor, 0.82)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.6));
      return;
    }

    if (level >= 12) {
      container.add(this.scene.add.ellipse(x, y - 4 * scale, 60 * scale, 22 * scale, 0xffffff, 0)
        .setStrokeStyle(strokeWidth, visualStyle.accentColor, 0.9));
      container.add(this.scene.add.ellipse(x, y - 5 * scale, 44 * scale, 13 * scale, visualStyle.secondaryAccentColor, 0.2));
      container.add(this.scene.add.rectangle(x, y - 25 * scale, 32 * scale, 6 * scale, visualStyle.accentColor, 0.9)
        .setStrokeStyle(1, visualStyle.strokeColor, 0.68));
      [-12, 0, 12].forEach((crownX, index) => {
        container.add(this.scene.add.triangle(
          x + crownX * scale,
          y - 31 * scale,
          0,
          10 * scale,
          5 * scale,
          -7 * scale,
          10 * scale,
          10 * scale,
          index === 1 ? visualStyle.secondaryAccentColor : visualStyle.accentColor,
          0.94,
        ).setStrokeStyle(1, visualStyle.strokeColor, 0.65));
      });
      container.add(this.scene.add.star(x - 20 * scale, y - 12 * scale, 5, 2.8 * scale, 5.8 * scale, visualStyle.secondaryAccentColor, 0.95));
      container.add(this.scene.add.star(x + 23 * scale, y - 2 * scale, 5, 2.8 * scale, 5.8 * scale, visualStyle.accentColor, 0.95));
    }
  }
}
