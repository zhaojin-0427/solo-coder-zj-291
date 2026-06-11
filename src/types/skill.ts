import { PatternType } from './game';

export type GameMode = 'level' | 'practice' | 'businessDay' | 'freeCreate';

export interface ModeStats {
  totalOrders: number;
  completionCount: number;
  totalCompletion: number;
  totalSatisfaction: number;
  totalSpeedQuality: number;
  totalPressureQuality: number;
  consecutiveSuccesses: number;
  artworkCount: number;
  highestIncome: number;
}

export interface PatternSkillStats {
  totalPractice: number;
  bestScore: number;
  totalScore: number;
}

export type PatternSkillStatsMap = Record<PatternType, PatternSkillStats>;

export interface PerformanceRecord {
  mode: GameMode;
  timestamp: number;
  score: number;
  completion: number;
  satisfaction: number;
  speedQuality: number;
  pressureQuality: number;
  patternType?: PatternType;
  levelId?: number;
}

export interface SkillProfile {
  level: number;
  exp: number;
  modeStats: Record<GameMode, ModeStats>;
  patternStats: PatternSkillStatsMap;
  unlockedBadges: string[];
  recentPerformances: PerformanceRecord[];
}

export interface BadgeDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'pattern' | 'skill' | 'business' | 'creation' | 'achievement';
}

export interface BadgeUnlockResult {
  badge: BadgeDef;
  isNew: boolean;
}

export interface ExpSettlement {
  expGained: number;
  newLevel: number;
  leveledUp: boolean;
  unlockedBadges: BadgeUnlockResult[];
}

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200,
  4000, 4900, 5900, 7000, 8200, 9500, 11000, 12600, 14300, 16100,
];

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

export const getExpForLevel = (level: number): number => {
  if (level <= 0) return 0;
  if (level > MAX_LEVEL) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  return LEVEL_THRESHOLDS[level - 1];
};

export const getLevelFromExp = (totalExp: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalExp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
};

export const getExpProgress = (exp: number): { current: number; needed: number; ratio: number } => {
  const level = getLevelFromExp(exp);
  if (level >= MAX_LEVEL) return { current: 0, needed: 1, ratio: 1 };
  const currentThreshold = LEVEL_THRESHOLDS[level - 1];
  const nextThreshold = LEVEL_THRESHOLDS[level];
  const current = exp - currentThreshold;
  const needed = nextThreshold - currentThreshold;
  return { current, needed, ratio: current / needed };
};

export const LEVEL_TITLES: Record<number, string> = {
  1: '裱花学徒',
  2: '裱花新手',
  3: '裱花入门',
  4: '裱花熟手',
  5: '裱花匠人',
  6: '裱花巧匠',
  7: '裱花达人',
  8: '裱花专家',
  9: '裱花大师',
  10: '裱花宗师',
  11: '裱花巨匠',
  12: '裱花圣手',
  13: '裱花传奇',
  14: '裱花至尊',
  15: '裱花神话',
  16: '甜品艺术家',
  17: '甜品雕刻家',
  18: '甜品创造者',
  19: '甜品大师',
  20: '裱花之神',
};

export const getLevelTitle = (level: number): string => {
  return LEVEL_TITLES[level] || `Lv.${level}`;
};

export const createEmptyModeStats = (): ModeStats => ({
  totalOrders: 0,
  completionCount: 0,
  totalCompletion: 0,
  totalSatisfaction: 0,
  totalSpeedQuality: 0,
  totalPressureQuality: 0,
  consecutiveSuccesses: 0,
  artworkCount: 0,
  highestIncome: 0,
});

export const createEmptyPatternStats = (): PatternSkillStatsMap => ({
  rose: { totalPractice: 0, bestScore: 0, totalScore: 0 },
  leaf: { totalPractice: 0, bestScore: 0, totalScore: 0 },
  shell: { totalPractice: 0, bestScore: 0, totalScore: 0 },
  text: { totalPractice: 0, bestScore: 0, totalScore: 0 },
});

export const createEmptySkillProfile = (): SkillProfile => ({
  level: 1,
  exp: 0,
  modeStats: {
    level: createEmptyModeStats(),
    practice: createEmptyModeStats(),
    businessDay: createEmptyModeStats(),
    freeCreate: createEmptyModeStats(),
  },
  patternStats: createEmptyPatternStats(),
  unlockedBadges: [],
  recentPerformances: [],
});
