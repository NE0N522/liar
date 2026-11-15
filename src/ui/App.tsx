import { lazy, Suspense, useEffect } from "react";
import { playSound } from "../audio/sounds";
import { useGameStore } from "../store/useGameStore";
import { AppHeader } from "./components";
import { useCopy } from "./useCopy";
import HomeScreen from "./HomeScreen";
const SetupScreen = lazy(() => import("./SetupScreen"));
const TableScreen = lazy(() => import("./TableScreen"));
const RevealScreen = lazy(() => import("./RevealScreen"));
const RoundResult = lazy(() => import("./ResultScreens").then((module) => ({ default: module.RoundResult })));
const WinnerScreen = lazy(() => import("./ResultScreens").then((module) => ({ default: module.WinnerScreen })));
const SettingsOverlay = lazy(() => import("./Overlays").then((module) => ({ default: module.SettingsOverlay })));
const RulesOverlay = lazy(() => import("./Overlays").then((module) => ({ default: module.RulesOverlay })));
const RevolverScene = lazy(() => import("../scene/RevolverScene"));

export default function App() {
  const t = useCopy();
  const page = useGameStore((state) => state.page);
  const overlay = useGameStore((state) => state.overlay);
  const locale = useGameStore((state) => state.locale);
  const game = useGameStore((state) => state.game);
  const preferences = useGameStore((state) => state.preferences);
  const setPage = useGameStore((state) => state.setPage);
  const setOverlay = useGameStore((state) => state.setOverlay);

  useEffect(() => {
    if (page !== "game" || !("wakeLock" in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let disposed = false;
    const requestWakeLock = async () => {
      try {
        const requested = await navigator.wakeLock.request("screen");
        if (disposed) void requested.release();
        else {
          sentinel = requested;
          requested.addEventListener("release", () => {
            if (sentinel === requested) sentinel = null;
          }, { once: true });
        }
      } catch {
        sentinel = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible" && (!sentinel || sentinel.released)) void requestWakeLock();
    };
    void requestWakeLock();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      if (sentinel) void sentinel.release();
    };
  }, [page]);

  const startNew = () => setPage("setup");
  const continueGame = () => setPage("game");
  const activeScreen = () => {
    if (page === "setup") return <SetupScreen key="setup" onBack={() => setPage("home")} />;
    if (page !== "game" || !game) {
      return (
        <HomeScreen
          key="home"
          onNewGame={startNew}
          onContinue={continueGame}
          onRules={() => setOverlay("rules")}
        />
      );
    }
    if (game.phase === "reveal") return <RevealScreen key="reveal" />;
    if (game.phase === "shooting") return <RevolverScene key="shooting" />;
    if (game.phase === "round-over") return <RoundResult key="round-result" />;
    if (game.phase === "finished") return <WinnerScreen key="winner" />;
    return <TableScreen key="table" />;
  };

  return (
    <div
      className={"app-shell" + (game?.phase === "shooting" ? " is-scene" : "")}
      data-reduced-motion={preferences.reducedMotion ? "true" : undefined}
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest("button")) {
          playSound("ui", preferences.volume * 0.35, preferences.soundEnabled);
        }
      }}
    >
      <div className="ambient-glow ambient-left" aria-hidden="true" />
      <div className="ambient-glow ambient-right" aria-hidden="true" />
      <div className="film-grain" aria-hidden="true" />
      <a className="skip-link" href="#app-content">{locale === "ru" ? "К основному содержимому" : "Skip to main content"}</a>
      <AppHeader />
      <div id="app-content" tabIndex={-1}>
        <Suspense fallback={<div className="screen-loading" role="status">{locale === "ru" ? "Подготовка стола…" : "Preparing the table…"}</div>}>
          {activeScreen()}
        </Suspense>
      </div>
      <footer className="app-footer">
        <span>NOIR TABLE · {new Date().getFullYear()}</span>
        <span>{t("offline")} <i className="online-light" /></span>
      </footer>
      {overlay === "settings" && <Suspense fallback={null}><SettingsOverlay /></Suspense>}
      {overlay === "rules" && <Suspense fallback={null}><RulesOverlay /></Suspense>}
    </div>
  );
}
