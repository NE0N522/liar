import { ArrowUpRight, CircleDot, ShieldCheck, Sparkles } from "lucide-react";
import { useGameStore } from "../store/useGameStore";
import { PrimaryButton, CardBack } from "./components";
import { useCopy } from "./useCopy";

export default function HomeScreen({
  onNewGame,
  onQuickStart,
  onContinue,
  onRules,
}: {
  onNewGame: () => void;
  onQuickStart: () => void;
  onContinue: () => void;
  onRules: () => void;
}) {
  const t = useCopy();
  const locale = useGameStore((state) => state.locale);
  const game = useGameStore((state) => state.game);
  const heroLines = t("tagline").split("\n");

  return (
    <main className="home-screen content-shell">
      <section className="home-hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" />{t("tableReady")}</div>
          <h1>{heroLines[0]}<br /><em>{heroLines[1]}</em></h1>
          <p>{t("heroBody")}</p>
          <div className="hero-actions">
            <PrimaryButton onClick={onQuickStart}>{t("quickStart")}</PrimaryButton>
            <button className="text-button" type="button" onClick={onNewGame}>
              {t("newGame")} <ArrowUpRight size={15} aria-hidden="true" />
            </button>
            {game && game.phase !== "finished" && (
              <button className="text-button" type="button" onClick={onContinue}>
                {t("continue")} <ArrowUpRight size={15} aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="hero-proof">
            <span><ShieldCheck size={16} aria-hidden="true" />{t("offline")}</span>
            <span><CircleDot size={14} aria-hidden="true" />{t("physicalNote")}</span>
          </div>
        </div>
        <div className="hero-art" aria-label="Стилизованные карты на зелёном столе">
          <div className="lamp-glow" />
          <div className="art-stamp">{locale === "ru" ? "СТОЛ ОТКРЫТ" : "TABLE OPEN"}</div>
          <div className="art-chips" aria-hidden="true">
            <span /><span /><span /><span /><span />
          </div>
          <div className="art-card art-card-back"><CardBack /></div>
          <div className="art-card art-card-red"><span>6</span><small>♥</small></div>
          <div className="art-card art-card-black"><span>Q</span><small>♠</small></div>
          <div className="art-ornament" aria-hidden="true">LAST<br /><small>CALL</small></div>
          <div className="art-caption">
            <Sparkles size={14} aria-hidden="true" />
            <span>{locale === "ru" ? "Ставки выше с каждым ходом" : "The stakes rise with every turn"}</span>
          </div>
        </div>
      </section>

      <section className="home-bottom" aria-label={locale === "ru" ? "Особенности игры" : "Game features"}>
        <div className="bottom-note">
          <span className="note-number">01</span>
          <div>
            <h2>{locale === "ru" ? "Один стол." : "One table."}</h2>
            <p>{locale === "ru" ? "Один экран передаётся по кругу." : "One screen travels around the table."}</p>
          </div>
        </div>
        <div className="bottom-note">
          <span className="note-number">02</span>
          <div>
            <h2>{locale === "ru" ? "Карты настоящие." : "Real cards."}</h2>
            <p>{locale === "ru" ? "Вы сами раздаёте и вскрываете их." : "You deal and reveal them yourselves."}</p>
          </div>
        </div>
        <button className="bottom-note rules-teaser" type="button" onClick={onRules}>
          <span className="note-number">03</span>
          <div>
            <h2>{t("rules")}</h2>
            <p>{locale === "ru" ? "Коротко о том, как играет стол." : "A short guide to the table."}</p>
          </div>
          <ArrowUpRight size={18} aria-hidden="true" />
        </button>
      </section>
    </main>
  );
}
