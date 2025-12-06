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
pnpm add @nestjs/platform-socket.io @nestjs/websockets socket.io  # WebSockets
pnpm add @aws-sdk/client-s3 @aws-sdk/lib-storage multer            # File upload (R2/S3)
pnpm add -D @types/passport-jwt @types/bcrypt @types/multer
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

## Step 1.5: Upload Module (Cloudflare R2)

### Why Early?
Real estate is images. Building with dummy URLs then refactoring to R2 later will break frontend components and image pipelines. Set it up now.

### 1.5.1 Files to Create
```
modules/upload/
├── upload.module.ts
├── upload.controller.ts
├── upload.service.ts
└── r2.config.ts
```

### 1.5.2 Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload` | Upload single file | Yes |
| POST | `/api/upload/multiple` | Upload multiple files | Yes |
| DELETE | `/api/upload/:key` | Delete file by key | Yes |

### 1.5.3 Implementation Details

**Upload Flow:**
1. Receive file via Multer (memory storage)
2. Generate unique key: `properties/{userId}/{uuid}.{ext}`
3. Stream directly to R2 using AWS SDK
4. Return public URL

**R2 Configuration:**
```typescript
// r2.config.ts
import { S3Client } from '@aws-sdk/client-s3';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
```

**Response Format:**
```json
{
  "url": "https://pub-xxx.r2.dev/properties/user123/abc.jpg",
  "key": "properties/user123/abc.jpg"
}
```

**Deliverables:**
- [ ] R2 bucket created and configured
- [ ] Single file upload working
- [ ] Multiple file upload working
- [ ] Delete file working
- [ ] Returns public URLs

---

## Step 2: Auth Module

### 2.1 Files to Create
```
modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── google.strategy.ts
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
| GET | `/api/auth/google` | Redirect to Google OAuth | No |
| GET | `/api/auth/google/callback` | Google OAuth callback | No |

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

**Google OAuth Flow:**
1. User clicks "Login with Google" → redirects to `/api/auth/google`
2. Google authenticates user → redirects to `/api/auth/google/callback`
3. Extract email, firstName, lastName from Google profile
4. Find or create user (password = null for OAuth users)
5. Generate JWT token
6. Redirect to frontend with token (e.g., `/auth/callback?token=xxx`)

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
- [ ] Google OAuth login working
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
├── search/
│   ├── search-provider.interface.ts   # Abstract search interface
│   └── postgres-search.provider.ts    # Default Postgres implementation
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
| GET | `/api/properties/clusters` | Get clustered pins for map | No |

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
  # Geo search (PostGIS)
  lat=41.2995
  lng=69.2401
  radius=5          # km
  bounds=SW_lat,SW_lng,NE_lat,NE_lng  # viewport bounds
```

### 4.4 Implementation Details

**Search Provider Abstraction:**
```typescript
// search-provider.interface.ts
interface SearchProvider {
  search(filters: PropertyFilterDto): Promise<SearchResult>;
  cluster(bounds: Bounds, zoom: number): Promise<Cluster[]>;
}
```
Start with Postgres + PostGIS. Can swap for Meilisearch/Elasticsearch later without changing controller.

**Create Property:**
1. Validate with CreatePropertyDto
2. Set userId from JWT
3. Create property with images and amenities
4. Return created property

**List Properties:**
1. Parse query params with PropertyFilterDto
2. Call SearchProvider.search() (abstracts DB vs search engine)
3. Apply pagination (skip/take)
4. Include images (primary only for list)
5. Return { items, total, page, limit, totalPages }

**Map Clustering (Important for performance):**
- At low zoom: Return clusters (count + center point)
- At high zoom: Return individual properties
- Use PostGIS ST_ClusterKMeans or Supercluster algorithm

**Geo Search with Haversine (until PostGIS):**
```typescript
// Simple distance filter without PostGIS extension
const result = await prisma.$queryRaw`
  SELECT *,
    ( 6371 * acos(
      cos( radians(${lat}) ) * cos( radians( lat ) ) *
      cos( radians( lng ) - radians(${lng}) ) +
      sin( radians(${lat}) ) * sin( radians( lat ) )
    )) AS distance
  FROM "Property"
  WHERE "deletedAt" IS NULL
  HAVING distance < ${radius}
  ORDER BY distance;
`;
```

**View Count - Avoid Row Locking:**
Don't write to Property table directly (causes row locks under load).
Use separate `PropertyAnalytics` table:
```typescript
// In Prisma schema (add this)
model PropertyAnalytics {
  id          String   @id @default(cuid())
  propertyId  String   @unique
  viewCount   Int      @default(0)
  property    Property @relation(fields: [propertyId], references: [id])
}

// In service
await prisma.propertyAnalytics.upsert({
  where: { propertyId },
  update: { viewCount: { increment: 1 } },
  create: { propertyId, viewCount: 1 },
});
```

