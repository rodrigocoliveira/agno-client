import { defineConfig } from 'tsup';

export default defineConfig([
  // Main entry - hooks, context, utilities (unchanged behavior)
  {
    entry: { index: 'src/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    external: ['react'],
    clean: true,
  },
  // UI entry - pre-built components with Tailwind + shadcn
  {
    entry: { ui: 'src/ui/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    banner: { js: '"use client";' },
    external: [
      'react',
      // Mark the main package as external so hooks aren't bundled twice
      '@rodrigocoliveira/agno-react',
      '@rodrigocoliveira/agno-client',
      '@rodrigocoliveira/agno-types',
      // Radix primitives
      '@radix-ui/react-accordion',
      '@radix-ui/react-avatar',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-select',
      '@radix-ui/react-slot',
      '@radix-ui/react-tooltip',
      // Styling utilities
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      // Feature deps
      'lucide-react',
      'shiki',
      'streamdown',
      'use-stick-to-bottom',
      'cmdk',
    ],
  },
]);
