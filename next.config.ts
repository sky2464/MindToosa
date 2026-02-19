import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // unsafe-eval required for Next.js HMR in dev; removed in production.
              // unsafe-inline is still needed until nonce-based CSP is implemented.
              isDev
                ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com"
                : "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data:",
              "font-src 'self'",
              "connect-src 'self' https://s3.us-west-2.amazonaws.com https://*.vercel-insights.com https://*.vercel-analytics.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
