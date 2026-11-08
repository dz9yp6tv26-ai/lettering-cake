"use client";
import { useEffect, useMemo, useState } from "react";
import { parse, type Font } from "opentype.js";
import {
  buildLetteringGeometry,
  meshFontFiles,
} from "@/lib/lettering-geometry";
import {
  DEFAULT_LETTERING_COLOR,
  DEFAULT_LETTERING_POSITION,
} from "@/lib/lettering-style";
import type { Cake3DState } from "@/lib/cake3d";

const cache = new Map<string, Promise<Font>>();
function loadFont(url: string) {
  if (!cache.has(url))
    cache.set(
      url,
      fetch(url)
        .then((response) => {
          if (!response.ok) throw new Error("Font unavailable");
          return response.arrayBuffer();
        })
        .then((buffer) => parse(buffer))
        .catch((error) => {
          cache.delete(url);
          throw error;
        }),
    );
  return cache.get(url)!;
}
export default function Lettering3D({
  state,
  onError,
}: {
  state: Cake3DState;
  onError: (message: string) => void;
}) {
  const text = state.lettering;
  const fontId = state.letteringFont ?? "classic";
  const [faces, setFaces] = useState<{
    key: string;
    primary: Font;
    fallback: Font;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    if (!text.trim()) return;
    async function load() {
      const primary = await loadFont(meshFontFiles[fontId]);
      const needsFallback = Array.from(text.normalize("NFC")).some(
        (c) => c !== "\n" && !primary.charToGlyphIndex(c),
      );
      const fallback = needsFallback
        ? await loadFont(meshFontFiles.classic)
        : primary;
      if (!cancelled) setFaces({ key: fontId + text, primary, fallback });
    }
    load().catch(() => {
      if (!cancelled) {
        setFailed(true);
        onError(
          "입체 글자 폰트를 불러오지 못했어요. 연결을 확인하고 다시 선택해 주세요.",
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fontId, text, onError]);
  const geometry = useMemo(
    () =>
      faces?.key === fontId + text && !failed
        ? buildLetteringGeometry(
            text,
            faces.primary,
            faces.fallback,
            state.letteringPosition ?? DEFAULT_LETTERING_POSITION,
          )
        : null,
    [faces, fontId, text, failed, state.letteringPosition],
  );
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  return (
    <mesh name="cake-lettering-3d" geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={state.letteringColor ?? DEFAULT_LETTERING_COLOR}
        roughness={0.36}
        metalness={0.02}
      />
    </mesh>
  );
}
