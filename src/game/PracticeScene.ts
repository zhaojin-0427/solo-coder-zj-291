import Phaser from 'phaser';
import { Point, DrawnPoint, PracticePattern, PracticeResult } from '@/types/game';
import { calculatePracticeResult, findNearestPattern } from '@/utils/scoreCalculator';

interface PracticeSceneConfig {
  pattern: PracticePattern;
  onScoreUpdate: (result: PracticeResult) => void;
  onPressureUpdate: (pressure: number) => void;
  onPracticeEnd: (result: PracticeResult) => void;
  onErrorHint: (hint: string) => void;
}

const SPEED_FAST_THRESHOLD = 7;
const SPEED_SLOW_THRESHOLD = 0.8;
const DEVIATION_THRESHOLD = 25;

export class PracticeScene extends Phaser.Scene {
  private configData!: PracticeSceneConfig;
  private cakeGraphics!: Phaser.GameObjects.Graphics;
  private targetGraphics!: Phaser.GameObjects.Graphics;
  private frostingGraphics!: Phaser.GameObjects.Graphics;
  private errorGraphics!: Phaser.GameObjects.Graphics;
  private nozzleSprite!: Phaser.GameObjects.Container;
  private nozzleTip!: Phaser.GameObjects.Graphics;
  private hintText!: Phaser.GameObjects.Text;
  private cursorPos: Phaser.Math.Vector2 = new Phaser.Math.Vector2(400, 300);
  private isDrawing: boolean = false;
  private currentPath: DrawnPoint[] = [];
  private drawnPaths: DrawnPoint[] = [];
  private pressure: number = 0.5;
  private lastDrawPos: Phaser.Math.Vector2 | null = null;
  private lastDrawTime: number = 0;
  private isGameOver: boolean = false;
  private errorHintTimer: number = 0;
  private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private lastErrorType: string = '';
  private consecutiveErrors: number = 0;

  constructor() {
    super('PracticeScene');
  }

  init(config?: PracticeSceneConfig): void {
    if (config) {
      this.configData = config;
    } else if ((this as any).initData) {
      this.configData = (this as any).initData;
    }
    this.isGameOver = false;
    this.drawnPaths = [];
    this.currentPath = [];
    this.pressure = 0.5;
  }

  create(): void {
    if (!this.configData && (this as any).initData) {
      this.configData = (this as any).initData;
    }
    this.cameras.main.setBackgroundColor('#FFF8E7');

    this.createCake();
    this.createTargetPattern();
    this.createFrostingLayer();
    this.createErrorLayer();
    this.createNozzle();
    this.createParticles();
    this.createHintText();
    this.setupInput();

    this.configData.onPressureUpdate(this.pressure);
  }

  private createCake(): void {
    this.cakeGraphics = this.add.graphics();
    const cx = 400, cy = 300;
    this.cakeGraphics.fillStyle(0x8b6914, 1);
    this.cakeGraphics.fillRoundedRect(cx - 180, cy + 80, 360, 30, 8);
    this.cakeGraphics.fillStyle(0xffffff, 0.3);
    this.cakeGraphics.fillRoundedRect(cx - 175, cy + 65, 350, 20, 6);
    this.cakeGraphics.fillStyle(0xFFE4C4, 1);
    this.cakeGraphics.fillCircle(cx, cy, 160);
    this.cakeGraphics.lineStyle(4, 0xd4a574, 1);
    this.cakeGraphics.strokeCircle(cx, cy, 160);
    this.cakeGraphics.fillStyle(0xffffff, 0.2);
    this.cakeGraphics.fillEllipse(cx - 40, cy - 50, 100, 40);
  }

