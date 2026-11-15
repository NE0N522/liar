import { useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { MeshPhysicalMaterial, Vector2, type Group, type Points } from "three";

function PerformanceMeter({ onLowQuality }: { onLowQuality: () => void }) {
  const elapsed = useRef(0);
  const frames = useRef(0);
  const triggered = useRef(false);
  useFrame((_, delta) => {
    elapsed.current += delta;
    frames.current += 1;
    if (elapsed.current >= 2) {
      const fps = frames.current / elapsed.current;
      if (fps < 43 && !triggered.current) {
        triggered.current = true;
        onLowQuality();
      }
      elapsed.current = 0;
      frames.current = 0;
    }
  });
  return null;
}

function DustMotes() {
  const points = useRef<Points>(null);
  const positions = useMemo(() => {
    const result = new Float32Array(96 * 3);
    for (let index = 0; index < 96; index += 1) {
      const x = Math.sin(index * 4.17) * 2.2;
      const y = ((index * 23) % 55) / 17 - 1.45;
      const z = Math.cos(index * 8.12) * 1.1;
      result[index * 3] = x;
      result[index * 3 + 1] = y;
      result[index * 3 + 2] = z;
    }
    return result;
  }, []);
  useFrame((_, delta) => {
    if (points.current) points.current.rotation.y += delta * 0.025;
  });
  return (
    <points ref={points} position={[0, 0, -0.5]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#d6b77d" size={0.025} transparent opacity={0.46} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function RevolverModel({ spinning, cocking }: { spinning: boolean; cocking: boolean }) {
  const cylinderRef = useRef<Group>(null);
  const hammerRef = useRef<Group>(null);
  const frameMaterial = useMemo(() => new MeshPhysicalMaterial({
    color: "#666454",
    metalness: 0.72,
    roughness: 0.34,
    clearcoat: 0.55,
    clearcoatRoughness: 0.23,
  }), []);
  const darkSteel = useMemo(() => new MeshPhysicalMaterial({
    color: "#333630",
    metalness: 0.68,
    roughness: 0.36,
    clearcoat: 0.4,
  }), []);
  const brass = useMemo(() => new MeshPhysicalMaterial({
    color: "#ad8b51",
    metalness: 0.82,
    roughness: 0.31,
    clearcoat: 0.3,
  }), []);
  const wood = useMemo(() => new MeshPhysicalMaterial({
    color: "#704a31",
    metalness: 0.08,
    roughness: 0.52,
    clearcoat: 0.24,
    clearcoatRoughness: 0.5,
  }), []);

  useFrame((_, delta) => {
    if (cylinderRef.current && spinning) cylinderRef.current.rotation.z += delta * 8;
    if (hammerRef.current) {
      const target = cocking ? 0.42 : 0.05;
      hammerRef.current.rotation.z += (target - hammerRef.current.rotation.z) * Math.min(1, delta * 10);
    }
  });

  return (
    <group rotation={[0.07, -0.1, -0.06]} scale={1.24} position={[-0.68, 0.08, 0]}>
      <RoundedBox args={[1.9, 0.69, 0.36]} radius={0.15} smoothness={5} position={[-0.13, 0.04, 0]} material={frameMaterial} castShadow receiveShadow />
      <mesh position={[1.3, 0.23, 0]} rotation={[0, 0, Math.PI / 2]} material={darkSteel} castShadow>
        <cylinderGeometry args={[0.18, 0.23, 1.62, 32]} />
      </mesh>
      <mesh position={[1.3, 0.23, 0.03]} rotation={[0, 0, Math.PI / 2]} material={frameMaterial}>
        <cylinderGeometry args={[0.16, 0.19, 1.65, 32]} />
      </mesh>
      <RoundedBox args={[0.38, 0.1, 0.13]} radius={0.035} smoothness={3} position={[1.47, 0.47, 0]} material={brass} />
      <group ref={cylinderRef} position={[-0.18, 0.02, 0.25]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={frameMaterial} castShadow>
          <cylinderGeometry args={[0.47, 0.47, 0.42, 48]} />
        </mesh>
        <mesh position={[0, 0, 0.218]} material={brass}>
          <torusGeometry args={[0.46, 0.027, 10, 48]} />
        </mesh>
        {Array.from({ length: 6 }, (_, index) => {
          const angle = (Math.PI * 2 * index) / 6;
          const x = Math.cos(angle) * 0.235;
          const y = Math.sin(angle) * 0.235;
          return (
            <group key={index} position={[x, y, 0.228]}>
              <mesh material={brass}><torusGeometry args={[0.095, 0.014, 8, 24]} /></mesh>
              <mesh position={[0, 0, -0.008]} material={darkSteel}><circleGeometry args={[0.08, 24]} /></mesh>
              <mesh position={[0, 0, -0.012]} material={frameMaterial}><circleGeometry args={[0.047, 24]} /></mesh>
            </group>
          );
        })}
        <mesh position={[0, 0, 0.235]} material={brass}><circleGeometry args={[0.08, 24]} /></mesh>
      </group>
      <RoundedBox args={[0.49, 1.16, 0.32]} radius={0.18} smoothness={7} position={[-0.4, -0.84, 0.02]} rotation={[0, 0, -0.24]} material={wood} castShadow />
      <mesh position={[-0.34, -0.78, 0.19]} rotation={[0, 0, -0.28]} material={brass}>
        <torusGeometry args={[0.085, 0.018, 8, 20]} />
      </mesh>
      <mesh position={[0.37, -0.42, 0.11]} rotation={[0, 0, 0.11]} material={brass}>
        <torusGeometry args={[0.245, 0.025, 8, 32]} />
      </mesh>
      <group ref={hammerRef} position={[0.43, 0.36, 0.03]}>
        <mesh rotation={[0, 0, -0.2]} material={brass} castShadow>
          <boxGeometry args={[0.1, 0.39, 0.12]} />
        </mesh>
        <mesh position={[0.06, 0.19, 0]} rotation={[0, 0, 0.3]} material={frameMaterial}>
          <boxGeometry args={[0.24, 0.1, 0.16]} />
        </mesh>
      </group>
      <mesh position={[-1.02, 0.1, 0.08]} material={brass}>
        <sphereGeometry args={[0.065, 16, 16]} />
      </mesh>
    </group>
  );
}

export default function Revolver3D({
  spinning,
  cocking,
  motionEnabled,
  ambientMotion,
  lowQuality,
  onLowQuality,
  fallback,
}: {
  spinning: boolean;
  cocking: boolean;
  motionEnabled: boolean;
  ambientMotion: boolean;
  lowQuality: boolean;
  onLowQuality: () => void;
  fallback: ReactNode;
}) {
  const chromaticOffset = useMemo(() => new Vector2(0.0007, 0.0007), []);
  const animate = motionEnabled && (ambientMotion || spinning || cocking);
  return (
    <div className="revolver-3d" role="img" aria-label="Револьвер, собранный в 3D">
      <Canvas
        fallback={fallback}
        frameloop={animate ? "always" : "demand"}
        dpr={lowQuality ? 1 : [1, 1.5]}
        camera={{ position: [0, 0, 5.2], fov: 35 }}
        gl={{ antialias: !lowQuality, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.95} color="#d6c5a3" />
        <spotLight position={[0.1, 4, 2.8]} angle={0.52} penumbra={0.83} intensity={58} color="#f0d49b" />
        <pointLight position={[-3.5, 0.1, 2]} intensity={19} color="#5d8c69" />
        <pointLight position={[3.4, -1.2, 1]} intensity={13} color="#c58c52" />
        <Environment resolution={128}>
          <Lightformer form="rect" intensity={2.4} position={[0, 4, 2]} scale={[8, 4, 1]} />
          <Lightformer form="rect" intensity={1.8} position={[-4, 1, -2]} rotation={[0, Math.PI / 2, 0]} scale={[5, 3, 1]} color="#71836b" />
          <Lightformer form="rect" intensity={1.6} position={[4, -1, 1]} rotation={[0, -Math.PI / 3, 0]} scale={[4, 2, 1]} color="#b8864d" />
        </Environment>
        <RevolverModel spinning={spinning} cocking={cocking} />
        {animate && ambientMotion && !lowQuality && <DustMotes />}
        {!lowQuality && (
          <EffectComposer multisampling={0}>
            <Bloom intensity={0.34} luminanceThreshold={0.4} mipmapBlur />
            <Vignette eskil offset={0.22} darkness={0.74} />
            <Noise opacity={0.025} />
            <ChromaticAberration offset={chromaticOffset} radialModulation modulationOffset={0.16} />
          </EffectComposer>
        )}
        {animate && <PerformanceMeter onLowQuality={onLowQuality} />}
      </Canvas>
    </div>
  );
}
