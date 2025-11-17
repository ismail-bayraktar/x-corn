import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Puppeteer için gerekli konfigürasyon (Next.js 16 yeni format)
  serverExternalPackages: ['puppeteer', 'puppeteer-core'],

  // Turbopack konfigürasyonu (Next.js 16 default)
  turbopack: {},

  // Webpack konfigürasyonu (fallback için)
  webpack: (config) => {
    // Puppeteer'ı webpack'ten hariç tut
    config.externals = [...(config.externals || []), 'puppeteer'];
    return config;
  },
};

export default nextConfig;
