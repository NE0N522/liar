import { randomInt, shuffle } from "./rng";
import type { Cylinder, RandomSource } from "./types";

export interface ShotResult {
  survived: boolean;
  cylinder: Cylinder;
}

export function createCylinder(chambers: number, bullets: number, source: RandomSource): Cylinder {
  const rounds = Array.from({ length: chambers }, (_, index) => index < bullets);
  const chamberStates = shuffle(rounds, source);
  return { chambers, bulletsRemaining: bullets, spent: 0, chamberStates };
}

export function pullTrigger(
  cylinder: Cylinder,
  spinEachPull: boolean,
  source: RandomSource,
): ShotResult {
  if (spinEachPull) {
    const fired = randomInt(cylinder.chambers, source) < cylinder.bulletsRemaining;
    return {
      survived: !fired,
      cylinder: { ...cylinder, spent: cylinder.spent + 1 },
    };
  }
  const index = cylinder.spent % cylinder.chambers;
  const fired = cylinder.chamberStates[index] ?? false;
  return {
    survived: !fired,
    cylinder: {
      ...cylinder,
      spent: cylinder.spent + 1,
      bulletsRemaining: Math.max(0, cylinder.bulletsRemaining - (fired ? 1 : 0)),
    },
  };
}

export function reshuffleCylinder(cylinder: Cylinder, bullets: number, source: RandomSource): Cylinder {
  const states = Array.from({ length: cylinder.chambers }, (_, index) => index < bullets);
  return { ...cylinder, chamberStates: shuffle(states, source), bulletsRemaining: bullets, spent: 0 };
}

export function odds(cylinder: Cylinder): { numerator: number; denominator: number } {
  if (cylinder.chambers <= cylinder.spent) return { numerator: 0, denominator: 0 };
  return {
    numerator: cylinder.bulletsRemaining,
    denominator: cylinder.chambers - cylinder.spent,
  };
}
