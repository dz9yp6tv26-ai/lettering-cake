"use client";
import { toppingPresets, type Topping3D, type ToppingKind } from "@/lib/cake3d";
export default function ToppingEditor({
  toppings,
  selectedId,
  onSelect,
  onChoose,
  onAdd,
  onRemove,
  onPlace,
}: {
  toppings: Topping3D[];
  selectedId: string;
  onSelect: (id: string) => void;
  onChoose: (kind: ToppingKind) => void;
  onAdd: () => void;
  onRemove: () => void;
  onPlace: () => void;
}) {
  const active = toppings.find((t) => t.id === selectedId);
  return (
    <fieldset className="decor-field topping-editor">
      <legend>토핑 꾸미기</legend>
      <div className="decoration-options topping-options">
        {toppingPresets.map((p) => (
          <button
            type="button"
            key={p.kind}
            aria-pressed={active?.kind === p.kind}
            onClick={() => onChoose(p.kind)}
          >
            <span>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>
      <div className="topping-actions">
        <label>
          선택한 토핑
          <select
            value={active?.id ?? ""}
            onChange={(e) => onSelect(e.target.value)}
          >
            {!toppings.length && <option value="">토핑 없음</option>}
            {toppings.map((t, i) => (
              <option key={t.id} value={t.id}>
                {i + 1}. {toppingPresets.find((p) => p.kind === t.kind)?.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={onAdd} disabled={toppings.length >= 12}>
          토핑 추가
        </button>
        <button type="button" onClick={onRemove} disabled={!active}>
          선택 삭제
        </button>
      </div>
      <button
        type="button"
        className="move-topping-button"
        disabled={!active}
        onClick={onPlace}
      >
        선택한 토핑 옮기기
      </button>
      <p>
        최대 12개 · 종류를 누르면 선택한 토핑이 바뀝니다. 옮기기를 누른 뒤
        케이크 윗면을 터치하세요.
      </p>
    </fieldset>
  );
}
