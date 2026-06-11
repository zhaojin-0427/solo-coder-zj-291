export type Difficulty = 'easy' | 'medium' | 'hard';
export type CakeShape = 'circle' | 'square' | 'heart';
export type NozzleType = 'round' | 'star' | 'leaf' | 'writing';
export type PatternType = 'rose' | 'leaf' | 'shell' | 'text';

export interface Point {
  x: number;
  y: number;
}

export interface Pattern {
  type: PatternType;
  points: Point[];
  requiredThickness: number;
  color: string;
  description: string;
}

export interface Level {
  id: number;
  name: string;
  difficulty: Difficulty;
  timeLimit: number;
  cakeShape: CakeShape;
  cakeColor: string;
  requiredPatterns: Pattern[];
  nozzleType: NozzleType;
  targetScore: number;
  description: string;
}

export interface DrawnPoint extends Point {
  thickness: number;
  timestamp: number;
}

export interface GameScore {
  completion: number;
  satisfaction: number;
  totalScore: number;
  stars: number;
}

export interface HighScores {
  [levelId: number]: number;
}
