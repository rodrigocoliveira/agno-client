import { $ } from "bun";

// Clean dist
await $`rm -rf dist`;

// Main entry — hooks, context, utilities
await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  format: "cjs",
  packages: "external",
  sourcemap: "external",
});

await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  format: "esm",
  naming: "[name].mjs",
  packages: "external",
  sourcemap: "external",
});

// UI entry — pre-built components with "use client" banner
await Bun.build({
  entrypoints: ["./src/ui.ts"],
  outdir: "./dist",
  format: "cjs",
  banner: '"use client";',
  packages: "external",
  sourcemap: "external",
});

await Bun.build({
  entrypoints: ["./src/ui.ts"],
  outdir: "./dist",
  format: "esm",
  naming: "[name].mjs",
  banner: '"use client";',
  packages: "external",
  sourcemap: "external",
});

// Generate .d.ts files
await $`tsc -p tsconfig.build.json`;
