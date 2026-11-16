import { PHYSICAL_RANKS } from "./deck";
import { cryptoRandom, pick, shuffle } from "./rng";
import { createCylinder, pullTrigger } from "./revolver";
import type { QuickGameState, QuickSettings, RandomSource } from "./types";

export const DEFAULT_QUICK_SETTINGS: QuickSettings = {
  colorTruth: true,
  ranks: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"],
  targetCount: 1,
  sameColor: true,
  chambers: 6,
  bullets: 1,
  showOdds: true,
};

export function createQuickGame(settings: QuickSettings, source: RandomSource = cryptoRandom): QuickGameState {
  const ranks = settings.ranks.length > 0 ? settings.ranks : PHYSICAL_RANKS;
  const targetCount = settings.targetCount === 2 ? 2 : 1;
  const drawnRanks = shuffle(ranks, source).slice(0, Math.min(targetCount, ranks.length));
  while (drawnRanks.length < targetCount) drawnRanks.push(pick(ranks, source));

  let targetColors: ("red" | "black" | null)[];
  if (targetCount === 2) {
    if (settings.sameColor) {
      const color = pick(["red", "black"] as const, source);
      targetColors = [color, color];
    } else {
      targetColors = shuffle(["red", "black"] as const, source);
    }
  } else {
    targetColors = [settings.colorTruth ? pick(["red", "black"] as const, source) : null];
  }

  const targetCards = drawnRanks.map((rank, index) => ({ rank, color: targetColors[index] ?? null }));
  const firstTarget = targetCards[0] ?? { rank: "6", color: null };
  return {
    tableRank: firstTarget.rank,
    tableColor: settings.colorTruth ? firstTarget.color : null,
    targetCards,
    cylinder: createCylinder(settings.chambers, settings.bullets, source),
    pulls: 0,
    outcome: "waiting",
  };
}

export function pullQuickTrigger(state: QuickGameState, source: RandomSource = cryptoRandom): QuickGameState {
  if (state.outcome === "fired" || state.cylinder.spent >= state.cylinder.chambers) return state;
  const result = pullTrigger(state.cylinder, false, source);
  return {
    ...state,
    cylinder: result.cylinder,
    pulls: state.pulls + 1,
    outcome: result.survived ? "survived" : "fired",
  };
}
