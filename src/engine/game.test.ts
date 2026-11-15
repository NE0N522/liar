import { describe, expect, it } from "vitest";
import { balancePercent, claimIsTrue, chooseTable, deckTotal } from "./deck";
import { createGame, reduceGame } from "./game";
import { seededRandom } from "./rng";
import { createCylinder, pullTrigger } from "./revolver";
import { DEFAULT_GAME_CONFIG, type DeckConfig, type GameConfig, type PlayerSetup } from "./types";

const players: PlayerSetup[] = [
  { id: "a", name: "Анна", color: "#a44", avatar: "A" },
  { id: "b", name: "Борис", color: "#4a4", avatar: "B" },
  { id: "c", name: "Вера", color: "#44a", avatar: "V" },
];
const config = (overrides: Partial<GameConfig> = {}): GameConfig => ({
  ...DEFAULT_GAME_CONFIG,
  ...overrides,
  deck: overrides.deck ?? DEFAULT_GAME_CONFIG.deck,
  revolver: { ...DEFAULT_GAME_CONFIG.revolver, ...overrides.revolver },
});

describe("revolver odds", () => {
  it("spreads the bullet across all chambers over repeated seeded trials", () => {
    const trials = 12_000;
    const source = seededRandom(1472);
    const deathByPull = new Array<number>(6).fill(0);
    for (let run = 0; run < trials; run += 1) {
      let cylinder = createCylinder(6, 1, source);
      for (let pull = 0; pull < 6; pull += 1) {
        const result = pullTrigger(cylinder, false, source);
        cylinder = result.cylinder;
        if (!result.survived) {
          deathByPull[pull] = (deathByPull[pull] ?? 0) + 1;
          break;
        }
      }
    }
    for (const frequency of deathByPull) expect(frequency / trials).toBeCloseTo(1 / 6, 1);
    const bulletPositions = new Array<number>(6).fill(0);
    const sample = seededRandom(992);
    for (let run = 0; run < trials; run += 1) {
      const cylinder = createCylinder(6, 1, sample);
      const position = cylinder.chamberStates.findIndex(Boolean);
      bulletPositions[position] = (bulletPositions[position] ?? 0) + 1;
    }
    for (const frequency of bulletPositions) expect(frequency / trials).toBeCloseTo(1 / 6, 1);
  });

  it("keeps spin mode at a constant probability", () => {
    const source = seededRandom(240);
    let deaths = 0;
    const trials = 6000;
    const cylinder = createCylinder(6, 1, source);
    for (let i = 0; i < trials; i += 1) {
      if (!pullTrigger(cylinder, true, source).survived) deaths += 1;
    }
    expect(deaths / trials).toBeCloseTo(1 / 6, 1);
  });
});

describe("deck rules", () => {
  it("computes the classic balance meter", () => {
    const deck: DeckConfig = {
      preset: "classic",
      ranks: ["K", "Q", "A"],
      copiesPerRank: 6,
      jokers: 2,
      namedRanksPerRound: 1,
      colorTruth: false,
    };
    expect(deckTotal(deck)).toBe(20);
    expect(balancePercent(deck)).toBe(40);
  });

  it("uses both rank and color for colored truth", () => {
    const sixRed = { rank: "6", color: "red" as const, joker: false };
    const sixBlack = { rank: "6", color: "black" as const, joker: false };
    expect(claimIsTrue([sixRed], ["6"], "red")).toBe(true);
    expect(claimIsTrue([sixBlack], ["6"], "red")).toBe(false);
    expect(claimIsTrue([sixBlack], ["6"], "red", true)).toBe(false);
  });

  it("accepts either named rank when two ranks are true", () => {
    const cards = [
      { rank: "6", color: "red" as const, joker: false },
      { rank: "7", color: "black" as const, joker: false },
    ];
    expect(claimIsTrue(cards, ["6", "7"], null)).toBe(true);
  });

  it("warns through a balance below 25% for physical color mode", () => {
    const deck: DeckConfig = {
      preset: "physical",
      ranks: ["9", "10", "J", "Q", "K", "A"],
      copiesPerRank: 4,
      jokers: 2,
      namedRanksPerRound: 2,
      colorTruth: true,
    };
    expect(balancePercent(deck)).toBeCloseTo(23.1, 0);
  });

  it("avoids the previous rank and color when requested", () => {
    const source = seededRandom(1);
    const table = chooseTable(
      { preset: "physical", ranks: ["6", "7", "8"], copiesPerRank: 4, jokers: 2, namedRanksPerRound: 1, colorTruth: true },
      ["6"],
      "red",
      true,
      source,
    );
    expect(table.ranks).not.toEqual(["6"]);
    expect(table.color).not.toBe("red");
  });

  it("guarantees at least one new rank when only one rank remains fresh", () => {
    const table = chooseTable(
      { preset: "physical", ranks: ["6", "7", "8"], copiesPerRank: 4, jokers: 2, namedRanksPerRound: 2, colorTruth: false },
      ["6", "7"],
      null,
      true,
      seededRandom(5),
    );
    expect(table.ranks).toContain("8");
  });
});

