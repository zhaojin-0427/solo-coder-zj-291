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

export type ReviewPointType =
  | 'deviation'
  | 'speed_fast'
  | 'speed_slow'
  | 'pressure_high'
  | 'pressure_low';

export interface ReviewPoint {
  x: number;
  y: number;
  type: ReviewPointType;
  severity: number;
  timestamp: number;
}

export interface TrajectoryReview {
  reviewPoints: ReviewPoint[];
  deviationCount: number;
  speedFastCount: number;
  speedSlowCount: number;
  pressureHighCount: number;
  pressureLowCount: number;
  weakestType: ReviewPointType;
  weakestPatternType: PatternType;
}

export interface PracticePattern {
  type: PatternType;
  name: string;
  icon: string;
  description: string;
  color: string;
  nozzleType: NozzleType;
  requiredThickness: number;
  targetPoints: Point[];
}

export interface PracticeResult {
  score: number;
  completion: number;
  accuracy: number;
  speedQuality: number;
  pressureQuality: number;
  errors: { type: ReviewPointType; count: number; description: string }[];
}

export interface HighScores {
  [levelId: number]: number;
}
