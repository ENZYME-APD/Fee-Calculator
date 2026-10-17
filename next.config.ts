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
  // The AI sign-in consent screen must never be shown inside another site's frame (clickjacking)
  async headers() {
    return [{
      source: '/oauth/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
      ],
    }];
  },
};

export default nextConfig;

