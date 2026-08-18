import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
      {
        source: "/videos/:path*",
        destination: "http://127.0.0.1:8000/videos/:path*",
      },
      {
        source: "/media/:path*",
        destination: "http://127.0.0.1:8000/api/v1/media/:path*",
      },
    ];
  },
};

export default nextConfig;
