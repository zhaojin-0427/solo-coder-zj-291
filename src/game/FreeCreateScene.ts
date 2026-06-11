import Phaser from 'phaser';
import { DrawnPoint, CakeShape, NozzleType, BackgroundDecoration } from '@/types/game';

export interface FreeCreateSceneConfig {
  cakeShape: CakeShape;
  cakeColor: string;
  nozzleType: NozzleType;
  creamColor: string;
  backgroundColor: string;
  backgroundDecoration: BackgroundDecoration;
  onPressureUpdate: (pressure: number) => void;
  onPathsChange: (paths: DrawnPoint[][]) => void;
  existingPaths?: DrawnPoint[][];
}

const SPEED_FAST_THRESHOLD = 7;
const SPEED_SLOW_THRESHOLD = 0.8;

export class FreeCreateScene extends Phaser.Scene {
  private configData!: FreeCreateSceneConfig;
  private cakeGraphics!: Phaser.GameObjects.Graphics;
  private frostingGraphics!: Phaser.GameObjects.Graphics;
  private decorationGraphics!: Phaser.GameObjects.Graphics;
  private nozzleSprite!: Phaser.GameObjects.Container;
  private nozzleTip!: Phaser.GameObjects.Graphics;
  private cursorPos: Phaser.Math.Vector2 = new Phaser.Math.Vector2(400, 300);
  private isDrawing: boolean = false;
  private currentPath: DrawnPoint[] = [];
  private drawnPaths: DrawnPoint[][] = [];
  private pressure: number = 0.5;
  private lastDrawPos: Phaser.Math.Vector2 | null = null;
  private lastDrawTime: number = 0;
  private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private currentCreamColor: string = '#FFB6C1';
  private currentNozzleType: NozzleType = 'round';
  private historyStack: DrawnPoint[][][] = [];
  private maxHistory: number = 30;

  constructor() {
    super('FreeCreateScene');
  }

  init(config?: FreeCreateSceneConfig): void {
    if (config) {
      this.configData = config;
    } else if ((this as any).initData) {
      this.configData = (this as any).initData;
    }
    this.drawnPaths = this.configData.existingPaths ? [...this.configData.existingPaths] : [];
    this.currentPath = [];
    this.pressure = 0.5;
    this.currentCreamColor = this.configData.creamColor;
    this.currentNozzleType = this.configData.nozzleType;
    this.historyStack = [];
  }

  create(): void {
    if (!this.configData && (this as any).initData) {
      this.configData = (this as any).initData;
      this.drawnPaths = this.configData.existingPaths ? [...this.configData.existingPaths] : [];
      this.currentCreamColor = this.configData.creamColor;
      this.currentNozzleType = this.configData.nozzleType;
    }
    this.cameras.main.setBackgroundColor(this.configData.backgroundColor);

    this.createDecorationLayer();
    this.createCake();
    this.createFrostingLayer();
    this.createNozzle();
    this.createParticles();
    this.setupInput();

    this.configData.onPressureUpdate(this.pressure);
    this.redrawAllFrosting();
  }

  private createDecorationLayer(): void {
    this.decorationGraphics = this.add.graphics();
    this.decorationGraphics.setDepth(1);
    this.drawBackgroundDecoration(this.configData.backgroundDecoration);
  }

