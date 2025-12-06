# AI Coding Instructions

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

## Don't Do

- Don't modify files outside your current task scope
- Don't add console.log (use proper logging)
- Don't skip type definitions
- Don't create files without exporting them
- Don't forget to update SESSION_LOG.md
