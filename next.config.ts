import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Routes exposed under the versioned prefix (/api/v1/)
// New external clients should use /api/v1/; /api/ remains for internal use.
const API_ROUTES = [
  "tasks",
  "tasks/:taskId",
  "tasks/:taskId/subtasks",
  "tasks/:taskId/dependencies",
  "goals",
  "goals/:id",
  "projects",
  "projects/:id",
  "spaces",
  "spaces/:id",
  "labels",
  "labels/:id",
  "trash",
  "notifications",
  "search",
  "focus",
  "gamification",
  "plan/daily",
  "support",
];

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return API_ROUTES.map((route) => ({
      source: `/api/v1/${route}`,
      destination: `/api/${route}`,
    }));
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
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
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
