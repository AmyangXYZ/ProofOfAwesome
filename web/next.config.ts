import type { NextConfig } from "next"

const nextConfig = {
  webpack: (config: NextConfig) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }
    return config
  },
}

module.exports = nextConfig
