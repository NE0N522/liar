import type { RandomSource } from "./types";

const UINT32_RANGE = 0x1_0000_0000;

export const cryptoRandom: RandomSource = {
  nextUint32() {
    const value = new Uint32Array(1);
    globalThis.crypto.getRandomValues(value);
    return value[0] ?? 0;
  },
};

export function seededRandom(seed: number): RandomSource {
  let state = seed >>> 0;
  if (state === 0) state = 0x9e3779b9;
  return {
    nextUint32() {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return state >>> 0;
    },
  };
}

export function randomInt(maxExclusive: number, source: RandomSource = cryptoRandom): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > UINT32_RANGE) {
    throw new RangeError("maxExclusive must be an integer from 1 to 2^32");
  }
  const limit = Math.floor(UINT32_RANGE / maxExclusive) * maxExclusive;
  let value = source.nextUint32();
  while (value >= limit) value = source.nextUint32();
  return value % maxExclusive;
}

export function shuffle<T>(items: readonly T[], source: RandomSource = cryptoRandom): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1, source);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export function pick<T>(items: readonly T[], source: RandomSource = cryptoRandom): T {
  if (items.length === 0) throw new RangeError("Cannot pick from an empty collection");
  return items[randomInt(items.length, source)]!;
}
