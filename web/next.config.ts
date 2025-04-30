import type { NextConfig } from "next"

const nextConfig = {
  devIndicators: false,
  webpack: (config: NextConfig) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }
    return config
  },
}

module.exports = nextConfig
