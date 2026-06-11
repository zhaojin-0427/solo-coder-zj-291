import { CakeShape, NozzleType, PatternType, CustomerOrder, Pattern } from '@/types/game';

const customerNames = [
  '小雨', '阿明', '花花', '大壮', '甜甜',
  '乐乐', '美美', '小杰', '阿福', '月月',
  '星星', '小贝', '安安', '瑞瑞', '晶晶',
  '小雅', '阿宝', '可可', '小凡', '梦梦',
];

const customerEmojis = [
  '👩', '👨', '👧', '👦', '👵',
  '👴', '👩‍🦰', '👨‍🦱', '👧‍🦳', '👦‍🦲',
  '🧑', '💁', '🧓', '👸', '🤴',
];

const cakeColors: Record<CakeShape, string[]> = {
  circle: ['#FFE4C4', '#FFDAB9', '#FFEFD5', '#F5DEB3', '#FAEBD7'],
  square: ['#FFDAB9', '#FFE4B5', '#F5DEB3', '#FFDEAD', '#FFE4C4'],
  heart: ['#FFEFD5', '#FFF0F5', '#FFE4E1', '#FFE4C4', '#FFDAB9'],
};

const shapeNozzleMap: Record<CakeShape, NozzleType[]> = {
  circle: ['round', 'star'],
  square: ['star', 'writing', 'leaf'],
  heart: ['star', 'writing', 'leaf'],
};

const patternColorSets: Record<PatternType, string[]> = {
  rose: ['#FF69B4', '#FF1493', '#FF6B9D', '#FF85A2', '#FFB6C1'],
  leaf: ['#90EE90', '#32CD32', '#3CB371', '#66CDAA', '#8FBC8F'],
  shell: ['#FFB6C1', '#FF6B9D', '#FFA07A', '#FFD700', '#FFC0CB'],
  text: ['#8B4513', '#FF1493', '#4169E1', '#FF6347', '#32CD32'],
};

interface PatternTemplate {
  type: PatternType;
  description: string;
  requiredThickness: number;
  generatePoints: (cx: number, cy: number, size: number, rotation?: number) => { x: number; y: number }[];
}

const generateRosePoints = (cx: number, cy: number, size: number): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = [];
  const petals = 5;
  for (let i = 0; i <= petals * 36; i++) {
    const angle = (i / (petals * 36)) * Math.PI * 2;
    const r = size * (1 + 0.3 * Math.sin(petals * angle));
    points.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    });
  }
  return points;
};

const generateLeafPoints = (cx: number, cy: number, size: number, rotation: number = 0): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= 36; i++) {
    const t = (i / 36) * Math.PI;
    const r = size * Math.sin(t);
    const x = cx + Math.cos(rotation) * r * Math.cos(t * 2) - Math.sin(rotation) * r * 0.6;
    const y = cy + Math.sin(rotation) * r * Math.cos(t * 2) + Math.cos(rotation) * r * 0.6;
    points.push({ x, y });
  }
  return points;
};

const generateShellBorder = (cx: number, cy: number, radius: number): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = [];
  const shells = 12;
  for (let i = 0; i <= shells * 20; i++) {
    const t = i / (shells * 20);
    const angle = t * Math.PI * 2;
    const wave = Math.sin(t * shells * Math.PI * 2) * 8;
    points.push({
      x: cx + Math.cos(angle) * (radius + wave),
      y: cy + Math.sin(angle) * (radius + wave),
    });
  }
  return points;
};

const patternTemplates: PatternTemplate[] = [
  {
    type: 'shell',
    description: '边缘裱花',
    requiredThickness: 8,
    generatePoints: (cx, cy, size) => generateShellBorder(cx, cy, size),
  },
  {
    type: 'rose',
    description: '玫瑰花',
    requiredThickness: 6,
    generatePoints: (cx, cy, size) => generateRosePoints(cx, cy, size),
  },
  {
    type: 'leaf',
    description: '叶子',
    requiredThickness: 5,
    generatePoints: (cx, cy, size, rotation) => generateLeafPoints(cx, cy, size, rotation),
  },
];

