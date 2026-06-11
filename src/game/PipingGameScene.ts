import Phaser from 'phaser';
import { Level, DrawnPoint, Pattern, GameScore } from '@/types/game';
import { calculateScore, findNearestPattern } from '@/utils/scoreCalculator';

interface GameSceneConfig {
  level: Level;
  onScoreUpdate: (score: GameScore) => void;
  onTimeUpdate: (time: number) => void;
  onPressureUpdate: (pressure: number) => void;
  onGameEnd: (score: GameScore) => void;
}

export class PipingGameScene extends Phaser.Scene {
  static pendingConfig: GameSceneConfig | null = null;

  private configData!: GameSceneConfig;
  private cakeGraphics!: Phaser.GameObjects.Graphics;
  private targetPatternGraphics!: Phaser.GameObjects.Graphics;
  private frostingGraphics!: Phaser.GameObjects.Graphics;
  private nozzleSprite!: Phaser.GameObjects.Container;
  private nozzleTip!: Phaser.GameObjects.Graphics;
  private cursorPos: Phaser.Math.Vector2 = new Phaser.Math.Vector2(400, 300);
  private isDrawing: boolean = false;
  private currentPath: DrawnPoint[] = [];
  private drawnPaths: DrawnPoint[][] = [];
  private pressure: number = 0.5;
  private lastDrawPos: Phaser.Math.Vector2 | null = null;
  private lastDrawTime: number = 0;
  private timeRemaining: number = 0;
  private timerEvent: Phaser.Time.TimerEvent | null = null;
  private isGameOver: boolean = false;
  private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor() {
    super('PipingGameScene');
  }

  init(config?: GameSceneConfig): void {
    if (config) {
      this.configData = config;
      this.timeRemaining = config.level.timeLimit;
    } else if ((this as any).initData) {
      this.configData = (this as any).initData;
      this.timeRemaining = this.configData.level.timeLimit;
    }
    this.isGameOver = false;
    this.drawnPaths = [];
    this.currentPath = [];
    this.pressure = 0.5;
  }

  create(): void {
    if (!this.configData && (this as any).initData) {
      this.configData = (this as any).initData;
      this.timeRemaining = this.configData.level.timeLimit;
    }
    this.cameras.main.setBackgroundColor('#FFF8E7');

    this.createCake();
    this.createTargetPatterns();
    this.createFrostingLayer();
    this.createNozzle();
    this.createParticles();
    this.setupInput();
    this.startTimer();

    this.configData.onPressureUpdate(this.pressure);
    this.configData.onTimeUpdate(this.timeRemaining);
  }

  private createCake(): void {
    const { cakeShape, cakeColor } = this.configData.level;
    this.cakeGraphics = this.add.graphics();

    const cx = 400;
    const cy = 300;

    this.cakeGraphics.fillStyle(0x8b6914, 1);
    this.cakeGraphics.fillRoundedRect(cx - 180, cy + 80, 360, 30, 8);

    this.cakeGraphics.fillStyle(0xffffff, 0.3);
    this.cakeGraphics.fillRoundedRect(cx - 175, cy + 65, 350, 20, 6);

    this.cakeGraphics.fillStyle(Phaser.Display.Color.HexStringToColor(cakeColor).color, 1);

    if (cakeShape === 'circle') {
      this.cakeGraphics.fillCircle(cx, cy, 160);
      this.cakeGraphics.lineStyle(4, 0xd4a574, 1);
      this.cakeGraphics.strokeCircle(cx, cy, 160);
    } else if (cakeShape === 'square') {
      this.cakeGraphics.fillRoundedRect(cx - 150, cy - 150, 300, 300, 20);
      this.cakeGraphics.lineStyle(4, 0xd4a574, 1);
      this.cakeGraphics.strokeRoundedRect(cx - 150, cy - 150, 300, 300, 20);
    } else if (cakeShape === 'heart') {
      this.drawHeart(cx, cy, 150);
    }

    this.cakeGraphics.fillStyle(0xffffff, 0.2);
    this.cakeGraphics.fillEllipse(cx - 40, cy - 50, 100, 40);
  }

  private drawHeart(cx: number, cy: number, size: number): void {
    const heartPoints: Phaser.Math.Vector2[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = (i / 100) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      heartPoints.push(new Phaser.Math.Vector2(cx + x * (size / 16), cy + y * (size / 16)));
    }

    const path = new Phaser.Curves.Path(heartPoints[0].x, heartPoints[0].y);
    for (let i = 1; i < heartPoints.length; i++) {
      path.lineTo(heartPoints[i].x, heartPoints[i].y);
    }

    this.cakeGraphics.fillPoints(heartPoints, true);
    this.cakeGraphics.lineStyle(4, 0xd4a574, 1);
    this.cakeGraphics.strokePoints(heartPoints, true);
  }