  private createTargetPattern(): void {
    this.targetGraphics = this.add.graphics();
    const { targetPoints, color, requiredThickness } = this.configData.pattern;
    const phaserColor = Phaser.Display.Color.HexStringToColor(color);

    this.targetGraphics.lineStyle(requiredThickness + 8, phaserColor.color, 0.2);
    this.targetGraphics.beginPath();
    if (targetPoints.length > 0) {
      this.targetGraphics.moveTo(targetPoints[0].x, targetPoints[0].y);
      for (let i = 1; i < targetPoints.length; i++) {
        this.targetGraphics.lineTo(targetPoints[i].x, targetPoints[i].y);
      }
    }
    this.targetGraphics.strokePath();

    this.targetGraphics.lineStyle(requiredThickness + 2, phaserColor.color, 0.35);
    this.targetGraphics.beginPath();
    if (targetPoints.length > 0) {
      this.targetGraphics.moveTo(targetPoints[0].x, targetPoints[0].y);
      for (let i = 1; i < targetPoints.length; i++) {
        this.targetGraphics.lineTo(targetPoints[i].x, targetPoints[i].y);
      }
    }
    this.targetGraphics.strokePath();
  }

  private createFrostingLayer(): void {
    this.frostingGraphics = this.add.graphics();
    this.frostingGraphics.setDepth(10);
  }

