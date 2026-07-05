import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

const GTM_ID = "GTM-PD37QHP2";
const siteUrl = new URL("https://nepick.kr");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "NePick — 나만의 맛집 기록",
  description: "방문한 맛집과 카페를 기록하고, 내 취향에 맞는 맛집을 발견하세요.",
  keywords: ["맛집", "카페", "기록", "추천", "NePick", "네픽"],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "NePick — 나만의 맛집 기록",
    description: "방문한 맛집과 카페를 기록하고, 내 취향에 맞는 맛집을 발견하세요.",
    url: "/",
    siteName: "NePick",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NePick — 나만의 맛집 기록",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NePick — 나만의 맛집 기록",
    description: "방문한 맛집과 카페를 기록하고, 내 취향에 맞는 맛집을 발견하세요.",
    images: ["/og-image.png"],
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
      <body className="min-h-full bg-surface antialiased">
        <Script
          id="gtm-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
