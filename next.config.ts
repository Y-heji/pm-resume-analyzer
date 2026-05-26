import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist", "@react-pdf/renderer", "better-sqlite3"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
