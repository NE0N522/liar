export type CardColor = "red" | "black";
export type RevolverMode = "classic" | "spin" | "shared";
export type DeckPreset = "classic" | "physical" | "custom";
export type Phase = "playing" | "reveal" | "shooting" | "round-over" | "finished";
export type ChaosEvent =
  | "double-trigger"
  | "shuffle-cylinder"
  | "reverse"
  | "double-truth"
  | "joker-ban";

export interface DeckConfig {
  preset: DeckPreset;
  ranks: string[];
  copiesPerRank: number;
  jokers: number;
  namedRanksPerRound: number;
  colorTruth: boolean;
}

export interface RevolverConfig {
  mode: RevolverMode;
  chambers: number;
  bullets: number;
  showOdds: boolean;
}

export interface PlayerSetup {
  id: string;
  name: string;
  color: string;
  avatar: string;
}

export interface Player extends PlayerSetup {
  alive: boolean;
  handCount: number;
  pulls: number;
  survivalCount: number;
  caughtLiars: number;
  falseChallenges: number;
  revolver: Cylinder;
}

export interface Cylinder {
  chambers: number;
  bulletsRemaining: number;
  spent: number;
  chamberStates: boolean[];
}

export interface GameConfig {
  handSize: number;
  deck: DeckConfig;
  revolver: RevolverConfig;
  noRepeatTable: boolean;
  shooterStarts: boolean;
  showHandCounts: boolean;
  chaosEnabled: boolean;
  timerSeconds: 0 | 15 | 30 | 60;
}

export interface LastPlay {
  playerId: string;
  quantity: number;
  turn: number;
}

export interface GameStats {
  turns: number;
  challenges: number;
  shots: number;
  highestPull: number;
  rounds: number;
}

export interface GameState {
  config: GameConfig;
  players: Player[];
  activeIndex: number;
  round: number;
  turnsThisRound: number;
  tableRanks: string[];
  tableColor: CardColor | null;
  previousTableRanks: string[];
  previousTableColor: CardColor | null;
  direction: 1 | -1;
  phase: Phase;
  lastPlay: LastPlay | null;
  challengerId: string | null;
  shooterId: string | null;
  lastShotSurvived: boolean | null;
  shotSequence: boolean[];
  pendingCylinder: Cylinder | null;
  resultTruthful: boolean | null;
  chaos: ChaosEvent | null;
  sharedRevolver: Cylinder;
  log: string[];
  stats: GameStats;
}

export type GameEvent =
  | { type: "PLAY"; quantity: number }
  | { type: "CHALLENGE" }
  | { type: "RESOLVE_CHALLENGE"; truthful: boolean }
  | { type: "COMPLETE_SCENE" }
  | { type: "NEXT_ROUND" }
  | { type: "TIMER_EXPIRED" }
  | { type: "UNDO" };

export interface RandomSource {
  nextUint32(): number;
}

export const DEFAULT_PLAYERS: PlayerSetup[] = [
  { id: "p1", name: "Алексей", color: "#ba8f52", avatar: "A" },
  { id: "p2", name: "Мария", color: "#a95e46", avatar: "M" },
  { id: "p3", name: "Никита", color: "#52785c", avatar: "N" },
];

export const DEFAULT_GAME_CONFIG: GameConfig = {
  handSize: 5,
  deck: {
    preset: "classic",
    ranks: ["K", "Q", "A"],
    copiesPerRank: 6,
    jokers: 2,
    namedRanksPerRound: 1,
    colorTruth: false,
  },
  revolver: { mode: "classic", chambers: 6, bullets: 1, showOdds: false },
  noRepeatTable: true,
  shooterStarts: false,
  showHandCounts: true,
  chaosEnabled: false,
  timerSeconds: 0,
};