**Soft Deletes:**
Never actually delete properties. Use `deletedAt` field:
```typescript
// Add to Property model
deletedAt DateTime?

// Prisma middleware to auto-filter
prisma.$use(async (params, next) => {
  if (params.model === 'Property' && params.action === 'findMany') {
    params.args.where = { ...params.args.where, deletedAt: null };
  }
  return next(params);
});
```

**Authorization:**
- Create: Any authenticated user
- Update/Delete: Only owner
- List/View: Public

**Deliverables:**
- [ ] List with all filters working
- [ ] Geo search with Haversine formula
- [ ] Create with images and amenities
- [ ] Update (owner only)
- [ ] Soft delete (owner only)
- [ ] My listings endpoint
- [ ] View count via PropertyAnalytics table

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

### 7.1 Files to Create
```
modules/messages/
├── messages.module.ts
├── messages.controller.ts      # REST endpoints
├── messages.service.ts
└── messages.gateway.ts         # WebSocket gateway
```

### 7.2 REST Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/messages/conversations` | My conversations | Yes |
| GET | `/api/messages/conversations/:id` | Get conversation messages | Yes |
| POST | `/api/messages/conversations` | Start conversation | Yes |
| POST | `/api/messages/conversations/:id` | Send message | Yes |
| PATCH | `/api/messages/:id/read` | Mark as read | Yes |

### 7.3 WebSocket Events (Socket.io)
```typescript
// Client → Server
'join_conversation'    // Join room for real-time updates
'leave_conversation'   // Leave room
'typing'               // User is typing indicator

// Server → Client
'new_message'          // New message received
'message_read'         // Message marked as read
'user_typing'          // Other user is typing
```

### 7.4 Implementation Details (Hybrid Approach)

**Why Hybrid?**
- REST for saving (reliable, transactional)
- WebSocket for notifications (instant, real-time)

**Send Message Flow:**
```
1. Sender calls REST: POST /api/messages/conversations/:id
2. Server saves to database
3. Server emits WebSocket event to recipient's room
4. Recipient UI updates instantly (no refresh needed)
```

**WebSocket Gateway:**
```typescript
@WebSocketGateway({ cors: true })
export class MessagesGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join_conversation')
  handleJoin(client: Socket, conversationId: string) {
    client.join(`conversation:${conversationId}`);
  }

  // Called by MessagesService after saving message
  notifyNewMessage(conversationId: string, message: Message) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('new_message', message);
  }
}
```

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
- [ ] WebSocket gateway for real-time notifications

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
| POST | `/api/admin/users/:id/impersonate` | Get JWT as user (for debugging) |
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

**Admin Impersonation (Debugging):**
```typescript
// POST /api/admin/users/:id/impersonate
// Returns JWT token as if admin were that user
// Crucial for debugging: "I can't see my property"
@Post('users/:id/impersonate')
@UseGuards(AdminGuard)
async impersonate(@Param('id') userId: string, @CurrentUser() admin: User) {
  // Log this action!
  await this.adminLogService.log(admin.id, 'IMPERSONATE', { targetUserId: userId });

  const user = await this.usersService.findById(userId);
  return { accessToken: this.authService.generateToken(user) };
}
```

**Deliverables:**
- [ ] Admin guard
- [ ] User management
- [ ] User impersonation (with logging)
- [ ] Property moderation
- [ ] Review moderation
- [ ] Dashboard stats
- [ ] Admin action logging

---

## Implementation Order (Priority)

### Phase 2A: Core (Do First)
1. Project Setup
2. Upload Module (Cloudflare R2)
3. Auth Module
4. Properties Module (CRUD + filters + soft delete)

### Phase 2B: Features
5. Users Module
6. Favorites Module
7. Reviews Module

### Phase 2C: Communication
8. Messages Module (REST + WebSocket)
9. Viewings Module

### Phase 2D: Admin
10. Admin Endpoints

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

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3001/api/auth/google/callback"

# Cloudflare R2 (S3-compatible)
R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="realestate-uploads"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"

# Frontend URL (for OAuth redirect)
FRONTEND_URL="http://localhost:3000"

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

---

## Pre-Launch Tasks (Before Production)

These are deferred until MVP is working:

### Search Performance (if needed)
- [ ] Evaluate if Postgres + Haversine is fast enough
- [ ] If not: Add Meilisearch/Elasticsearch
- [ ] Swap `PostgresSearchProvider` → `MeilisearchProvider`

### PostGIS Upgrade (if needed)
- [ ] Enable PostGIS extension in production database
- [ ] Replace Haversine with PostGIS ST_Distance
- [ ] Add geometry column to Property table
- [ ] Implement server-side clustering with ST_ClusterKMeans

---

## Frontend Notes

When building frontend (Phase 3):
- Use **MapLibre GL** instead of Mapbox (free, same API)
- Use **Lucide React** for icons (shadcn standard)
- Use **Day.js** for date handling (lightweight)
