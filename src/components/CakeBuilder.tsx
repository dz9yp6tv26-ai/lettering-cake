"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Check,
  Gift,
  Heart,
  Link,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { toPng } from "html-to-image";
import dynamic from "next/dynamic";
import {
  MAX_STROKES,
  presetToppings,
  serializeCake3DState,
  type Cake3DState,
  type CreamStroke,
  type Topping3D,
} from "@/lib/cake3d";
const CakeViewer3D = dynamic(() => import("./CakeViewer3D"), {
  ssr: false,
  loading: () => (
    <div className="viewer-loading">달콤한 3D 케이크를 준비하고 있어요…</div>
  ),
});
import {
  colors,
  decodeCake,
  encodeCake,
  initialCake,
  type Cake,
} from "@/lib/cake";
const tabs = ["케이크 바탕", "크림 & 토핑", "레터링"] as const;
export default function CakeBuilder() {
  const [cake, setCake] = useState<Cake>(initialCake);
  const [strokes, setStrokes] = useState<CreamStroke[]>([]);
  const [toppings, setToppings] = useState<Topping3D[]>(() =>
    presetToppings(initialCake.topping),
  );
  const [mode, setMode] = useState<"rotate" | "pipe" | "place">("rotate");
  const [creamColor, setCreamColor] = useState("#fff7e3");
  const [creamRadius, setCreamRadius] = useState(0.035);
  const state3D = useMemo<Cake3DState>(
    () => ({
      schemaVersion: 1,
      coordinateSystem: "cake-local-y-up",
      cake: { radius: 1, height: 0.65, color: cake.color, cream: cake.cream },
      lettering: cake.lettering,
      message: cake.message,
      recipient: cake.recipient,
      strokes,
      toppings,
    }),
    [cake, strokes, toppings],
  );
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(true);
  const [blown, setBlown] = useState(false);
  const [receiver, setReceiver] = useState(false);
  const [modal, setModal] = useState(false);
  const [url, setUrl] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const preview = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function loadGift() {
      const raw = new URLSearchParams(window.location.hash.slice(1)).get(
        "gift",
      );
      setInvalid(false);
      if (!raw) {
        setReceiver(false);
        return;
      }
      const data = decodeCake(raw);
      if (data) {
        setCake(
          data.design3D
            ? {
                ...data,
                color: data.design3D.cake.color,
                cream: data.design3D.cake.cream,
                lettering: data.design3D.lettering,
                message: data.design3D.message,
                recipient: data.design3D.recipient,
              }
            : data,
        );
        setStrokes(data.design3D?.strokes ?? []);
        setToppings(data.design3D?.toppings ?? presetToppings(data.topping));
        setMode("rotate");
        setReceiver(true);
        setOpen(false);
        setBlown(false);
      } else {
        setReceiver(false);
        setInvalid(true);
      }
    }
    loadGift();
    window.addEventListener("hashchange", loadGift);
    return () => window.removeEventListener("hashchange", loadGift);
  }, []);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setModal(false);
      if (event.key !== "Tab") return;
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".share-modal button:not(:disabled), .share-modal input",
        ),
      );
      const first = elements[0],
        last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, [modal]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(id);
  }, [notice]);
  function update<K extends keyof Cake>(key: K, value: Cake[K]) {
    setCake((prev) => ({ ...prev, [key]: value }));
    if (key === "topping")
      setToppings(presetToppings(value as Cake["topping"]));
  }
  function finish() {
    const link = `${window.location.origin}${window.location.pathname}#gift=${encodeURIComponent(encodeCake({ ...cake, design3D: state3D }))}`;
    if (link.length > 8000)
      setNotice(
        "크림 궤적이 많아 링크가 길어요. 앱에 따라 공유가 제한될 수 있어요. JSON으로도 저장할 수 있어요.",
      );
    setUrl(link);
    setModal(true);
  }
  function exportJSON() {
    const blob = new Blob([serializeCake3DState(state3D)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "little-wish-3d.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setNotice("선물 링크를 복사했어요 ♡");
    } catch {
      setNotice("아래 링크를 직접 선택해 복사해 주세요.");
    }
  }
  async function download() {
    if (!preview.current) return;
    setBusy(true);
    try {
      const data = await toPng(preview.current, {
        pixelRatio: 2,
        backgroundColor: "#f7f3eb",
      });
      const a = document.createElement("a");
      a.href = data;
      a.download = "little-wish.png";
      a.click();
      setNotice("케이크 이미지를 저장했어요.");
    } catch {
      setNotice("이미지 저장에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }
  async function share() {
    try {
      if (navigator.share)
        await navigator.share({
          title: "당신에게 도착한 작은 케이크 ♡",
          text: "상자를 열고 내 마음을 확인해 줘!",
          url,
        });
      else await copy();
    } catch (e) {
      if ((e as Error).name !== "AbortError")
        setNotice("공유 링크를 복사해서 보내 주세요.");
    }
  }
  return (
    <>
      <header className="site-header">
        <a href="/" className="brand">
          little wish<span>✳</span>
        </a>
        <nav>
          <span className="nav-active">케이크 만들기</span>
          <button
            onClick={() =>
              setNotice(
                "케이크를 꾸미고 완성하면 링크로 마음을 전할 수 있어요.",
              )
            }
            className="about-link"
          >
            little wish 이야기 <Heart size={14} />
          </button>
        </nav>
      </header>
      <main>
        <div className="page-intro">
          <div className="eyebrow">
            <span /> A LITTLE CAKE, A LOT OF LOVE
          </div>
          <h1>
            {receiver ? (
              "당신에게 도착한 작은 마음"
            ) : (
              <>
                작은 케이크에,
                <br className="mobile-break" /> 마음을 담아.
              </>
            )}
          </h1>
          <p>
            {receiver
              ? "상자를 열어 소중한 사람의 마음을 확인해 보세요."
              : "세상에 하나뿐인 케이크를 만들고, 소중한 사람에게 선물하세요."}
          </p>
        </div>
        {invalid && (
          <p role="alert" className="error-banner">
            선물 링크를 읽을 수 없어요. 새로운 케이크를 만들어 보세요.
          </p>
        )}
        <div className={`studio ${receiver ? "receiver-studio" : ""}`}>
          <section className="preview-panel" aria-label="케이크 미리보기">
            <div className="preview-top">
              <span>
                <span className="live-dot" />
                {receiver ? "A GIFT FOR YOU" : "YOUR LITTLE CAKE"}
              </span>
              <span className="hand-note">a little piece of happiness ↙</span>
            </div>
            <div ref={preview} className="capture-area">
              <CakeViewer3D
                state={state3D}
                mode={receiver ? "rotate" : mode}
                creamColor={creamColor}
                creamRadius={creamRadius}
                onStroke={(stroke) =>
                  setStrokes((previous) =>
                    previous.length < MAX_STROKES
                      ? [...previous, stroke]
                      : previous,
                  )
                }
                onPlace={(point) =>
                  setToppings((previous) =>
                    previous.map((t, i) =>
                      i === 0 ? { ...t, position: point } : t,
                    ),
                  )
                }
                onNotice={setNotice}
                open={open}
                blown={blown}
                onOpen={() => setOpen(true)}
                onBlow={() => {
                  setBlown(!blown);
                  if (!blown) setNotice("소원이 이루어지길 바라요 ✨");
                }}
              />
            </div>
            {!receiver && (
              <div className="piping-toolbar" aria-label="3D 꾸미기 도구">
                <div className="mode-buttons">
                  {(
                    [
                      { value: "rotate", label: "360° 회전" },
                      { value: "pipe", label: "크림 짜기" },
                      { value: "place", label: "토핑 옮기기" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.value}
                      aria-pressed={mode === item.value}
                      onClick={() => {
                        setMode(item.value);
                        setOpen(true);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                {mode === "pipe" && (
                  <>
                    <div className="cream-tools">
                      <label>
                        크림 색{" "}
                        <input
                          type="color"
                          aria-label="크림 색"
                          value={creamColor}
                          onChange={(e) => setCreamColor(e.target.value)}
                        />
                      </label>
                      <label>
                        굵기{" "}
                        <input
                          type="range"
                          aria-label="크림 굵기"
                          min="0.015"
                          max="0.08"
                          step="0.005"
                          value={creamRadius}
                          onChange={(e) =>
                            setCreamRadius(Number(e.target.value))
                          }
                        />
                      </label>
                    </div>
                    <p>
                      케이크 윗면이나 옆면을 드래그하세요. 회전 모드로 각도를
                      바꿀 수 있어요.
                    </p>
                  </>
                )}
                {mode === "place" && (
                  <p>케이크 윗면을 눌러 선택한 토핑을 옮기세요.</p>
                )}
                <div className="stroke-actions">
                  <span>
                    크림 {strokes.length}/{MAX_STROKES}획
                  </span>
                  <button
                    disabled={!strokes.length}
                    onClick={() => setStrokes((s) => s.slice(0, -1))}
                  >
                    한 획 취소
                  </button>
                  <button
                    disabled={!strokes.length}
                    onClick={() => setStrokes([])}
                  >
                    크림 지우기
                  </button>
                  <button onClick={exportJSON}>3D JSON 저장</button>
                </div>
              </div>
            )}
            {open && toppings.some((t) => t.kind === "candle") && (
              <button
                className="blow-candle"
                onClick={() => {
                  setBlown(!blown);
                  if (!blown) setNotice("소원이 이루어지길 바라요 ✨");
                }}
              >
                {blown ? "촛불 다시 켜기" : "촛불 끄고 소원 빌기"}
              </button>
            )}
            <div className="preview-bottom">
              <span className="preview-caption">
                <Heart size={13} /> 정성을 담아, 오직 너를 위해
              </span>
              <button
                title="상자 다시 열어보기"
                aria-label="상자 다시 열어보기"
                onClick={() => {
                  setOpen(false);
                  setBlown(false);
                }}
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </section>
          {receiver ? (
            <section className="gift-message">
              <span className="eyebrow">JUST FOR YOU</span>
              <h2>
                {cake.recipient ? `${cake.recipient}에게` : "소중한 당신에게"} ♡
              </h2>
              <p>{open ? cake.message : "상자를 눌러 열어 주세요."}</p>
              {open && cake.topping === "candle" && (
                <p className="helper">촛불을 눌러 소원을 빌어보세요.</p>
              )}
              <a className="primary-button" href="/">
                나도 케이크 만들기 <ArrowRight size={17} />
              </a>
            </section>
          ) : (
            <section className="editor-panel">
              <div className="editor-heading">
                <div>
                  <span className="eyebrow">CAKE ATELIER</span>
                  <h2>어떤 마음을 담아볼까요?</h2>
                </div>
                <span className="step-count">
                  0{tab + 1}
                  <span> / 03</span>
                </span>
              </div>
              <div className="tabs" role="tablist">
                {tabs.map((label, i) => (
                  <button
                    key={label}
                    role="tab"
                    aria-selected={tab === i}
                    onClick={() => setTab(i)}
                    className={tab === i ? "selected" : ""}
                  >
                    <span>0{i + 1}</span>
                    {label}
                  </button>
                ))}
              </div>
              <div className="editor-content" role="tabpanel">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                  >
                    {tab === 0 && (
                      <>
                        <div className="field-title">
                          <h3>케이크 바탕색</h3>
                          <span>오늘의 마음은 무슨 색인가요?</span>
                        </div>
                        <div className="color-grid">
                          {colors.map((color) => (
                            <button
                              key={color.value}
                              className={`color-option ${cake.color === color.value ? "chosen" : ""}`}
                              onClick={() => update("color", color.value)}
                              aria-pressed={cake.color === color.value}
                            >
                              <span
                                className="swatch"
                                style={{ background: color.value }}
                              >
                                {cake.color === color.value && (
                                  <Check size={21} />
                                )}
                              </span>
                              <span>{color.name}</span>
                            </button>
                          ))}
                        </div>
                        <div className="atelier-tip">
                          <Sparkles size={18} />
                          <div>
                            <strong>조금 서툴러도 괜찮아요.</strong>
                            <p>당신의 마음이 가장 예쁜 데코레이션이니까요.</p>
                          </div>
                        </div>
                      </>
                    )}
                    {tab === 1 && (
                      <>
                        <div className="field-title">
                          <h3>생크림 테두리</h3>
                          <span>달콤함을 한 겹 더</span>
                        </div>
                        <div className="choice-grid">
                          {(
                            [
                              { value: "shell", label: "〰 쉘 크림" },
                              { value: "pearl", label: "◌ 진주 크림" },
                              { value: "none", label: "○ 깔끔하게" },
                            ] as const
                          ).map((x) => (
                            <button
                              className={
                                cake.cream === x.value
                                  ? "choice active"
                                  : "choice"
                              }
                              key={x.value}
                              onClick={() => update("cream", x.value)}
                              aria-pressed={cake.cream === x.value}
                            >
                              {x.label}
                            </button>
                          ))}
                        </div>
                        <div className="field-title topping-title">
                          <h3>작은 포인트</h3>
                          <span>마지막 한 스푼의 귀여움</span>
                        </div>
                        <div className="choice-grid">
                          {(
                            [
                              { value: "cherry", label: "🍒", name: "체리" },
                              { value: "candle", label: "🕯️", name: "초" },
                              { value: "heart", label: "💕", name: "하트" },
                            ] as const
                          ).map((x) => (
                            <button
                              className={
                                cake.topping === x.value
                                  ? "choice topping active"
                                  : "choice topping"
                              }
                              key={x.value}
                              onClick={() => {
                                update("topping", x.value);
                                setBlown(false);
                              }}
                              aria-pressed={cake.topping === x.value}
                            >
                              <span>{x.label}</span>
                              {x.name}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    {tab === 2 && (
                      <>
                        <label className="input-label" htmlFor="lettering">
                          케이크 위 레터링{" "}
                          <span>{cake.lettering.length}/30</span>
                        </label>
                        <textarea
                          id="lettering"
                          maxLength={30}
                          rows={2}
                          value={cake.lettering}
                          onChange={(e) => update("lettering", e.target.value)}
                          placeholder="happy birthday"
                        />
                        <label className="input-label" htmlFor="message">
                          케이크 판에 남기는 마음{" "}
                          <span>{cake.message.length}/100</span>
                        </label>
                        <textarea
                          id="message"
                          maxLength={100}
                          rows={2}
                          value={cake.message}
                          onChange={(e) => update("message", e.target.value)}
                        />
                        <label className="input-label" htmlFor="recipient">
                          받는 사람 <span>선택</span>
                        </label>
                        <input
                          id="recipient"
                          maxLength={20}
                          value={cake.recipient}
                          onChange={(e) => update("recipient", e.target.value)}
                          placeholder="소중한 사람의 이름"
                        />
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="editor-footer">
                <div className="progress-dots">
                  {tabs.map((_, i) => (
                    <span key={i} className={i === tab ? "current" : ""} />
                  ))}
                </div>
                {tab > 0 && (
                  <button
                    className="back-button"
                    onClick={() => setTab(tab - 1)}
                    aria-label="이전 단계"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <button
                  className="primary-button"
                  onClick={() => (tab < 2 ? setTab(tab + 1) : finish())}
                >
                  {tab < 2 ? "다음 단계" : "케이크 완성하기"}
                  {tab < 2 ? <ArrowRight size={17} /> : <Gift size={17} />}
                </button>
              </div>
            </section>
          )}
        </div>
        <div className="below-studio">
          <span>
            <span>✧</span> 칼로리는 0, 마음은 가득.
          </span>
          <p>직접 만든 작은 행복을 링크 하나로 전해보세요.</p>
        </div>
        <footer>
          <span className="brand footer-brand">
            little wish<span>✳</span>
          </span>
          <span>작고 다정한 마음이 오가는 곳</span>
          <span>© {new Date().getFullYear()} little wish</span>
        </footer>
      </main>
      <AnimatePresence>
        {notice && (
          <motion.div
            role="status"
            className="toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {notice}
          </motion.div>
        )}
        {modal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModal(false)}
          >
            <section
              className="share-modal"
              role="dialog"
              aria-modal="true"
              aria-label="케이크 선물하기"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Escape") setModal(false);
              }}
            >
              <button
                className="close-modal"
                autoFocus
                onClick={() => setModal(false)}
                aria-label="닫기"
              >
                <X size={20} />
              </button>
              <div className="gift-icon">
                <Gift size={28} />
              </div>
              <span className="eyebrow">BAKED WITH LOVE</span>
              <h2>마음을 전할 준비가 됐어요!</h2>
              <p>
                링크를 열면 선물 상자가 도착해요.
                <br />
                소중한 사람에게 작은 행복을 보내보세요.
              </p>
              <label className="sr-only" htmlFor="gift-url">
                공유 링크
              </label>
              <input
                id="gift-url"
                value={url}
                readOnly
                onFocus={(e) => e.target.select()}
              />
              <button className="primary-button" onClick={copy}>
                <Link size={16} /> 선물 링크 복사
              </button>
              <div className="share-actions">
                <button onClick={download} disabled={busy}>
                  {busy ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <ArrowDownToLine size={16} />
                  )}
                  이미지 저장
                </button>
                <button onClick={share}>
                  <Heart size={16} />
                  마음 공유하기
                </button>
              </div>
              <small>
                링크에 케이크가 담겨요. 별도 가입 없이 열 수 있어요.
              </small>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
