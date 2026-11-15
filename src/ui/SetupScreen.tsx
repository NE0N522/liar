import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";
import { balancePercent, deckTotal, DEFAULT_PHYSICAL_RANKS, PHYSICAL_RANKS } from "../engine/deck";
import { DEFAULT_GAME_CONFIG, DEFAULT_PLAYERS, type DeckConfig, type GameConfig, type PlayerSetup } from "../engine/types";
import { useGameStore } from "../store/useGameStore";
import { PrimaryButton } from "./components";
import { useCopy } from "./useCopy";

const colors = ["#bb8d4e", "#a75f4a", "#5b8064", "#6e7397", "#9a7b42", "#507e86", "#9c6373", "#77786a"];
const avatars = ["A", "M", "N", "L", "D", "И", "С", "К"];

function presetDeck(preset: DeckConfig["preset"]): DeckConfig {
  if (preset === "physical") {
    return {
      preset,
      ranks: [...DEFAULT_PHYSICAL_RANKS],
      copiesPerRank: 4,
      jokers: 2,
      namedRanksPerRound: 2,
      colorTruth: false,
    };
  }
  if (preset === "custom") {
    return { ...DEFAULT_GAME_CONFIG.deck, preset };
  }
  return {
    preset: "classic",
    ranks: ["K", "Q", "A"],
    copiesPerRank: 6,
    jokers: 2,
    namedRanksPerRound: 1,
    colorTruth: false,
  };
}

