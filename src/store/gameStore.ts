import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HighScores, GameScore, BusinessDayLeaderboardEntry, CakeArtwork, SortBy, PatternType } from '@/types/game';
import {
  SkillProfile,
  GameMode,
  ExpSettlement,
  BadgeUnlockResult,
  PerformanceRecord,
  createEmptySkillProfile,
  getLevelFromExp,
} from '@/types/skill';
import { checkAllBadges, getBadgeDef } from '@/data/badges';

export type PracticeHighScores = Record<string, number>;

interface GameStore {
  currentLevel: number | null;
  score: GameScore | null;
  isPlaying: boolean;
  isPaused: boolean;
  highScores: HighScores;
  practiceHighScores: PracticeHighScores;
  businessDayLeaderboard: BusinessDayLeaderboardEntry[];
  artworks: CakeArtwork[];
  skillProfile: SkillProfile;
  setCurrentLevel: (levelId: number | null) => void;
  setScore: (score: GameScore | null) => void;
  setPlaying: (playing: boolean) => void;
  setPaused: (paused: boolean) => void;
  saveHighScore: (levelId: number, score: number) => void;
  getHighScore: (levelId: number) => number;
  savePracticeHighScore: (patternType: string, score: number) => void;
  getPracticeHighScore: (patternType: string) => number;
  saveBusinessDayScore: (entry: BusinessDayLeaderboardEntry) => void;
  getBusinessDayLeaderboard: () => BusinessDayLeaderboardEntry[];
  saveArtwork: (artwork: CakeArtwork) => void;
  getArtworks: (sortBy?: SortBy) => CakeArtwork[];
  getArtworkById: (id: string) => CakeArtwork | undefined;
  deleteArtwork: (id: string) => void;
  updateArtwork: (id: string, updates: Partial<CakeArtwork>) => void;
  submitLevelResult: (params: {
    score: number;
    completion: number;
    satisfaction: number;
    speedQuality: number;
    pressureQuality: number;
    levelId: number;
    stars: number;
  }) => ExpSettlement;
  submitPracticeResult: (params: {
    score: number;
    completion: number;
    satisfaction: number;
    speedQuality: number;
    pressureQuality: number;
    patternType: PatternType;
  }) => ExpSettlement;
  submitBusinessDayResult: (params: {
    totalOrders: number;
    totalIncome: number;
    averageSatisfaction: number;
    averageCompletion: number;
    averageSpeedQuality: number;
    averagePressureQuality: number;
    completedOrders: number;
  }) => ExpSettlement;
  submitFreeCreateResult: () => ExpSettlement;
  getSkillProfile: () => SkillProfile;
  resetGame: () => void;
}

const calculateExp = (mode: GameMode, params: Record<string, number>): number => {
  let base = 0;
  switch (mode) {
    case 'level': {
      base = 20;
      base += (params.completion || 0) * 0.3;
      base += (params.satisfaction || 0) * 0.2;
      base += (params.stars || 0) * 10;
      break;
    }
    case 'practice': {
      base = 10;
      base += (params.completion || 0) * 0.2;
      base += (params.score || 0) * 0.1;
      break;
    }
    case 'businessDay': {
      base = 30;
      base += (params.completedOrders || 0) * 5;
      base += (params.averageSatisfaction || 0) * 0.3;
      base += Math.min((params.totalIncome || 0) * 0.05, 30);
      break;
    }
    case 'freeCreate': {
      base = 15;
      break;
    }
  }
  return Math.round(base);
};

