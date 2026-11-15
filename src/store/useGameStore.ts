import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createGame, reduceGame } from "../engine/game";
import { createQuickGame, DEFAULT_QUICK_SETTINGS, pullQuickTrigger } from "../engine/quick";
import type { GameConfig, GameEvent, GameState, PlayerSetup, QuickGameState, QuickSettings } from "../engine/types";
import type { Locale } from "../i18n/translations";

export type Page = "home" | "setup" | "game" | "quick-setup" | "quick-game";

export interface Preferences {
  soundEnabled: boolean;
  volume: number;
  haptics: boolean;
  reducedMotion: boolean;
}

interface AppStore {
  page: Page;
  overlay: "settings" | "rules" | null;
  game: GameState | null;
  quickGame: QuickGameState | null;
  quickSettings: QuickSettings;
  locale: Locale;
  preferences: Preferences;
  setPage: (page: Page) => void;
  setOverlay: (overlay: AppStore["overlay"]) => void;
  setLocale: (locale: Locale) => void;
  updatePreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  startGame: (players: PlayerSetup[], config: GameConfig) => void;
  dispatch: (event: GameEvent) => void;
  resetGame: () => void;
  updateQuickSettings: (settings: Partial<QuickSettings>) => void;
  startQuickGame: () => void;
  pullQuickTrigger: () => void;
  newQuickRound: () => void;
};

const initialPreferences: Preferences = {
  soundEnabled: true,
  volume: 0.65,
  haptics: true,
  reducedMotion: false,
};

export const useGameStore = create<AppStore>()(
  persist(
    immer((set) => ({
      page: "home",
      overlay: null,
      game: null,
      quickGame: null,
      quickSettings: DEFAULT_QUICK_SETTINGS,
      locale: "ru",
      preferences: initialPreferences,
      setPage: (page) =>
        set((state) => {
          state.page = page;
        }),
      setOverlay: (overlay) =>
        set((state) => {
          state.overlay = overlay;
        }),
      setLocale: (locale) =>
        set((state) => {
          state.locale = locale;
        }),
      updatePreference: (key, value) =>
        set((state) => {
          state.preferences[key] = value;
        }),
      startGame: (players, config) =>
        set((state) => {
          state.game = createGame(players, config);
          state.page = "game";
          state.overlay = null;
        }),
      dispatch: (event) =>
        set((state) => {
          if (state.game) state.game = reduceGame(state.game, event);
        }),
      resetGame: () =>
        set((state) => {
          state.game = null;
          state.page = "home";
          state.overlay = null;
        }),
      updateQuickSettings: (settings) =>
        set((state) => {
          const chambers = settings.chambers ?? state.quickSettings.chambers;
          state.quickSettings = {
            ...state.quickSettings,
            ...settings,
            bullets: Math.max(1, Math.min(settings.bullets ?? state.quickSettings.bullets, chambers - 1)),
          };
        }),
      startQuickGame: () =>
        set((state) => {
          state.quickGame = createQuickGame(state.quickSettings);
          state.page = "quick-game";
          state.overlay = null;
        }),
      pullQuickTrigger: () =>
        set((state) => {
          if (state.quickGame) state.quickGame = pullQuickTrigger(state.quickGame);
        }),
      newQuickRound: () =>
        set((state) => {
          state.quickGame = createQuickGame(state.quickSettings);
          state.page = "quick-game";
        }),
    })),
    {
      name: "last-call-save-v1",
      partialize: (state) =>
        ({
          page: state.page,
          game: state.game,
          quickGame: state.quickGame,
          quickSettings: state.quickSettings,
          locale: state.locale,
          preferences: state.preferences,
        }) as AppStore,
    },
  ),
);