  private createErrorLayer(): void {
    this.errorGraphics = this.add.graphics();
    this.errorGraphics.setDepth(15);
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
    const bagPoints = [
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
    const { nozzleType, color } = this.configData.pattern;
    const phaserColor = Phaser.Display.Color.HexStringToColor(color);

    this.nozzleTip.fillStyle(phaserColor.color, 0.9);

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
    let x = cx, y = cy;
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
    const color = this.configData.pattern.color;
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

  private createHintText(): void {
    this.hintText = this.add.text(400, 560, '', {
      fontSize: '18px',
      color: '#ff4444',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      backgroundColor: '#ffffffcc',
      padding: { x: 12, y: 6 },
    });
    this.hintText.setOrigin(0.5);
    this.hintText.setDepth(200);
    this.hintText.setVisible(false);
  }

  private showErrorHint(msg: string): void {
    this.hintText.setText(msg);
    this.hintText.setVisible(true);
    this.errorHintTimer = this.time.now + 1500;
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

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _go: any[], _dx: number, deltaY: number) => {
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
      this.drawnPaths.push(...this.currentPath);
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

    const phaserColor = Phaser.Display.Color.HexStringToColor(this.configData.pattern.color);

    if (this.lastDrawPos) {
      const dist = Phaser.Math.Distance.Between(this.lastDrawPos.x, this.lastDrawPos.y, x, y);
      const timeDiff = now - this.lastDrawTime;

      if (timeDiff > 0 && dist > 0) {
        const speed = dist / (timeDiff / 16.67);
        let actualThickness = point.thickness;

        if (speed > SPEED_FAST_THRESHOLD) {
          actualThickness = Math.max(1, point.thickness - (speed - SPEED_FAST_THRESHOLD));
        } else if (speed < SPEED_SLOW_THRESHOLD) {
          actualThickness = Math.min(20, point.thickness + (SPEED_SLOW_THRESHOLD - speed) * 3);
        }

        this.frostingGraphics.lineStyle(actualThickness, phaserColor.color, 0.9);
        this.frostingGraphics.beginPath();
        this.frostingGraphics.moveTo(this.lastDrawPos.x, this.lastDrawPos.y);
        this.frostingGraphics.lineTo(x, y);
        this.frostingGraphics.strokePath();

        if (this.pressure > 0.3 && this.particles) {
          (this.particles as any).defaultTint = phaserColor.color;
          this.particles.emitParticleAt(x, y, Math.floor(this.pressure * 3));
        }

        this.checkRealtimeErrors(x, y, speed, actualThickness);
      }
    }

    this.currentPath.push(point);
    this.lastDrawPos = new Phaser.Math.Vector2(x, y);
    this.lastDrawTime = now;
    this.updatePracticeScore();
  }

  private checkRealtimeErrors(x: number, y: number, speed: number, thickness: number): void {
    const { targetPoints, requiredThickness } = this.configData.pattern;
    const tolerance = DEVIATION_THRESHOLD + requiredThickness;

    let minDist = Infinity;
    for (let i = 0; i < targetPoints.length - 1; i++) {
      const dx = targetPoints[i + 1].x - targetPoints[i].x;
      const dy = targetPoints[i + 1].y - targetPoints[i].y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) continue;
      let t = ((x - targetPoints[i].x) * dx + (y - targetPoints[i].y) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const projX = targetPoints[i].x + t * dx;
      const projY = targetPoints[i].y + t * dy;
      const d = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
      if (d < minDist) minDist = d;
    }

    if (this.time.now > this.errorHintTimer) {
      if (minDist > tolerance) {
        this.showErrorHint('⚠️ 偏离目标线！请靠近示范线绘制');
        this.drawErrorMarker(x, y, 0xff4444);
        this.lastErrorType = 'deviation';
        this.consecutiveErrors++;
        return;
      }

      if (speed > SPEED_FAST_THRESHOLD * 1.5) {
        this.showErrorHint('🏃 速度太快！奶油断裂了，请放慢速度');
        this.drawErrorMarker(x, y, 0xff8800);
        this.lastErrorType = 'speed_fast';
        this.consecutiveErrors++;
        return;
      }

      if (speed < SPEED_SLOW_THRESHOLD * 0.5 && speed > 0) {
        this.showErrorHint('🐌 速度太慢！奶油堆积了，请加快速度');
        this.drawErrorMarker(x, y, 0x8800ff);
        this.lastErrorType = 'speed_slow';
        this.consecutiveErrors++;
        return;
      }

      if (thickness > requiredThickness * 1.8) {
        this.showErrorHint('💪 力度太大！奶油溢出了，请减小力度');
        this.drawErrorMarker(x, y, 0xff0066);
        this.lastErrorType = 'pressure_high';
        this.consecutiveErrors++;
        return;
      }

      if (thickness < requiredThickness * 0.3) {
        this.showErrorHint('🪶 力度太小！奶油太细了，请加大力度');
        this.drawErrorMarker(x, y, 0x0088ff);
        this.lastErrorType = 'pressure_low';
        this.consecutiveErrors++;
        return;
      }

      this.consecutiveErrors = 0;
      this.hintText.setVisible(false);
    } else if (minDist > tolerance || speed > SPEED_FAST_THRESHOLD * 1.5 || thickness > requiredThickness * 1.8 || thickness < requiredThickness * 0.3) {
      if (minDist > tolerance) this.drawErrorMarker(x, y, 0xff4444);
      else if (speed > SPEED_FAST_THRESHOLD * 1.5) this.drawErrorMarker(x, y, 0xff8800);
      else if (thickness > requiredThickness * 1.8) this.drawErrorMarker(x, y, 0xff0066);
      else if (thickness < requiredThickness * 0.3) this.drawErrorMarker(x, y, 0x0088ff);
    }
  }

  private drawErrorMarker(x: number, y: number, color: number): void {
    this.errorGraphics.fillStyle(color, 0.6);
    this.errorGraphics.fillCircle(x, y, 5);
    this.errorGraphics.lineStyle(2, color, 0.8);
    this.errorGraphics.strokeCircle(x, y, 8);
  }

  private updatePracticeScore(): void {
    const allPaths = this.currentPath.length > 1 ? [this.drawnPaths, this.currentPath] : [this.drawnPaths];
    const flatPaths = allPaths.filter(p => p.length >= 2);
    if (flatPaths.length === 0) return;

    const result = calculatePracticeResult(
      this.configData.pattern.targetPoints,
      flatPaths,
      this.configData.pattern.requiredThickness
    );
    this.configData.onScoreUpdate(result);
  }

  public endPractice(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.isDrawing = false;
    this.stopDrawing();

    const result = calculatePracticeResult(
      this.configData.pattern.targetPoints,
      [this.drawnPaths],
      this.configData.pattern.requiredThickness
    );
    this.configData.onPracticeEnd(result);
  }

  public forceEndPractice(): void {
    this.endPractice();
  }

  update(): void {
    if (this.errorHintTimer > 0 && this.time.now > this.errorHintTimer + 500) {
      this.hintText.setVisible(false);
    }

    if (this.errorGraphics && this.time.now % 3000 < 16) {
      this.errorGraphics.clear();
    }
  }
}
