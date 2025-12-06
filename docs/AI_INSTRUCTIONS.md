# AI Coding Instructions

## Feature Development Strategy: Vertical Slicing

**CRITICAL:** Build features as complete vertical slices, not horizontal layers.

### What is Vertical Slicing?

Instead of building all Backend features first, then all Frontend features:

```
❌ WRONG (Horizontal):
1. Build ALL API endpoints (Auth, Properties, Messaging, Reviews)
2. Then build ALL Frontend pages
3. Discover contracts don't match, waste time refactoring
```

Build complete features end-to-end:

```
✅ CORRECT (Vertical Slices):
Slice 1: Auth (BE endpoints + FE login/register + shared types)
Slice 2: Properties (BE search API + FE search page + shared types)
Slice 3: Messaging (BE + WS + FE conversation UI + shared types)
```

### Development Order for Each Feature

1. **Shared Types First** - Define DTOs in `packages/shared`
2. **Backend Foundation** - Build core API endpoints
3. **Frontend Consumption** - Build UI that consumes the API
4. **Iterate** - Add complexity (WebSockets, edge cases)

### Iteration Example (Messaging Feature)

| Iteration | Focus | Action |
|-----------|-------|--------|
| 1 | Core (REST) | BE: GET/POST endpoints, FE: static UI |
| 2 | Real-time (BE) | BE: WebSocket implementation |
| 3 | Real-time (FE) | FE: Connect to WebSocket, live updates |
| 4 | Polish | Read receipts, unread counts |

### Why Not Build Everything Backend First?

- **Stale Contracts** - FE may need different data structure
- **No Feedback** - Can't validate UX until API is done
- **Wasted Work** - Building features nobody will use

### Current Vertical Slices Status

- [x] Slice 1: Auth (BE done, FE next)
- [ ] Slice 2: Properties Search
- [ ] Slice 3: Messaging
- [ ] Slice 4: Reviews

---

## Before Starting Any Session

1. **Read SESSION_LOG.md** - Understand what was done before
2. **Check TASKS.md** - Know what needs to be done
3. **Pull latest code** - `git pull origin develop`

## Session Workflow

```bash
# 1. Start of session
git checkout develop
git pull origin develop

# 2. Work on tasks
# ... make changes ...

# 3. Commit frequently (logical chunks)
git add .
git commit -m "feat(scope): description"

# 4. End of session
git push origin develop

# 5. Update SESSION_LOG.md with what you did
```

## Creating New Files

### New API Endpoint

1. Check if DTO exists in `packages/shared/src/dto/`
   - If not, create it there first
2. Create/update controller in `apps/api/src/modules/{feature}/`
3. Create/update service in same folder
4. Update module to register new providers
5. Test the endpoint

### New React Component

1. Decide location:
   - Reusable → `packages/ui/src/`
   - Page-specific → `apps/web/src/components/`
   - Feature → `apps/web/src/features/{feature}/`
2. Create component file
3. Export from index.ts
4. Add to parent component

### New Database Model

1. Update `packages/database/prisma/schema.prisma`
2. Run `pnpm --filter @repo/database db:migrate`
3. Add types to `packages/shared/src/types/`
4. Add DTOs if needed to `packages/shared/src/dto/`

## Package Dependencies

### Who imports what:
```
apps/api      → @repo/database, @repo/shared
apps/web      → @repo/ui, @repo/shared
apps/mobile   → @repo/ui, @repo/shared
apps/worker   → @repo/database, @repo/shared
packages/ui   → (nothing from other packages)
packages/shared → (nothing from other packages)
```

### Never:
- Import from apps/* into packages/*
- Import from packages/database into packages/ui
- Import from packages/ui into packages/shared

## Common Tasks

### Add a new property field

1. Update Prisma schema (`packages/database/prisma/schema.prisma`)
2. Run migration
3. Update types (`packages/shared/src/types/index.ts`)
4. Update DTOs (`packages/shared/src/dto/index.ts`)
5. Update API endpoint if needed
6. Update frontend forms/displays

### Add a new API endpoint

```typescript
// 1. DTO in packages/shared/src/dto/index.ts
export const MyNewDto = z.object({
  field: z.string(),
});
export type MyNewDto = z.infer<typeof MyNewDto>;

// 2. Controller in apps/api/src/modules/{module}/{module}.controller.ts
@Post('new-endpoint')
async myNewEndpoint(@Body() dto: MyNewDto) {
  return this.service.myNewMethod(dto);
}

// 3. Service in apps/api/src/modules/{module}/{module}.service.ts
async myNewMethod(dto: MyNewDto) {
  return prisma.model.create({ data: dto });
}
```

### Add a new page

```tsx
// apps/web/src/app/{route}/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title',
};

export default async function PageName() {
  return (
    <div>
      <h1>Page Content</h1>
    </div>
  );
}
```

## Error Handling

### Backend (NestJS)
```typescript
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Throw specific exceptions
throw new NotFoundException('Property not found');
throw new BadRequestException('Invalid input');
```

### Frontend (Next.js)
```typescript
try {
  const data = await api.get('/endpoint');
} catch (error) {
  // Handle error appropriately
  toast.error('Something went wrong');
}
```

## Testing Checklist

Before committing, verify:
- [ ] TypeScript compiles without errors
- [ ] No console.log statements left
- [ ] API endpoints return correct status codes
- [ ] Error cases are handled
- [ ] Types are properly defined

## Scope Rules (CRITICAL)

### ONLY modify files related to your current task
```
Task: "Add favorites endpoint"
✅ Can modify:
   - apps/api/src/modules/favorites/*
   - packages/shared/src/dto/index.ts (add FavoriteDto)
   - packages/shared/src/types/index.ts (add Favorite type)

❌ Cannot modify:
   - apps/api/src/modules/properties/* (not related)
   - apps/web/* (frontend is separate task)
   - Any "improvements" to existing code
```

### Before modifying ANY file, ask:
1. Is this file directly required for my task?
2. Am I adding new code or changing existing code?
3. If changing existing code - was I asked to?

### Forbidden without explicit request:
- Refactoring existing working code
- Adding "nice to have" features
- Updating dependencies
- Changing code style/formatting
- Adding comments to code you didn't write
- Creating abstractions for "future use"

## Don't Do

- Don't modify files outside your current task scope
- Don't add console.log (use proper logging)
- Don't skip type definitions
- Don't create files without exporting them
- Don't forget to update SESSION_LOG.md
- Don't leave TODO/FIXME comments (finish or don't start)
- Don't add new dependencies without documenting why
- Don't refactor unless explicitly asked

## Pre-Commit Checklist

Run before EVERY commit:
```bash
./scripts/pre-commit.sh
```

This checks:
- TypeScript compilation
- No console.log statements
- No TODO comments
- Reminder to update SESSION_LOG.md

## Using Templates

Before writing new code, check `templates/` folder:
- `nest-module.template.ts` - NestJS controller/service
- `react-component.template.tsx` - React components
- `api-route.template.ts` - Next.js API routes

Copy and adapt - don't write from scratch.

## Manual Testing Checklist

After implementing a feature:
- [ ] Start the app: `pnpm dev`
- [ ] Test the happy path (feature works)
- [ ] Test error cases (proper error messages)
- [ ] Check browser console (no errors)
- [ ] Check API logs (no errors)

## Rollback Instructions

If something breaks:
```bash
# See recent commits
git log --oneline -10

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Revert a specific commit
git revert <commit-hash>
```

Document what went wrong in SESSION_LOG.md.
