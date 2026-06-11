import { Level } from '@/types/game';

const generateCirclePoints = (cx: number, cy: number, radius: number, segments: number): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    });
  }
  return points;
};

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

const generateLeafPoints = (cx: number, cy: number, size: number, rotation: number): { x: number; y: number }[] => {
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

export const levels: Level[] = [
  {
    id: 1,
    name: '新手入门',
    difficulty: 'easy',
    timeLimit: 90,
    cakeShape: 'circle',
    cakeColor: '#FFE4C4',
    nozzleType: 'round',
    targetScore: 60,
    description: '在圆形蛋糕边缘画一个简单的奶油圈',
    requiredPatterns: [
      {
        type: 'shell',
        points: generateShellBorder(400, 300, 150),
        requiredThickness: 8,
        color: '#FFB6C1',
        description: '圆形蛋糕边缘裱花',
      },
    ],
  },
  {
    id: 2,
    name: '玫瑰花艺',
    difficulty: 'medium',
    timeLimit: 120,
    cakeShape: 'square',
    cakeColor: '#FFDAB9',
    nozzleType: 'star',
    targetScore: 75,
    description: '在方形蛋糕上裱出玫瑰花和叶子',
    requiredPatterns: [
      {
        type: 'rose',
        points: generateRosePoints(400, 280, 50),
        requiredThickness: 6,
        color: '#FF69B4',
        description: '中心玫瑰花',
      },
      {
        type: 'leaf',
        points: generateLeafPoints(320, 350, 40, -0.5),
        requiredThickness: 5,
        color: '#90EE90',
        description: '左下叶子',
      },
      {
        type: 'leaf',
        points: generateLeafPoints(480, 350, 40, 0.5),
        requiredThickness: 5,
        color: '#90EE90',
        description: '右下叶子',
      },
    ],
  },
  {
    id: 3,
    name: '大师挑战',
    difficulty: 'hard',
    timeLimit: 180,
    cakeShape: 'heart',
    cakeColor: '#FFEFD5',
    nozzleType: 'writing',
    targetScore: 85,
    description: '在心形蛋糕上完成复杂的组合装饰',
    requiredPatterns: [
      {
        type: 'shell',
        points: [
          ...generateCirclePoints(400, 290, 140, 72),
        ],
        requiredThickness: 7,
        color: '#FF6B9D',
        description: '心形外圈',
      },
      {
        type: 'rose',
        points: generateRosePoints(340, 250, 35),
        requiredThickness: 5,
        color: '#FF1493',
        description: '左上玫瑰',
      },
      {
        type: 'rose',
        points: generateRosePoints(460, 250, 35),
        requiredThickness: 5,
        color: '#FF1493',
        description: '右上玫瑰',
      },
      {
        type: 'leaf',
        points: generateLeafPoints(400, 340, 50, Math.PI / 2),
        requiredThickness: 4,
        color: '#32CD32',
        description: '底部叶子',
      },
    ],
  },
];

export const pipingKnowledge = [
  {
    title: '圆口花嘴 (Round Nozzle)',
    icon: '⭕',
    description: '最基础的花嘴，适合写字、画线条、点缀圆点。控制好力度可以画出粗细均匀的线条。',
    tip: '保持匀速移动，力度稳定，避免突然停顿造成奶油堆积。',
  },
  {
    title: '星形花嘴 (Star Nozzle)',
    icon: '⭐',
    description: '带齿纹的花嘴，可以挤出带花纹的奶油，适合做玫瑰花、贝壳边和装饰性花边。',
    tip: '做玫瑰花时以打圈方式移动，力度由轻到重再到轻。',
  },
  {
    title: '叶子花嘴 (Leaf Nozzle)',
    icon: '🍃',
    description: '扁平带锯齿的花嘴，专门用于制作叶子造型，可以挤出自然的叶脉纹路。',
    tip: '挤叶子时先轻后重再轻，配合左右小幅摆动做出自然形态。',
  },
  {
    title: '写字花嘴 (Writing Nozzle)',
    icon: '✍️',
    description: '细小的圆口花嘴，适合在蛋糕上写祝福语和画精细的图案线条。',
    tip: '写字时手要稳，移动速度要均匀，奶油要调得软硬适中。',
  },
  {
    title: '力度控制技巧',
    icon: '💪',
    description: '挤酱力度决定了奶油的粗细。力度太大奶油会堆积，太小奶油会断裂。',
    tip: '找到合适的力度区间，保持稳定的压力是关键！',
  },
  {
    title: '移动速度要领',
    icon: '🏃',
    description: '移动速度影响奶油分布。移动过快会导致奶油断裂，过慢会堆积成堆。',
    tip: '保持均匀适中的速度，让奶油自然流畅地附着在蛋糕上。',
  },
];
