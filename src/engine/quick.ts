import { chooseTable } from "./deck";
import { cryptoRandom } from "./rng";
import { createCylinder, pullTrigger } from "./revolver";
import type { QuickGameState, QuickSettings, RandomSource } from "./types";

export const DEFAULT_QUICK_SETTINGS: QuickSettings = {
  colorTruth: true,
  ranks: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"],
  chambers: 6,
  bullets: 1,
  showOdds: true,
};

export function createQuickGame(settings: QuickSettings, source: RandomSource = cryptoRandom): QuickGameState {
  const target = chooseTable({
    preset: "physical",
    ranks: settings.ranks,
    copiesPerRank: 4,
    jokers: 0,
    namedRanksPerRound: 1,
    colorTruth: settings.colorTruth,
  }, [], null, false, source);
  return {
    tableRank: target.ranks[0] ?? "6",
    tableColor: target.color,
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
