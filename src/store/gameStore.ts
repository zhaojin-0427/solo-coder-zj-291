import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HighScores, GameScore, Level } from '@/types/game';

interface GameStore {
  currentLevel: number | null;
  score: GameScore | null;
  isPlaying: boolean;
  isPaused: boolean;
  highScores: HighScores;
  setCurrentLevel: (levelId: number | null) => void;
  setScore: (score: GameScore | null) => void;
  setPlaying: (playing: boolean) => void;
  setPaused: (paused: boolean) => void;
  saveHighScore: (levelId: number, score: number) => void;
  getHighScore: (levelId: number) => number;
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
      resetGame: () => set({ currentLevel: null, score: null, isPlaying: false, isPaused: false }),
    }),
    {
      name: 'cake-piping-game-storage',
      partialize: (state) => ({ highScores: state.highScores }),
    }
  )
);
