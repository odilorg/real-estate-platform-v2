# Backend Implementation Plan

## Overview

NestJS API with JWT authentication, PostgreSQL database via Prisma.

**Location:** `apps/api/`
**Port:** 3001
**Base URL:** `http://localhost:3001/api`

---

## Step 1: Project Setup

### 1.1 Create NestJS App
```bash
cd apps
pnpm dlx @nestjs/cli new api --package-manager pnpm --skip-git
```

### 1.2 Install Dependencies
```bash
cd apps/api
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer
pnpm add -D @types/passport-jwt @types/bcrypt
```

### 1.3 Configure Workspace
- Add `@repo/database` and `@repo/shared` as dependencies
- Update `tsconfig.json` to extend root config
- Add to `turbo.json` pipeline

### 1.4 Project Structure
```
apps/api/
├── src/
│   ├── main.ts                 # Entry point
│   ├── app.module.ts           # Root module
│   ├── common/
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   └── pipes/
│   │       └── zod-validation.pipe.ts
│   └── modules/
│       ├── auth/
│       ├── users/
│       ├── properties/
│       ├── favorites/
│       ├── reviews/
│       ├── messages/
│       └── viewings/
├── .env
└── package.json
```

**Deliverables:**
- [ ] NestJS app created and running
- [ ] Connected to @repo/database
- [ ] Health check endpoint: `GET /api/health`

---

## Step 2: Auth Module

### 2.1 Files to Create
```
modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   └── jwt.strategy.ts
└── dto/
    └── (use @repo/shared DTOs)
```

### 2.2 Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create new user | No |
| POST | `/api/auth/login` | Login, get JWT token | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/refresh` | Refresh token | Yes |

### 2.3 Implementation Details

**Register Flow:**
1. Validate input with Zod (RegisterDto)
2. Check if email exists → 409 Conflict
3. Hash password with bcrypt (10 rounds)
4. Create user in database
5. Return user (without password)

**Login Flow:**
1. Validate input with Zod (LoginDto)
2. Find user by email → 401 if not found
3. Compare password with bcrypt → 401 if wrong
4. Generate JWT token (7 day expiry)
5. Return { accessToken, user }

**JWT Payload:**
```typescript
{
  sub: userId,
  email: user.email,
  role: user.role
}
```

**Deliverables:**
- [ ] Register endpoint working
- [ ] Login endpoint returns JWT
- [ ] JWT guard protects routes
- [ ] CurrentUser decorator extracts user

---

## Step 3: Users Module

### 3.1 Files to Create
```
modules/users/
├── users.module.ts
├── users.controller.ts
└── users.service.ts
```

### 3.2 Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/me` | Get my profile | Yes |
| PATCH | `/api/users/me` | Update my profile | Yes |
| GET | `/api/users/:id` | Get user by ID (public info) | No |

### 3.3 Implementation Details

- Only return public fields for other users
- Full profile for own user
- Cannot change email/role via PATCH

**Deliverables:**
- [ ] Get own profile
- [ ] Update own profile
- [ ] Get public user info

---

## Step 4: Properties Module (Core)

### 4.1 Files to Create
```
modules/properties/
├── properties.module.ts
├── properties.controller.ts
├── properties.service.ts
└── dto/
    └── (use @repo/shared DTOs)
```

### 4.2 Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/properties` | List with filters/pagination | No |
| GET | `/api/properties/:id` | Get single property | No |
| POST | `/api/properties` | Create property | Yes |
| PATCH | `/api/properties/:id` | Update property | Yes (owner) |
| DELETE | `/api/properties/:id` | Delete property | Yes (owner) |
| GET | `/api/properties/my` | Get my listings | Yes |
| POST | `/api/properties/:id/view` | Increment view count | No |

### 4.3 Query Parameters for List
```
GET /api/properties?
  page=1
  limit=20
  sortBy=price|createdAt|area
  sortOrder=asc|desc
  city=Tashkent
  district=Yunusabad
  propertyType=APARTMENT
  listingType=SALE
  minPrice=50000
  maxPrice=200000
  minArea=50
  maxArea=150
  bedrooms=3
  buildingClass=BUSINESS
  renovation=EURO
  featured=true
```

### 4.4 Implementation Details

**Create Property:**
1. Validate with CreatePropertyDto
2. Set userId from JWT
3. Create property with images and amenities
4. Return created property

**List Properties:**
1. Parse query params with PropertyFilterDto
2. Build Prisma where clause
3. Apply pagination (skip/take)
4. Include images (primary only for list)
5. Return { items, total, page, limit, totalPages }

**Authorization:**
- Create: Any authenticated user
- Update/Delete: Only owner
- List/View: Public

**Deliverables:**
- [ ] List with all filters working
- [ ] Create with images and amenities
- [ ] Update (owner only)
- [ ] Delete (owner only)
- [ ] My listings endpoint
- [ ] View count increment

