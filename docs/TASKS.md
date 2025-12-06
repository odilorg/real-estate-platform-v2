# Implementation Tasks

## Phase 1: Foundation ✅
- [x] Monorepo setup (Turborepo + pnpm)
- [x] packages/shared (types, DTOs, constants)
- [x] packages/database (Prisma schema)
- [x] packages/ui (base components)
- [x] packages/config (ESLint, TS config)
- [x] Documentation files

## Phase 2: Backend Core
- [ ] NestJS app setup (apps/api)
- [ ] Prisma connection
- [ ] Auth module (JWT)
  - [ ] Register endpoint
  - [ ] Login endpoint
  - [ ] JWT guard
  - [ ] Current user decorator
- [ ] Users module
  - [ ] Get profile
  - [ ] Update profile
- [ ] Properties module
  - [ ] Create property
  - [ ] List properties (with filters)
  - [ ] Get property by ID
  - [ ] Update property
  - [ ] Delete property
  - [ ] Search endpoint

## Phase 3: Frontend Core
- [ ] Next.js app setup (apps/web)
- [ ] Layout and navigation
- [ ] Auth pages
  - [ ] Login page
  - [ ] Register page
  - [ ] Auth context
- [ ] Property pages
  - [ ] Listing page with filters
  - [ ] Property detail page
  - [ ] Create property form
  - [ ] Edit property form
- [ ] User dashboard
  - [ ] My properties
  - [ ] My favorites
  - [ ] My viewings

## Phase 4: Features
- [ ] Favorites module (API + UI)
- [ ] Messaging system (API + UI)
- [ ] Reviews system (API + UI)
- [ ] Saved searches (API + UI)
- [ ] Viewing scheduling (API + UI)

## Phase 5: Workers & Notifications
- [ ] BullMQ setup (apps/worker)
- [ ] Email notifications
- [ ] In-app notifications
- [ ] WebSocket gateway

## Phase 6: Admin & Polish
- [ ] Admin dashboard
  - [ ] Users management
  - [ ] Properties moderation
  - [ ] Reviews moderation
  - [ ] Analytics
- [ ] i18n (en, ru, uz)
- [ ] SEO optimization
- [ ] Mobile app start (apps/mobile)
