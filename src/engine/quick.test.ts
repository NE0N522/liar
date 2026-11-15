import { describe, expect, it } from "vitest";
import { createQuickGame, DEFAULT_QUICK_SETTINGS, pullQuickTrigger } from "./quick";
import { seededRandom } from "./rng";

describe("quick mode", () => {
  it("draws a physical rank and a red or black target by default", () => {
    const quick = createQuickGame(DEFAULT_QUICK_SETTINGS, seededRandom(12));
    expect(DEFAULT_QUICK_SETTINGS.ranks).toContain(quick.tableRank);
    expect(["red", "black"]).toContain(quick.tableColor);
    expect(quick.cylinder.chambers).toBe(6);
    expect(quick.cylinder.bulletsRemaining).toBe(1);
  });

  it("can generate a rank-only target", () => {
    const quick = createQuickGame({ ...DEFAULT_QUICK_SETTINGS, colorTruth: false }, seededRandom(84));
    expect(quick.tableColor).toBeNull();
  });

  it("allows the player to pull until a live round fires, then locks the cylinder", () => {
    const source = seededRandom(29);
    let quick = createQuickGame({ ...DEFAULT_QUICK_SETTINGS, bullets: 2 }, source);
    while (quick.outcome !== "fired" && quick.pulls < quick.cylinder.chambers) {
      quick = pullQuickTrigger(quick, source);
    }
    expect(quick.outcome).toBe("fired");
    expect(quick.cylinder.bulletsRemaining).toBeLessThan(2);
    expect(pullQuickTrigger(quick, source)).toBe(quick);
  });
});
