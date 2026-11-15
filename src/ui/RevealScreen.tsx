import { motion } from "framer-motion";
import { Eye, ShieldAlert } from "lucide-react";
import { useGameStore } from "../store/useGameStore";
import { PrimaryButton } from "./components";
import { useCopy } from "./useCopy";

export default function RevealScreen() {
  const t = useCopy();
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const locale = useGameStore((state) => state.locale);
  if (!game?.lastPlay) return null;
  const player = game.players.find((item) => item.id === game.lastPlay?.playerId);
  const caller = game.players.find((item) => item.id === game.challengerId);

  return (
    <motion.main
      className="reveal-screen content-shell"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="reveal-backdrop" aria-hidden="true" />
      <div className="reveal-content">
        <div className="reveal-icon"><Eye size={24} aria-hidden="true" /></div>
        <div className="eyebrow"><span className="eyebrow-line" />{t("liar")}</div>
        <h1>{t("revealTitle")}</h1>
        <p className="reveal-copy">{t("revealCopy")}</p>
        <div className="reveal-players">
          <div className="reveal-person">
            <span className="reveal-avatar" style={{ "--player": player?.color ?? "#ba8f52" } as React.CSSProperties}>{player?.avatar}</span>
            <span><small>{locale === "ru" ? "Последний ход" : "Last play"}</small><b>{player?.name}</b></span>
            <span className="reveal-count">{game.lastPlay.quantity}×</span>
          </div>
          <span className="reveal-vs">VS</span>
          <div className="reveal-person reveal-person-caller">
            <span className="reveal-avatar" style={{ "--player": caller?.color ?? "#a95e46" } as React.CSSProperties}>{caller?.avatar}</span>
            <span><small>{locale === "ru" ? "Вызвал" : "Called"}</small><b>{caller?.name}</b></span>
            <ShieldAlert size={19} aria-hidden="true" />
          </div>
        </div>
        <div className="reveal-target">
          <span>{locale === "ru" ? "ПРОВЕРЬТЕ ХОД" : "CHECK THE PLAY"}</span>
          <b>{game.tableRanks.join(" / ")}{game.tableColor ? " · " + t(game.tableColor).toUpperCase() : ""}</b>
        </div>
        {game.chaos === "joker-ban" && (
          <p className="reveal-rule-note">{locale === "ru" ? "В этом раунде джокеры не подходят." : "Jokers do not count this round."}</p>
        )}
        <div className="reveal-actions">
          <PrimaryButton className="truth-button" onClick={() => dispatch({ type: "RESOLVE_CHALLENGE", truthful: true })}>
            {t("toldTruth")}
          </PrimaryButton>
          <button className="lie-choice-button" type="button" onClick={() => dispatch({ type: "RESOLVE_CHALLENGE", truthful: false })}>
            {t("wasLying")}
          </button>
        </div>
        <span className="reveal-hint">{locale === "ru" ? "Выбор определяет, кто пойдёт к револьверу" : "Your choice decides who goes to the revolver"}</span>
      </div>
    </motion.main>
  );
}

