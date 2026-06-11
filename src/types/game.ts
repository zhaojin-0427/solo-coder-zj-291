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
  color?: string;
  nozzleType?: NozzleType;
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

export interface CustomerOrder {
  id: string;
  customerName: string;
  customerEmoji: string;
  cakeShape: CakeShape;
  cakeColor: string;
  nozzleType: NozzleType;
  requiredPatterns: Pattern[];
  timeLimit: number;
  basePrice: number;
  patience: number;
  patienceDecayRate: number;
  toleranceBonus: number;
  colorPreference: string;
  preferredSpeed: 'slow' | 'medium' | 'fast';
}

export interface OrderResult {
  orderId: string;
  customerName: string;
  customerEmoji: string;
  score: GameScore;
  completion: number;
  accuracy: number;
  speedQuality: number;
  pressureStability: number;
  preferenceMatch: number;
  patienceRemaining: number;
  tip: number;
  satisfaction: number;
  timeUsed: number;
  timeLimit: number;
  failed: boolean;
  review: TrajectoryReview | null;
}

export interface BusinessDayResult {
  totalIncome: number;
  averageSatisfaction: number;
  failedOrders: number;
  totalOrders: number;
  bestOrder: OrderResult | null;
  weakestSkill: ReviewPointType;
  weakestPatternType: PatternType;
  orderResults: OrderResult[];
  businessDayTime: number;
  date: string;
}

export interface BusinessDayLeaderboardEntry {
  totalIncome: number;
  date: string;
  totalOrders: number;
  failedOrders: number;
}

export type BackgroundDecoration = 'none' | 'sprinkles' | 'flowers' | 'stars' | 'hearts';

export interface CakeArtwork {
  id: string;
  name: string;
  thumbnail: string;
  createdAt: string;
  cakeShape: CakeShape;
  cakeColor: string;
  nozzleTypes: NozzleType[];
  mainColors: string[];
  drawnPaths: DrawnPoint[][];
  backgroundColor: string;
  backgroundDecoration: BackgroundDecoration;
  rating: number;
  tags: string[];
}

export type SortBy = 'newest' | 'oldest' | 'highest_rated' | 'lowest_rated';
