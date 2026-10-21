import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow dev-mode HMR WebSocket connections from LAN IP access
  // This prevents the "Loading ShopZilla..." hang when accessing via IP
  allowedDevOrigins: [
    "192.168.0.103",
    "192.168.0.*",
    "10.0.0.*",
    "172.16.*.*",
  ],
};

export default nextConfig;
