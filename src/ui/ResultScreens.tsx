import { motion } from "framer-motion";
import { ArrowRight, Crown, RotateCcw, Trophy } from "lucide-react";
import type { PlayerSetup } from "../engine/types";
import { useGameStore } from "../store/useGameStore";
import { PrimaryButton } from "./components";
import { useCopy } from "./useCopy";

export function RoundResult() {
  const t = useCopy();
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const locale = useGameStore((state) => state.locale);
  if (!game) return null;
  const shooter = game.players.find((player) => player.id === game.shooterId);
  const survived = game.lastShotSurvived === true;

  return (
    <motion.main className="result-screen content-shell" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className={"result-aura" + (survived ? " aura-green" : " aura-red")} aria-hidden="true" />
      <div className={"result-stamp" + (survived ? " stamp-live" : " stamp-out")}>
        {survived ? t("survives") : t("eliminated")}
      </div>
      <div className="eyebrow"><span className="eyebrow-line" />{t("round")} {game.round}</div>
      <h1>{survived ? locale === "ru" ? "Пока жив." : "Still alive." : locale === "ru" ? "Стол стал тише." : "The table grew quieter."}</h1>
      <div className="result-player">
        <span className="result-avatar" style={{ "--player": shooter?.color ?? "#ba8f52" } as React.CSSProperties}>{shooter?.avatar}</span>
        <div><small>{t("shooter")}</small><b>{shooter?.name}</b></div>
        <span className={"result-status " + (survived ? "result-status-live" : "result-status-out")}>{survived ? t("survives") : t("eliminated")}</span>
      </div>
      <div className="result-pulls">
        <span>{t("spent")}</span>
        <b>{game.stats.highestPull} <small>{t("pullCount")}</small></b>
      </div>
      <PrimaryButton onClick={() => dispatch({ type: "NEXT_ROUND" })}>{t("nextRound")}</PrimaryButton>
    </motion.main>
  );
}

export function WinnerScreen() {
  const t = useCopy();
  const locale = useGameStore((state) => state.locale);
  const game = useGameStore((state) => state.game);
  const startGame = useGameStore((state) => state.startGame);
  const resetGame = useGameStore((state) => state.resetGame);
  if (!game) return null;
  const winner = game.players.find((player) => player.alive);
  const rematchPlayers: PlayerSetup[] = game.players.map(({ id, name, color, avatar }) => ({ id, name, color, avatar }));
  const rematch = () => startGame(rematchPlayers, game.config);
  return (
    <motion.main className="winner-screen content-shell" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
      <div className="winner-light" aria-hidden="true" />
      <div className="winner-crown"><Crown size={36} strokeWidth={1.3} aria-hidden="true" /></div>
      <div className="eyebrow"><span className="eyebrow-line" />{locale === "ru" ? "ПАРТИЯ ЗАВЕРШЕНА" : "GAME OVER"}</div>
      <h1>{t("winner")}</h1>
      <div className="winner-nameplate">
        <span className="winner-avatar" style={{ "--player": winner?.color ?? "#ba8f52" } as React.CSSProperties}>{winner?.avatar}</span>
        <strong>{winner?.name}</strong>
        <span className="winner-crown-small"><Crown size={15} aria-hidden="true" /></span>
      </div>
      <div className="winner-stats">
        <div><small>{t("rounds")}</small><b>{game.stats.rounds}</b></div>
        <div><small>{t("challenges")}</small><b>{game.stats.challenges}</b></div>
        <div><small>{t("shotsMade")}</small><b>{game.stats.shots}</b></div>
        <div><small>{t("riskyPull")}</small><b>{game.stats.highestPull}</b></div>
      </div>
      <div className="winner-player-stats">
        <div className="winner-player-stats-head">
          <span>{t("players")}</span><span>{t("survivals")}</span><span>{t("caughtLiars")}</span><span>{t("falseChallenges")}</span>
        </div>
        {game.players.map((player) => (
          <div className="winner-player-stats-row" key={player.id}>
            <span><i style={{ "--player": player.color } as React.CSSProperties} />{player.name}</span>
            <b>{player.survivalCount}</b>
            <b>{player.caughtLiars}</b>
            <b>{player.falseChallenges}</b>
          </div>
        ))}
      </div>
      <div className="winner-actions">
        <PrimaryButton onClick={rematch}><RotateCcw size={15} aria-hidden="true" />{t("rematch")}</PrimaryButton>
        <button className="text-button" type="button" onClick={resetGame}>{t("menu")} <ArrowRight size={15} aria-hidden="true" /></button>
      </div>
      <span className="winner-quote"><Trophy size={14} aria-hidden="true" />{t("winningStats")}</span>
    </motion.main>
  );
}
