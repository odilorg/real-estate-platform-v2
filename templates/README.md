# Code Templates

Templates for common code patterns. Copy and adapt these to ensure consistency.

## Available Templates

### `nest-module.template.ts`
Complete NestJS module with controller and service.
- Use for: Backend API features
- Location: `apps/api/src/modules/{feature}/`

### `react-component.template.tsx`
React component with props interface and standard patterns.
- Use for: UI components
- Location: `packages/ui/src/` or `apps/web/src/components/`

### `api-route.template.ts`
Next.js API route with CRUD operations.
- Use for: If using Next.js API routes instead of NestJS
- Location: `apps/web/src/app/api/{endpoint}/route.ts`

## How to Use

1. **Copy the template** to your target location
2. **Find and replace** placeholders:
   - `{Feature}` → `Properties` (PascalCase)
   - `{feature}` → `properties` (lowercase)
   - `{ComponentName}` → `PropertyCard` (PascalCase)
   - `{Model}` → `Property` (PascalCase)
   - `{model}` → `property` (lowercase)
   - `{endpoint}` → `properties` (URL path)
3. **Implement the logic** specific to your feature
4. **Export from index.ts** in the appropriate package
5. **Update TASKS.md** to mark as complete

## Checklist After Using Template

- [ ] All placeholders replaced
- [ ] Imports updated for your feature
- [ ] DTOs imported from @repo/shared
- [ ] Exported from index.ts
- [ ] TypeScript compiles without errors
- [ ] Manually tested