const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generatePatternsForShape = (shape: CakeShape, difficulty: number): Pattern[] => {
  const patterns: Pattern[] = [];
  const cx = 400;
  const cy = 300;

  const borderTemplate = patternTemplates[0];
  const borderSize = shape === 'circle' ? 150 : shape === 'heart' ? 140 : 140;
  patterns.push({
    type: borderTemplate.type,
    points: borderTemplate.generatePoints(cx, cy, borderSize),
    requiredThickness: borderTemplate.requiredThickness,
    color: pickRandom(patternColorSets[borderTemplate.type]),
    description: `${shape === 'circle' ? '圆形' : shape === 'square' ? '方形' : '心形'}${borderTemplate.description}`,
  });

  if (difficulty >= 2) {
    const roseTemplate = patternTemplates[1];
    const rosePositions = difficulty >= 3
      ? [{ x: cx - 60, y: cy - 30, s: 35 }, { x: cx + 60, y: cy - 30, s: 35 }]
      : [{ x: cx, y: cy - 20, s: 45 }];

    for (const pos of rosePositions) {
      patterns.push({
        type: roseTemplate.type,
        points: roseTemplate.generatePoints(pos.x, pos.y, pos.s),
        requiredThickness: roseTemplate.requiredThickness,
        color: pickRandom(patternColorSets[roseTemplate.type]),
        description: roseTemplate.description,
      });
    }
  }

  if (difficulty >= 3) {
    const leafTemplate = patternTemplates[2];
    const leafPositions = [
      { x: cx - 80, y: cy + 40, s: 30, r: -0.5 },
      { x: cx + 80, y: cy + 40, s: 30, r: 0.5 },
    ];

    for (const pos of leafPositions) {
      patterns.push({
        type: leafTemplate.type,
        points: leafTemplate.generatePoints(pos.x, pos.y, pos.s, pos.r),
        requiredThickness: leafTemplate.requiredThickness,
        color: pickRandom(patternColorSets[leafTemplate.type]),
        description: leafTemplate.description,
      });
    }
  }

  return patterns;
};

export const BUSINESS_DAY_DURATION = 300;
export const BUSINESS_DAY_CUSTOMER_COUNT = 6;

export const generateCustomerQueue = (count: number = BUSINESS_DAY_CUSTOMER_COUNT): CustomerOrder[] => {
  const usedNames = new Set<string>();
  const orders: CustomerOrder[] = [];

  for (let i = 0; i < count; i++) {
    let name = pickRandom(customerNames);
    while (usedNames.has(name)) {
      name = pickRandom(customerNames);
    }
    usedNames.add(name);

    const difficulty = i < 2 ? 1 : i < 4 ? 2 : 3;
    const cakeShape: CakeShape = pickRandom(['circle', 'square', 'heart'] as CakeShape[]);
    const nozzleType = pickRandom(shapeNozzleMap[cakeShape]);
    const cakeColor = pickRandom(cakeColors[cakeShape]);

    const timeLimit = difficulty === 1 ? 50 : difficulty === 2 ? 65 : 80;
    const basePrice = difficulty === 1 ? 30 : difficulty === 2 ? 50 : 75;
    const patience = difficulty === 1 ? 90 : difficulty === 2 ? 75 : 60;
    const patienceDecayRate = difficulty === 1 ? 0.3 : difficulty === 2 ? 0.5 : 0.7;
    const toleranceBonus = difficulty === 1 ? 5 : difficulty === 2 ? 0 : -3;

    const patterns = generatePatternsForShape(cakeShape, difficulty);
    const colorPreference = pickRandom(patterns.map(p => p.color));

    const speedOptions: Array<'slow' | 'medium' | 'fast'> = ['slow', 'medium', 'fast'];
    const preferredSpeed = pickRandom(speedOptions);

    orders.push({
      id: `order-${i + 1}-${Date.now()}`,
      customerName: name,
      customerEmoji: pickRandom(customerEmojis),
      cakeShape,
      cakeColor,
      nozzleType,
      requiredPatterns: patterns,
      timeLimit,
      basePrice,
      patience,
      patienceDecayRate,
      toleranceBonus,
      colorPreference,
      preferredSpeed,
    });
  }

  return orders;
};