---

## Step 5: Favorites Module

### 5.1 Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/favorites` | Get my favorites | Yes |
| POST | `/api/favorites/:propertyId` | Add to favorites | Yes |
| DELETE | `/api/favorites/:propertyId` | Remove from favorites | Yes |
| GET | `/api/favorites/check/:propertyId` | Check if favorited | Yes |

### 5.2 Implementation Details
- Unique constraint: (userId, propertyId)
- Return 409 if already favorited
- Include property details in list

**Deliverables:**
- [ ] Add/remove favorites
- [ ] List favorites with property info
- [ ] Check if property is favorited

---

## Step 6: Reviews Module

### 6.1 Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/reviews/property/:propertyId` | Get property reviews | No |
| POST | `/api/reviews/property/:propertyId` | Create review | Yes |
| PATCH | `/api/reviews/:id` | Update my review | Yes (author) |
| DELETE | `/api/reviews/:id` | Delete my review | Yes (author) |

### 6.2 Implementation Details
- One review per user per property
- Rating: 1-5
- Only approved reviews shown (default: approved)
- Include reviewer name in response

**Deliverables:**
- [ ] Create review (one per user per property)
- [ ] List property reviews
- [ ] Update/delete own review

---

## Step 7: Messages Module

### 7.1 Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/messages/conversations` | My conversations | Yes |
| GET | `/api/messages/conversations/:id` | Get conversation messages | Yes |
| POST | `/api/messages/conversations` | Start conversation | Yes |
| POST | `/api/messages/conversations/:id` | Send message | Yes |
| PATCH | `/api/messages/:id/read` | Mark as read | Yes |

### 7.2 Implementation Details
- Conversation between 2 users about a property
- Check participant before allowing access
- Return unread count per conversation
- Order messages by createdAt

**Deliverables:**
- [ ] List conversations with last message
- [ ] Get conversation messages
- [ ] Start new conversation
- [ ] Send message
- [ ] Mark as read

---

## Step 8: Viewings Module

### 8.1 Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/viewings/my` | My viewing requests | Yes |
| GET | `/api/viewings/received` | Viewings for my properties | Yes |
| POST | `/api/viewings` | Request viewing | Yes |
| PATCH | `/api/viewings/:id` | Update status (confirm/cancel) | Yes |

### 8.2 Implementation Details
- Status: PENDING → CONFIRMED / CANCELLED / COMPLETED
- Only property owner can confirm/complete
- Only requester can cancel their request
- Include property and user details

**Deliverables:**
- [ ] Request viewing
- [ ] List my requests
- [ ] List received requests
- [ ] Confirm/cancel/complete viewing

---

## Step 9: Admin Endpoints

### 9.1 Endpoints (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| PATCH | `/api/admin/users/:id/role` | Change user role |
| PATCH | `/api/admin/users/:id/ban` | Ban/unban user |
| GET | `/api/admin/properties` | List all properties |
| PATCH | `/api/admin/properties/:id/verify` | Verify property |
| PATCH | `/api/admin/properties/:id/feature` | Feature property |
| DELETE | `/api/admin/properties/:id` | Delete any property |
| GET | `/api/admin/reviews` | List pending reviews |
| PATCH | `/api/admin/reviews/:id/approve` | Approve/reject review |
| GET | `/api/admin/stats` | Dashboard stats |

### 9.2 Implementation Details
- Admin guard checks role === 'ADMIN'
- Log all admin actions to AdminLog
- Stats: user count, property count, etc.

**Deliverables:**
- [ ] Admin guard
- [ ] User management
- [ ] Property moderation
- [ ] Review moderation
- [ ] Dashboard stats
- [ ] Admin action logging

---

## Implementation Order (Priority)

### Phase 2A: Core (Do First)
1. Project Setup
2. Auth Module
3. Properties Module (CRUD + filters)

### Phase 2B: Features
4. Users Module
5. Favorites Module
6. Reviews Module

### Phase 2C: Communication
7. Messages Module
8. Viewings Module

### Phase 2D: Admin
9. Admin Endpoints

---

## Testing Checklist

After each module, test:
- [ ] Happy path works
- [ ] Validation errors return 400
- [ ] Unauthorized returns 401
- [ ] Forbidden returns 403
- [ ] Not found returns 404
- [ ] Duplicate returns 409

**Test with:**
```bash
# Health check
curl http://localhost:3001/api/health

# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Authenticated request
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <token>"
```

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/realestate_dev"

# JWT
JWT_SECRET="your-super-secret-key-min-32-chars"
JWT_EXPIRES_IN="7d"

# App
PORT=3001
NODE_ENV=development
```

---

## Success Criteria

Backend is complete when:
- [ ] All endpoints implemented
- [ ] All endpoints tested manually
- [ ] Seed data works
- [ ] No TypeScript errors
- [ ] Documented in this file
