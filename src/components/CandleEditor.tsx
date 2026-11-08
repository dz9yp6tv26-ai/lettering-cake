"use client";
import { candleColors, candleShapes, type CandleConfig } from "@/lib/cake3d";
export default function CandleEditor({
  value,
  onChange,
}: {
  value: CandleConfig;
  onChange: (value: CandleConfig) => void;
}) {
  const update = (patch: Partial<CandleConfig>) =>
    onChange({ ...value, ...patch });
  const count = (n: number) =>
    update({
      count: Math.max(1, Math.min(99, Math.round(n))),
      positions: undefined,
    });
  return (
    <div className="candle-editor">
      <label className="decor-switch">
        <span>초 사용하기</span>
        <input
          type="checkbox"
          checked={value.enabled !== false}
          onChange={(e) => update({ enabled: e.target.checked })}
        />
      </label>
      <fieldset className="decor-field">
        <legend>초 모양 선택</legend>
        <div className="decoration-options">
          {candleShapes.map((shape) => (
            <button
              type="button"
              key={shape.value}
              aria-pressed={value.shape === shape.value}
              onClick={() => update({ shape: shape.value })}
            >
              {shape.label}
            </button>
          ))}
        </div>
      </fieldset>
      {value.shape === "number" && (
        <label className="number-candle-label">
          숫자 초에 표시할 숫자 (0~99)
          <input
            type="number"
            min={0}
            max={99}
            step={1}
            value={Number(value.number ?? "1")}
            onChange={(e) =>
              update({
                number: String(
                  Math.min(
                    99,
                    Math.max(0, Math.round(Number(e.target.value) || 0)),
                  ),
                ),
              })
            }
          />
        </label>
      )}
      <fieldset className="decor-field">
        <legend>초 개수 설정</legend>
        <div className="candle-counter">
          <button
            type="button"
            onClick={() => count(value.count - 1)}
            disabled={value.count === 1}
            aria-label="초 개수 줄이기"
          >
            −
          </button>
          <output aria-live="polite">{value.count}개</output>
          <button
            type="button"
            onClick={() => count(value.count + 1)}
            disabled={value.count === 99}
            aria-label="초 개수 늘리기"
          >
            +
          </button>
        </div>
        <input
          type="range"
          aria-label="초 개수"
          min={1}
          max={99}
          step={1}
          value={value.count}
          onChange={(e) => count(Number(e.target.value))}
        />
        <p>1~99개 · 개수에 맞춰 크기를 조절하고 원형으로 자동 배치해요.</p>
      </fieldset>
      <fieldset className="decor-field">
        <legend>초 색상 선택</legend>
        <div className="candle-colors">
          {candleColors.map((color) => (
            <button
              type="button"
              key={color.value}
              aria-label={`초 색상 ${color.name}`}
              aria-pressed={value.color === color.value}
              onClick={() => update({ color: color.value })}
            >
              <span style={{ background: color.value }} />
              {color.name}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="decor-field">
        <legend>촛불 불꽃 / 애니메이션</legend>
        <label className="decor-switch">
          <span>불꽃 켜기</span>
          <input
            type="checkbox"
            checked={value.isLit}
            onChange={(e) => update({ isLit: e.target.checked })}
          />
        </label>
        <label className="decor-switch">
          <span>반짝임과 Glow 효과</span>
          <input
            type="checkbox"
            checked={value.sparkle !== false}
            onChange={(e) => update({ sparkle: e.target.checked })}
          />
        </label>
        <p>선물을 받는 사람은 초를 눌러 촛불을 끌 수 있어요.</p>
      </fieldset>
    </div>
  );
}
