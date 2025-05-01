import type { NextConfig } from "next"

const nextConfig = {
  devIndicators: false,
  reactStrictMode: false,

  webpack: (config: NextConfig) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }
    return config
  },
}

module.exports = nextConfig
