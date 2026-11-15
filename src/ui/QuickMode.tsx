import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, CircleDot, Crosshair, RotateCcw } from "lucide-react";
import { odds } from "../engine/revolver";
import { PHYSICAL_RANKS } from "../engine/deck";
import { rankDisplay } from "../i18n/ranks";
import { useGameStore } from "../store/useGameStore";
import { PrimaryButton, TargetCard } from "./components";
import { useCopy } from "./useCopy";

const quickRanges = {
  all: PHYSICAL_RANKS,
  six: PHYSICAL_RANKS.slice(4),
  nine: PHYSICAL_RANKS.slice(7),
} as const;

function rangeKey(ranks: string[]) {
  if (ranks[0] === "9") return "nine";
  if (ranks[0] === "6") return "six";
  return "all";
}

export function QuickSetupScreen() {
  const t = useCopy();
  const locale = useGameStore((state) => state.locale);
  const settings = useGameStore((state) => state.quickSettings);
  const updateSettings = useGameStore((state) => state.updateQuickSettings);
  const startQuickGame = useGameStore((state) => state.startQuickGame);
  const setPage = useGameStore((state) => state.setPage);

  return (
    <motion.main
      className="setup-screen quick-setup-screen content-shell"
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-heading">
        <button className="back-button" type="button" onClick={() => setPage("home")}>
          <ArrowDown size={15} aria-hidden="true" /> {t("back")}
        </button>
        <div>
          <div className="eyebrow"><span className="eyebrow-line" />{t("quickMode")}</div>
          <h1>{t("quickSetupTitle")}</h1>
          <p>{t("quickSetupIntro")}</p>
        </div>
      </div>

      <div className="quick-setup-grid">
        <section className="setup-card quick-setup-card">
          <div className="section-topline"><span className="section-index">01</span><h2>{t("quickTargetOptions")}</h2></div>
          <label className="field-label" htmlFor="quick-rank-range">{t("quickRankRange")}</label>
          <select
            id="quick-rank-range"
            value={rangeKey(settings.ranks)}
            onChange={(event) => updateSettings({ ranks: [...quickRanges[event.target.value as keyof typeof quickRanges]] })}
          >
            <option value="all">{t("quickRangeAll")}</option>
            <option value="six">{t("quickRangeSix")}</option>
            <option value="nine">{t("quickRangeNine")}</option>
          </select>
          <label className="toggle-row quick-color-toggle">
            <span><b>{t("colorTruth")}</b><small>{t("quickColorHelp")}</small></span>
            <input type="checkbox" checked={settings.colorTruth} onChange={(event) => updateSettings({ colorTruth: event.target.checked })} />
          </label>
          <div className="quick-settings-note">
            <TargetCard rank="6" color={settings.colorTruth ? "red" : null} compact />
            <span>{settings.colorTruth ? t("quickColorExample") : t("quickRankOnly")}</span>
          </div>
        </section>

        <section className="setup-card quick-setup-card">
          <div className="section-topline"><span className="section-index">02</span><h2>{t("revolver")}</h2></div>
          <label className="field-label" htmlFor="quick-chambers">{t("chambers")}</label>
          <select
            id="quick-chambers"
            value={settings.chambers}
            onChange={(event) => {
              const chambers = Number(event.target.value);
              updateSettings({ chambers, bullets: Math.min(settings.bullets, chambers - 1) });
            }}
          >
            {[6, 8, 10].map((chambers) => <option value={chambers} key={chambers}>{chambers}</option>)}
          </select>
          <div className="quick-bullet-setting">
            <div><b>{t("bullets")}</b><small>{locale === "ru" ? "1–" + (settings.chambers - 1) : "1–" + (settings.chambers - 1)}</small></div>
            <div className="quick-stepper" role="group" aria-label={t("bullets")}>
              <button type="button" aria-label={locale === "ru" ? "Уменьшить пули" : "Fewer bullets"} disabled={settings.bullets <= 1} onClick={() => updateSettings({ bullets: settings.bullets - 1 })}>−</button>
              <output aria-live="polite">{settings.bullets}</output>
              <button type="button" aria-label={locale === "ru" ? "Добавить пулю" : "More bullets"} disabled={settings.bullets >= settings.chambers - 1} onClick={() => updateSettings({ bullets: settings.bullets + 1 })}>+</button>
            </div>
          </div>
          <label className="toggle-row quick-odds-toggle">
            <span><b>{t("showOdds")}</b><small>{t("quickOddsHelp")}</small></span>
            <input type="checkbox" checked={settings.showOdds} onChange={(event) => updateSettings({ showOdds: event.target.checked })} />
          </label>
        </section>
      </div>

      <div className="quick-setup-actions">
        <PrimaryButton onClick={startQuickGame}><CircleDot size={16} aria-hidden="true" />{t("quickBegin")}</PrimaryButton>
        <span>{t("quickNoPlayers")}</span>
      </div>
    </motion.main>
  );
}

