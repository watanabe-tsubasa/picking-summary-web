import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  webpack: (config, { isServer }) => { if (isServer) { config.externals.push({ 'nodejs-polars': 'commonjs nodejs-polars' }); } return config }
};

export default nextConfig;
