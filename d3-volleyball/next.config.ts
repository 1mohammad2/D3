import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

// ✅ Fix: apply next-intl plugin AFTER defining config
// Using require() avoids the __esModule TypeScript issue
const withNextIntl = require("next-intl/plugin")();

module.exports = withNextIntl(nextConfig);

