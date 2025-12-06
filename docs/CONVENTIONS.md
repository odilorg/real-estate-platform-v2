# Coding Conventions

## Project Structure

```
apps/
  api/          → NestJS backend
  web/          → Next.js frontend
  mobile/       → React Native (Expo)
  worker/       → BullMQ background jobs

packages/
  shared/       → Types, DTOs, constants (used by all)
  database/     → Prisma schema and client
  ui/           → React UI components
  config/       → Shared ESLint, TS configs
```

## Naming Conventions

### Files
- Components: `PascalCase.tsx` (e.g., `PropertyCard.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatPrice.ts`)
- Types: `camelCase.ts` in types folder
- Constants: `camelCase.ts` in constants folder

### Code
- Variables/functions: `camelCase`
- Classes/Components: `PascalCase`
- Constants: `UPPER_SNAKE_CASE` or `PascalCase` for objects
- Types/Interfaces: `PascalCase`
- Enums: `PascalCase` (values: `UPPER_SNAKE_CASE`)

## TypeScript

- Always use strict mode
- Prefer interfaces over types for objects
- Use `type` for unions, intersections, primitives
- Always type function parameters and returns
- Avoid `any`, use `unknown` if needed

## NestJS (Backend)

### Module Structure
```
modules/
  auth/
    auth.module.ts
    auth.controller.ts
    auth.service.ts
    dto/
      login.dto.ts
      register.dto.ts
    guards/
      jwt-auth.guard.ts
```

### DTOs
- Define in packages/shared for sharing with frontend
- Use Zod for validation
- Import in NestJS and transform with class-validator if needed

### Error Handling
- Use NestJS built-in exceptions
- Always return consistent error format:
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

## Next.js (Frontend)

### Folder Structure
```
src/
  app/              → Pages (App Router)
  components/       → Page-specific components
  features/         → Feature modules
  lib/              → Utilities, API client
  hooks/            → Custom React hooks
```

### API Calls
- Use fetch wrapper from `lib/api.ts`
- Handle loading/error states consistently
- Type all responses using shared types

### Components
- One component per file
- Props interface above component
- Use `cn()` for className merging

## Git

### Branch Names
```
backend/feature/{name}
frontend/feature/{name}
shared/feature/{name}
fix/{description}
chore/{description}
```

### Commit Messages
```
{type}({scope}): {description}

Types: feat, fix, chore, refactor, test, docs
Scopes: api, web, mobile, shared, ui, db, infra
```

Examples:
```
feat(api): add JWT authentication
feat(web): create property listing page
fix(api): correct pagination calculation
chore(db): add seed script
```

## Imports Order

1. External packages
2. Internal packages (@repo/*)
3. Relative imports (../, ./)
4. Types (last)

Example:
```typescript
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { prisma } from '@repo/database';
import { CreatePropertyDto } from '@repo/shared';

import { AuthService } from '../auth/auth.service';

import type { Property } from '@repo/shared';
```

## KISS Principle (Keep It Simple)

### Do the simplest thing that works

```
❌ Over-engineered:
   - Abstract factory for creating one type of object
   - Event bus for two components that talk once
   - Microservices for a small app

✅ Simple:
   - Direct function call
   - Props passed between components
   - Monolith that can be split later
```

### Signs you're over-engineering:
- "We might need this later"
- "This makes it more flexible"
- "Other projects do it this way"
- Creating a file for < 20 lines of code
- More than 2 levels of abstraction

### Rules:
1. **No premature abstraction** - Wait until you have 3 similar things before abstracting
2. **No unused code** - Delete it, don't comment it out
3. **No "just in case" features** - Build what's requested
4. **No complex patterns for simple problems** - If/else is fine

### File size guidelines:
- Component: 50-200 lines ideal, 300 max
- Service: 100-300 lines ideal, 500 max
- If bigger, consider splitting by feature (not by layer)

## Code Quality Rules

### Complete, not perfect
- Finish features end-to-end
- Don't leave half-done code
- Working > elegant

### Explicit over implicit
- Name things clearly
- Avoid magic numbers/strings
- Type everything

### Fail fast
- Validate inputs early
- Throw errors, don't return null
- Log errors with context

## Dangerous Files (Modify with Caution)

These files affect the entire system:
- `packages/shared/src/types/index.ts` - Breaking changes affect all apps
- `packages/shared/src/dto/index.ts` - API contract changes
- `packages/database/prisma/schema.prisma` - Database schema
- `turbo.json` - Build system
- `tsconfig.json` - TypeScript config

Before modifying:
1. Understand all consumers
2. Make backwards-compatible changes
3. Test all apps after changes
