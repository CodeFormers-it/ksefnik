# Releasing Ksefnik packages

This repository uses a **two-branch release model**:

- **`main`** — development branch. Every merge here bumps the **patch** version of all `@ksefnik/*` packages. **Nothing is published.**
- **`prod`** — release branch. Every merge here bumps the **minor** version of all packages, publishes them to npm, tags the release, and opens a sync PR back to `main`.

**You always decide when to publish.** Publication happens only when you merge `main` → `prod`.

## Flow diagram

```
feature/xyz ──PR──▶ main              (patch bump, no publish)
                     │
                     │  when ready to release:
                     ▼
                    prod              (minor bump + npm publish)
                     │
                     │ auto-opens sync PR
                     ▼
                    main              (versions in sync with npm)
```

## Version bumping rules

| Event | Branch | Bump | Published |
|---|---|---|---|
| PR merged to `main` | `main` | `patch` (0.0.1 → 0.0.2) | ❌ no |
| PR merged to `prod` | `prod` | `minor` (0.0.5 → 0.1.0) | ✅ all 6 packages |

All 6 packages always get the same version bump. This keeps the monorepo simple and avoids dependency drift.

## First-time setup (once)

### 1. Create the `prod` branch

```bash
git checkout main
git pull
git checkout -b prod
git push -u origin prod
```

### 2. Add `NPM_TOKEN` as a GitHub secret

Go to https://github.com/CodeFormers-it/ksefnik/settings/secrets/actions and create a new repository secret:

- **Name**: `NPM_TOKEN`
- **Value**: Granular Access Token from https://www.npmjs.com/settings/~/tokens with:
  - **Packages and scopes** → `Read and write` on `@ksefnik`
  - **Organizations** → `Read` on `ksefnik`
  - **Bypass 2FA** → ✅ checked
  - **Expiration** → 90 days (rotate when it expires)

### 3. Enable branch protection (recommended)

On https://github.com/CodeFormers-it/ksefnik/settings/branches protect both `main` and `prod`:

- Require pull request before merging
- Require status checks to pass (CI)
- For `prod`: restrict who can push (only maintainers)

## Daily development workflow

### Making changes

```bash
git checkout main
git pull
git checkout -b feature/something

# ...make changes, commit...

git push -u origin feature/something
gh pr create --base main
```

When the PR is merged to `main`, the `Bump patch on main` workflow automatically:

1. Runs `node scripts/bump-version.mjs patch`
2. Commits the version bumps to `main` as `chore: bump dev version to X.Y.Z [skip bump] [skip ci]`
3. Pushes back to `main`

**Nothing is published.** The version on `main` is purely for tracking dev progress.

### Releasing to npm

When you want to publish the accumulated changes:

```bash
git checkout prod
git pull
git merge main
git push origin prod
```

Or open a PR `main` → `prod` via GitHub UI and merge it.

The `Release to npm (prod)` workflow then:

1. Runs typecheck + tests
2. Bumps all packages minor (e.g., `0.0.5` → `0.1.0`)
3. Builds all packages
4. Publishes each to npm with [provenance](https://docs.npmjs.com/generating-provenance-statements) (GitHub-signed)
5. Commits version bumps + tag `v0.1.0` to `prod`
6. Creates a GitHub Release with auto-generated notes
7. Opens a sync PR `prod` → `main` titled `chore: sync versions from prod v0.1.0`

**Merge the sync PR** afterwards so `main`'s version state matches what's published on npm. Otherwise the next patch bump on `main` will be lower than the latest published version.

## Bump script

[scripts/bump-version.mjs](scripts/bump-version.mjs) is the single source of truth for version bumping. It can be run locally for testing:

```bash
# Bump all packages patch (0.0.1 → 0.0.2)
node scripts/bump-version.mjs patch

# Bump minor (0.0.5 → 0.1.0)
node scripts/bump-version.mjs minor

# Bump major (0.9.2 → 1.0.0)
node scripts/bump-version.mjs major
```

It modifies every `packages/*/package.json` in place. Revert with `git checkout packages/*/package.json` if you ran it by accident.

## Major releases

The automation only bumps patch (on `main`) and minor (on `prod`). For a **major release** (breaking change):

1. Checkout prod manually: `git checkout prod && git pull`
2. Run `node scripts/bump-version.mjs major` locally
3. Commit: `git commit -am "chore(release): prepare major"`
4. Push with skip marker: **`git push origin prod`** — but this would still trigger the minor bump. So instead:
5. Better: disable the workflow temporarily, push, re-enable. Or run `pnpm -r publish --access public --provenance` manually from your laptop with `NPM_TOKEN` env set.

Major releases should be rare and deliberate — do them by hand with explicit review.

## Emergency: unpublishing

- You have **72 hours** to unpublish a version: `npm unpublish @ksefnik/xxx@1.2.3`
- After 72 hours, unpublishing is not allowed — publish a fix as a new version (`1.2.4`) instead
- The unpublished version **cannot be republished for 24 hours**

## Troubleshooting

**"Workflow keeps looping on main"**
Check the bot commit includes `[skip bump] [skip ci]`. GitHub natively skips workflow runs when `[skip ci]` is in the commit message.

**"npm publish fails with 403"**
`NPM_TOKEN` expired or was revoked. Generate a new one and update the repository secret.

**"Versions on main and prod diverged"**
Merge the latest sync PR from `prod` → `main`. If it was missed, manually run locally:

```bash
git checkout main
git merge prod
git push origin main
```

**"I need to publish without bumping"**
You can't — the workflows always bump. If you truly need a no-bump republish (rare), run `pnpm -r publish` manually from your laptop after checking out the exact commit you want.
