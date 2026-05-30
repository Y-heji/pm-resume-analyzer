import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist", "@react-pdf/renderer"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