const MAX_RECENT_PERFORMANCES = 20;

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      currentLevel: null,
      score: null,
      isPlaying: false,
      isPaused: false,
      highScores: {},
      practiceHighScores: {},
      businessDayLeaderboard: [],
      artworks: [],
      skillProfile: createEmptySkillProfile(),

      setCurrentLevel: (levelId) => set({ currentLevel: levelId }),
      setScore: (score) => set({ score }),
      setPlaying: (playing) => set({ isPlaying: playing }),
      setPaused: (paused) => set({ isPaused: paused }),

      saveHighScore: (levelId, score) => {
        const current = get().highScores[levelId] || 0;
        if (score > current) {
          set((state) => ({
            highScores: { ...state.highScores, [levelId]: score },
          }));
        }
      },
      getHighScore: (levelId) => get().highScores[levelId] || 0,

      savePracticeHighScore: (patternType, score) => {
        const current = get().practiceHighScores[patternType] || 0;
        if (score > current) {
          set((state) => ({
            practiceHighScores: { ...state.practiceHighScores, [patternType]: score },
          }));
        }
      },
      getPracticeHighScore: (patternType) => get().practiceHighScores[patternType] || 0,

      saveBusinessDayScore: (entry) => {
        const leaderboard = [...get().businessDayLeaderboard, entry]
          .sort((a, b) => b.totalIncome - a.totalIncome)
          .slice(0, 10);
        set({ businessDayLeaderboard: leaderboard });
      },
      getBusinessDayLeaderboard: () => get().businessDayLeaderboard,

      saveArtwork: (artwork) => {
        set((state) => ({
          artworks: [artwork, ...state.artworks],
        }));
      },
      getArtworks: (sortBy = 'newest') => {
        const artworks = [...get().artworks];
        switch (sortBy) {
          case 'newest':
            return artworks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          case 'oldest':
            return artworks.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          case 'highest_rated':
            return artworks.sort((x, y) => y.rating - x.rating);
          case 'lowest_rated':
            return artworks.sort((x, y) => x.rating - y.rating);
          default:
            return artworks;
        }
      },
      getArtworkById: (id) => get().artworks.find((a) => a.id === id),
      deleteArtwork: (id) => {
        set((state) => ({
          artworks: state.artworks.filter((a) => a.id !== id),
        }));
      },
      updateArtwork: (id, updates) => {
        set((state) => ({
          artworks: state.artworks.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
      },

      submitLevelResult: (params) => {
        const profile = { ...get().skillProfile };
        const ms = { ...profile.modeStats, level: { ...profile.modeStats.level } };
        const ps = { ...profile.patternStats };

        ms.level.totalOrders += 1;
        ms.level.completionCount += 1;
        ms.level.totalCompletion += params.completion;
        ms.level.totalSatisfaction += params.satisfaction;
        ms.level.totalSpeedQuality += params.speedQuality;
        ms.level.totalPressureQuality += params.pressureQuality;

        if (params.stars >= 1) {
          ms.level.consecutiveSuccesses += 1;
        } else {
          ms.level.consecutiveSuccesses = 0;
        }

        const record: PerformanceRecord = {
          mode: 'level',
          timestamp: Date.now(),
          score: params.score,
          completion: params.completion,
          satisfaction: params.satisfaction,
          speedQuality: params.speedQuality,
          pressureQuality: params.pressureQuality,
          levelId: params.levelId,
        };

        const recent = [record, ...profile.recentPerformances].slice(0, MAX_RECENT_PERFORMANCES);
        profile.modeStats = ms;
        profile.patternStats = ps;
        profile.recentPerformances = recent;

        const expGained = calculateExp('level', params);
        profile.exp += expGained;
        const newLevel = getLevelFromExp(profile.exp);
        const leveledUp = newLevel > profile.level;
        profile.level = newLevel;

        const newBadgeIds = checkAllBadges(profile);
        profile.unlockedBadges = [...profile.unlockedBadges, ...newBadgeIds];

        set({ skillProfile: profile });

        const unlockedBadges: BadgeUnlockResult[] = newBadgeIds.map((id) => ({
          badge: getBadgeDef(id)!,
          isNew: true,
        }));

        return { expGained, newLevel, leveledUp, unlockedBadges };
      },

      submitPracticeResult: (params) => {
        const profile = { ...get().skillProfile };
        const ms = { ...profile.modeStats, practice: { ...profile.modeStats.practice } };
        const ps = {
          ...profile.patternStats,
          [params.patternType]: { ...profile.patternStats[params.patternType] },
        };

        ms.practice.completionCount += 1;
        ms.practice.totalCompletion += params.completion;
        ms.practice.totalSatisfaction += params.satisfaction;
        ms.practice.totalSpeedQuality += params.speedQuality;
        ms.practice.totalPressureQuality += params.pressureQuality;

        if (params.score >= 50) {
          ms.practice.consecutiveSuccesses += 1;
        } else {
          ms.practice.consecutiveSuccesses = 0;
        }

        ps[params.patternType].totalPractice += 1;
        ps[params.patternType].totalScore += params.score;
        if (params.score > ps[params.patternType].bestScore) {
          ps[params.patternType].bestScore = params.score;
        }

        const record: PerformanceRecord = {
          mode: 'practice',
          timestamp: Date.now(),
          score: params.score,
          completion: params.completion,
          satisfaction: params.satisfaction,
          speedQuality: params.speedQuality,
          pressureQuality: params.pressureQuality,
          patternType: params.patternType,
        };

        const recent = [record, ...profile.recentPerformances].slice(0, MAX_RECENT_PERFORMANCES);
        profile.modeStats = ms;
        profile.patternStats = ps;
        profile.recentPerformances = recent;

        const expGained = calculateExp('practice', {
          score: params.score,
          completion: params.completion,
          satisfaction: params.satisfaction,
          speedQuality: params.speedQuality,
          pressureQuality: params.pressureQuality,
        });
        profile.exp += expGained;
        const newLevel = getLevelFromExp(profile.exp);
        const leveledUp = newLevel > profile.level;
        profile.level = newLevel;

        const newBadgeIds = checkAllBadges(profile);
        profile.unlockedBadges = [...profile.unlockedBadges, ...newBadgeIds];

        set({ skillProfile: profile });

        const unlockedBadges: BadgeUnlockResult[] = newBadgeIds.map((id) => ({
          badge: getBadgeDef(id)!,
          isNew: true,
        }));

        return { expGained, newLevel, leveledUp, unlockedBadges };
      },

      submitBusinessDayResult: (params) => {
        const profile = { ...get().skillProfile };
        const ms = { ...profile.modeStats, businessDay: { ...profile.modeStats.businessDay } };

        ms.businessDay.totalOrders += params.totalOrders;
        ms.businessDay.completionCount += 1;
        ms.businessDay.totalCompletion += params.averageCompletion;
        ms.businessDay.totalSatisfaction += params.averageSatisfaction;
        ms.businessDay.totalSpeedQuality += params.averageSpeedQuality;
        ms.businessDay.totalPressureQuality += params.averagePressureQuality;
        if (params.totalIncome > ms.businessDay.highestIncome) {
          ms.businessDay.highestIncome = params.totalIncome;
        }
        if (params.completedOrders > 0) {
          ms.businessDay.consecutiveSuccesses += 1;
        } else {
          ms.businessDay.consecutiveSuccesses = 0;
        }

        const record: PerformanceRecord = {
          mode: 'businessDay',
          timestamp: Date.now(),
          score: params.totalIncome,
          completion: params.averageCompletion,
          satisfaction: params.averageSatisfaction,
          speedQuality: params.averageSpeedQuality,
          pressureQuality: params.averagePressureQuality,
        };

        const recent = [record, ...profile.recentPerformances].slice(0, MAX_RECENT_PERFORMANCES);
        profile.modeStats = ms;
        profile.recentPerformances = recent;

        const expGained = calculateExp('businessDay', params);
        profile.exp += expGained;
        const newLevel = getLevelFromExp(profile.exp);
        const leveledUp = newLevel > profile.level;
        profile.level = newLevel;

        const newBadgeIds = checkAllBadges(profile);
        profile.unlockedBadges = [...profile.unlockedBadges, ...newBadgeIds];

        set({ skillProfile: profile });

        const unlockedBadges: BadgeUnlockResult[] = newBadgeIds.map((id) => ({
          badge: getBadgeDef(id)!,
          isNew: true,
        }));

        return { expGained, newLevel, leveledUp, unlockedBadges };
      },

      submitFreeCreateResult: () => {
        const profile = { ...get().skillProfile };
        const ms = { ...profile.modeStats, freeCreate: { ...profile.modeStats.freeCreate } };

        ms.freeCreate.artworkCount += 1;

        const record: PerformanceRecord = {
          mode: 'freeCreate',
          timestamp: Date.now(),
          score: 0,
          completion: 0,
          satisfaction: 0,
          speedQuality: 0,
          pressureQuality: 0,
        };

        const recent = [record, ...profile.recentPerformances].slice(0, MAX_RECENT_PERFORMANCES);
        profile.modeStats = ms;
        profile.recentPerformances = recent;

        const expGained = calculateExp('freeCreate', {});
        profile.exp += expGained;
        const newLevel = getLevelFromExp(profile.exp);
        const leveledUp = newLevel > profile.level;
        profile.level = newLevel;

        const newBadgeIds = checkAllBadges(profile);
        profile.unlockedBadges = [...profile.unlockedBadges, ...newBadgeIds];

        set({ skillProfile: profile });

        const unlockedBadges: BadgeUnlockResult[] = newBadgeIds.map((id) => ({
          badge: getBadgeDef(id)!,
          isNew: true,
        }));

        return { expGained, newLevel, leveledUp, unlockedBadges };
      },

      getSkillProfile: () => get().skillProfile,

      resetGame: () => set({ currentLevel: null, score: null, isPlaying: false, isPaused: false }),
    }),
    {
      name: 'cake-piping-game-storage',
      partialize: (state) => ({
        highScores: state.highScores,
        practiceHighScores: state.practiceHighScores,
        businessDayLeaderboard: state.businessDayLeaderboard,
        artworks: state.artworks,
        skillProfile: state.skillProfile,
      }),
    }
  )
);