  private drawBackgroundDecoration(decoration: BackgroundDecoration): void {
    this.decorationGraphics.clear();
    const cx = 400;
    const cy = 300;

    if (decoration === 'none') return;

    if (decoration === 'sprinkles') {
      const colors = [0xFF6B6B, 0x4ECDC4, 0xFFE66D, 0x95E1D3, 0xF38181, 0xAA96DA];
      for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 170 + Math.random() * 120;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        const color = Phaser.Utils.Array.GetRandom(colors);
        this.decorationGraphics.fillStyle(color, 0.7);
        this.decorationGraphics.fillEllipse(x, y, 3, 8, angle);
      }
    } else if (decoration === 'flowers') {
      const flowerColors = [0xFFB6C1, 0xFFFF99, 0xADD8E6, 0xDDA0DD];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const dist = 200;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        const color = flowerColors[i % flowerColors.length];
        this.drawFlower(x, y, color);
      }
    } else if (decoration === 'stars') {
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 170 + Math.random() * 130;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        const size = 8 + Math.random() * 10;
        this.drawStarDeco(x, y, 5, size, size * 0.5, 0xFFD700);
      }
    } else if (decoration === 'hearts') {
      const heartColors = [0xFF69B4, 0xFFB6C1, 0xFF1493];
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 175 + Math.random() * 110;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        const size = 10 + Math.random() * 8;
        const color = Phaser.Utils.Array.GetRandom(heartColors);
        this.drawHeartDeco(x, y, size, color);
      }
    }
  }

  private drawFlower(x: number, y: number, color: number): void {
    this.decorationGraphics.fillStyle(color, 0.8);
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const px = x + Math.cos(angle) * 10;
      const py = y + Math.sin(angle) * 10;
      this.decorationGraphics.fillCircle(px, py, 8);
    }
    this.decorationGraphics.fillStyle(0xFFD700, 0.9);
    this.decorationGraphics.fillCircle(x, y, 6);
  }

  private drawStarDeco(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number, color: number): void {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    this.decorationGraphics.fillStyle(color, 0.7);
    this.decorationGraphics.beginPath();
    this.decorationGraphics.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.decorationGraphics.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.decorationGraphics.lineTo(x, y);
      rot += step;
    }
    this.decorationGraphics.lineTo(cx, cy - outerRadius);
    this.decorationGraphics.closePath();
    this.decorationGraphics.fillPath();
  }

  private drawHeartDeco(cx: number, cy: number, size: number, color: number): void {
    const heartPoints: Phaser.Math.Vector2[] = [];
    for (let i = 0; i <= 30; i++) {
      const t = (i / 30) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      heartPoints.push(new Phaser.Math.Vector2(cx + x * (size / 16), cy + y * (size / 16)));
    }
    this.decorationGraphics.fillStyle(color, 0.7);
    this.decorationGraphics.fillPoints(heartPoints, true);
  }

  private createCake(): void {
    const { cakeShape, cakeColor } = this.configData;
    this.cakeGraphics = this.add.graphics();
    this.cakeGraphics.setDepth(5);

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
      this.drawHeartShape(cx, cy, 150);
    }

    this.cakeGraphics.fillStyle(0xffffff, 0.2);
    this.cakeGraphics.fillEllipse(cx - 40, cy - 50, 100, 40);
  }

  private drawHeartShape(cx: number, cy: number, size: number): void {
    const heartPoints: Phaser.Math.Vector2[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = (i / 100) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      heartPoints.push(new Phaser.Math.Vector2(cx + x * (size / 16), cy + y * (size / 16)));
    }

    this.cakeGraphics.fillPoints(heartPoints, true);
    this.cakeGraphics.lineStyle(4, 0xd4a574, 1);
    this.cakeGraphics.strokePoints(heartPoints, true);
  }

  private createFrostingLayer(): void {
    this.frostingGraphics = this.add.graphics();
    this.frostingGraphics.setDepth(10);
  }

  private redrawAllFrosting(): void {
    this.frostingGraphics.clear();
    for (const path of this.drawnPaths) {
      if (path.length < 2) continue;
      const color = Phaser.Display.Color.HexStringToColor(path[0].color || this.currentCreamColor).color;
      for (let i = 1; i < path.length; i++) {
        const prev = path[i - 1];
        const curr = path[i];
        const thickness = curr.thickness;
        this.frostingGraphics.lineStyle(thickness, color, 0.9);
        this.frostingGraphics.beginPath();
        this.frostingGraphics.moveTo(prev.x, prev.y);
        this.frostingGraphics.lineTo(curr.x, curr.y);
        this.frostingGraphics.strokePath();
      }
    }
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

  private updateNozzleTip(): void {
    this.nozzleTip.clear();
    const nozzleSize = 4 + this.pressure * 4;
    const color = Phaser.Display.Color.HexStringToColor(this.currentCreamColor);

    this.nozzleTip.fillStyle(color.color, 0.9);

    if (this.currentNozzleType === 'round' || this.currentNozzleType === 'writing') {
      this.nozzleTip.fillCircle(0, 15, nozzleSize);
    } else if (this.currentNozzleType === 'star') {
      this.drawStarTip(0, 15, 5, nozzleSize, nozzleSize * 0.5);
    } else if (this.currentNozzleType === 'leaf') {
      this.nozzleTip.fillEllipse(0, 15, nozzleSize * 1.5, nozzleSize * 0.8);
    }
  }

  private drawStarTip(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number): void {
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
    this.particles = this.add.particles(0, 0, undefined, {
      quantity: 0,
      lifespan: { min: 300, max: 600 },
      speed: { min: 10, max: 30 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.3, end: 0 },
      tint: Phaser.Display.Color.HexStringToColor(this.currentCreamColor).color,
      blendMode: 'ADD',
    });
    this.particles.setDepth(99);
  }

  private setupInput(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.cursorPos.set(pointer.x, pointer.y);
      this.nozzleSprite.setPosition(pointer.x, pointer.y);
      this.updateNozzleTip();
      if (this.isDrawing) {
        this.drawFrosting(pointer.x, pointer.y);
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
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
      this.pressure = Phaser.Math.Clamp(this.pressure + deltaY * 0.001, 0.1, 1.0);
      this.configData.onPressureUpdate(this.pressure);
      this.updateNozzleTip();
    });
  }

  private startDrawing(): void {
    this.isDrawing = true;
    this.currentPath = [];
    this.lastDrawPos = null;
    this.lastDrawTime = this.time.now;
    this.pushToHistory();
  }

  private stopDrawing(): void {
    if (this.isDrawing && this.currentPath.length > 1) {
      const pathWithColor = this.currentPath.map((p) => ({
        ...p,
        color: this.currentCreamColor,
        nozzleType: this.currentNozzleType,
      }));
      this.drawnPaths.push(pathWithColor as any);
      this.configData.onPathsChange(this.drawnPaths);
    }
    this.isDrawing = false;
    this.currentPath = [];
    this.lastDrawPos = null;
  }

  private drawFrosting(x: number, y: number): void {
    const now = this.time.now;
    const point: DrawnPoint & { color?: string; nozzleType?: NozzleType } = {
      x,
      y,
      thickness: 3 + this.pressure * 8,
      timestamp: now,
      color: this.currentCreamColor,
      nozzleType: this.currentNozzleType,
    };

    const phaserColor = Phaser.Display.Color.HexStringToColor(this.currentCreamColor);

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

        if (speed < 0.3) {
          this.frostingGraphics.fillStyle(phaserColor.color, 0.6);
          this.frostingGraphics.fillCircle(x, y, actualThickness * 0.8);
        }
      }
    }

    this.currentPath.push(point);
    this.lastDrawPos = new Phaser.Math.Vector2(x, y);
    this.lastDrawTime = now;
  }

  private pushToHistory(): void {
    this.historyStack.push(JSON.parse(JSON.stringify(this.drawnPaths)));
    if (this.historyStack.length > this.maxHistory) {
      this.historyStack.shift();
    }
  }

  public undo(): void {
    if (this.historyStack.length === 0) return;
    if (this.isDrawing) {
      this.stopDrawing();
    }
    const previousState = this.historyStack.pop();
    if (previousState) {
      this.drawnPaths = previousState;
      this.redrawAllFrosting();
      this.configData.onPathsChange(this.drawnPaths);
    }
  }

  public clearAll(): void {
    if (this.isDrawing) {
      this.stopDrawing();
    }
    this.pushToHistory();
    this.drawnPaths = [];
    this.frostingGraphics.clear();
    this.configData.onPathsChange(this.drawnPaths);
  }

  public setCreamColor(color: string): void {
    this.currentCreamColor = color;
    this.updateNozzleTip();
    if (this.particles) {
      (this.particles as any).defaultTint = Phaser.Display.Color.HexStringToColor(color).color;
    }
  }

  public setNozzleType(type: NozzleType): void {
    this.currentNozzleType = type;
    this.updateNozzleTip();
  }

  public setCakeShape(shape: CakeShape): void {
    this.configData.cakeShape = shape;
    this.cakeGraphics.clear();
    this.createCake();
    this.frostingGraphics.clear();
    this.redrawAllFrosting();
  }

  public setCakeColor(color: string): void {
    this.configData.cakeColor = color;
    this.cakeGraphics.clear();
    this.createCake();
    this.frostingGraphics.clear();
    this.redrawAllFrosting();
  }

  public setBackgroundColor(color: string): void {
    this.configData.backgroundColor = color;
    this.cameras.main.setBackgroundColor(color);
  }

  public setBackgroundDecoration(decoration: BackgroundDecoration): void {
    this.configData.backgroundDecoration = decoration;
    this.drawBackgroundDecoration(decoration);
  }

  public setPressure(pressure: number): void {
    this.pressure = Phaser.Math.Clamp(pressure, 0.1, 1.0);
    this.configData.onPressureUpdate(this.pressure);
    this.updateNozzleTip();
  }

  public getDrawnPaths(): DrawnPoint[][] {
    return this.drawnPaths;
  }

  public getCurrentConfig(): FreeCreateSceneConfig {
    return { ...this.configData };
  }

  public generateThumbnail(): string {
    const canvas = this.game.canvas;
    return canvas.toDataURL('image/png');
  }

  public canUndo(): boolean {
    return this.historyStack.length > 0;
  }
}
