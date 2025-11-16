import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Puppeteer için gerekli konfigürasyon
  experimental: {
    serverComponentsExternalPackages: ['puppeteer'],
  },

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
