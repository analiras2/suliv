import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // The repository root, so Turbopack resolves `@suliv/error-codes` through
    // its `file:` symlink into ../packages (ADR-002). Pinning the root to the
    // admin folder stops resolution at its boundary.
    root: path.join(__dirname, ".."),
  },
};

export default nextConfig;
