import type { RefObject } from "react";

export default function FallbackRevolver({
  drumRef,
  spinning,
  cocking,
  outcome,
}: {
  drumRef: RefObject<SVGGElement>;
  spinning: boolean;
  cocking: boolean;
  outcome: "live" | "out" | null;
}) {
  return (
    <div className={"revolver-fallback" + (outcome === "out" ? " fallback-fired" : "")}>
      <svg viewBox="0 0 520 320" role="img" aria-label="Процедурный рисунок револьвера с закрытым барабаном">
        <defs>
          <linearGradient id="fallback-steel" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#b5a47d" /><stop offset=".32" stopColor="#595849" /><stop offset=".72" stopColor="#343630" /><stop offset="1" stopColor="#191d18" />
          </linearGradient>
          <linearGradient id="fallback-wood" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#9d6c45" /><stop offset=".5" stopColor="#68432c" /><stop offset="1" stopColor="#30251c" />
          </linearGradient>
          <filter id="fallback-shadow"><feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#000" floodOpacity=".7" /></filter>
        </defs>
        <g className={"fallback-gun-group" + (cocking ? " hammer-cocking" : "")} filter="url(#fallback-shadow)">
          <path d="M279 111h196v38H279z" fill="url(#fallback-steel)" stroke="#cab98d" strokeWidth="3" />
          <path d="M300 106v48m-13-40v31m133-36v31m25-33v35" fill="none" stroke="#292c26" strokeWidth="5" />
          <path d="M153 105h173v116H153z" rx="23" fill="url(#fallback-steel)" stroke="#c4b489" strokeWidth="4" />
          <path d="M173 122h120v85H173z" fill="#252822" stroke="#9e8f66" strokeWidth="2" />
          <g ref={drumRef} className={"fallback-drum" + (spinning ? " drum-spinning" : "")} transform="translate(235 164)">
            <circle r="45" fill="#373a34" stroke="#d1ba81" strokeWidth="4" />
            {Array.from({ length: 6 }, (_, index) => {
              const angle = (Math.PI * 2 * index) / 6;
              const x = Math.cos(angle) * 24;
              const y = Math.sin(angle) * 24;
              return <g key={index} transform={"translate(" + x + " " + y + ")"}><circle r="11" fill="#10130f" stroke="#a18c5e" strokeWidth="2" /><circle r="6" fill="#242722" /></g>;
            })}
            <circle r="10" fill="#9b8557" stroke="#ded0aa" strokeWidth="2" />
          </g>
          <path d="M180 220h115l-14 37-68 43-54-20-32-20 20-22z" fill="url(#fallback-wood)" stroke="#bb8b58" strokeWidth="3" />
          <path d="M161 254c12 12 31 19 53 26m-34-45 55 55m-16-71 46 46" fill="none" stroke="#c39262" strokeOpacity=".33" strokeWidth="2" />
          <path d="M315 219q-9 24-1 40" fill="none" stroke="#bba575" strokeWidth="8" strokeLinecap="round" />
          <path d="M292 113q12-48 46-34l10 28" fill="none" stroke="url(#fallback-steel)" strokeWidth="16" strokeLinecap="round" />
          <path d="M332 79 341 63l18 9-8 22" fill="url(#fallback-steel)" stroke="#c0ad7b" strokeWidth="3" />
          <path d="M281 239q5 22 27 18" fill="none" stroke="#c4b07f" strokeWidth="4" />
        </g>
      </svg>
      {outcome === "out" && <span className="fallback-muzzle-bloom" aria-hidden="true" />}
    </div>
  );
}
