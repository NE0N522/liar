import { AnimatePresence } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { AppHeader } from "./components";
import { useCopy } from "./useCopy";
import HomeScreen from "./HomeScreen";
import SetupScreen from "./SetupScreen";
import TableScreen from "./TableScreen";
import RevealScreen from "./RevealScreen";
import ShootingStub from "./ShootingStub";
import { RoundResult, WinnerScreen } from "./ResultScreens";
import { RulesOverlay, SettingsOverlay } from "./Overlays";

export default function App() {
  const t = useCopy();
  const page = useGameStore((state) => state.page);
  const overlay = useGameStore((state) => state.overlay);
  const game = useGameStore((state) => state.game);
  const preferences = useGameStore((state) => state.preferences);
  const setPage = useGameStore((state) => state.setPage);
  const setOverlay = useGameStore((state) => state.setOverlay);

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
    if (game.phase === "shooting") return <ShootingStub key="shooting" />;
    if (game.phase === "round-over") return <RoundResult key="round-result" />;
    if (game.phase === "finished") return <WinnerScreen key="winner" />;
    return <TableScreen key="table" />;
  };

  return (
    <div className="app-shell" data-reduced-motion={preferences.reducedMotion ? "true" : undefined}>
      <div className="ambient-glow ambient-left" aria-hidden="true" />
      <div className="ambient-glow ambient-right" aria-hidden="true" />
      <div className="film-grain" aria-hidden="true" />
      <AppHeader />
      <AnimatePresence mode="wait">{activeScreen()}</AnimatePresence>
      <footer className="app-footer">
        <span>NOIR TABLE · {new Date().getFullYear()}</span>
        <span>{t("offline")} <i className="online-light" /></span>
      </footer>
      {overlay === "settings" && <SettingsOverlay />}
      {overlay === "rules" && <RulesOverlay />}
    </div>
  );
}
