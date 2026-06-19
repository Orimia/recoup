import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg uses dynamic requires; keep it as a runtime dependency, not bundled.
  serverExternalPackages: ["pg"],
};

export default nextConfig;
