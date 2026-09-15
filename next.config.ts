import type { NextConfig } from "next";
import { cwd } from "node:process";

const onNetworkVolume = cwd().startsWith("/Volumes/");

const nextConfig: NextConfig = {
  serverExternalPackages: ["postgres"],
  /** Next 16 defaults to Turbopack; webpack config below is dev-only (network volume polling). */
  turbopack: {},
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
    /**
     * Artwork texture looks muddy at the Next default (AVIF @ q75, max 1920px).
     * WebP @ 90 plus retina widths keeps the same files, just less crushed.
     */
    formats: ["image/webp"],
    qualities: [90],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560, 3840],
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
