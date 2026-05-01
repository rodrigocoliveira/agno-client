import { $ } from "bun";

// Bun's JSX transform picks `react/jsx-runtime` vs `react/jsx-dev-runtime`
// based on NODE_ENV at process start. If NODE_ENV !== "production", the
// emitted bundle imports `jsxDEV`, which is missing in React production
// builds and crashes consumers (Vite/Laravel) at runtime.
if (process.env.NODE_ENV !== "production") {
  throw new Error(
    "build.ts must be run with NODE_ENV=production (the package.json `build` script sets this).",
  );
}

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
