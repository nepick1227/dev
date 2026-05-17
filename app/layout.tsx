import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NePick — 나만의 맛집 기록",
  description: "방문한 맛집과 카페를 기록하고, 내 취향에 맞는 맛집을 발견하세요.",
  keywords: ["맛집", "카페", "기록", "추천", "NePick", "네픽"],
  openGraph: {
    title: "NePick — 나만의 맛집 기록",
    description: "방문한 맛집과 카페를 기록하고, 내 취향에 맞는 맛집을 발견하세요.",
    siteName: "NePick",
    locale: "ko_KR",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#D32F2F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full bg-surface antialiased">{children}</body>
    </html>
  );
}
