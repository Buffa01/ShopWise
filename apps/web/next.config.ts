import type { NextConfig } from "next";

const apiBaseUrl = process.env.INTERNAL_API_BASE_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  transpilePackages: ["@shopwise/contracts", "@shopwise/config", "@shopwise/utils"],
  async rewrites() {
    return [
      {
        source: "/v1/:path*",
        destination: `${apiBaseUrl}/v1/:path*`
      }
    ];
  }
};

export default nextConfig;
