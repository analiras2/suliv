import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@suliv/auth": path.resolve(__dirname, "../../packages/auth/src/index.ts"),
      "@suliv/db": path.resolve(__dirname, "../../packages/db/src/index.ts"),
      "@suliv/design-system": path.resolve(
        __dirname,
        "../../packages/design-system/src/index.ts"
      ),
    },
  },
});
