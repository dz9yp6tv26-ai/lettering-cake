"use client";
import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import Lettering3D from "./Lettering3D";
import ToppingMesh from "./ToppingMeshes";
import Candles3D from "./Candles3D";
import { letteringFont, type LetteringFont } from "@/lib/lettering-fonts";
import {
  MAX_POINTS,
  MAX_STROKES,
  type Cake3DState,
  type CreamStroke,
  type Vec3,
} from "@/lib/cake3d";
export type CakeViewer3DProps = {
  state: Cake3DState;
  mode: "rotate" | "pipe" | "place";
  open: boolean;
  blown: boolean;
  creamColor: string;
  creamRadius: number;
  onStroke: (stroke: CreamStroke) => void;
  onPlace: (point: Vec3) => void;
  onOpen: () => void;
  onBlow: () => void;
  onNotice: (text: string) => void;
};
class WebGLBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p role="alert" className="webgl-fallback">
        3D 화면을 열 수 없어요. WebGL을 지원하는 브라우저에서 하드웨어 가속을
        켜고 다시 접속해 주세요.
      </p>
    ) : (
      this.props.children
    );
  }
}
function useLabelTexture(
  text: string,
  ink: string,
  size: number,
  fontId: LetteringFont = "classic",
) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, []);
  useEffect(() => {
    let cancelled = false;
    const canvas = texture.image as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    const selected = letteringFont(fontId);
    const family = `${getComputedStyle(document.body).getPropertyValue(selected.variable).trim().split(",")[0]}, "Malgun Gothic", sans-serif`;
    const descriptor = (px: number) =>
      `${selected.style} ${selected.weight} ${px}px ${family}`;
    function draw() {
      if (cancelled) return;
      const lines = text.split("\n");
      let px = size;
      let ascent = 0,
        descent = 0,
        lineHeight = 0;
      // Fit with real glyph bounds, including swashes and descenders. Never squeeze only X.
      for (let pass = 0; pass < 5; pass++) {
        ctx.font = descriptor(px);
        ctx.letterSpacing = `${px * selected.spacing}px`;
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        const metrics = lines.map((line) => ctx.measureText(line || "Mg"));
        ascent = Math.max(
          ...metrics.map((m) => m.actualBoundingBoxAscent),
          px * 0.7,
        );
        descent = Math.max(
          ...metrics.map((m) => m.actualBoundingBoxDescent),
          px * 0.2,
        );
        lineHeight = ascent + descent + px * 0.16;
        const width = Math.max(
          1,
          ...metrics.map((m) =>
            Math.max(
              m.width,
              2 * m.actualBoundingBoxLeft,
              2 * m.actualBoundingBoxRight,
            ),
          ),
        );
        const height = ascent + descent + (lines.length - 1) * lineHeight;
        const scale = Math.min(1, 920 / width, 416 / height);
        if (scale >= 0.999) break;
        px *= scale;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = ink;
      const height = ascent + descent + (lines.length - 1) * lineHeight;
      lines.forEach((line, i) =>
        ctx.fillText(line, 512, (512 - height) / 2 + ascent + i * lineHeight),
      );
      texture.needsUpdate = true;
    }
    draw();
    // CanvasTexture does not repaint itself when a webfont finishes loading.
    document.fonts
      .load(descriptor(size), "Happy birthday")
      .then(draw)
      .catch(() => {
        /* Keep the readable system fallback. */
      });
    return () => {
      cancelled = true;
    };
  }, [texture, text, ink, size, fontId]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
function Label({
  text,
  position,
  width,
  height,
  ink,
  size = 90,
  fontId = "classic",
}: {
  text: string;
  position: Vec3;
  width: number;
  height: number;
  ink: string;
  size?: number;
  fontId?: LetteringFont;
}) {
  const map = useLabelTexture(text, ink, size, fontId);
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={map}
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  );
}
function Cream({ stroke }: { stroke: CreamStroke }) {
  const geometry = useMemo(() => {
    if (stroke.points.length < 2) return null;
    const spline = new THREE.CatmullRomCurve3(
      stroke.points.map((p) => new THREE.Vector3(...p)),
      false,
      "centripetal",
    );
    // Project the smoothed centerline back onto its surface, preventing curves sinking into the cake.
    class SurfaceCurve extends THREE.Curve<THREE.Vector3> {
      constructor() {
        super();
      }
      getPoint(t: number, target = new THREE.Vector3()) {
        spline.getPoint(t, target);
        if (stroke.surface === "top") {
          target.y = 0.685;
          const r = Math.hypot(target.x, target.z);
          if (r > 1) {
            target.x /= r;
            target.z /= r;
          }
        } else {
          const r = Math.hypot(target.x, target.z);
          if (r > 0) {
            target.x *= 1.035 / r;
            target.z *= 1.035 / r;
          }
          target.y = THREE.MathUtils.clamp(target.y, 0, 0.65);
        }
        return target;
      }
    }
    return new THREE.TubeGeometry(
      new SurfaceCurve(),
      Math.min(400, Math.max(12, stroke.points.length * 4)),
      stroke.radius,
      8,
      false,
    );
  }, [stroke]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  return (
    <group>
      {geometry && (
        <mesh geometry={geometry} castShadow>
          <meshStandardMaterial color={stroke.color} roughness={0.73} />
        </mesh>
      )}
      {[
        stroke.points[0],
        ...(geometry ? [stroke.points[stroke.points.length - 1]] : []),
      ].map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <sphereGeometry args={[stroke.radius, 10, 8]} />
          <meshStandardMaterial color={stroke.color} roughness={0.73} />
        </mesh>
      ))}
    </group>
  );
}
function Lid({ open }: { open: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) {
      group.current.position.y = THREE.MathUtils.damp(
        group.current.position.y,
        open ? 0.12 : 0.9,
        7,
        Math.min(delta, 0.1),
      );
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        open ? -1.9 : 0,
        7,
        Math.min(delta, 0.1),
      );
    }
  });
  return (
    <group ref={group} position={[0, 0.9, -1.4]}>
      <RoundedBox
        args={[2.9, 0.12, 2.8]}
        radius={0.13}
        position={[0, 0, 1.4]}
        castShadow
      >
        <meshStandardMaterial color="#e4dcc8" roughness={1} />
      </RoundedBox>
      <mesh position={[0, -0.066, 1.4]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 2.4]} />
        <meshStandardMaterial color="#eee7d5" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
