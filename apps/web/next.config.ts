import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@shopwise/contracts", "@shopwise/config", "@shopwise/utils"]
};

export default nextConfig;

