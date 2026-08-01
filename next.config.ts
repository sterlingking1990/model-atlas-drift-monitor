import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // model-atlas is server-only (fs/network-touching, ESM/NodeNext) — keep
  // the bundler out of its way rather than trying to bundle it for the client.
  serverExternalPackages: ["model-atlas"],
};

export default nextConfig;
