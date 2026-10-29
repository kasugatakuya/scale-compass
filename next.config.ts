import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // すべてクライアント側で完結するため静的書き出し（どこにでも配置できる）
  output: "export",
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
