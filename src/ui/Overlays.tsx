import { useGameStore } from "../store/useGameStore";
import { Modal } from "./components";
import { useCopy } from "./useCopy";
import type { Locale } from "../i18n/translations";

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
  const setOverlay = useGameStore((state) => state.setOverlay);
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
        <div className="physical-rule-note">
          <span>↗</span><div><b>{t("physicalNote")}</b><p>{t("physicalNoteBody")}</p></div>
        </div>
      </div>
    </Modal>
  );
}
