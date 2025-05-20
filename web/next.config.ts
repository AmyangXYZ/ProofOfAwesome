import type { NextConfig } from "next"

const nextConfig = {
  devIndicators: false,
  reactStrictMode: false,
  images: {
    domains: ["attachments.proof-of-awesome.app"],
  },

  webpack: (config: NextConfig) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }
    return config
  },
}

module.exports = nextConfig
