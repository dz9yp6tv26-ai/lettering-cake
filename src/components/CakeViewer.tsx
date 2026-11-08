"use client";
import { motion } from "framer-motion";
import type { Cake } from "@/lib/cake";
export default function CakeViewer({
  cake,
  open,
  blown,
  onOpen,
  onBlow,
}: {
  cake: Cake;
  open: boolean;
  blown: boolean;
  onOpen: () => void;
  onBlow: () => void;
}) {
  return (
    <div className="cake-scene">
      <div className="box-lid">
        <span className="lid-line" />
        <span className="lid-label">made with love</span>
        <span className="lid-line" />
      </div>
      <div className="lunch-box">
        <div className="paper">
          <div className="cake-shadow" />
          <div className="cake-side" style={{ background: cake.color }} />
          <div className="cake-top" style={{ background: cake.color }}>
            {cake.cream !== "none" &&
              Array.from(
                { length: cake.cream === "shell" ? 28 : 36 },
                (_, i) => {
                  const angle =
                    (i / (cake.cream === "shell" ? 28 : 36)) * Math.PI * 2;
                  return (
                    <span
                      key={i}
                      className={`cream ${cake.cream}`}
                      style={{
                        left: `${50 + 45 * Math.cos(angle)}%`,
                        top: `${50 + 44 * Math.sin(angle)}%`,
                        transform: `translate(-50%, -50%) rotate(${(angle * 180) / Math.PI + 90}deg)`,
                      }}
                    />
                  );
                },
              )}
            <div className="cake-lettering">
              {cake.lettering || "your wish"}
            </div>
            {cake.topping === "cherry" && (
              <div className="cherries">
                <i />
                <i />
                <span />
                <span />
              </div>
            )}
            {cake.topping === "heart" && (
              <div className="heart-toppings">
                <span>♥</span>
                <span>♥</span>
                <span>♥</span>
              </div>
            )}
            {cake.topping === "candle" && (
              <button
                className="candle"
                onClick={onBlow}
                aria-label={blown ? "촛불 다시 켜기" : "촛불 끄기"}
              >
                {!blown && <span className="flame" />}
                <span className="wick" />
              </button>
            )}
            <span className="sprinkle s1" />
            <span className="sprinkle s2" />
            <span className="sprinkle s3" />
            <span className="sprinkle s4" />
          </div>
          <div className="board-message">{cake.message}</div>
        </div>
      </div>
      <motion.button
        className="closed-lid"
        initial={false}
        animate={{ rotateX: open ? -115 : 0, opacity: open ? 0 : 1 }}
        transition={{ duration: 0.8 }}
        onClick={onOpen}
        style={{ pointerEvents: open ? "none" : "auto" }}
        aria-label="선물 상자 열기"
      >
        <span>little wish</span>
        <small>
          당신을 위한 작은 선물
          <br />
          눌러서 열어보세요 ♡
        </small>
      </motion.button>
    </div>
  );
}
