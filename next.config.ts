import type { NextConfig } from "next";

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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com", // Vercel Analytics/Speed Insights
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data:",
              "font-src 'self'",
              "connect-src 'self' https://s3.us-west-2.amazonaws.com https://*.vercel-insights.com https://*.vercel-analytics.com", // Allow Supabase/AWS and Vercel Analytics
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
