"use client";
import { useEffect, useMemo, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { Topping3D } from "@/lib/cake3d";
import {
  heartShape,
  roundedStarShape,
  flatCandyGeometry,
  strawberryGeometry,
  strawberryRadius,
  leafGeometry,
  petalGeometry,
  ribbonGeometry,
  stemGeometry,
} from "@/lib/decoration-geometry";

function StrawberrySeeds() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    if (!mesh.current) return;
    const dummy = new THREE.Object3D();
    let index = 0;
    for (let row = 0; row < 6; row++) {
      const y = 0.065 + row * 0.044;
      const count = 7 + Math.round(strawberryRadius(y) * 25);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (row % 2) * 0.3;
        const slope =
          (strawberryRadius(y + 0.001) - strawberryRadius(y - 0.001)) / 0.002;
        const normal = new THREE.Vector3(
          Math.cos(angle),
          -slope,
          Math.sin(angle),
        ).normalize();
        dummy.position
          .set(
            strawberryRadius(y) * Math.cos(angle),
            y,
            strawberryRadius(y) * Math.sin(angle),
          )
          .addScaledVector(normal, 0.002);
        dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        dummy.scale.set(0.006, 0.012, 0.003);
        dummy.updateMatrix();
        mesh.current.setMatrixAt(index++, dummy.matrix);
      }
    }
    mesh.current.count = index;
    mesh.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, 80]}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshStandardMaterial color="#f8d995" roughness={0.55} />
    </instancedMesh>
  );
}
export default function ToppingMesh({ item }: { item: Topping3D }) {
  const assets = useMemo(() => {
    switch (item.kind) {
      case "heart":
        return [flatCandyGeometry(heartShape(), 0.1)];
      case "star":
        return [flatCandyGeometry(roundedStarShape(), 0.08)];
      case "strawberry":
        return [strawberryGeometry(), leafGeometry()];
      case "rose":
        return [petalGeometry(), leafGeometry()];
      case "ribbon":
        return [
          ribbonGeometry(-1),
          ribbonGeometry(1),
          ribbonGeometry(-1, true),
          ribbonGeometry(1, true),
        ];
      case "cherry":
        return [stemGeometry(-1), stemGeometry(1), leafGeometry()];
    }
  }, [item.kind]);
  useEffect(() => () => assets.forEach((g) => g.dispose()), [assets]);
  return (
    <group
      name={`topping-${item.kind}`}
      position={item.position}
      rotation={item.rotation}
      scale={item.scale}
    >
      {(item.kind === "heart" || item.kind === "star") && (
        <mesh geometry={assets[0]} castShadow receiveShadow>
          <meshStandardMaterial
            color={item.kind === "heart" ? "#e78da6" : "#f3d579"}
            roughness={0.35}
            metalness={0.01}
          />
        </mesh>
      )}
      {item.kind === "cherry" && (
        <>
          {[-1, 1].map((side, i) => (
            <group key={side}>
              <mesh position={[side * 0.1, 0.13, 0]} castShadow>
                <sphereGeometry args={[0.13, 28, 20]} />
                <meshStandardMaterial color="#b92d44" roughness={0.2} />
              </mesh>
              <mesh geometry={assets[i]}>
                <meshStandardMaterial color="#587444" roughness={0.7} />
              </mesh>
            </group>
          ))}
          <mesh
            geometry={assets[2]}
            position={[0, 0.38, -0.025]}
            rotation={[0, 0.8, -0.3]}
            scale={0.6}
          >
            <meshStandardMaterial color="#688854" />
          </mesh>
        </>
      )}
      {item.kind === "strawberry" && (
        <>
          <mesh geometry={assets[0]} castShadow receiveShadow>
            <meshStandardMaterial color="#d94c55" roughness={0.3} />
          </mesh>
          <StrawberrySeeds />
          {Array.from({ length: 5 }, (_, i) => (
            <mesh
              key={i}
              geometry={assets[1]}
              position={[0, 0.338, 0]}
              rotation={[0, (i * Math.PI * 2) / 5, 0]}
              scale={0.8}
            >
              <meshStandardMaterial color="#65864b" roughness={0.6} />
            </mesh>
          ))}
        </>
      )}
      {item.kind === "rose" && (
        <>
          {Array.from({ length: 3 }, (_, ring) =>
            Array.from({ length: 5 + ring * 2 }, (_, i) => (
              <mesh
                key={`${ring}-${i}`}
                geometry={assets[0]}
                position={[0, (2 - ring) * 0.04, 0]}
                rotation={[
                  0,
                  (i * Math.PI * 2) / (5 + ring * 2) + ring * 0.4,
                  0,
                ]}
                scale={0.5 + ring * 0.25}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial
                  color={
                    ring === 0 ? "#d87e9b" : ring === 1 ? "#e89bb2" : "#efb1c3"
                  }
                  roughness={0.57}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )),
          )}
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              geometry={assets[1]}
              rotation={[0, side * 1.3, 0]}
              scale={1.35}
            >
              <meshStandardMaterial color="#8ca774" />
            </mesh>
          ))}
          <mesh position={[0, 0.13, 0]} scale={[0.035, 0.07, 0.035]}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshStandardMaterial color="#d87e9b" roughness={0.6} />
          </mesh>
        </>
      )}
      {item.kind === "ribbon" && (
        <>
          {assets.map((geometry, i) => (
            <mesh key={i} geometry={geometry} castShadow receiveShadow>
              <meshStandardMaterial color="#d98ea8" roughness={0.46} />
            </mesh>
          ))}
          <RoundedBox
            args={[0.13, 0.09, 0.12]}
            radius={0.035}
            position={[0, 0.085, 0]}
            castShadow
          >
            <meshStandardMaterial color="#e9a0b5" roughness={0.4} />
          </RoundedBox>
        </>
      )}
    </group>
  );
}
