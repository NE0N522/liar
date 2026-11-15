import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import FallbackRevolver from "./FallbackRevolver";

const Revolver3D = lazy(() => import("./Revolver3D"));

export type RevolverOutcome = "live" | "out" | null;

export function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

export function RevolverDisplay({
  className = "",
  spinning,
  cocking,
  outcome,
  ambientMotion = false,
}: {
  className?: string;
  spinning: boolean;
  cocking: boolean;
  outcome: RevolverOutcome;
  ambientMotion?: boolean;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const drumRef = useRef<SVGGElement>(null);
  const [lowQuality, setLowQuality] = useState(false);
  const motionEnabled = !reducedMotion;
  const displaySpinning = motionEnabled && spinning;
  const displayCocking = motionEnabled && cocking;
  const fallback = (
    <FallbackRevolver
      drumRef={drumRef}
      spinning={displaySpinning}
      cocking={displayCocking}
      outcome={outcome}
    />
  );

  return (
    <div className={"revolver-display " + className}>
      <RevolverErrorBoundary fallback={fallback}>
        <Suspense fallback={fallback}>
          <Revolver3D
            spinning={displaySpinning}
            cocking={displayCocking}
            motionEnabled={motionEnabled}
            ambientMotion={ambientMotion}
            lowQuality={lowQuality}
            onLowQuality={() => setLowQuality(true)}
            fallback={fallback}
          />
        </Suspense>
      </RevolverErrorBoundary>
    </div>
  );
}

class RevolverErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
