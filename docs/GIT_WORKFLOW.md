# Git Workflow

## Branch Structure

```
main           ← production (protected, deploy on merge)
develop        ← integration/staging branch
  └── feature/xxx    ← feature work
  └── fix/xxx        ← bug fixes
```

## Rules

1. **One feature = one branch = one PR**
   - ALL changes (API + shared types + web) in same branch
   - Never split BE/FE into separate branches

2. **Branch naming:**
   ```
   feature/auth
   feature/upload
   feature/properties
   fix/login-bug
   chore/update-deps
   ```

3. **Workflow:**
   ```bash
   # 1. Start feature
   git checkout develop
   git pull origin develop
   git checkout -b feature/xxx

   # 2. Work, commit often
   git add .
   git commit -m "feat(api): description"

   # 3. Push and create PR
   git push origin feature/xxx
   # Create PR: feature/xxx → develop

   # 4. After CI passes, merge PR

   # 5. Cleanup
   git checkout develop
   git pull origin develop
   git branch -d feature/xxx
   ```

4. **Commit format:**
   ```
   {type}({scope}): {description}

   Types: feat, fix, chore, refactor, test, docs
   Scopes: api, web, mobile, shared, ui, db, infra
   ```

5. **CI must pass before merge:**
   - `pnpm turbo run lint typecheck build`

## Current Branch Status

Check with: `git branch -a`

---

## Committing and Pushing Strategy

The committing and pushing strategy directly supports our Feature Branching Git Flow and work with AI Coder to maintain a clean history and maximize Turborepo's caching.

**Key idea:** Use atomic commits for small, logical changes, then use squash-and-merge when integrating the complete feature into `develop`.

---

## Phase 1: Committing (Local Strategy)

Focus on making your local commit history clear and easy to read. These are the small, daily checkpoints of your work.

### 1. Atomic Commits

An atomic commit means a single commit contains **one logical change**—no more, no less. This makes rolling back or reviewing history much easier.

| Instead of This (Bad) | Do This (Good) |
|-----------------------|----------------|
| `feat: added property listing and fixed css` | 1. `feat(api): implement property creation endpoint`<br>2. `feat(shared): add PropertyDto interface`<br>3. `fix(web): correct property listing page styling` |

### 2. Structured Commit Messages

Use the **Conventional Commit Specification** for consistency. This allows tools to automatically parse your commit history.

**Format:** `<type>(<scope>): <description>`

| Type | When to Use | Example |
|------|-------------|---------|
| `feat` | A new feature or functionality | `feat(auth): add Google OAuth flow` |
| `fix` | A bug fix | `fix(web): correct map pin rendering bug` |
| `chore` | Maintenance, updating dependencies, setting up CI | `chore(ci): update pnpm to v8` |
| `refactor` | Code changes that don't fix a bug or add a feature | `refactor(api): convert user service to async/await` |
| `docs` | Documentation changes | `docs: update README with environment variables` |
| `test` | Adding or updating tests | `test(api): add auth service unit tests` |

### 3. Staging for AI-Generated Code

When an AI generates a large feature (e.g., the entire reviews module), it might change files across `apps/api`, `apps/web`, and `packages/shared`.

1. **Audit First:** Manually review the AI's changes in your feature branch
2. **Stage Logically:** Use interactive staging (`git add -p` or `git gui`) to only stage changes you approve of. If the AI added an unnecessary log statement, don't stage it.
3. **Commit the Whole Feature:** Commit all related files (FE, BE, Shared) in a single commit:
   ```
   feat(reviews): generated and audited reviews module
   ```

---

## Phase 2: Pushing & Integration (Remote Strategy)

Your pushing strategy should prioritize validation and a clean history on `develop`.

### 1. Push Frequently

Push your feature branch to the remote repository frequently (at least daily). This acts as a safe backup and allows team members to see progress.

```bash
git push origin feature/property-details
```

### 2. The Pull Request (PR) Workflow

The PR is the primary tool for integration.

- **Target develop:** Every new feature PR should target the `develop` branch
- **CI Barrier:** The PR must not be mergeable until the CI pipeline (lint, typecheck, build) passes successfully

### 3. The Squash and Merge Strategy (Recommended)

This is the most crucial step for maintaining a clean history on `develop`.

| Strategy | Why It's Best for Monorepos | Resulting History |
|----------|----------------------------|-------------------|
| **Squash and Merge** | Takes all messy iterative commits ("fix: stuff," "wip," "more changes") and combines them into one clean commit like `feat(properties): full implementation of map clustering and search` | A clean, linear history on develop where every commit represents a fully working feature |
| Rebase and Merge | Creates clean linear history but requires discipline and manual conflict resolution | Cleaner history, but more friction |
| Merge Commit | Brings all messy commits into develop | Cluttered, non-linear history (Avoid this) |

**Recommendation:** Configure repository to allow **Squash and Merge only**.

---

## Summary Flow

```bash
# 1. Create feature branch from develop
git checkout -b feature/new-module

# 2. Work, commit, commit, commit (atomic, conventional commits)
git add .
git commit -m "feat(api): add endpoint"
git commit -m "feat(shared): add DTO"
git commit -m "fix(api): handle edge case"

# 3. Push to remote
git push origin feature/new-module

# 4. Open PR (targets develop)
# - CI checks pass
# - Code review passes

# 5. Merge PR using "Squash and Merge"
# The entire feature becomes ONE clean commit on develop

# 6. Periodically merge develop into main (for production release)
```

---

## GitHub Repository Settings

To enforce this workflow, configure these settings in GitHub:

1. **Branch Protection Rules** (for `develop` and `main`):
   - Require pull request reviews before merging
   - Require status checks to pass before merging
   - Require branches to be up to date before merging

2. **Merge Settings**:
   - Allow squash merging: ✅
   - Allow merge commits: ❌
   - Allow rebase merging: ❌
   - Default to squash merge

3. **PR Settings**:
   - Automatically delete head branches after merge: ✅
