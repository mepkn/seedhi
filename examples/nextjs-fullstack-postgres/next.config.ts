import type { NextConfig } from "next";

// `standalone` makes `next build` write .next/standalone: a server.js plus only
// the node_modules files the app actually uses, so the Docker image needs no
// `npm install` and no full node_modules (lesson 2.1).
const nextConfig: NextConfig = {
  output: "standalone",
  // The app has no <Image>; without the optimizer the standalone output can
  // leave out sharp and its 45 MB of native libraries.
  images: { unoptimized: true },
  outputFileTracingExcludes: { "*": ["node_modules/sharp/**", "node_modules/@img/**"] },
};

export default nextConfig;
