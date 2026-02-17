import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "bin/claw": "bin/claw.ts",
  },
  format: ["esm"],
  target: "node20",
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  banner: {
    js: "// ClaudeClaw — Open-Source Personal AI Assistant",
  },
});
