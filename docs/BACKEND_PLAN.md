# Backend Implementation Plan (MVP)

## Overview

NestJS API for Uzbekistan Real Estate Platform.
**Strategy:** "Supply First" - Build inventory to attract buyers.

**Location:** `apps/api/`
**Port:** 3001
**Base URL:** `http://localhost:3001/api`

---

## Market Requirements

| Requirement | Implementation |
|-------------|----------------|
| Currency | у.е. (YE) / UZS toggle (у.е. = conditional units, not USD) |
| Location | City → District (Tuman) → Mahalla hierarchy |
| Language | RU/UZ/EN (handled by frontend) |
| Communication | Phone + Simple messaging |

---

## MVP Phases

### Phase 1: Inventory Engine (Current)

**Goal:** Enable agents/owners to post listings easily.

| # | Feature | Status |
|---|---------|--------|
| 1.1 | Auth (Email + Google) | ✅ Done |
| 1.2 | Auth UI (Login/Register) | ✅ Done |
| 1.3 | Upload Module (R2) | 🔜 Next |
| 1.4 | Property Create Wizard | Pending |

### Phase 2: Search & Discovery

**Goal:** Buyers finding properties.

| # | Feature | Status |
|---|---------|--------|
| 2.1 | Property List + Filters | Pending |
| 2.2 | Property Detail Page | Pending |
| 2.3 | Map Search | Pending |

### Phase 3: Engagement & Leads

**Goal:** Connecting buyers and sellers.

| # | Feature | Status |
|---|---------|--------|
| 3.1 | Favorites | Pending |
| 3.2 | "Show Phone" (Lead tracking) | Pending |
| 3.3 | Simple Messaging | Pending |

### Deferred (Post-MVP)

- Reviews Module
- Viewings/Appointments
- WebSocket real-time messaging
- Admin Panel
- Advanced analytics

---

## Phase 1.3: Upload Module (Cloudflare R2)

### Files to Create
```
modules/upload/
├── upload.module.ts
├── upload.controller.ts
├── upload.service.ts
└── r2.config.ts
```

### Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload` | Upload single file | Yes |
| POST | `/api/upload/multiple` | Upload multiple (max 15) | Yes |
| DELETE | `/api/upload/:key` | Delete file | Yes |

### Implementation
- Receive via Multer (memory storage)
- Resize/compress images (sharp)
- Generate key: `properties/{userId}/{uuid}.{ext}`
- Stream to R2
- Return public URL

### Response Format
```json
{
  "url": "https://pub-xxx.r2.dev/properties/user123/abc.jpg",
  "key": "properties/user123/abc.jpg"
}
```

---

## Phase 1.4: Property Create (Multi-step Wizard)

### Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/properties` | Create property | Yes |
| PATCH | `/api/properties/:id` | Update property | Yes (owner) |
| DELETE | `/api/properties/:id` | Soft delete | Yes (owner) |
| GET | `/api/properties/my` | My listings | Yes |

### Wizard Steps (Frontend)
1. **Location** - City, District, Map pin (lat/lng)
2. **Specs** - Type, Deal, Rooms, Area, Floor, Repair
3. **Images** - Drag & drop upload (max 15)
4. **Price** - Amount + Currency (USD/UZS)

### CreatePropertyDto Fields
```typescript
{
  // Location
  city: string;
  district: string;
  mahalla?: string;
  address: string;
  latitude?: number;
  longitude?: number;

  // Specs
  propertyType: 'APARTMENT' | 'HOUSE' | 'COMMERCIAL';
  listingType: 'SALE' | 'RENT_LONG' | 'RENT_DAILY';
  rooms: number;
  area: number;
  floor?: number;
  totalFloors?: number;
  renovation: 'EURO' | 'NORMAL' | 'NEEDS_REPAIR';

  // Images
  images: string[]; // R2 keys

  // Price
  price: number;
  currency: 'YE' | 'UZS';  // YE = у.е. (conditional units)
}
```

---

## Phase 2.1: Property Search

### Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/properties` | List with filters | No |
| GET | `/api/properties/:id` | Single property | No |
| POST | `/api/properties/:id/view` | Track view | No |

### Query Parameters
```
GET /api/properties?
  page=1
  limit=20
  sortBy=price|createdAt
  sortOrder=asc|desc
  city=Tashkent
  district=Yunusabad
  propertyType=APARTMENT
  listingType=SALE
  minPrice=50000
  maxPrice=200000
  currency=YE
  rooms=3
```

### Response (Paginated)
```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

---

## Phase 3.1: Favorites

### Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/favorites` | My favorites | Yes |
| POST | `/api/favorites/:propertyId` | Add | Yes |
| DELETE | `/api/favorites/:propertyId` | Remove | Yes |

---

## Phase 3.2: Lead Tracking

### "Show Phone Number" Flow
1. Property detail shows masked phone: `+998 9* *** ** **`
2. User clicks "Show Number"
3. API logs the lead: `POST /api/leads`
4. Return full phone number

### Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/properties/:id/reveal-phone` | Track lead, return phone | Optional |

---

## Phase 3.3: Simple Messaging

### Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/messages/conversations` | My conversations | Yes |
| POST | `/api/messages` | Send message | Yes |
| GET | `/api/messages/:conversationId` | Get messages | Yes |

Simple REST-only implementation. No WebSocket in MVP.

---

## Database Schema Updates Needed

### Add to Property model:
```prisma
// Currency
currency      Currency  @default(YE)

// Tashkent-specific location
mahalla       String?

// Lead tracking
phoneReveals  Int       @default(0)
```

### Add Currency enum:
```prisma
enum Currency {
  YE    // у.е. (conditional units - used instead of USD in Uzbekistan)
  UZS   // Uzbek Som
}
```

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/realestate_dev"

# JWT
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="7d"

# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_CALLBACK_URL="http://localhost:3001/api/auth/google/callback"

# Cloudflare R2
R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="realestate-uploads"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"

# Frontend
FRONTEND_URL="http://localhost:3000"

# App
API_PORT=3001
NODE_ENV=development
```

---

## Success Criteria (MVP Launch)

- [ ] Users can register/login
- [ ] Users can upload images
- [ ] Users can create property listings
- [ ] Users can search/filter properties
- [ ] Users can view property details
- [ ] Users can save favorites
- [ ] Phone reveal works (lead tracking)
- [ ] Basic messaging works
- [ ] RU/UZ/EN translations work (frontend)
- [ ] CI/CD passes

---

## Vertical Slice Order

Build complete features (BE + FE) before moving to next:

```
1. ✅ Auth (BE + FE done)
2. 🔜 Upload + Property Create (BE + FE wizard)
3. ⏳ Property Search (BE + FE list/detail)
4. ⏳ Favorites + Leads (BE + FE)
5. ⏳ Messaging (BE + FE)
```
