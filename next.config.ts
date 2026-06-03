import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist", "@react-pdf/renderer", "puppeteer-core", "@sparticuz/chromium"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