export function QuickGameScreen() {
  const t = useCopy();
  const locale = useGameStore((state) => state.locale);
  const quick = useGameStore((state) => state.quickGame);
  const settings = useGameStore((state) => state.quickSettings);
  const pull = useGameStore((state) => state.pullQuickTrigger);
  const newRound = useGameStore((state) => state.newQuickRound);
  const setPage = useGameStore((state) => state.setPage);
  if (!quick) return null;

  const chance = odds(quick.cylinder);
  const rankName = rankDisplay(quick.tableRank, locale);
  const statusCopy = quick.outcome === "fired"
    ? t("quickFired")
    : quick.outcome === "survived"
      ? t("quickSurvived")
      : t("quickWaiting");

  return (
    <motion.main
      className="quick-game-screen content-shell"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-heading quick-game-heading">
        <button className="back-button" type="button" onClick={() => setPage("home")}>
          <ArrowDown size={15} aria-hidden="true" /> {t("menu")}
        </button>
        <div>
          <div className="eyebrow"><span className="eyebrow-line" />{t("quickGameLabel")}</div>
          <h1>{t("quickGameTitle")}</h1>
          <p>{t("quickGameIntro")}</p>
        </div>
      </div>

      <div className="quick-game-grid">
        <section className="quick-card-stage" aria-label={t("quickTarget")}>
          <div className="quick-card-halo" aria-hidden="true" />
          <span className="quick-card-label">{t("quickTarget")}</span>
          <TargetCard rank={quick.tableRank} color={quick.tableColor} />
          <strong className="quick-target-name">{rankName}{quick.tableColor ? " · " + t(quick.tableColor) : ""}</strong>
          <span className="quick-target-mode">{quick.tableColor ? t("colorMode") : t("quickRankOnly")}</span>
        </section>

        <section className="setup-card quick-revolver-card" aria-label={t("revolver")}>
          <div className="section-topline"><span className="section-index">01</span><h2>{t("quickRevolverTitle")}</h2></div>
          <div className="quick-cylinder-label">
            <span>{t("bullets")}</span><b>{quick.cylinder.bulletsRemaining} / {settings.bullets}</b>
          </div>
          <div className="quick-cylinder" aria-label={t("spent") + ": " + quick.cylinder.spent + " / " + quick.cylinder.chambers}>
            {Array.from({ length: quick.cylinder.chambers }, (_, index) => (
              <span className={index < quick.cylinder.spent ? "chamber-dot spent" : "chamber-dot"} key={index} />
            ))}
          </div>
          <div className={"quick-outcome" + (quick.outcome === "fired" ? " quick-outcome-fired" : quick.outcome === "survived" ? " quick-outcome-survived" : "")} role="status" aria-live="polite">
            <span className="quick-outcome-mark" aria-hidden="true">{quick.outcome === "fired" ? "!" : quick.outcome === "survived" ? "✓" : "·"}</span>
            <p>{statusCopy}</p>
          </div>
          {settings.showOdds && quick.outcome !== "fired" && (
            <div className="quick-chance"><span>{t("quickChance")}</span><b>{chance.denominator ? chance.numerator + " / " + chance.denominator : "—"}</b></div>
          )}
          <button className="quick-trigger" type="button" onClick={pull} disabled={quick.outcome === "fired" || quick.cylinder.spent >= quick.cylinder.chambers}>
            <Crosshair size={21} aria-hidden="true" />
            <span><b>{quick.outcome === "fired" ? t("quickFiredButton") : t("quickPull")}</b><small>{quick.pulls} · {t("quickShotsMade")}</small></span>
            <ArrowRight size={17} aria-hidden="true" />
          </button>
          <button className="quick-new-round" type="button" onClick={newRound}>
            <RotateCcw size={15} aria-hidden="true" /> {t("quickNewRound")}
          </button>
        </section>
      </div>
    </motion.main>
  );
}
