export function rankDisplay(rank: string, locale: "ru" | "en") {
  if (locale === "en") return rank;
  const russianFaces: Record<string, string> = { J: "В", Q: "Д", K: "К", A: "Т" };
  return russianFaces[rank] ?? rank;
}