function Scene(props: CakeViewer3DProps) {
  const {
    state,
    mode,
    open,
    blown,
    onBlow,
    onStroke,
    onNotice,
    creamColor,
    creamRadius,
  } = props;
  const mesh = useRef<THREE.Mesh>(null);
  const active = useRef<CreamStroke | null>(null);
  const pointerId = useRef<number | null>(null);
  const [draft, setDraft] = useState<CreamStroke | null>(null);
  const { gl } = useThree();
  const callbacks = useRef({ onStroke, onNotice });
  callbacks.current = { onStroke, onNotice };
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  function finish() {
    const stroke = active.current;
    active.current = null;
    pointerId.current = null;
    setDraft(null);
    if (stroke) callbacks.current.onStroke(stroke);
  }
  useEffect(() => {
    const up = () => finish();
    const cancel = () => {
      active.current = null;
      pointerId.current = null;
      setDraft(null);
    };
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("blur", up);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("blur", up);
    };
  }, []);
  useEffect(() => {
    active.current = null;
    pointerId.current = null;
    setDraft(null);
  }, [mode, open]);
  function sample(e: ThreeEvent<PointerEvent>) {
    if (!mesh.current) return null;
    raycaster.ray.copy(e.ray);
    const hit = raycaster.intersectObject(mesh.current, false)[0];
    if (!hit?.face || hit.face.normal.y < -0.5) return null;
    const p = hit.point;
    const surface = hit.face.normal.y > 0.5 ? "top" : "side";
    if (surface === "top") p.y = 0.685;
    else {
      const r = Math.hypot(p.x, p.z);
      p.x *= 1.035 / r;
      p.z *= 1.035 / r;
    }
    return {
      surface,
      point: p.toArray().map((n) => Math.round(n * 1000) / 1000) as Vec3,
    } as const;
  }
  function down(e: ThreeEvent<PointerEvent>) {
    if (mode === "rotate" || !open || e.button !== 0) return;
    if (mode === "place") {
      e.stopPropagation();
      const hit = sample(e);
      if (hit?.surface === "top")
        props.onPlace([hit.point[0], 0.65, hit.point[2]]);
      else onNotice("토핑은 케이크 윗면에 놓아 주세요.");
      return;
    }
    e.stopPropagation();
    if (active.current) return;
    if (state.strokes.length >= MAX_STROKES) {
      onNotice(`크림은 최대 ${MAX_STROKES}획까지 그릴 수 있어요.`);
      return;
    }
    const hit = sample(e);
    if (!hit) return;
    (e.target as unknown as HTMLElement).setPointerCapture(e.pointerId);
    pointerId.current = e.pointerId;
    active.current = {
      id:
        globalThis.crypto?.randomUUID?.() ??
        `stroke-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      surface: hit.surface,
      color: creamColor,
      radius: creamRadius,
      points: [hit.point],
    };
    setDraft({ ...active.current });
  }
  function move(e: ThreeEvent<PointerEvent>) {
    if (!active.current || pointerId.current !== e.pointerId) return;
    e.stopPropagation();
    const hit = sample(e);
    // A missed surface / edge ends the stroke instead of drawing a bridge through empty space.
    if (!hit || hit.surface !== active.current.surface) {
      finish();
      return;
    }
    const points = active.current.points;
    const distance = new THREE.Vector3(...hit.point).distanceTo(
      new THREE.Vector3(...points[points.length - 1]),
    );
    if (distance < 0.025) return;
    if (distance > 0.3) {
      finish();
      return;
    }
    active.current = { ...active.current, points: [...points, hit.point] };
    setDraft(active.current);
    if (active.current.points.length >= MAX_POINTS) {
      finish();
      onNotice("한 획을 완성했어요. 이어서 새 획을 그려 주세요.");
    }
  }
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (e: Event) => {
      e.preventDefault();
      callbacks.current.onNotice(
        "3D 연결이 중단됐어요. 새로고침하면 다시 열 수 있어요.",
      );
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl]);
  return (
    <>
      <color attach="background" args={["#f3f1e9"]} />
      <ambientLight intensity={1.6} />
      <hemisphereLight args={["#fff9ec", "#c5bfaf", 1.5]} />
      <directionalLight
        position={[-3, 7, 4]}
        intensity={3}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <group position={[0, -0.28, 0]}>
        <RoundedBox
          args={[3, 0.25, 2.95]}
          radius={0.14}
          position={[0, 0.05, 0]}
          receiveShadow
        >
          <meshStandardMaterial color="#ded6c2" roughness={1} />
        </RoundedBox>
        {([-1, 1] as const).flatMap((side) => [
          <RoundedBox
            key={`x${side}`}
            args={[0.12, 0.28, 2.8]}
            radius={0.04}
            position={[side * 1.44, 0.26, 0]}
          >
            <meshStandardMaterial color="#e6dfcd" />
          </RoundedBox>,
          <RoundedBox
            key={`z${side}`}
            args={[2.8, 0.28, 0.12]}
            radius={0.04}
            position={[0, 0.26, side * 1.4]}
          >
            <meshStandardMaterial color="#e6dfcd" />
          </RoundedBox>,
        ])}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.184, 0]}
          receiveShadow
        >
          <planeGeometry args={[2.72, 2.66]} />
          <meshStandardMaterial color="#fffbed" />
        </mesh>
      </group>
      <mesh
        ref={mesh}
        position={[0, 0.325, 0]}
        castShadow
        receiveShadow
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={(e) => {
          if (pointerId.current === e.pointerId) {
            e.stopPropagation();
            finish();
            (e.target as unknown as HTMLElement).releasePointerCapture(
              e.pointerId,
            );
          }
        }}
      >
        <cylinderGeometry args={[1, 1, 0.65, 80]} />
        <meshStandardMaterial color={state.cake.color} roughness={0.78} />
      </mesh>
      {state.cake.cream !== "none" &&
        Array.from(
          { length: state.cake.cream === "shell" ? 32 : 40 },
          (_, i) => {
            const angle =
              (i / (state.cake.cream === "shell" ? 32 : 40)) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[
                  0.94 * Math.cos(angle),
                  0.68,
                  0.94 * Math.sin(angle),
                ]}
                rotation={[0, -angle, 0]}
                scale={
                  state.cake.cream === "shell"
                    ? [0.09, 0.07, 0.07]
                    : [0.06, 0.06, 0.06]
                }
                castShadow
              >
                <sphereGeometry args={[1, 12, 10]} />
                <meshStandardMaterial color="#fff7e3" roughness={0.8} />
              </mesh>
            );
          },
        )}
      <group visible={open}>
        <Lettering3D state={state} onError={onNotice} />
        <Label
          text={state.message}
          position={[
            0,
            -0.088,
            state.letteringPosition === "board" ? -1.17 : 1.17,
          ]}
          width={2.35}
          height={0.23}
          ink="#8a806f"
          size={65}
        />
        {state.strokes.map((s) => (
          <Cream key={s.id} stroke={s} />
        ))}
        {draft && <Cream stroke={draft} />}
        {state.toppings.map((t) => (
          <ToppingMesh key={t.id} item={t} />
        ))}
        <Candles3D
          config={state.candles}
          blown={blown}
          interactive={mode === "rotate" && open}
          onBlow={onBlow}
          onError={onNotice}
        />
      </group>
      <Lid open={open} />
      <OrbitControls
        makeDefault
        enabled={mode === "rotate" && open}
        enablePan={false}
        minDistance={4.1}
        maxDistance={7.8}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2 - 0.05}
        target={[0, 0.35, 0]}
        enableDamping
      />
    </>
  );
}
export default function CakeViewer3D(props: CakeViewer3DProps) {
  return (
    <div
      className={`cake-viewer-3d ${props.mode === "pipe" ? "piping" : ""}`}
      aria-label="3D 케이크 뷰어"
    >
      <WebGLBoundary>
        <Canvas
          shadows
          dpr={[1, 1.7]}
          camera={{ position: [3.2, 4.5, 5], fov: 40 }}
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          fallback={
            <p className="webgl-fallback">
              WebGL 지원 브라우저에서 3D 케이크를 열어 주세요.
            </p>
          }
        >
          <Scene {...props} />
        </Canvas>
      </WebGLBoundary>
      {!props.open && (
        <button className="open-3d-gift primary-button" onClick={props.onOpen}>
          선물 상자 열기 ♡
        </button>
      )}
    </div>
  );
}