  private createTargetPatterns(): void {
    this.targetPatternGraphics = this.add.graphics();
    const { requiredPatterns } = this.configData.level;

    requiredPatterns.forEach((pattern) => {
      const color = Phaser.Display.Color.HexStringToColor(pattern.color);
      this.targetPatternGraphics.lineStyle(pattern.requiredThickness + 4, color.color, 0.25);
      this.targetPatternGraphics.beginPath();

      if (pattern.points.length > 0) {
        this.targetPatternGraphics.moveTo(pattern.points[0].x, pattern.points[0].y);
        for (let i = 1; i < pattern.points.length; i++) {
          this.targetPatternGraphics.lineTo(pattern.points[i].x, pattern.points[i].y);
        }
      }
      this.targetPatternGraphics.strokePath();
    });
  }

  private createFrostingLayer(): void {
    this.frostingGraphics = this.add.graphics();
    this.frostingGraphics.setDepth(10);
  }

  private createNozzle(): void {
    this.nozzleSprite = this.add.container(400, 300);
    this.nozzleSprite.setDepth(100);

    const cone = this.add.graphics();
    cone.fillStyle(0xc0c0c0, 1);
    cone.fillTriangle(-12, -30, 12, -30, 0, 15);
    cone.lineStyle(2, 0x808080, 1);
    cone.strokeTriangle(-12, -30, 12, -30, 0, 15);

    const ring = this.add.graphics();
    ring.fillStyle(0xb87333, 1);
    ring.fillRoundedRect(-18, -38, 36, 12, 4);
    ring.lineStyle(2, 0x8b4513, 1);
    ring.strokeRoundedRect(-18, -38, 36, 12, 4);

    const bag = this.add.graphics();
    bag.fillStyle(0xf5deb3, 1);
    const bagPoints: Phaser.Math.Vector2[] = [
      new Phaser.Math.Vector2(-20, -35),
      new Phaser.Math.Vector2(-28, -55),
      new Phaser.Math.Vector2(-22, -75),
      new Phaser.Math.Vector2(-15, -90),
      new Phaser.Math.Vector2(0, -92),
      new Phaser.Math.Vector2(15, -90),
      new Phaser.Math.Vector2(22, -75),
      new Phaser.Math.Vector2(28, -55),
      new Phaser.Math.Vector2(20, -35),
    ];
    bag.fillPoints(bagPoints, true);
    bag.lineStyle(2, 0xd4a574, 1);
    bag.strokePoints(bagPoints, true);

    this.nozzleTip = this.add.graphics();
    this.updateNozzleTip();

    this.nozzleSprite.add([bag, ring, cone, this.nozzleTip]);
  }

  private updateNozzleTip(cursorX?: number, cursorY?: number): void {
    this.nozzleTip.clear();
    const nozzleSize = 4 + this.pressure * 4;
    const { nozzleType, requiredPatterns } = this.configData.level;

    let tipColor = requiredPatterns[0]?.color || '#FFB6C1';
    if (cursorX !== undefined && cursorY !== undefined) {
      const nearest = findNearestPattern(cursorX, cursorY, requiredPatterns);
      if (nearest) tipColor = nearest.color;
    }
    const color = Phaser.Display.Color.HexStringToColor(tipColor);

    this.nozzleTip.fillStyle(color.color, 0.9);

    if (nozzleType === 'round' || nozzleType === 'writing') {
      this.nozzleTip.fillCircle(0, 15, nozzleSize);
    } else if (nozzleType === 'star') {
      this.drawStar(0, 15, 5, nozzleSize, nozzleSize * 0.5);
    } else if (nozzleType === 'leaf') {
      this.nozzleTip.fillEllipse(0, 15, nozzleSize * 1.5, nozzleSize * 0.8);
    }
  }

