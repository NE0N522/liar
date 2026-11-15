import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { gsap } from "gsap";
import { ArrowRight, Volume2 } from "lucide-react";
import { cryptoRandom, randomInt } from "../engine/rng";
import { odds } from "../engine/revolver";
import { playSound, vibrate } from "../audio/sounds";
import { useGameStore } from "../store/useGameStore";
import { useCopy } from "../ui/useCopy";
import { RevolverDisplay } from "./RevolverDisplay";
const minimumHold = 280;
const delay = (milliseconds: number) => new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

export default function RevolverScene() {
  const t = useCopy();
  const game = useGameStore((state) => state.game);
  const preferences = useGameStore((state) => state.preferences);
  const dispatch = useGameStore((state) => state.dispatch);
  const locale = useGameStore((state) => state.locale);
  const worldRef = useRef<HTMLDivElement>(null);
  const gunRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const holdStart = useRef<number | null>(null);
  const firingRef = useRef(false);
  const suppressClick = useRef(false);
  const [spinning, setSpinning] = useState(false);
  const [cocking, setCocking] = useState(false);
  const [firing, setFiring] = useState(false);
  const [sceneDone, setSceneDone] = useState(false);
  const [outcomeMark, setOutcomeMark] = useState<"live" | "out" | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const context = gsap.context(() => {
      const timeline = gsap.timeline();
      timeline
        .fromTo(playerRef.current, { y: -22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "power3.out" })
        .fromTo(gunRef.current, { y: 160, opacity: 0, rotation: -6, scale: 0.92 }, { y: 0, opacity: 1, rotation: 0, scale: 1, duration: 0.9, ease: "power4.out" }, "-=.22")
        .fromTo(vignetteRef.current, { opacity: 0.96 }, { opacity: 0.56, duration: 0.8, ease: "sine.out" }, "-=.3");
      if (reducedMotion || preferences.reducedMotion) timeline.timeScale(3);
    }, worldRef);
    const entryDuration = reducedMotion || preferences.reducedMotion ? 500 : 1500;
    const spinRequired = game?.config.revolver.mode === "spin" || game?.chaos === "shuffle-cylinder";
    const spinTimeout = spinRequired && !reducedMotion && !preferences.reducedMotion ? window.setTimeout(() => {
      setSpinning(true);
      playSound("ratchet", preferences.volume, preferences.soundEnabled);
      vibrate(45, preferences.haptics);
      window.setTimeout(() => setSpinning(false), 1800);
    }, entryDuration) : undefined;
    const pulseInterval = window.setInterval(() => {
      if (!firingRef.current) {
        playSound("pulse", preferences.volume * 0.26, preferences.soundEnabled && !preferences.reducedMotion);
      }
    }, 2500);
    return () => {
      context.revert();
      if (spinTimeout) window.clearTimeout(spinTimeout);
      window.clearInterval(pulseInterval);
    };
  }, [game?.chaos, game?.config.revolver.mode, preferences.haptics, preferences.reducedMotion, preferences.soundEnabled, preferences.volume, reducedMotion]);

  const fireSequence = useCallback(async () => {
    if (!game || firingRef.current) return;
    firingRef.current = true;
    setFiring(true);
    const shooter = game.players.find((player) => player.id === game.shooterId);
    const cylinder = game.config.revolver.mode === "shared" ? game.sharedRevolver : shooter?.revolver;
    const lastChamber = Boolean(cylinder && cylinder.spent >= cylinder.chambers - 1);
    const sequence = game.shotSequence.length > 0
      ? game.shotSequence
      : [game.lastShotSurvived === true];

    setSpinning(true);
    for (let index = 0; index < sequence.length; index += 1) {
      const survived = sequence[index]!;
      const suspense = lastChamber && index === 0 ? 1900 : 600 + randomInt(1201, cryptoRandom);
      await delay(reducedMotion || preferences.reducedMotion ? 140 : suspense);
      if (survived) {
        playSound("dry", preferences.volume, preferences.soundEnabled);
        vibrate([45, 40, 70], preferences.haptics);
        setOutcomeMark("live");
        if (!reducedMotion && !preferences.reducedMotion) {
          if (worldRef.current) gsap.fromTo(worldRef.current, { x: -3 }, { x: 0, duration: 0.22, ease: "elastic.out(1, .35)" });
          await delay(420);
        }
      } else {
        playSound("shot", preferences.volume, preferences.soundEnabled);
        vibrate(260, preferences.haptics);
        setOutcomeMark("out");
        if (worldRef.current && !reducedMotion && !preferences.reducedMotion) {
          gsap.fromTo(worldRef.current, { x: -8, y: 5 }, { x: 0, y: 0, duration: 0.48, ease: "elastic.out(1, .28)" });
        }
        await delay(reducedMotion || preferences.reducedMotion ? 240 : 820);
        break;
      }
    }
    if (game.lastShotSurvived) {
      setOutcomeMark("live");
      playSound("win", preferences.volume * 0.45, preferences.soundEnabled);
    } else {
      setOutcomeMark("out");
    }
    setSpinning(false);
    await delay(reducedMotion || preferences.reducedMotion ? 100 : 500);
    setSceneDone(true);
  }, [game, preferences.haptics, preferences.reducedMotion, preferences.soundEnabled, preferences.volume, reducedMotion]);

  const startHold = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (firingRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    holdStart.current = Date.now();
    setCocking(true);
    playSound("cock", preferences.volume, preferences.soundEnabled);
    vibrate(35, preferences.haptics);
  };

  const releaseHold = () => {
    if (holdStart.current === null) return;
    const heldFor = Date.now() - holdStart.current;
    holdStart.current = null;
    setCocking(false);
    suppressClick.current = true;
    if (heldFor >= minimumHold) void fireSequence();
  };

  const keyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if ((event.key === " " || event.key === "Enter") && !event.repeat && !firingRef.current) {
      event.preventDefault();
      holdStart.current = Date.now();
      setCocking(true);
      playSound("cock", preferences.volume, preferences.soundEnabled);
      vibrate(35, preferences.haptics);
    }
  };
  const keyUp = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      releaseHold();
    }
  };

  if (!game) return null;
  const shooter = game.players.find((player) => player.id === game.shooterId);
  const cylinder = game.config.revolver.mode === "shared" ? game.sharedRevolver : shooter?.revolver;
  const displayedOdds = cylinder ? odds(cylinder) : { numerator: 0, denominator: 0 };
  const shakeClass = outcomeMark === "out" && !reducedMotion && !preferences.reducedMotion ? " scene-shot-impact" : "";

  return (
    <section
      ref={worldRef}
      role="main"
      className={"revolver-scene" + (preferences.reducedMotion ? " scene-light" : "") + (shakeClass ? shakeClass : "")}
      aria-label={locale === "ru" ? "Сцена револьвера" : "Revolver scene"}
    >
      <div ref={vignetteRef} className="scene-vignette" aria-hidden="true" />
      <div className="scene-lamp-cone" aria-hidden="true" />
      <div className="scene-dust" aria-hidden="true" />
      <div className="scene-topline">
        <span>{locale === "ru" ? "ПОСЛЕДНИЙ РАУНД" : "LAST CALL"} <i /></span>
        <span>{t("round")} {String(game.round).padStart(2, "0")}</span>
      </div>

      <div ref={playerRef} className="scene-player-card">
        <span className="scene-player-avatar" style={{ "--player": shooter?.color ?? "#ba8f52" } as React.CSSProperties}>{shooter?.avatar}</span>
        <span><small>{t("shooter")}</small><b>{shooter?.name}</b></span>
        {game.config.revolver.showOdds && displayedOdds.denominator > 0 && (
          <span className="scene-risk">{displayedOdds.numerator}/{displayedOdds.denominator}</span>
        )}
      </div>

      <div className="scene-gun">
        <div ref={gunRef} className="scene-gun-motion">
          <RevolverDisplay
            className="scene-revolver-display"
            spinning={spinning}
            cocking={cocking}
            outcome={outcomeMark}
            ambientMotion
          />
        </div>
        {outcomeMark === "out" && <div className={"muzzle-flash" + (reducedMotion || preferences.reducedMotion ? " flash-muted" : "")} aria-hidden="true" />}
      </div>

      <div className="scene-lower">
        <div className="scene-caption">
          <span className="scene-state-dot" />
          <span>{firing ? t("firing") : cocking ? (locale === "ru" ? "Курок взведён" : "Hammer pulled back") : spinning ? (locale === "ru" ? "Барабан вращается" : "Cylinder spinning") : t("shooterTruth")}</span>
        </div>
        {outcomeMark && (
          <div className={"scene-outcome-stamp " + (outcomeMark === "live" ? "stamp-live" : "stamp-out")} role="status">
            {outcomeMark === "live" ? t("survives") : t("eliminated")}
          </div>
        )}
        {!sceneDone ? (
          <div className="scene-controls">
            <button
              className={"cock-button" + (cocking ? " cock-button-active" : "")}
              type="button"
              disabled={firing}
              onPointerDown={startHold}
              onPointerUp={releaseHold}
              onPointerCancel={releaseHold}
              onKeyDown={keyDown}
              onKeyUp={keyUp}
              onClick={() => {
                if (suppressClick.current) {
                  suppressClick.current = false;
                  return;
                }
                void fireSequence();
              }}
              aria-label={t("cock") + ". " + t("holdHint")}
            >
              <span className="cock-inner"><i />{t("cock")}</span>
              <small>{t("holdHint")}</small>
            </button>
            <button className="press-button" type="button" disabled={firing} onClick={() => void fireSequence()}>
              <span>{t("press")}</span><ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button className="scene-finish-button" type="button" onClick={() => dispatch({ type: "COMPLETE_SCENE" })}>
            {locale === "ru" ? "Продолжить" : "Continue"} <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
        <div className="scene-footnote">
          <span><Volume2 size={12} aria-hidden="true" />{t("sound")}</span>
          <span>{game.shotSequence.length || 1} {t("pullCount")}</span>
        </div>
      </div>
      <span className="scene-sr-note sr-only" aria-live="polite">{outcomeMark === "live" ? t("survives") : outcomeMark === "out" ? t("eliminated") : ""}</span>
    </section>
  );
}
