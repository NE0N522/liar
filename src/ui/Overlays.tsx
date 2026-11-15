import { useState } from "react";
import { useGameStore } from "../store/useGameStore";
import { Modal } from "./components";
import { useCopy } from "./useCopy";
import type { Locale } from "../i18n/translations";
import { TargetCard } from "./components";

export function SettingsOverlay() {
  const t = useCopy();
  const locale = useGameStore((state) => state.locale);
  const setLocale = useGameStore((state) => state.setLocale);
  const preferences = useGameStore((state) => state.preferences);
  const updatePreference = useGameStore((state) => state.updatePreference);
  const setOverlay = useGameStore((state) => state.setOverlay);
  return (
    <Modal title={t("settings")} onClose={() => setOverlay(null)}>
      <div className="settings-content">
        <label className="settings-row">
          <span><b>{t("sound")}</b><small>{locale === "ru" ? "Процедурные звуки игры" : "Procedural game sounds"}</small></span>
          <input type="checkbox" checked={preferences.soundEnabled} onChange={(event) => updatePreference("soundEnabled", event.target.checked)} />
        </label>
        <label className="settings-range">
          <span><b>{t("volume")}</b><output>{Math.round(preferences.volume * 100)}%</output></span>
          <input type="range" min="0" max="1" step="0.05" value={preferences.volume} onChange={(event) => updatePreference("volume", Number(event.target.value))} />
        </label>
        <label className="settings-row">
          <span><b>{t("haptics")}</b><small>{locale === "ru" ? "Короткая вибрация на важные действия" : "Short vibration on key actions"}</small></span>
          <input type="checkbox" checked={preferences.haptics} onChange={(event) => updatePreference("haptics", event.target.checked)} />
        </label>
        <div className="settings-language">
          <span><b>{t("language")}</b></span>
          <div className="segmented-control" role="group" aria-label={t("language")}>
            {(["ru", "en"] as Locale[]).map((item) => (
              <button key={item} className={locale === item ? "segment active" : "segment"} type="button" aria-pressed={locale === item} onClick={() => setLocale(item)}>{item.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <label className="settings-row">
          <span><b>{t("reducedMotion")}</b><small>{locale === "ru" ? "Упростить движения и вспышки" : "Reduce movement and flashes"}</small></span>
          <input type="checkbox" checked={preferences.reducedMotion} onChange={(event) => updatePreference("reducedMotion", event.target.checked)} />
        </label>
      </div>
    </Modal>
  );
}

export function RulesOverlay() {
  const t = useCopy();
  const locale = useGameStore((state) => state.locale);
  const setOverlay = useGameStore((state) => state.setOverlay);
  const [targetColor, setTargetColor] = useState<"red" | "black">("red");
  const oppositeColor = targetColor === "red" ? "black" : "red";
  return (
    <Modal title={t("rules")} onClose={() => setOverlay(null)} wide>
      <div className="rules-content">
        <p className="rules-intro">{t("ruleIntro")}</p>
        <ol className="rules-list">
          {(["ruleOne", "ruleTwo", "ruleThree", "ruleFour", "ruleFive"] as const).map((key, index) => (
            <li key={key}>
              <span className="rule-number">0{index + 1}</span>
              <p>{t(key)}</p>
            </li>
          ))}
        </ol>
        <div className="color-rule-card">
          <span className="color-rule-mark">♥ / ♠</span>
          <div><b>{t("colorTruth")}</b><p>{t("ruleColor")}</p></div>
        </div>
        <div className="color-example">
          <div className="color-example-heading">
            <span>{locale === "ru" ? "ПРОВЕРКА ЦВЕТА" : "COLOR CHECK"}</span>
            <button
              type="button"
              className="color-switch"
              aria-label={locale === "ru" ? "Сменить цвет стола" : "Switch table color"}
              onClick={() => setTargetColor(oppositeColor)}
            >
              {locale === "ru" ? "Сменить цвет" : "Switch color"}
            </button>
          </div>
          <div className="color-example-cards">
            <div><small>{locale === "ru" ? "Карта стола" : "Table card"}</small><TargetCard rank="6" color={targetColor} compact /></div>
            <span className="color-example-arrow">→</span>
            <div><small>{locale === "ru" ? "Совпадает" : "Matches"}</small><TargetCard rank="6" color={targetColor} compact /></div>
            <span className="color-example-arrow">/</span>
            <div><small>{locale === "ru" ? "Не совпадает" : "Does not match"}</small><TargetCard rank="6" color={oppositeColor} compact /></div>
          </div>
          <p className="color-example-note">
            {locale === "ru"
              ? "Если последний ход включает чёрную шестёрку при красной цели, ход ложный — стреляет сыгравший."
              : "If the last play includes a black six against a red target, it is a lie — the player who played it shoots."}
          </p>
        </div>
        <div className="physical-rule-note">
          <span>↗</span><div><b>{t("physicalNote")}</b><p>{t("physicalNoteBody")}</p></div>
        </div>
      </div>
    </Modal>
  );
}
