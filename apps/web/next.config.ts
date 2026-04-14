import type { NextConfig } from "next";

const config: NextConfig = {
  // Allow Next.js webpack to import TypeScript source from workspace packages
  transpilePackages: ["@suliv/auth", "@suliv/db", "@suliv/design-system"],
  webpack: (webpackConfig) => {
    // Map .js imports to .ts counterparts so source re-exports like
    // `export * from "./jwt.js"` resolve correctly during next build
    webpackConfig.resolve.extensionAlias = {
      ".js": [".ts", ".js"],
      ".jsx": [".tsx", ".jsx"],
    };
    return webpackConfig;
  },
};

export default config;
