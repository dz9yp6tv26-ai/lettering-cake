import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
// Official Google Fonts distributions; bundled for reliable, private font loading.
const gaegu = localFont({ src: "../../public/fonts/Gaegu-Regular.ttf", variable: "--font-gaegu", display: "swap", weight: "400", preload: false });
const jua = localFont({ src: "../../public/fonts/Jua-Regular.ttf", variable: "--font-jua", display: "swap", weight: "400", preload: false });
const gowun = localFont({ src: "../../public/fonts/GowunBatang-Regular.ttf", variable: "--font-gowun", display: "swap", weight: "400", preload: false });
const noto = localFont({ src: "../../public/fonts/NotoSansKR-Regular.ttf", variable: "--font-noto", display: "swap", weight: "400", preload: false });
const nanum = localFont({
  src: "../../public/fonts/NanumPenScript-Regular.ttf",
  variable: "--font-nanum",
  display: "swap",
  weight: "400",
});
const pacifico = localFont({
  src: "./fonts/Pacifico-Regular.ttf",
  variable: "--font-pacifico",
  display: "swap",
  weight: "400",
});
const fredoka = localFont({
  src: "./fonts/Fredoka-Variable.ttf",
  variable: "--font-fredoka",
  display: "swap",
  weight: "300 700",
});
const cherry = localFont({
  src: "./fonts/CherrySwash-Regular.ttf",
  variable: "--font-cherry",
  display: "swap",
  weight: "400",
});
const shrikhand = localFont({
  src: "./fonts/Shrikhand-Regular.ttf",
  variable: "--font-shrikhand",
  display: "swap",
  weight: "400",
});
export const metadata: Metadata = {
  title: "little wish · 작은 케이크, 커다란 마음",
  description: "나만의 레터링 케이크를 만들고 소중한 사람에게 선물하세요.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body
        className={`${gaegu.variable} ${jua.variable} ${gowun.variable} ${noto.variable} ${nanum.variable} ${pacifico.variable} ${fredoka.variable} ${cherry.variable} ${shrikhand.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
