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
