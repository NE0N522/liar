import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Undo2 } from "lucide-react";
import { useGameStore } from "../store/useGameStore";
import { TargetCard } from "./components";
import { useCopy } from "./useCopy";
import { odds } from "../engine/revolver";

export default function TableScreen() {
  const t = useCopy();
  const game = useGameStore((state) => state.game);
  const locale = useGameStore((state) => state.locale);
  const dispatch = useGameStore((state) => state.dispatch);
  const [secondsLeft, setSecondsLeft] = useState<number>(game?.config.timerSeconds ?? 0);
  const timerFired = useRef(false);
  const timerSeconds = game?.config.timerSeconds ?? 0;
  const turnKey = game ? [game.round, game.turnsThisRound, game.activeIndex].join("-") : "none";
  const activeAlive = game?.players[game.activeIndex]?.alive ?? false;

  useEffect(() => {
    setSecondsLeft(timerSeconds);
    timerFired.current = false;
  }, [timerSeconds, turnKey]);

  useEffect(() => {
    if (!timerSeconds || game?.phase !== "playing" || !activeAlive) return;
    const endAt = Date.now() + timerSeconds * 1000;
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0 && !timerFired.current) {
        timerFired.current = true;
        window.clearInterval(interval);
        dispatch({ type: "TIMER_EXPIRED" });
      }
    }, 120);
    return () => window.clearInterval(interval);
  }, [activeAlive, dispatch, game?.phase, timerSeconds, turnKey]);

  if (!game) return null;

  const active = game.players[game.activeIndex];
  const canChallenge = Boolean(game.lastPlay && game.turnsThisRound > 1);
  const forcedChallenge = Boolean(canChallenge && active?.handCount === 0);
  const tableCount = game.players.length;
  const actionsEnabled = game.phase === "playing";
  const turnRemaining = game.config.timerSeconds > 0 ? secondsLeft : 0;

  const seatPosition = (index: number) => {
    const angle = (index / tableCount) * 2 * Math.PI - Math.PI / 2;
    return {
      "--seat-x": 50 + Math.cos(angle) * (tableCount <= 4 ? 41 : 43) + "%",
      "--seat-y": 50 + Math.sin(angle) * (tableCount <= 4 ? 39 : 42) + "%",
    } as React.CSSProperties;
  };

  return (
    <motion.main
      className="game-screen content-shell"
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32 }}
    >
      <div className="game-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" />{t("round")} {String(game.round).padStart(2, "0")}</div>
          <h1>{t("rankTarget")}</h1>
        </div>
        <div className="round-counter">
          <span>{t("round")}</span>
          <b>{String(game.round).padStart(2, "0")}</b>
        </div>
      </div>

      {game.chaos && (
        <div className="chaos-banner" role="status">
          <span className="chaos-light" />
          <b>{t("chaosTitle")}</b>
          <span>{chaosLabel(game.chaos, t)}</span>
        </div>
      )}

      <section className="felt-table" aria-label={localeTableLabel(game, t)}>
        <div className="table-rim" />
        <div className="table-felt" />
        {game.players.map((player, index) => {
          const isActive = game.activeIndex === index && player.alive;
          return (
            <div
              key={player.id}
              className={"table-seat" + (isActive ? " seat-active" : "") + (player.alive ? "" : " seat-out")}
              style={{ ...seatPosition(index), "--player": player.color } as React.CSSProperties}
              aria-current={isActive ? "step" : undefined}
            >
              <div className="seat-avatar-wrap">
                {isActive && game.config.timerSeconds > 0 && (
                  <svg className="turn-ring" viewBox="0 0 56 56" aria-hidden="true">
                    <circle className="ring-track" cx="28" cy="28" r="25" />
                    <circle
                      className="ring-progress"
                      cx="28"
                      cy="28"
                      r="25"
                      style={{
                        strokeDashoffset: 157 * (1 - turnRemaining / game.config.timerSeconds),
                      }}
                    />
                  </svg>
                )}
                <span className="seat-avatar">{player.avatar}</span>
                {!player.alive && <span className="seat-out-stamp">{t("out")}</span>}
              </div>
              <div className="seat-name">{player.name}</div>
              <div className="seat-info">
                <span className="hand-count">
                  {game.config.showHandCounts ? <>{player.handCount} <small>{t("cardsLeft")}</small></> : <span className="hand-count-hidden">•••</span>}
                </span>
                <span className="seat-status">{isActive ? t("activeTurn") : player.alive ? t("waiting") : t("out")}</span>
              </div>
              <div className="chamber-indicator" aria-label={t("spent") + ": " + (game.config.revolver.mode === "shared" ? game.sharedRevolver.spent : player.revolver.spent)}>
                {Array.from({ length: game.config.revolver.chambers }, (_, dot) => {
                  const spent = game.config.revolver.mode === "shared"
                    ? dot < game.sharedRevolver.spent
                    : dot < player.revolver.spent;
                  return <span className={spent ? "chamber-dot spent" : "chamber-dot"} key={dot} />;
                })}
              </div>
              {game.config.revolver.showOdds && player.alive && (() => {
                const cylinder = game.config.revolver.mode === "shared" ? game.sharedRevolver : player.revolver;
                const risk = game.config.revolver.mode === "spin"
                  ? game.config.revolver.bullets + "/" + game.config.revolver.chambers
                  : odds(cylinder).denominator > 0
                    ? odds(cylinder).numerator + "/" + odds(cylinder).denominator
                    : "—";
                return <span className="seat-odds">{risk} {t("chances")}</span>;
              })()}
            </div>
          );
        })}

        <div className="table-center">
          <div className="center-label">{localeLabel(t, "rankTarget")}</div>
          <div className="target-cards">
            {game.tableRanks.map((rank) => (
              <TargetCard key={rank} rank={rank} color={game.tableColor} />
            ))}
          </div>
          {game.tableColor && <div className={"color-call color-call-" + game.tableColor}>{t(game.tableColor)}</div>}
          <div className="center-divider"><span /><b>{localeLabel(t, "round")} {game.round}</b><span /></div>
          <div className="table-turn-copy">
            {forcedChallenge ? t("forcedChallenge") : active ? t("activeTurn") + ": " + active.name : t("waiting")}
          </div>
        </div>
      </section>

      <section className="action-panel" aria-label={t("activeTurn")}>
        <div className="action-heading">
          <div>
            <span className="action-overline">{forcedChallenge ? t("forcedChallenge") : active ? active.name : ""}</span>
            <h2>{forcedChallenge ? t("liar") : localeTableAction(t)}</h2>
          </div>
          {game.lastPlay && (
            <div className="last-play-note">
              <span className="last-play-dot" />
              <span>{game.players.find((player) => player.id === game.lastPlay?.playerId)?.name} · {game.lastPlay.quantity}</span>
            </div>
          )}
        </div>
        <div className="action-buttons">
          {!forcedChallenge && [1, 2, 3].map((quantity) => (
            <button
              type="button"
              className="play-button"
              key={quantity}
              disabled={!actionsEnabled || !active?.alive || (active?.handCount ?? 0) < quantity}
              onClick={() => dispatch({ type: "PLAY", quantity })}
            >
              <span className="play-number">0{quantity}</span>
              <span>{t(quantity === 1 ? "oneCard" : quantity === 2 ? "twoCards" : "threeCards")}</span>
            </button>
          ))}
          {canChallenge && (
            <button
              type="button"
              className={"liar-button" + (forcedChallenge ? " liar-button-forced" : "")}
              disabled={!actionsEnabled}
              onClick={() => dispatch({ type: "CHALLENGE" })}
              aria-label={t("liar")}
            >
              <span className="liar-signal" />
              <span>{t("liar")}</span>
              <small>{forcedChallenge ? t("forcedChallenge") : locale === "ru" ? "Вызвать прошлый ход" : "Challenge last play"}</small>
            </button>
          )}
        </div>
        <div className="action-footer">
          <span>{forcedChallenge ? t("forcedChallenge") : locale === "ru" ? "Ход закрыт рубашкой вверх" : "Play face down"}</span>
          {game.lastPlay && game.phase === "playing" && (
            <button className="undo-button" type="button" onClick={() => dispatch({ type: "UNDO" })}>
              <Undo2 size={15} aria-hidden="true" />{t("undo")}
            </button>
          )}
        </div>
      </section>
      <details className="game-log">
        <summary>{t("gameHistory")} <span>{game.log.length}</span></summary>
        <ol>
          {game.log.slice(0, 6).map((entry, index) => <li key={index}>{entry}</li>)}
        </ol>
      </details>
    </motion.main>
  );
}

function localeTableLabel(game: NonNullable<ReturnType<typeof useGameStore.getState>["game"]>, t: ReturnType<typeof useCopy>) {
  return t("round") + " " + game.round + ", " + t("players") + ": " + game.players.length;
}

function localeLabel(t: ReturnType<typeof useCopy>, key: Parameters<ReturnType<typeof useCopy>>[0]) {
  return t(key).toUpperCase();
}

function localeTableAction(t: ReturnType<typeof useCopy>) {
  return t("turnPrompt");
}

function chaosLabel(chaos: NonNullable<ReturnType<typeof useGameStore.getState>["game"]>["chaos"], t: ReturnType<typeof useCopy>) {
  if (chaos === "double-trigger") return t("chaosDouble");
  if (chaos === "shuffle-cylinder") return t("chaosShuffle");
  if (chaos === "reverse") return t("chaosReverse");
  if (chaos === "double-truth") return t("chaosTruth");
  return t("chaosJokers");
}
