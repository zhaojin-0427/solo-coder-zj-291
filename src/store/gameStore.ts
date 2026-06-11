import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HighScores, GameScore, BusinessDayLeaderboardEntry } from '@/types/game';

export type PracticeHighScores = Record<string, number>;

interface GameStore {
  currentLevel: number | null;
  score: GameScore | null;
  isPlaying: boolean;
  isPaused: boolean;
  highScores: HighScores;
  practiceHighScores: PracticeHighScores;
  businessDayLeaderboard: BusinessDayLeaderboardEntry[];
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
  resetGame: () => void;
}

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
      resetGame: () => set({ currentLevel: null, score: null, isPlaying: false, isPaused: false }),
    }),
    {
      name: 'cake-piping-game-storage',
      partialize: (state) => ({
        highScores: state.highScores,
        practiceHighScores: state.practiceHighScores,
        businessDayLeaderboard: state.businessDayLeaderboard,
      }),
    }
  )
);
