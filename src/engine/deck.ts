import { pick, shuffle } from "./rng";
import type { CardColor, DeckConfig, RandomSource } from "./types";

export const CLASSIC_RANKS = ["K", "Q", "A"];
export const PHYSICAL_RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
export const DEFAULT_PHYSICAL_RANKS = ["9", "10", "J", "Q", "K", "A"];
export const RANK_NAMES: Record<string, string> = {
  "2": "Двойка",
  "3": "Тройка",
  "4": "Четвёрка",
  "5": "Пятёрка",
  "6": "Шестёрка",
  "7": "Семёрка",
  "8": "Восьмёрка",
  "9": "Девятка",
  "10": "Десятка",
  J: "Валет",
  Q: "Дама",
  K: "Король",
  A: "Туз",
};

export interface DeckCard {
  rank: string;
  color: CardColor | "joker";
  joker: boolean;
}

export function buildDeck(config: DeckConfig): DeckCard[] {
  const cards: DeckCard[] = [];
  for (const rank of config.ranks) {
    for (let copy = 0; copy < config.copiesPerRank; copy += 1) {
      let color: CardColor;
      if (config.preset === "classic") color = copy % 2 === 0 ? "red" : "black";
      else color = copy % 2 === 0 ? "red" : "black";
      cards.push({ rank, color, joker: false });
    }
  }
  for (let index = 0; index < config.jokers; index += 1) {
    cards.push({ rank: "JOKER", color: "joker", joker: true });
  }
  return cards;
}

export function deckTotal(config: DeckConfig): number {
  return config.ranks.length * config.copiesPerRank + config.jokers;
}

export function balancePercent(config: DeckConfig): number {
  const total = deckTotal(config);
  if (total === 0) return 0;
  const namedCopies = config.copiesPerRank * config.namedRanksPerRound;
  const eligibleCopies = config.colorTruth ? namedCopies / 2 : namedCopies;
  return ((eligibleCopies + config.jokers) / total) * 100;
}

export function chooseTable(
  config: DeckConfig,
  previousRanks: string[],
  previousColor: CardColor | null,
  noRepeat: boolean,
  source: RandomSource,
): { ranks: string[]; color: CardColor | null } {
  const amount = Math.min(config.namedRanksPerRound, config.ranks.length);
  const freshRanks = config.ranks.filter((rank) => !previousRanks.includes(rank));
  let ranks: string[];
  if (noRepeat && freshRanks.length > 0 && config.ranks.length > amount) {
    const first = shuffle(freshRanks, source).slice(0, Math.min(amount, freshRanks.length));
    const remaining = amount - first.length;
    ranks = [...first, ...shuffle(config.ranks.filter((rank) => !first.includes(rank)), source).slice(0, remaining)];
  } else {
    ranks = shuffle(config.ranks, source).slice(0, amount);
  }
  if (ranks.length === 0) ranks = [pick(config.ranks, source)];
  let color: CardColor | null = null;
  if (config.colorTruth) {
    color = pick(["red", "black"] as const, source);
    if (noRepeat && config.ranks.length === 1 && previousColor === color) {
      color = color === "red" ? "black" : "red";
    }
  }
  return { ranks, color };
}

export function claimIsTrue(
  cards: DeckCard[],
  tableRanks: string[],
  tableColor: CardColor | null,
  jokerBan = false,
): boolean {
  return cards.every((card) => {
    if (card.joker) return !jokerBan;
    return tableRanks.includes(card.rank) && (tableColor === null || card.color === tableColor);
  });
}
