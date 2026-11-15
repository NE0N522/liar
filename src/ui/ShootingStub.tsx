import { motion } from "framer-motion";
import { ArrowRight, Crosshair } from "lucide-react";
import { useGameStore } from "../store/useGameStore";
import { useCopy } from "./useCopy";

export default function ShootingStub() {
  const t = useCopy();
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  if (!game) return null;
  const shooter = game.players.find((player) => player.id === game.shooterId);
  const shotsRemaining = game.shotSequence.length;

  return (
    <motion.main className="shooting-stub content-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="scene-darkness" />
      <div className="stub-content">
        <span className="scene-kicker"><Crosshair size={15} aria-hidden="true" />{t("shooter")}</span>
        <div className="stub-gun" aria-hidden="true">
          <svg viewBox="0 0 300 188">
            <defs>
              <linearGradient id="steel" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#b6a47f"/><stop offset=".42" stopColor="#514b3d"/><stop offset="1" stopColor="#191a17"/></linearGradient>
              <linearGradient id="wood" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#98623f"/><stop offset="1" stopColor="#33261d"/></linearGradient>
            </defs>
            <path d="M151 62h126v24H151z" fill="url(#steel)" stroke="#d2bc8b" strokeWidth="2"/>
            <path d="M198 59v30m-19-26v22m65-22v22" stroke="#272a25" strokeWidth="4"/>
            <path d="M74 67h105v66H74z" rx="12" fill="url(#steel)" stroke="#c6b181" strokeWidth="2"/>
            <path d="M85 72h86v55H85z" fill="#262821" stroke="#837555"/>
            <g fill="#10120f" stroke="#b7a06f" strokeWidth="2">
              <circle cx="107" cy="92" r="13"/><circle cx="148" cy="92" r="13"/><circle cx="127" cy="113" r="13"/>
            </g>
            <path d="M103 132h62l-10 17-30 14-21-9-15-3z" fill="url(#wood)" stroke="#c19463" strokeWidth="2"/>
            <path d="M178 61q8-28 29-17l7 15" fill="none" stroke="url(#steel)" strokeWidth="10" strokeLinecap="round"/>
            <path d="M176 127q12 13 6 28" fill="none" stroke="#a98e5b" strokeWidth="4" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="stub-player">
          <span className="stub-avatar" style={{ "--player": shooter?.color ?? "#ba8f52" } as React.CSSProperties}>{shooter?.avatar}</span>
          <span><small>{t("shooter")}</small><b>{shooter?.name}</b></span>
        </div>
        <h1>{t("loadingScene")}</h1>
        <p>{t("shooterTruth")}</p>
        <div className="shot-status">
          {Array.from({ length: Math.max(1, shotsRemaining) }, (_, index) => (
            <span key={index} className={index < Math.max(1, shotsRemaining) ? "shot-dot shot-dot-live" : "shot-dot"} />
          ))}
          <span>{localeShotCount(game.shotSequence.length, t)}</span>
        </div>
        <button className="scene-continue" type="button" onClick={() => dispatch({ type: "COMPLETE_SCENE" })}>
          {t("press")} <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </motion.main>
  );
}

function localeShotCount(count: number, t: ReturnType<typeof useCopy>) {
  return count + " " + t("pullCount");
}
