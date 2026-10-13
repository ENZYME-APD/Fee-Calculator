import type { NextConfig } from "next";

const nextConfig: any = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // firebase-admin/auth pulls in jwks-rsa -> jose's ESM build, which the
  // server bundler can't require() correctly, crashing any route that
  // imports it (e.g. /api/auth/provision) with ERR_REQUIRE_ESM. Excluding
  // firebase-admin from bundling makes it load natively from node_modules
  // at runtime instead, which doesn't have this problem.
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;

