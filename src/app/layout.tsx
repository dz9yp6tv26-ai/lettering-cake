import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "little wish · 작은 케이크, 커다란 마음",
  description: "나만의 레터링 케이크를 만들고 소중한 사람에게 선물하세요.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