  private drawStar(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number): void {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    this.nozzleTip.beginPath();
    this.nozzleTip.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.nozzleTip.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.nozzleTip.lineTo(x, y);
      rot += step;
    }
    this.nozzleTip.lineTo(cx, cy - outerRadius);
    this.nozzleTip.closePath();
    this.nozzleTip.fillPath();
  }

  private createParticles(): void {
    const color = this.configData.level.requiredPatterns[0]?.color || '#FFB6C1';

    this.particles = this.add.particles(0, 0, undefined, {
      quantity: 0,
      lifespan: { min: 300, max: 600 },
      speed: { min: 10, max: 30 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.3, end: 0 },
      tint: Phaser.Display.Color.HexStringToColor(color).color,
      blendMode: 'ADD',
    });
    this.particles.setDepth(99);
  }

  private setupInput(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isGameOver) return;

      this.cursorPos.set(pointer.x, pointer.y);
      this.nozzleSprite.setPosition(pointer.x, pointer.y);
      this.updateNozzleTip(pointer.x, pointer.y);

      if (this.isDrawing) {
        this.drawFrosting(pointer.x, pointer.y);
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isGameOver) return;

      this.cursorPos.set(pointer.x, pointer.y);
      this.nozzleSprite.setPosition(pointer.x, pointer.y);
      this.startDrawing();
    });

    this.input.on('pointerup', () => {
      this.stopDrawing();
    });

    this.input.on('pointerleave', () => {
      this.stopDrawing();
    });

    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number) => {
      if (this.isGameOver) return;

      this.pressure = Phaser.Math.Clamp(this.pressure + deltaY * 0.001, 0.1, 1.0);
      this.configData.onPressureUpdate(this.pressure);
      this.updateNozzleTip(this.cursorPos.x, this.cursorPos.y);
    });
  }

  private startDrawing(): void {
    this.isDrawing = true;
    this.currentPath = [];
    this.lastDrawPos = null;
    this.lastDrawTime = this.time.now;
  }

  private stopDrawing(): void {
    if (this.isDrawing && this.currentPath.length > 1) {
      this.drawnPaths.push([...this.currentPath]);
    }
    this.isDrawing = false;
    this.currentPath = [];
    this.lastDrawPos = null;
  }

  private drawFrosting(x: number, y: number): void {
    const now = this.time.now;
    const point: DrawnPoint = {
      x,
      y,
      thickness: 3 + this.pressure * 8,
      timestamp: now,
    };

    const nearestPattern = findNearestPattern(
      x,
      y,
      this.configData.level.requiredPatterns
    );
    const currentColor = Phaser.Display.Color.HexStringToColor(
      nearestPattern?.color || this.configData.level.requiredPatterns[0]?.color || '#FFB6C1'
    );

    if (this.lastDrawPos) {
      const dist = Phaser.Math.Distance.Between(this.lastDrawPos.x, this.lastDrawPos.y, x, y);
      const timeDiff = now - this.lastDrawTime;

      if (timeDiff > 0 && dist > 0) {
        const speed = dist / (timeDiff / 16.67);

        let actualThickness = point.thickness;

        if (speed > 7) {
          actualThickness = Math.max(1, point.thickness - (speed - 7));
        } else if (speed < 0.8) {
          actualThickness = Math.min(20, point.thickness + (0.8 - speed) * 3);
        }

        this.frostingGraphics.lineStyle(actualThickness, currentColor.color, 0.9);
        this.frostingGraphics.beginPath();
        this.frostingGraphics.moveTo(this.lastDrawPos.x, this.lastDrawPos.y);
        this.frostingGraphics.lineTo(x, y);
        this.frostingGraphics.strokePath();

        if (this.pressure > 0.3 && this.particles) {
          (this.particles as any).defaultTint = currentColor.color;
          this.particles.emitParticleAt(x, y, Math.floor(this.pressure * 3));
        }

        if (speed > 10) {
          this.frostingGraphics.lineStyle(actualThickness * 0.5, currentColor.color, 0.5);
        }

        if (speed < 0.3) {
          this.frostingGraphics.fillStyle(currentColor.color, 0.6);
          this.frostingGraphics.fillCircle(x, y, actualThickness * 0.8);
        }
      }
    }

    this.currentPath.push(point);
    this.lastDrawPos = new Phaser.Math.Vector2(x, y);
    this.lastDrawTime = now;
    this.updateScoreEstimate();
  }

  private updateScoreEstimate(): void {
    const allPaths = this.currentPath.length > 1 ? [...this.drawnPaths, this.currentPath] : this.drawnPaths;
    const estimate = calculateScore(
      this.configData.level.requiredPatterns,
      allPaths,
      this.timeRemaining,
      this.configData.level.timeLimit
    );
    this.configData.onScoreUpdate(estimate);
  }

  private startTimer(): void {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.isGameOver) return;
        this.timeRemaining--;
        this.configData.onTimeUpdate(this.timeRemaining);

        if (this.timeRemaining <= 0) {
          this.endGame();
        }
      },
      loop: true,
    });
  }

  public endGame(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.isDrawing = false;
    this.stopDrawing();

    if (this.timerEvent) {
      this.timerEvent.remove(false);
    }

    const finalScore = calculateScore(
      this.configData.level.requiredPatterns,
      this.drawnPaths,
      Math.max(0, this.timeRemaining),
      this.configData.level.timeLimit
    );

    this.configData.onGameEnd(finalScore);
  }

  public forceEndGame(): void {
    this.endGame();
  }
}

export const createGameConfig = (
  parent: string | HTMLElement,
  _config: GameSceneConfig
): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent,
  width: 800,
  height: 600,
  backgroundColor: '#FFF8E7',
  scene: [PipingGameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});
