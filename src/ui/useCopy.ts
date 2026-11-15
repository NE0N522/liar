import { translate } from "../i18n/translations";
import { useGameStore } from "../store/useGameStore";

export function useCopy() {
  const locale = useGameStore((state) => state.locale);
  return (key: Parameters<typeof translate>[1]) => translate(locale, key);
}
