import type { NextConfig } from "next";
import { cwd } from "node:process";

const onNetworkVolume = cwd().startsWith("/Volumes/");

const nextConfig: NextConfig = {
  serverExternalPackages: ["postgres"],
  experimental: {
    serverActions: {
      /** Art uploads via admin forms (default is 1mb). */
      bodySizeLimit: "12mb",
    },
  },
  /** Allow same-origin Geolocation API (some hosts default to a restrictive policy). */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Permissions-Policy", value: "geolocation=(self)" }],
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 828, 1080, 1200, 1920],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.wixstatic.com",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
  webpack: (config, { dev }) => {
    if (dev && onNetworkVolume) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 2000,
        aggregateTimeout: 500,
        ignored: ["**/node_modules/**", "**/.git/**", "**/.next/**"],
      };
    }
    return config;
  },
};

export default nextConfig;
