# CLAUDE.md - React Chat Example

## Stack

- **React 19** + **TypeScript** + **Vite** (port 3000)
- **Tailwind CSS 3** with CSS variables for theming (light/dark)
- **shadcn/ui** (New York style, neutral base, Lucide icons)
- **Radix UI** primitives underneath shadcn components

## Commands

```bash
pnpm install    # Install deps
pnpm dev        # Dev server on :3000
pnpm build      # Typecheck + production build
pnpm typecheck  # TypeScript only
```

## shadcn/ui Usage

- Config: `components.json` (style: `new-york`, `rsc: false`)
- Add components: `npx shadcn@latest add <component>`
- UI components live in `src/components/ui/`
- Utility: `cn()` from `@/lib/utils` (clsx + tailwind-merge)

## Path Aliases

`@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.json`).

## Project Structure

```
src/
  pages/
    ChatRootPage.tsx      # Hooks-based chat (build from scratch with useAgnoChat)
    ChatComposedPage.tsx   # Compound component chat (AgnoChat from /ui)
  components/
    ui/             # shadcn components (57+) - do NOT hand-edit
    ai-elements/    # Chat-specific UI (message, response, tool, code-block)
    chat/           # ChatInterface, ChatInput, MessageItem, AudioRecorder
    config/         # ConfigPanel (endpoint, auth, mode settings)
    sessions/       # SessionSidebar (session list/management)
    debug/          # StateInspector (dev tool for events/state)
    generative-ui/  # Custom renderers (charts, card grids)
  hooks/            # use-mobile, use-toast
  tools/            # Example generative UI tool handlers
  lib/utils.ts      # cn() helper
  styles/globals.css # Tailwind base + CSS variables
```

## Styling Rules

- Use **Tailwind utility classes** for all styling. No inline styles or CSS modules.
- Use **CSS variables** defined in `globals.css` for colors (e.g., `bg-background`, `text-foreground`).
- Dark mode is handled via `.dark` class and CSS variable overrides.
- Always use `cn()` when conditionally merging classNames.

## Two Chat Approaches

The example app demonstrates two ways to build a chat UI:

1. **Chat (Root)** (`/chat-root`) — Uses hooks (`useAgnoChat`, `useAgnoSession`, etc.) with custom components. Full control over layout and behavior.
2. **Chat (Composed)** (`/chat-composed`) — Uses the `AgnoChat` compound component from `@rodrigocoliveira/agno-react/ui`. Pre-built UI with customization via props and slots.

## Key Conventions

- This project uses **workspace packages** from the parent monorepo (`@rodrigocoliveira/agno-client`, `agno-react`, `agno-types`). Build the monorepo root first with `pnpm build` if types are missing.
- Environment variables use `VITE_` prefix (e.g., `VITE_AGNO_ENDPOINT`).
- Forms use **react-hook-form** + **zod** for validation.
- Do not modify files in `src/components/ui/` by hand; use the shadcn CLI to update them.
