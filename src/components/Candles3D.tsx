"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { parse, type Font } from "opentype.js";
import * as THREE from "three";
import { candleLayout, type CandleConfig, type Vec3 } from "@/lib/cake3d";
import { makeCandleModel } from "@/lib/candle-geometry";

type Instance = { position: Vec3; scale: Vec3 };
function Instances({
  items,
  geometry,
  color,
  interactive,
  onBlow,
}: {
  items: Instance[];
  geometry: THREE.BufferGeometry;
  color: string;
  interactive?: boolean;
  onBlow?: () => void;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const dummy = new THREE.Object3D();
    items.forEach((item, i) => {
      dummy.position.fromArray(item.position);
      dummy.scale.fromArray(item.scale);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [items]);
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (interactive && e.delta < 5) {
      e.stopPropagation();
      onBlow?.();
    }
  };
  return (
    <instancedMesh
      name="candle-part"
      ref={mesh}
      args={[geometry, undefined, items.length]}
      frustumCulled={false}
      castShadow
      receiveShadow
      onClick={click}
    >
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.01} />
    </instancedMesh>
  );
}
let numberFont: Promise<Font> | undefined;
function loadNumberFont() {
  return (numberFont ??= fetch("/fonts/Fredoka-Variable.ttf")
    .then((r) => {
      if (!r.ok) throw new Error("Candle font unavailable");
      return r.arrayBuffer();
    })
    .then((buffer) => parse(buffer))
    .catch((e) => {
      numberFont = undefined;
      throw e;
    }));
}
function FlameInstances({
  config,
  layout,
  wick,
  lit,
}: {
  config: CandleConfig;
  layout: ReturnType<typeof candleLayout>;
  wick: Vec3;
  lit: boolean;
}) {
  const core = useRef<THREE.InstancedMesh>(null),
    glow = useRef<THREE.InstancedMesh>(null),
    sparks = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext("2d")!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,219,143,.8)");
    gradient.addColorStop(0.4, "rgba(255,177,64,.22)");
    gradient.addColorStop(1, "rgba(255,163,40,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  const reduced = useRef(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reduced.current = query.matches;
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useFrame(({ clock, camera }) => {
    if (!lit || !core.current) return;
    const animated = config.sparkle !== false && !reduced.current;
    const time = animated ? clock.elapsedTime : 0;
    layout.forEach(({ position, scale }, i) => {
      const x = position[0] + wick[0] * scale,
        y = position[1] + (wick[1] + 0.045) * scale,
        z = position[2];
      dummy.position.set(
        x + Math.sin(time * 5 + i) * 0.007 * scale,
        y + 0.055 * scale,
        z,
      );
      dummy.quaternion.identity();
      dummy.scale.set(
        0.03 * scale,
        (0.065 + Math.sin(time * 7 + i) * 0.008) * scale,
        0.03 * scale,
      );
      dummy.updateMatrix();
      core.current!.setMatrixAt(i, dummy.matrix);
      if (glow.current) {
        dummy.position.set(x, y + 0.04 * scale, z);
        dummy.quaternion.copy(camera.quaternion);
        dummy.scale.setScalar(0.34 * scale);
        dummy.updateMatrix();
        glow.current.setMatrixAt(i, dummy.matrix);
      }
      if (sparks.current)
        for (let j = 0; j < 3; j++) {
          const phase = (time * 0.55 + i * 0.17 + j / 3) % 1;
          dummy.quaternion.identity();
          dummy.position.set(
            x + Math.sin(i + j + time * 2) * 0.045 * scale,
            y + phase * 0.26 * scale,
            z + Math.cos(i + j + time) * 0.03 * scale,
          );
          dummy.scale.setScalar(animated ? 0.004 * scale * (1 - phase) : 0);
          dummy.updateMatrix();
          sparks.current.setMatrixAt(i * 3 + j, dummy.matrix);
        }
    });
    core.current.instanceMatrix.needsUpdate = true;
    if (glow.current) glow.current.instanceMatrix.needsUpdate = true;
    if (sparks.current) sparks.current.instanceMatrix.needsUpdate = true;
  });
  if (!lit) return null;
  return (
    <group name="candle-flames">
      <instancedMesh
        ref={core}
        args={[undefined, undefined, layout.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial
          color="#ffdc89"
          emissive="#ffad39"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </instancedMesh>
      {config.sparkle !== false && (
        <>
          <instancedMesh
            ref={glow}
            args={[undefined, undefined, layout.length]}
            frustumCulled={false}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={texture}
              transparent
              opacity={0.65}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </instancedMesh>
          <instancedMesh
            ref={sparks}
            args={[undefined, undefined, layout.length * 3]}
            frustumCulled={false}
          >
            <sphereGeometry args={[1, 6, 4]} />
            <meshBasicMaterial color="#ffe6ae" toneMapped={false} />
          </instancedMesh>
        </>
      )}
    </group>
  );
}
export default function Candles3D({
  config,
  blown,
  interactive,
  onBlow,
  onError,
}: {
  config?: CandleConfig;
  blown: boolean;
  interactive: boolean;
  onBlow: () => void;
  onError: (message: string) => void;
}) {
  const [font, setFont] = useState<Font>();
  useEffect(() => {
    if (config?.shape !== "number" || config.enabled === false) return;
    let cancelled = false;
    loadNumberFont()
      .then((face) => {
        if (!cancelled) setFont(face);
      })
      .catch(() => {
        if (!cancelled)
          onError("숫자 초 폰트를 불러오지 못했어요. 다시 선택해 주세요.");
      });
    return () => {
      cancelled = true;
    };
  }, [config?.shape, config?.enabled, onError]);
  const model = useMemo(
    () =>
      config ? makeCandleModel(config.shape, config.number ?? "1", font) : null,
    [config?.shape, config?.number, font],
  );
  const layout = useMemo(
    () => (config ? candleLayout(config) : []),
    [config?.count, config?.shape, config?.number, config?.positions],
  );
  const sphere = useMemo(() => new THREE.SphereGeometry(1, 12, 8), []);
  const wickGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.006, 0.006, 0.045, 6),
    [],
  );
  useEffect(() => () => model?.geometry.dispose(), [model]);
  useEffect(
    () => () => {
      sphere.dispose();
      wickGeometry.dispose();
    },
    [sphere, wickGeometry],
  );
  const parts = useMemo(() => {
    const base = (offset: Vec3, size: Vec3): Instance[] =>
      layout.map(({ position, scale }) => ({
        position: [
          position[0] + offset[0] * scale,
          position[1] + offset[1] * scale,
          position[2] + offset[2] * scale,
        ],
        scale: [size[0] * scale, size[1] * scale, size[2] * scale],
      }));
    return {
      body: base([0, 0, 0], [1, 1, 1]),
      wick: base(
        [model?.wick[0] ?? 0, (model?.wick[1] ?? 0.5) + 0.0225, 0],
        [1, 1, 1],
      ),
      eyes: [
        ...base([-0.053, 0.397, 0.053], [0.012, 0.013, 0.008]),
        ...base([0.053, 0.397, 0.053], [0.012, 0.013, 0.008]),
      ],
      muzzle: base([0, 0.355, 0.052], [0.043, 0.027, 0.012]),
      nose: base([0, 0.363, 0.064], [0.012, 0.009, 0.006]),
    };
  }, [layout, model]);
  if (!config || config.enabled === false || !model) return null;
  return (
    <group name="candles-3d">
      <Instances
        items={parts.body}
        geometry={model.geometry}
        color={config.color}
        interactive={interactive}
        onBlow={onBlow}
      />
      <Instances items={parts.wick} geometry={wickGeometry} color="#645446" />
      {config.shape === "bear" && (
        <>
          <Instances items={parts.muzzle} geometry={sphere} color="#fff0db" />
          <Instances
            items={[...parts.eyes, ...parts.nose]}
            geometry={sphere}
            color="#61433b"
          />
        </>
      )}
      <FlameInstances
        config={config}
        layout={layout}
        wick={model.wick}
        lit={config.isLit !== blown}
      />
    </group>
  );
}
