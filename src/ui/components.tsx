import { useEffect, useRef, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, Settings2, Volume2, VolumeX } from "lucide-react";
import { useGameStore } from "../store/useGameStore";
import { useCopy } from "./useCopy";

export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 40 44" role="img">
        <path d="M20 3 3.8 22.1a10.2 10.2 0 0 0 16.2 12.2 10.2 10.2 0 0 0 16.2-12.2L20 3Z" />
        <path d="M16.3 30.6c.1 4.5-.8 7.2-3 9.4h13.4c-2.2-2.2-3.1-4.9-3-9.4" />
      </svg>
    </span>
  );
}

export function AppHeader() {
  const t = useCopy();
  const locale = useGameStore((state) => state.locale);
  const game = useGameStore((state) => state.game);
  const preferences = useGameStore((state) => state.preferences);
  const setLocale = useGameStore((state) => state.setLocale);
  const setPage = useGameStore((state) => state.setPage);
  const setOverlay = useGameStore((state) => state.setOverlay);
  const updatePreference = useGameStore((state) => state.updatePreference);

  return (
    <header className="app-header">
      <button className="brand-lockup" type="button" onClick={() => setPage("home")} aria-label={t("brand")}>
        <BrandMark />
        <span>
          <strong>{t("brand")}</strong>
          <small>{t("descriptor")}</small>
        </span>
      </button>
      <div className="header-actions">
        {game && (
          <button className="quiet-button header-menu" type="button" onClick={() => setPage("home")}>
            <ArrowLeft aria-hidden="true" size={16} />
            <span>{t("menu")}</span>
          </button>
        )}
        <button className="quiet-button header-rule" type="button" onClick={() => setOverlay("rules")}>
          {t("rules")}
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label={preferences.soundEnabled ? t("sound") : t("sound") + " off"}
          aria-pressed={preferences.soundEnabled}
          onClick={() => updatePreference("soundEnabled", !preferences.soundEnabled)}
        >
          {preferences.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button
          className="locale-button"
          type="button"
          aria-label="Change language"
          onClick={() => setLocale(locale === "ru" ? "en" : "ru")}
        >
          {locale.toUpperCase()}
          <ArrowDown size={12} aria-hidden="true" />
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label={t("settings")}
          onClick={() => setOverlay("settings")}
        >
          <Settings2 size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  className = "",
  type = "button",
  ariaLabel,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  ariaLabel?: string;
}) {
  return (
    <button
      className={"primary-button " + className}
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      <span>{children}</span>
      <ArrowRight size={17} aria-hidden="true" />
    </button>
  );
}

export function CardBack({ small = false }: { small?: boolean }) {
  return (
    <div className={"playing-card card-back" + (small ? " playing-card-small" : "")} aria-label="Карта рубашкой вверх">
      <span className="card-back-pattern" aria-hidden="true">
        <BrandMark />
      </span>
    </div>
  );
}

export function TargetCard({
  rank,
  color,
  compact = false,
}: {
  rank: string;
  color: "red" | "black" | null;
  compact?: boolean;
}) {
  const suit = color === "red" ? "♥" : color === "black" ? "♠" : "♣";
  const displayColor = color ?? "neutral";
  return (
    <div
      className={"playing-card target-card target-" + displayColor + (compact ? " playing-card-small" : "")}
      aria-label={rank + (color ? (color === "red" ? " красная" : " чёрная") : "")}
    >
      <span className="target-corner">
        <b>{rank}</b>
        <small aria-hidden="true">{suit}</small>
      </span>
      <span className="target-center" aria-hidden="true">{suit}</span>
      <span className="target-corner target-corner-bottom" aria-hidden="true">
        <b>{rank}</b>
        <small>{suit}</small>
      </span>
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const t = useCopy();
  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const dialog = document.querySelector<HTMLElement>("[data-modal-dialog]");
        if (!dialog) return;
        const items = Array.from(dialog.querySelectorAll<HTMLElement>('button, input, select, [tabindex="0"]'))
          .filter((element) => !element.hasAttribute("disabled"));
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first && last) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last && first) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-scrim" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className={"modal-panel" + (wide ? " modal-panel-wide" : "")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        data-modal-dialog
      >
        <div className="modal-heading">
          <h2 id="modal-title">{title}</h2>
          <button ref={closeRef} className="icon-button" type="button" aria-label={t("close")} onClick={onClose}>
            <span aria-hidden="true">×</span>
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

