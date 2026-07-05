import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require("./package.json") as { version: string };

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  ...(!isDev && {
    async headers() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "https://*.supabase.co";
      const csp = [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        [
          "script-src",
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://dapi.kakao.com",
          "https://*.daumcdn.net",
          "https://www.googletagmanager.com",
        ].join(" "),
        [
          "style-src",
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
        ].join(" "),
        [
          "font-src",
          "'self'",
          "data:",
          "https://cdn.jsdelivr.net",
        ].join(" "),
        [
          "img-src",
          "'self'",
          "data:",
          "blob:",
          supabaseOrigin,
          "https://*.supabase.co",
          "https://*.daumcdn.net",
          "https://*.kakao.com",
          "https://*.kakaocdn.net",
          "https://www.googletagmanager.com",
          "https://www.google-analytics.com",
        ].join(" "),
        [
          "connect-src",
          "'self'",
          supabaseOrigin,
          "https://*.supabase.co",
          "wss://*.supabase.co",
          "https://dapi.kakao.com",
          "https://*.kakao.com",
          "https://*.daum.net",
          "https://*.daumcdn.net",
          "https://www.googletagmanager.com",
          "https://www.google-analytics.com",
          "https://analytics.google.com",
        ].join(" "),
      ].join("; ");

      return [
        {
          source: "/(.*)",
          headers: [
            { key: "Content-Security-Policy", value: csp },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "X-Frame-Options", value: "DENY" },
            { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=()" },
            { key: "Strict-Transport-Security", value: "max-age=31536000" },
          ],
        },
      ];
    },
  }),
};

export default nextConfig;
