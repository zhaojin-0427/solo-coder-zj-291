import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HighScores, GameScore, BusinessDayLeaderboardEntry, CakeArtwork, SortBy } from '@/types/game';

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
      artworks: [],
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
            return artworks.sort((a, b) => b.rating - a.rating);
          case 'lowest_rated':
            return artworks.sort((a, b) => a.rating - b.rating);
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
      resetGame: () => set({ currentLevel: null, score: null, isPlaying: false, isPaused: false }),
    }),
    {
      name: 'cake-piping-game-storage',
      partialize: (state) => ({
        highScores: state.highScores,
        practiceHighScores: state.practiceHighScores,
        businessDayLeaderboard: state.businessDayLeaderboard,
        artworks: state.artworks,
      }),
    }
  )
);