export default function SetupScreen({ onBack }: { onBack: () => void }) {
  const t = useCopy();
  const locale = useGameStore((state) => state.locale);
  const startGame = useGameStore((state) => state.startGame);
  const [players, setPlayers] = useState<PlayerSetup[]>(DEFAULT_PLAYERS);
  const [config, setConfig] = useState<GameConfig>(DEFAULT_GAME_CONFIG);
  const [rankText, setRankText] = useState(config.deck.ranks.join(", "));
  const percent = useMemo(() => balancePercent(config.deck), [config.deck]);
  const cardsNeeded = players.length * config.handSize;
  const cardsAvailable = deckTotal(config.deck);

  const patchConfig = <K extends keyof GameConfig>(key: K, value: GameConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };
  const patchDeck = <K extends keyof DeckConfig>(key: K, value: DeckConfig[K]) => {
    setConfig((current) => ({ ...current, deck: { ...current.deck, [key]: value } }));
  };
  const patchRevolver = <K extends keyof GameConfig["revolver"]>(key: K, value: GameConfig["revolver"][K]) => {
    setConfig((current) => ({ ...current, revolver: { ...current.revolver, [key]: value } }));
  };
  const patchPlayer = (index: number, value: Partial<PlayerSetup>) => {
    setPlayers((current) => current.map((player, playerIndex) => playerIndex === index ? { ...player, ...value } : player));
  };
  const selectPreset = (preset: DeckConfig["preset"]) => {
    const next = presetDeck(preset);
    setRankText(next.ranks.join(", "));
    setConfig((current) => ({ ...current, deck: next }));
  };
  const setColorTruth = (enabled: boolean) => {
    if (enabled && config.deck.preset === "classic") selectPreset("physical");
    setConfig((current) => ({
      ...current,
      deck: {
        ...current.deck,
        ...(enabled && current.deck.preset === "classic" ? presetDeck("physical") : {}),
        colorTruth: enabled,
        namedRanksPerRound: enabled ? 1 : current.deck.namedRanksPerRound,
      },
    }));
  };
  const setPlayerCount = (count: number) => {
    setPlayers((current) => {
      if (count < current.length) return current.slice(0, count);
      const next = [...current];
      while (next.length < count) {
        const index = next.length;
        next.push({ id: "p" + (index + 1), name: "", color: colors[index % colors.length]!, avatar: avatars[index % avatars.length]! });
      }
      return next;
    });
  };
  const movePlayer = (index: number, direction: -1 | 1) => {
    setPlayers((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex]!, next[index]!];
      return next;
    });
  };
  const handleStart = () => {
    if (players.length >= 2) {
      startGame(players.map((player, index) => ({
        ...player,
        name: player.name.trim() || (locale === "ru" ? "Игрок " : "Player ") + (index + 1),
      })), config);
    }
  };

  const balanceMessage = percent > 55 ? t("tooEasy") : percent < 25 ? t("tooHard") : t("balanced");
  const selector = [
    { value: "classic", label: t("classicDeck") },
    { value: "physical", label: t("physicalDeck") },
    { value: "custom", label: t("customDeck") },
  ] as const;
  return (
    <motion.main
      className="setup-screen content-shell"
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-heading">
        <button className="back-button" type="button" onClick={onBack}>
          <ArrowDown size={15} aria-hidden="true" /> {t("back")}
        </button>
        <div>
          <div className="eyebrow"><span className="eyebrow-line" />{locale === "ru" ? "ПЕРЕД ПЕРВОЙ РАЗДАЧЕЙ" : "BEFORE THE FIRST DEAL"}</div>
          <h1>{t("setupTitle")}</h1>
          <p>{t("setupIntro")}</p>
        </div>
      </div>

      <div className="setup-grid">
        <section className="setup-card player-setup">
          <div className="section-topline"><span className="section-index">01</span><h2>{t("players")}</h2></div>
          <label className="field-label" htmlFor="player-count">{t("players")}</label>
          <select id="player-count" value={players.length} onChange={(event) => setPlayerCount(Number(event.target.value))}>
            {Array.from({ length: 7 }, (_, index) => index + 2).map((count) => (
              <option value={count} key={count}>{count} {locale === "ru" ? "игрока" : count === 1 ? "player" : "players"}</option>
            ))}
          </select>
          <div className="player-list">
            {players.map((player, index) => (
              <div className="player-edit-row" key={player.id}>
                <span className="player-edit-avatar" style={{ "--player": player.color } as React.CSSProperties}>{player.avatar}</span>
                <label className="sr-only" htmlFor={"player-" + player.id}>{t("playerName") + " " + (index + 1)}</label>
                <input
                  id={"player-" + player.id}
                  value={player.name}
                  maxLength={18}
                  placeholder={(locale === "ru" ? "Игрок " : "Player ") + (index + 1)}
                  onChange={(event) => patchPlayer(index, { name: event.target.value })}
                />
                <div className="player-reorder">
                  <button type="button" className="mini-button" aria-label={(locale === "ru" ? "Переместить " : "Move ") + player.name + " up"} disabled={index === 0} onClick={() => movePlayer(index, -1)}><ArrowUp size={14} /></button>
                  <button type="button" className="mini-button" aria-label={(locale === "ru" ? "Переместить " : "Move ") + player.name + " down"} disabled={index === players.length - 1} onClick={() => movePlayer(index, 1)}><ArrowDown size={14} /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="form-field hand-size-field">
            <label htmlFor="hand-size">{t("handSize")}</label>
            <div className="inline-stepper">
              <button className="stepper-button" type="button" aria-label="−" onClick={() => patchConfig("handSize", Math.max(1, config.handSize - 1))}>−</button>
              <output htmlFor="hand-size">{config.handSize}</output>
              <button className="stepper-button" type="button" aria-label="+" onClick={() => patchConfig("handSize", Math.min(10, config.handSize + 1))}>+</button>
            </div>
            <input id="hand-size" className="sr-only" type="number" min="1" max="10" value={config.handSize} onChange={(event) => patchConfig("handSize", Number(event.target.value))} />
          </div>
        </section>

        <section className="setup-card deck-setup">
          <div className="section-topline"><span className="section-index">02</span><h2>{t("deck")}</h2></div>
          <label className="field-label" htmlFor="deck-preset">{t("deck")}</label>
          <select id="deck-preset" value={config.deck.preset} onChange={(event) => selectPreset(event.target.value as DeckConfig["preset"])}>
            {selector.map((preset) => <option value={preset.value} key={preset.value}>{preset.label}</option>)}
          </select>
          {config.deck.preset === "custom" && (
            <div className="custom-deck-fields">
              <div className="form-field">
                <label htmlFor="ranks">{t("ranks")}</label>
                <input
                  id="ranks"
                  value={rankText}
                  onChange={(event) => {
                    setRankText(event.target.value);
                    const ranks = event.target.value.split(",").map((rank) => rank.trim().toUpperCase()).filter(Boolean);
                    if (ranks.length > 0 && new Set(ranks).size === ranks.length) {
                      patchDeck("ranks", ranks);
                      patchDeck("namedRanksPerRound", Math.min(config.deck.namedRanksPerRound, ranks.length));
                    }
                  }}
                  placeholder="9, 10, J, Q, K, A"
                />
              </div>
              <div className="config-pair">
                <NumberField label={t("copies")} value={config.deck.copiesPerRank} min={1} max={12} onChange={(value) => patchDeck("copiesPerRank", value)} />
                <NumberField label={t("jokers")} value={config.deck.jokers} min={0} max={8} onChange={(value) => patchDeck("jokers", value)} />
              </div>
              <NumberField label={t("namedRanks")} value={config.deck.namedRanksPerRound} min={1} max={Math.max(1, config.deck.ranks.length)} onChange={(value) => patchDeck("namedRanksPerRound", value)} />
            </div>
          )}
          {config.deck.preset === "physical" && (
            <fieldset className="rank-picker">
              <legend>{t("chooseRanks")}</legend>
              <div>
                {PHYSICAL_RANKS.map((rank) => (
                  <label className="rank-chip" key={rank}>
                    <input
                      type="checkbox"
                      checked={config.deck.ranks.includes(rank)}
                      onChange={(event) => {
                        const ranks = event.target.checked
                          ? [...config.deck.ranks, rank].sort((a, b) => PHYSICAL_RANKS.indexOf(a) - PHYSICAL_RANKS.indexOf(b))
                          : config.deck.ranks.filter((item) => item !== rank);
                        if (ranks.length > 0) {
                          patchDeck("ranks", ranks);
                          patchDeck("namedRanksPerRound", Math.min(config.deck.namedRanksPerRound, ranks.length));
                        }
                      }}
                    />
                    <span>{rank}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {config.deck.preset === "physical" && (
            <div className="form-field named-ranks-field">
              <label htmlFor="named-ranks">{t("namedRanks")}</label>
              <select id="named-ranks" value={config.deck.namedRanksPerRound} onChange={(event) => patchDeck("namedRanksPerRound", Number(event.target.value))}>
                {Array.from({ length: Math.min(2, config.deck.ranks.length) }, (_, index) => index + 1).map((count) => (
                  <option key={count} value={count}>{count}</option>
                ))}
              </select>
            </div>
          )}
          {config.deck.preset !== "custom" && (
            <div className="deck-facts">
              <span>{config.deck.ranks.length} {locale === "ru" ? "ранга" : "ranks"}</span>
              <i />
              <span>{config.deck.copiesPerRank}×</span>
              <i />
              <span>{config.deck.jokers} {t("jokers").toLowerCase()}</span>
            </div>
          )}
          <label className="toggle-row color-toggle">
            <span>
              <b>{t("colorTruth")}</b>
              <small>{t("colorTruthHelp")}</small>
            </span>
            <input type="checkbox" checked={config.deck.colorTruth} onChange={(event) => setColorTruth(event.target.checked)} />
          </label>
          <div className="balance-box">
            <div className="balance-heading">
              <span>{t("balance")}</span>
              <b>{percent.toFixed(0)}%</b>
            </div>
            <div className="balance-track"><span style={{ width: Math.min(percent, 100) + "%" }} /></div>
            <div className="balance-foot">
              <span>{balanceMessage}</span>
              <small>{t("classicBalance")}: 40%</small>
            </div>
          </div>
          {cardsNeeded > cardsAvailable && (
            <p className="deck-warning" role="status">{t("deckShort")} <b>{cardsNeeded}/{cardsAvailable}</b></p>
          )}
        </section>

        <section className="setup-card revolver-setup">
          <div className="section-topline"><span className="section-index">03</span><h2>{t("revolver")}</h2></div>
          <label className="field-label" htmlFor="revolver-mode">{t("revolver")}</label>
          <select id="revolver-mode" value={config.revolver.mode} onChange={(event) => patchRevolver("mode", event.target.value as GameConfig["revolver"]["mode"])}>
            <option value="classic">{t("classicMode")}</option>
            <option value="spin">{t("spinMode")}</option>
            <option value="shared">{t("sharedMode")}</option>
          </select>
          <div className="config-pair">
            <NumberField label={t("chambers")} value={config.revolver.chambers} min={2} max={12} onChange={(value) => {
              patchRevolver("chambers", value);
              patchRevolver("bullets", Math.min(config.revolver.bullets, value - 1));
            }} />
            <NumberField label={t("bullets")} value={config.revolver.bullets} min={1} max={config.revolver.chambers - 1} onChange={(value) => patchRevolver("bullets", value)} />
          </div>
          <label className="toggle-row">
            <span><b>{t("showOdds")}</b><small>{config.revolver.showOdds ? "1/" + config.revolver.chambers : locale === "ru" ? "По умолчанию выключено" : "Off by default"}</small></span>
            <input type="checkbox" checked={config.revolver.showOdds} onChange={(event) => patchRevolver("showOdds", event.target.checked)} />
          </label>
        </section>

        <section className="setup-card house-setup">
          <div className="section-topline"><span className="section-index">04</span><h2>{locale === "ru" ? "Хаус-рулы" : "House rules"}</h2></div>
          <label className="toggle-row">
            <span><b>{t("noRepeat")}</b></span>
            <input type="checkbox" checked={config.noRepeatTable} onChange={(event) => patchConfig("noRepeatTable", event.target.checked)} />
          </label>
          <label className="toggle-row">
            <span><b>{t("shooterStarts")}</b></span>
            <input type="checkbox" checked={config.shooterStarts} onChange={(event) => patchConfig("shooterStarts", event.target.checked)} />
          </label>
          <label className="toggle-row">
            <span><b>{t("showHandCounts")}</b></span>
            <input type="checkbox" checked={config.showHandCounts} onChange={(event) => patchConfig("showHandCounts", event.target.checked)} />
          </label>
          <label className="toggle-row">
            <span><b>{t("chaos")}</b></span>
            <input type="checkbox" checked={config.chaosEnabled} onChange={(event) => patchConfig("chaosEnabled", event.target.checked)} />
          </label>
          <div className="form-field timer-field">
            <label htmlFor="turn-timer">{t("timer")}</label>
            <select id="turn-timer" value={config.timerSeconds} onChange={(event) => patchConfig("timerSeconds", Number(event.target.value) as GameConfig["timerSeconds"])}>
              <option value={0}>{t("noTimer")}</option>
              {[15, 30, 60].map((seconds) => <option value={seconds} key={seconds}>{seconds} {t("seconds")}</option>)}
            </select>
          </div>
        </section>
      </div>

      <div className="setup-footer">
        <span className="deal-reminder">{t("physicalNote")}</span>
        <PrimaryButton onClick={handleStart}>{t("start")}</PrimaryButton>
      </div>
    </motion.main>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="form-field" role="group" aria-label={label}>
      <span className="number-field-label">{label}</span>
      <div className="inline-stepper">
        <button className="stepper-button" type="button" aria-label={label + " −"} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
        <output>{value}</output>
        <button className="stepper-button" type="button" aria-label={label + " +"} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
      </div>
    </div>
  );
}
