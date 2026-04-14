import type { NextConfig } from "next";
import path from "path";

const appRoot = __dirname;

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
    // Ensure the web app always resolves its own pinned React runtime rather than
    // another workspace copy.
    webpackConfig.resolve.alias = {
      ...(webpackConfig.resolve.alias ?? {}),
      react: path.resolve(appRoot, "node_modules/react"),
      "react-dom": path.resolve(appRoot, "node_modules/react-dom"),
    };
    return webpackConfig;
  },
};

export default config;
