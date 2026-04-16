# Publishing the Packages

This repo ships three independent npm packages from a single Bun monorepo. They are always released together under the same version number.

| Package | Path | Depends on |
| --- | --- | --- |
| `@rodrigocoliveira/agno-types` | `packages/types` | — |
| `@rodrigocoliveira/agno-client` | `packages/core` | `agno-types` |
| `@rodrigocoliveira/agno-react` | `packages/react` | `agno-client`, `agno-types` |

The dependency order (`types → core → react`) is also the build and publish order.

## ⚠️ Critical: use pack-then-publish, never `bun publish` or bare `npm publish`

- **`npm publish`** run directly in a package dir does **not** rewrite the `workspace:*` protocol → ships broken tarballs.
- **`bun publish`** is also buggy and ships `workspace:*` unresolved (confirmed in v1.1.1 — broken).
- **`bun pm pack`** correctly rewrites `workspace:*` to concrete versions. Build a tarball with `bun pm pack`, then publish the tarball file with `npm publish <file>.tgz`.

Versions 1.1.0 and 1.1.1 were published with unresolved `workspace:*` and are deprecated.

## Prerequisites

- Logged in to npm as a user with publish rights on the `@rodrigocoliveira` scope: `npm whoami`
- Your authenticator app handy (npm will prompt for a 6-digit OTP on each publish)
- Clean working tree on `main`, up-to-date with `origin/main`
- Bun installed (`bun --version`)

## Release flow

```bash
# 1. Bump version in all three package.json files (same version everywhere)

# 2. Regenerate the lockfile so workspace resolution uses the new version
rm bun.lock && bun install

# 3. Build
bun run build

# 4. Pack each package (rewrites workspace:* → concrete version)
cd packages/types && bun pm pack
cd ../core        && bun pm pack
cd ../react       && bun pm pack

# 5. (Optional but recommended) verify no workspace:* leaked through
for pkg in types:types core:client react:react; do
  name=${pkg%:*}; short=${pkg#*:}
  tar -xzOf packages/$name/rodrigocoliveira-agno-$short-*.tgz package/package.json | grep workspace && echo "BROKEN in $name" || echo "$name OK"
done

# 6. Publish tarballs in dependency order (OTP prompt on each)
cd packages/types && npm publish rodrigocoliveira-agno-types-*.tgz --access public
cd ../core        && npm publish rodrigocoliveira-agno-client-*.tgz --access public
cd ../react       && npm publish rodrigocoliveira-agno-react-*.tgz --access public

# 7. Clean up tarballs
rm packages/types/*.tgz packages/core/*.tgz packages/react/*.tgz

# 8. Commit + tag + push
git add packages/types/package.json packages/core/package.json packages/react/package.json bun.lock
git commit -m "chore: bump all packages to vX.Y.Z"
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

## Versioning

Follows [semver](https://semver.org/):

- **patch** (`1.1.2 → 1.1.3`) — bug fixes, internal changes, schema alignment with Agno backend
- **minor** (`1.1.2 → 1.2.0`) — new public API, new hooks, new exports — backward compatible
- **major** (`1.1.2 → 2.0.0`) — breaking change to any exported type, hook, or method signature

All three packages share the same version, even if only one package changed. This keeps the install matrix simple for consumers.

## Deeper guide

For a step-by-step skill with recovery recipes for common failures, see `.claude/skills/publish-packages/SKILL.md`.
