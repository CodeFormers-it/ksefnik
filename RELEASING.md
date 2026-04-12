# Releasing Ksefnik packages

## Branches

- **`main`** — development branch. Push and merge freely. **Nothing happens automatically.**
- **`prod`** — release branch. Merge from main triggers build, test, version bump, npm publish, and GitHub Release.

## Who can merge

Only **@luke-cf** can approve and merge PRs to `main` and `prod` (enforced via CODEOWNERS + branch protection).

## Flow

```
feature/xyz ──PR──▶ main              (nothing happens)
                     │
                     │  when ready to release:
                     │  open PR main → prod
                     ▼
                    prod              (auto: minor bump + npm publish)
                     │
                     │ auto-opens sync PR
                     ▼
                    main              (versions in sync with npm)
```

## How to release

1. Open a PR from `main` → `prod`
2. CI runs on the PR (build + typecheck + tests)
3. Review and merge the PR

After merge, `prod-release.yml` automatically:

1. Runs typecheck + tests
2. Bumps **minor** version in all 6 packages (e.g., `0.0.1` → `0.1.0`)
3. Builds all packages
4. Publishes to npm with provenance
5. Commits version bump + tag `v0.1.0` to `prod`
6. Creates a GitHub Release with auto-generated notes
7. Opens a sync PR `prod` → `main`

**Merge the sync PR** to keep `main` in sync with published versions.

## Bump script

[scripts/bump-version.mjs](scripts/bump-version.mjs) bumps all 6 packages. Can be run locally:

```bash
node scripts/bump-version.mjs patch   # 0.0.1 → 0.0.2
node scripts/bump-version.mjs minor   # 0.0.2 → 0.1.0
node scripts/bump-version.mjs major   # 0.9.2 → 1.0.0
```

## Major releases

For a **major** (breaking) release, run the bump locally before merging to prod:

```bash
git checkout main
node scripts/bump-version.mjs major
git commit -am "chore: prepare major release"
git push origin main
# then open PR main → prod as usual
```

The prod workflow will bump minor on top — so to get `1.0.0`, set packages to `0.999.0` before merging (or temporarily edit the workflow). Alternatively, publish major releases manually.

## Branch protection setup

On https://github.com/CodeFormers-it/ksefnik/settings/branches, configure:

### `main`
- Require pull request before merging
- Required approvals: 1
- Require review from Code Owners (`@luke-cf` via CODEOWNERS)
- Require status checks: CI

### `prod`
- Require pull request before merging
- Required approvals: 1
- Require review from Code Owners (`@luke-cf` via CODEOWNERS)
- Require status checks: CI
- Allow `github-actions[bot]` to bypass (for version commit + tag push after release)

## Troubleshooting

**"npm publish fails with 401/403"**
`NPM_TOKEN` secret expired or was revoked. Generate a new Granular token and update the repo secret.

**"Versions on main and prod diverged"**
Merge the sync PR from `prod` → `main`. If it was missed: `git checkout main && git merge prod && git push`.

**"Self-hosted runner not picking up jobs"**
Check macmini: `ssh codeformers-macmini` → verify `actions-runner` service is running.