describe("game state machine", () => {
  it("prevents a challenge on the first play", () => {
    const state = createGame(players, config(), seededRandom(22));
    const first = reduceGame(state, { type: "PLAY", quantity: 1 }, seededRandom(3));
    expect(reduceGame(first, { type: "CHALLENGE" }, seededRandom(3))).toBe(first);
    expect(first.phase).toBe("playing");
  });

  it("forces an empty-handed player to challenge and resolves the shooter", () => {
    let state = createGame(players, config({ handSize: 1 }), seededRandom(10));
    state = reduceGame(state, { type: "PLAY", quantity: 1 }, seededRandom(10));
    state = reduceGame(state, { type: "PLAY", quantity: 1 }, seededRandom(10));
    state = reduceGame(state, { type: "PLAY", quantity: 1 }, seededRandom(10));
    expect(state.players[state.activeIndex]?.handCount).toBe(0);
    const challenged = reduceGame(state, { type: "CHALLENGE" }, seededRandom(10));
    expect(challenged.phase).toBe("reveal");
    expect(challenged.challengerId).toBe(state.players[state.activeIndex]?.id);
    const shot = reduceGame(challenged, { type: "RESOLVE_CHALLENGE", truthful: false }, seededRandom(10));
    expect(shot.phase).toBe("shooting");
    const result = reduceGame(shot, { type: "COMPLETE_SCENE" }, seededRandom(10));
    expect(["round-over", "finished"]).toContain(result.phase);
    expect(result.shooterId).toBe(challenged.lastPlay?.playerId);
  });

  it("allows undo only before a challenge opens the reveal", () => {
    let state = createGame(players, config(), seededRandom(11));
    state = reduceGame(state, { type: "PLAY", quantity: 2 }, seededRandom(11));
    const undo = reduceGame(state, { type: "UNDO" }, seededRandom(11));
    expect(undo.lastPlay).toBeNull();
    const second = reduceGame(undo, { type: "PLAY", quantity: 1 }, seededRandom(11));
    const challenged = reduceGame(second, { type: "PLAY", quantity: 1 }, seededRandom(11));
    const reveal = reduceGame(challenged, { type: "CHALLENGE" }, seededRandom(11));
    expect(reduceGame(reveal, { type: "UNDO" }, seededRandom(11))).toBe(reveal);
  });

  it("serializes without losing state", () => {
    const state = createGame(players, config(), seededRandom(44));
    const restored = JSON.parse(JSON.stringify(state)) as typeof state;
    expect(restored.players[0]?.revolver.chambers).toBe(6);
    expect(restored.tableRanks).toEqual(state.tableRanks);
  });

  it("uses one shared cylinder without changing each player's personal cylinder", () => {
    const zeroSource = { nextUint32: () => 0 };
    let state = createGame(players, config({ revolver: { mode: "shared", chambers: 6, bullets: 1, showOdds: false } }), zeroSource);
    state = reduceGame(state, { type: "PLAY", quantity: 1 }, zeroSource);
    state = reduceGame(state, { type: "PLAY", quantity: 1 }, zeroSource);
    state = reduceGame(state, { type: "CHALLENGE" }, zeroSource);
    state = reduceGame(state, { type: "RESOLVE_CHALLENGE", truthful: true }, zeroSource);
    expect(state.phase).toBe("shooting");
    state = reduceGame(state, { type: "COMPLETE_SCENE" }, zeroSource);
    expect(state.sharedRevolver.spent).toBe(1);
    expect(state.players.every((player) => player.revolver.spent === 0)).toBe(true);
  });

  it("performs the second pull in a double-trigger round after a safe first pull", () => {
    const zeroSource = { nextUint32: () => 0 };
    let state = createGame(players, config(), zeroSource);
    state = { ...state, chaos: "double-trigger" };
    state = reduceGame(state, { type: "PLAY", quantity: 1 }, zeroSource);
    state = reduceGame(state, { type: "PLAY", quantity: 1 }, zeroSource);
    state = reduceGame(state, { type: "CHALLENGE" }, zeroSource);
    state = reduceGame(state, { type: "RESOLVE_CHALLENGE", truthful: true }, zeroSource);
    expect(state.shotSequence).toEqual([true, true]);
    expect(state.pendingCylinder?.spent).toBe(2);
    state = reduceGame(state, { type: "COMPLETE_SCENE" }, zeroSource);
    expect(state.stats.shots).toBe(2);
    expect(state.players[2]?.pulls).toBe(2);
  });

  it("forbids a challenge on the first play of every round", () => {
    const zeroSource = { nextUint32: () => 0 };
    let state = createGame(players, config(), zeroSource);
    state = reduceGame(state, { type: "PLAY", quantity: 1 }, zeroSource);
    state = reduceGame(state, { type: "PLAY", quantity: 1 }, zeroSource);
    state = reduceGame(state, { type: "CHALLENGE" }, zeroSource);
    state = reduceGame(state, { type: "RESOLVE_CHALLENGE", truthful: false }, zeroSource);
    state = reduceGame(state, { type: "COMPLETE_SCENE" }, zeroSource);
    expect(state.phase).toBe("round-over");
    state = reduceGame(state, { type: "NEXT_ROUND" }, zeroSource);
    expect(state.turnsThisRound).toBe(0);
    state = reduceGame(state, { type: "PLAY", quantity: 1 }, zeroSource);
    expect(state.turnsThisRound).toBe(1);
    expect(reduceGame(state, { type: "CHALLENGE" }, zeroSource)).toBe(state);
  });
});
