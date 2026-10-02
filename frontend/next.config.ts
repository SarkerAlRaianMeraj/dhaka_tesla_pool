import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone containing only the files the runtime container needs.
  output: "standalone",
};

export default nextConfig;