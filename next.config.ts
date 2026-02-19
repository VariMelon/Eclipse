import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

module.exports = {
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
};
