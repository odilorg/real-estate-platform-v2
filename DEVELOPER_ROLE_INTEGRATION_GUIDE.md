# Developer Role Integration Guide

**Document Type:** Integration Architecture
**Created:** December 12, 2025
**Status:** Pre-Implementation

---

## Critical Context

**THIS IS NOT A SEPARATE PLATFORM**

We are **ADDING Developer features TO THE EXISTING real estate platform**, not building from scratch.

### Existing Platform Status
- ✅ **80% complete consumer marketplace**
- ✅ Properties, Users, Agencies, Agents working
- ✅ Authentication (Phone, Email, Google OAuth) working
- ✅ Image upload (Cloudflare R2) working
- ✅ Multi-language (RU/UZ) working
- ✅ Database: PostgreSQL with Prisma

### What We're Adding
- 🆕 Developer role (new user type)
- 🆕 DeveloperProject model (residential complexes)
- 🆕 Developer dashboard (`/developer/*` routes)
- 🆕 Project & unit management
- 🆕 Developer-specific lead CRM
- 🆕 Sales team management
- 🆕 Payment plan features

---

## Integration Strategy

### Principle: Additive, Not Disruptive

**All changes are:**
- ✅ **Additive** (new fields are optional/nullable)
- ✅ **Non-breaking** (existing features continue working)
- ✅ **Parallel** (new modules don't conflict with existing)
- ✅ **Reversible** (can be disabled without breaking platform)

### Database Integration

#### Schema Changes (Week 1)

**Existing Models - ENHANCED (not replaced):**

```prisma
// User model - ADD optional developer membership
model User {
  // ========== EXISTING FIELDS (unchanged) ==========
  id            String    @id @default(cuid())
  email         String?   @unique
  passwordHash  String?
  firstName     String
  lastName      String
  phone         String?   @unique
  role          UserRole  @default(USER)
  // ... all other existing fields ...

  // ========== NEW FIELDS (optional, nullable) ==========
  developerId   String?   // 🆕 Link to developer company
  developer     Developer? @relation("DeveloperSalesTeam", fields: [developerId], references: [id])

  // ========== EXISTING RELATIONS (unchanged) ==========
  properties    Property[]
  favorites     Favorite[]
  // ... all other existing relations ...
}

// UserRole enum - ADD developer roles
enum UserRole {
  USER                    // Existing ✅
  AGENT                   // Existing ✅
  ADMIN                   // Existing ✅
  AGENCY_ADMIN            // Existing (was planned) ✅
  DEVELOPER_ADMIN         // 🆕 Developer company owner
  DEVELOPER_SALES_AGENT   // 🆕 Sales person at developer
}

// Property model - ADD developer ownership
model Property {
  // ========== EXISTING FIELDS (unchanged) ==========
  id          String        @id @default(cuid())
  userId      String        // Individual owner ✅
  user        User          @relation(...) ✅
  title       String
  description String
  price       Float
  propertyType PropertyType
  listingType ListingType
  marketType  MarketType?   // Already exists! NEW_BUILDING or SECONDARY ✅
  // ... all other existing fields ...

  // ========== NEW FIELDS (optional, nullable) ==========
  // Developer ownership (alternative to userId/agencyId)
  developerId        String?   // 🆕 Which developer owns this unit
  developer          Developer? @relation(...)

  developerProjectId String?   // 🆕 Which project this unit belongs to
  developerProject   DeveloperProject? @relation(...)

  // Unit-specific fields (for developer properties)
  buildingBlock      String?   // 🆕 "Block A", "Tower 1"
  unitNumber         String?   // 🆕 "305", "A-12"
  entrance           String?   // 🆕 Entrance number
  unitStatus         UnitStatus? @default(AVAILABLE) // 🆕 AVAILABLE, RESERVED, SOLD

  // Reservation
  reservedUntil      DateTime? // 🆕 Reservation expiry
  reservedBy         String?   // 🆕 Lead ID or name

  // Payment plan (for new builds)
  paymentPlanAvailable Boolean @default(false)  // 🆕
  downPaymentPercent   Int?    // 🆕 e.g., 30
  installmentMonths    Int?    // 🆕 e.g., 12, 24, 36
  paymentPlanDetails   String? @db.Text  // 🆕

  // Delivery timeline
  estimatedDelivery  DateTime? // 🆕 When unit ready
  isReadyToMoveIn    Boolean   @default(false)  // 🆕
  handoverDate       DateTime? // 🆕 When keys given

  // ========== EXISTING RELATIONS (unchanged) ==========
  images      PropertyImage[]
  amenities   PropertyAmenity[]
  favorites   Favorite[]
  // ... all other existing relations ...
}

enum UnitStatus {
  AVAILABLE     // For sale
  RESERVED      // Temporarily held (24-48 hours)
  SOLD          // Contract signed
  HANDED_OVER   // Keys given to buyer
}
```

**New Models - ADDED (not replacing anything):**

```prisma
// Developer company
model Developer {
  id              String    @id @default(cuid())

  // Basic Info
  name            String    // Russian name
  nameUz          String?   // Uzbek name
  slug            String    @unique
  logo            String?

  // Description (bilingual)
  descriptionRu   String?   @db.Text
  descriptionUz   String?   @db.Text

  // Legal
  licenseNumber   String?
  innTin          String?   // Tax ID
  legalEntity     String?   // OOO, AO, etc.
  legalAddress    String?
  establishedYear Int?

  // Contact
  phone           String
  email           String?
  website         String?
  telegram        String?   // @username
  whatsapp        String?

  // Location
  city            String    // Tashkent, Samarkand
  officeAddress   String?

  // Branding
  primaryColor    String    @default("#3B82F6")
  secondaryColor  String    @default("#1E40AF")

  // Status
  verified        Boolean   @default(false)
  featured        Boolean   @default(false)
  subscriptionTier String   @default("FREE")
  subscriptionExpiry DateTime?

  // Auto-updated stats
  totalProjects   Int       @default(0)
  totalUnits      Int       @default(0)
  unitsSold       Int       @default(0)
  unitsAvailable  Int       @default(0)
  rating          Float     @default(0)
  reviewCount     Int       @default(0)

  // Relations
  projects        DeveloperProject[]
  properties      Property[]
  salesTeam       User[]    @relation("DeveloperSalesTeam")
  leads           Lead[]    // When Lead model added
  deals           Deal[]    // When Deal model added

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([slug])
  @@index([city])
  @@index([verified])
}

// Residential project (complex, building)
model DeveloperProject {
  id              String    @id @default(cuid())
  developerId     String
  developer       Developer @relation(fields: [developerId], references: [id], onDelete: Cascade)

  // Basic Info
  name            String    // Russian name
  nameUz          String?   // Uzbek name
  slug            String    @unique

  // Description (bilingual)
  descriptionRu   String?   @db.Text
  descriptionUz   String?   @db.Text

  // Location
  cityId          String
  city            City      @relation(fields: [cityId], references: [id])
  districtId      String
  district        District  @relation(fields: [districtId], references: [id])
  mahallaId       String?
  mahalla         Mahalla?  @relation(fields: [mahallaId], references: [id])
  address         String
  latitude        Float?
  longitude       Float?

  // Building Details
  buildingClass   BuildingClass?  // ECONOMY, COMFORT, BUSINESS, ELITE
  buildingType    BuildingType?   // BRICK, PANEL, MONOLITHIC
  totalUnits      Int
  totalFloors     Int?
  totalBlocks     Int       @default(1)  // Number of buildings/towers
  parkingSpaces   Int?

  // Timeline
  constructionStartDate DateTime?
  completionDate  DateTime
  deliveryStages  Json?     // { "Block A": "2025-06-01", "Block B": "2025-12-01" }

  // Features & Amenities
  amenities       String[]  // pool, gym, playground, kindergarten, etc.
  hasGatedArea    Boolean   @default(false)
  hasConcierge    Boolean   @default(false)
  hasGreenArea    Boolean   @default(false)
  hasKindergarten Boolean   @default(false)
  hasCommercial   Boolean   @default(false)

  // Infrastructure
  heating         String?   // Centralized, Individual
  gasSupply       Boolean   @default(true)
  waterSupply     String?   // Centralized
  elevator        Boolean   @default(true)
  elevatorCount   Int?

  // Media
  masterPlanImage String?
  siteLayoutImage String?
  virtualTourUrl  String?
  images          ProjectImage[]
  videos          ProjectVideo[]

  // Status
  status          ProjectStatus @default(PLANNING)
  featured        Boolean   @default(false)

  // Auto-updated stats
  unitsTotal      Int       @default(0)
  unitsAvailable  Int       @default(0)
  unitsReserved   Int       @default(0)
  unitsSold       Int       @default(0)

  // Relations
  properties      Property[]  // All units in this project

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([developerId])
  @@index([status])
  @@index([cityId])
  @@index([districtId])
  @@index([completionDate])
}

enum ProjectStatus {
  PLANNING            // Project announced
  UNDER_CONSTRUCTION  // Actively building
  COMPLETED           // Construction done
  HANDED_OVER         // All units delivered
  CANCELLED           // Project cancelled
}

// Project images
model ProjectImage {
  id        String           @id @default(cuid())
  projectId String
  project   DeveloperProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  url       String
  type      ProjectImageType @default(EXTERIOR)
  caption   String?
  order     Int              @default(0)
  createdAt DateTime         @default(now())

  @@index([projectId])
  @@index([projectId, order])
}

enum ProjectImageType {
  EXTERIOR        // Building exterior
  INTERIOR        // Lobby, common areas
  AMENITY         // Pool, gym, playground
  FLOOR_PLAN      // Unit layouts
  MASTER_PLAN     // Site plan
  CONSTRUCTION    // Progress photos
  INFRASTRUCTURE  // Roads, landscaping
}

// Project videos
model ProjectVideo {
  id          String           @id @default(cuid())
  projectId   String
  project     DeveloperProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  url         String
  thumbnail   String?
  title       String?
  duration    Int?             // seconds
  order       Int              @default(0)
  createdAt   DateTime         @default(now())

  @@index([projectId])
}

// Location hierarchy (needed for both agencies AND developers)
model City {
  id         String     @id @default(cuid())
  nameRu     String
  nameUz     String
  country    String     @default("Uzbekistan")
  latitude   Float?
  longitude  Float?

  districts  District[]
  properties Property[]
  projects   DeveloperProject[]

  createdAt  DateTime   @default(now())

  @@index([nameRu])
  @@index([nameUz])
}

model District {
  id       String    @id @default(cuid())
  cityId   String
  city     City      @relation(fields: [cityId], references: [id])
  nameRu   String
  nameUz   String

  mahallas   Mahalla[]
  properties Property[]
  projects   DeveloperProject[]

  createdAt  DateTime  @default(now())

  @@index([cityId])
  @@index([nameRu])
}

model Mahalla {
  id         String     @id @default(cuid())
  districtId String
  district   District   @relation(fields: [districtId], references: [id])
  nameRu     String
  nameUz     String

  properties Property[]
  projects   DeveloperProject[]

  createdAt  DateTime   @default(now())

  @@index([districtId])
  @@index([nameRu])
}
```

#### Migration Safety Checklist

**Before Running Migration:**
- ✅ All new fields are **optional** (nullable with `?`)
- ✅ All new tables are **separate** (don't alter existing tables structure)
- ✅ Only **additive** changes to existing tables
- ✅ No foreign key constraints that could fail on existing data
- ✅ Default values provided where needed

**Migration Command:**
```bash
# Create migration
npx prisma migrate dev --name add_developer_role

# Verify in Prisma Studio
npx prisma studio
```

**Rollback Plan:**
If something goes wrong:
```bash
# Revert last migration
npx prisma migrate reset

# Or manually drop new tables:
DROP TABLE IF EXISTS "ProjectVideo";
DROP TABLE IF EXISTS "ProjectImage";
DROP TABLE IF EXISTS "DeveloperProject";
DROP TABLE IF EXISTS "Developer";
DROP TABLE IF EXISTS "Mahalla";
DROP TABLE IF EXISTS "District";
DROP TABLE IF EXISTS "City";

# Remove new columns from Property
ALTER TABLE "Property" DROP COLUMN IF EXISTS "developerId";
ALTER TABLE "Property" DROP COLUMN IF EXISTS "developerProjectId";
-- etc.
```

---

## Backend Integration

### Module Structure

**Existing Modules (Untouched):**
```
apps/api/src/modules/
├── auth/              ✅ No changes
├── properties/        ✅ No changes
├── agencies/          ✅ No changes
├── agents/            ✅ No changes
├── users/             ✅ No changes
├── upload/            ✅ No changes
├── email/             ✅ No changes
├── sms/               ✅ No changes
├── otp/               ✅ No changes
├── favorites/         ✅ No changes
├── reviews/           ✅ No changes
├── viewings/          ✅ No changes
├── messages/          ✅ No changes
├── saved-searches/    ✅ No changes
├── collections/       ✅ No changes
├── search/            ✅ No changes
└── admin/             ✅ No changes
```

**New Modules (Added):**
```
apps/api/src/modules/
├── developers/              🆕 Developer CRUD
├── developer-projects/      🆕 Project management
├── developer-leads/         🆕 Lead CRM (later)
└── developer-analytics/     🆕 Stats (later)
```

### API Routes

**Existing Routes (Untouched):**
```
POST   /api/auth/register           ✅
POST   /api/auth/login              ✅
GET    /api/properties              ✅
POST   /api/properties              ✅
GET    /api/properties/:id          ✅
PUT    /api/properties/:id          ✅
DELETE /api/properties/:id          ✅
POST   /api/upload                  ✅
GET    /api/agencies                ✅
GET    /api/agents                  ✅
... (all existing routes continue working)
```

**New Routes (Added):**
```
# Developer management
POST   /api/developers              🆕 Create developer profile
GET    /api/developers              🆕 List developers
GET    /api/developers/:id          🆕 Get developer details
PUT    /api/developers/:id          🆕 Update developer
DELETE /api/developers/:id          🆕 Delete developer

# Project management
POST   /api/developer-projects      🆕 Create project
GET    /api/developer-projects      🆕 List projects
GET    /api/developer-projects/:id  🆕 Get project details
PUT    /api/developer-projects/:id  🆕 Update project
DELETE /api/developer-projects/:id  🆕 Delete project

# Unit management (uses existing properties API with filters)
GET    /api/properties?developerId=xxx&projectId=yyy  🆕 List units
POST   /api/properties (with developerId)             🆕 Create unit
```

### Shared Services

Developers will **reuse existing services**:

```typescript
// Upload Service (existing ✅)
import { UploadService } from '../upload/upload.service';

// Developer service can use it
async uploadProjectImage(file: Express.Multer.File) {
  return this.uploadService.uploadFile(file, 'projects');  // Existing method
}

// Email Service (existing ✅)
import { EmailService } from '../email/email.service';

// Developer service can use it
async notifySalesTeam(projectId: string) {
  const project = await this.findOne(projectId);
  return this.emailService.send({
    to: project.developer.email,
    subject: 'New project created',
    template: 'project-created',
    data: { project },
  });
}

// SMS Service (existing ✅)
import { SmsService } from '../sms/sms.service';

// Developer service can use it
async notifyLeadAssignment(leadId: string, agentPhone: string) {
  return this.smsService.send(agentPhone, 'You have a new lead!');
}
```

**No code duplication** - developers leverage all existing infrastructure.

---

## Frontend Integration

### Route Structure

**Existing Routes (Untouched):**
```
apps/web/src/app/[locale]/
├── page.tsx                     ✅ Home page
├── properties/
│   ├── page.tsx                 ✅ Property listings
│   ├── [id]/
│   │   └── page.tsx             ✅ Property detail
│   ├── new/
│   │   └── page.tsx             ✅ Create property
│   └── [id]/edit/
│       └── page.tsx             ✅ Edit property
├── agencies/
│   ├── page.tsx                 ✅ Agency directory
│   └── [slug]/
│       └── page.tsx             ✅ Agency profile
├── agents/
│   ├── page.tsx                 ✅ Agent directory
│   └── [id]/
│       └── page.tsx             ✅ Agent profile
├── dashboard/
│   ├── page.tsx                 ✅ User dashboard
│   ├── favorites/
│   │   └── page.tsx             ✅ Favorites
│   ├── messages/
│   │   └── page.tsx             ✅ Messages
│   ├── profile/
│   │   └── page.tsx             ✅ Profile settings
│   └── saved-searches/
│       └── page.tsx             ✅ Saved searches
├── auth/
│   ├── login/
│   │   └── page.tsx             ✅ Login page
│   └── register/
│       └── page.tsx             ✅ Register page
└── ... (all other existing pages)
```

**New Routes (Added):**
```
apps/web/src/app/[locale]/
└── developer/                   🆕 Developer section
    ├── layout.tsx               🆕 Developer layout with nav
    ├── page.tsx                 🆕 Developer dashboard
    ├── projects/
    │   ├── page.tsx             🆕 Project list
    │   ├── new/
    │   │   └── page.tsx         🆕 Create project
    │   └── [id]/
    │       ├── page.tsx         🆕 Project details
    │       ├── edit/
    │       │   └── page.tsx     🆕 Edit project
    │       └── units/
    │           ├── page.tsx     🆕 Unit management
    │           └── new/
    │               └── page.tsx 🆕 Add units
    ├── leads/
    │   ├── page.tsx             🆕 Lead inbox
    │   ├── kanban/
    │   │   └── page.tsx         🆕 Kanban board
    │   └── [id]/
    │       └── page.tsx         🆕 Lead details
    ├── team/
    │   ├── page.tsx             🆕 Sales team
    │   └── invite/
    │       └── page.tsx         🆕 Invite agent
    ├── analytics/
    │   └── page.tsx             🆕 Analytics dashboard
    └── settings/
        └── page.tsx             🆕 Developer settings
```

### Shared Components

Developers will **reuse existing components**:

```typescript
// Image upload (existing ✅)
import { ImageUpload } from '@/components/ImageUpload';

// Developer project form can use it
<ImageUpload
  onUpload={(url) => setImages([...images, url])}
  folder="projects"
/>

// Location picker (existing ✅)
import { LocationPicker } from '@/components/LocationPicker';

// Developer project form can use it
<LocationPicker
  onSelect={(city, district, mahalla) => {
    setCityId(city.id);
    setDistrictId(district.id);
    setMahallaId(mahalla?.id);
  }}
/>

// Property card (existing ✅)
import { PropertyCard } from '@/components/PropertyCard';

// Developer's unit list can use it
{units.map(unit => (
  <PropertyCard key={unit.id} property={unit} />
))}
```

**No component duplication** - maximum code reuse.

### Navigation Integration

**User sees different nav based on role:**

```typescript
// apps/web/src/components/Header.tsx

function Header() {
  const { user } = useAuth();

  // Regular user
  if (user.role === 'USER') {
    return (
      <nav>
        <Link href="/">Home</Link>
        <Link href="/properties">Properties</Link>
        <Link href="/agencies">Agencies</Link>
        <Link href="/dashboard">My Dashboard</Link>
      </nav>
    );
  }

  // Agent
  if (user.role === 'AGENT' || user.role === 'AGENCY_ADMIN') {
    return (
      <nav>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/dashboard/listings">My Listings</Link>
        <Link href="/dashboard/leads">Leads</Link>
      </nav>
    );
  }

  // Developer (NEW 🆕)
  if (user.role === 'DEVELOPER_ADMIN' || user.role === 'DEVELOPER_SALES_AGENT') {
    return (
      <nav>
        <Link href="/developer">Dashboard</Link>
        <Link href="/developer/projects">Projects</Link>
        <Link href="/developer/leads">Leads</Link>
        {user.role === 'DEVELOPER_ADMIN' && (
          <Link href="/developer/team">Team</Link>
        )}
      </nav>
    );
  }

  // Default
  return <nav>...</nav>;
}
```

---

## User Experience Integration

### How Different Users Interact

#### 1. Property Buyer (Existing User ✅)

**Experience unchanged:**
- Visits `/properties`
- Sees ALL properties (individual + agency + **developer units**)
- Filters work the same
- Developer units show "New Building" badge
- Can favorite, compare, message seller
- **No impact from developer features**

#### 2. Real Estate Agent (Existing User ✅)

**Experience unchanged:**
- Uses `/dashboard` for their listings
- Manages leads, viewings, commissions
- Developer units appear in search results
- Can recommend developer units to clients
- **No impact from developer features**

#### 3. Real Estate Developer (New User 🆕)

**New experience:**
- Registers as developer → role set to `DEVELOPER_ADMIN`
- Gets redirected to `/developer/dashboard`
- Creates projects (residential complexes)
- Adds units (100+ apartments per project)
- Manages direct buyer leads
- Tracks sales team performance
- Units automatically appear in public search

#### 4. Developer Sales Agent (New User 🆕)

**New experience:**
- Invited by developer admin → role set to `DEVELOPER_SALES_AGENT`
- Gets access to `/developer/leads` and `/developer/projects`
- Assigned leads from developer's inventory
- Can reserve/sell units
- Tracks their own commissions

### Example: Property Search Integration

**Before (existing ✅):**
```sql
-- Properties from individuals and agencies
SELECT * FROM "Property"
WHERE status = 'ACTIVE'
  AND propertyType = 'APARTMENT'
  AND bedrooms = 3
  AND price BETWEEN 50000 AND 100000
```

**After (with developers 🆕):**
```sql
-- Same query, now includes developer units automatically
SELECT * FROM "Property"
WHERE status = 'ACTIVE'
  AND propertyType = 'APARTMENT'
  AND bedrooms = 3
  AND price BETWEEN 50000 AND 100000
-- Developer units have developerId set, but same Property table
```

**UI shows:**
```
Search Results (120 properties):

┌──────────────────────────────────────┐
│ 🏠 3-room, Yunusobod - $75,000      │
│ 📍 Individual seller                 │ ← Existing
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 🏠 3-room, Chilonzor - $72,000      │
│ 🏢 Agency: Samarkand Real Estate    │ ← Existing
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 🏠 3-room, Tashkent City - $80,000  │
│ 🏗️ NEW BUILD - Tashkent City Dev    │ ← NEW 🆕
│ 📅 Delivery: Q2 2025                 │
│ 💳 Payment plan available            │
└──────────────────────────────────────┘
```

All three types appear **seamlessly** in the same search results.

---

## Testing Integration

### Existing Tests (Should Still Pass)

```bash
# Run existing tests
pnpm test

# All existing tests should pass:
✅ User authentication tests
✅ Property CRUD tests
✅ Agency tests
✅ Agent tests
✅ Upload tests
✅ Favorite tests
✅ Review tests
```

**If any test fails:** Developer features broke something, need to fix.

### New Tests (For Developer Features)

```typescript
// Developer creation
describe('Developer API', () => {
  it('should create developer', async () => {
    const response = await request(app)
      .post('/api/developers')
      .send({
        name: 'Tashkent City',
        phone: '+998901234567',
        city: 'Tashkent',
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Tashkent City');
  });

  it('should not affect existing properties', async () => {
    // Create developer
    const developer = await createDeveloper();

    // Existing properties should still be queryable
    const properties = await request(app)
      .get('/api/properties')
      .query({ userId: 'existing-user-id' });

    expect(properties.status).toBe(200);
    expect(properties.body.length).toBeGreaterThan(0);
  });
});

// Project creation
describe('Developer Projects', () => {
  it('should create project', async () => {
    const project = await createProject({
      name: 'Tashkent City Phase 2',
      developerId: developer.id,
      totalUnits: 200,
    });

    expect(project.name).toBe('Tashkent City Phase 2');
  });

  it('should update developer stats', async () => {
    await createProject({ developerId: developer.id });

    const updated = await getDeveloper(developer.id);
    expect(updated.totalProjects).toBe(1);
  });
});
```

---

## Deployment Integration

### Staging Deployment (No Downtime)

**Step 1: Database Migration (Week 1)**
```bash
# SSH to staging server
ssh root@staging.jahongir-app.uz

# Navigate to project
cd /var/www/realestate-staging

# Pull latest code
git pull origin develop

# Run migration (ADDITIVE, no breaking changes)
npx prisma migrate deploy

# Restart API (optional, existing features still work)
pm2 restart realestate-staging-api
```

**Result:**
- ✅ New tables created
- ✅ New columns added (all nullable)
- ✅ Existing features continue working
- ✅ No user-facing changes yet

**Step 2: Backend Deployment (Week 2)**
```bash
# Build API with new modules
pnpm --filter @repo/api build

# Restart API
pm2 restart realestate-staging-api
```

**Result:**
- ✅ New API routes available (`/api/developers`, etc.)
- ✅ Existing routes unchanged
- ✅ Still no user-facing changes

**Step 3: Frontend Deployment (Week 2)**
```bash
# Build web with new pages
pnpm --filter @repo/web build

# Restart web
pm2 restart realestate-staging-web
```

**Result:**
- ✅ `/developer` routes available
- ✅ Existing pages unchanged
- ✅ Developer features live!

### Production Deployment Checklist

Before deploying to production:

- [ ] All existing tests pass
- [ ] New developer tests pass
- [ ] Manual QA on staging:
  - [ ] Existing user can still browse properties
  - [ ] Existing agent can still list properties
  - [ ] Developer can create account
  - [ ] Developer can create project
  - [ ] Developer units appear in search
- [ ] Database backup created
- [ ] Migration tested on staging database
- [ ] Rollback plan ready

---

## Monitoring Integration

### What to Monitor

**Existing Metrics (Should Not Change):**
- User registrations per day
- Property listings created
- Search queries
- API response times
- Error rates

**New Metrics (Developer Features):**
- Developer registrations per day
- Projects created
- Units added
- Developer units in search results
- Developer lead conversions

**Alert if:**
- Existing metrics drop significantly (indicates broken integration)
- Developer metrics are zero (indicates features not working)
- Error rates spike (indicates bugs)

---

## Rollback Strategy

### If Something Goes Wrong

**Immediate Rollback (5 minutes):**
```bash
# Revert to previous deployment
git checkout previous-commit
pnpm build
pm2 restart all

# Or use PM2 saved deployment
pm2 reload --restore
```

**Database Rollback (15 minutes):**
```bash
# Restore database backup
pg_restore -d realestate_prod backup_before_developer_migration.sql

# Or revert migration
npx prisma migrate reset --to-migration previous_migration_name
```

**Feature Flag Approach (Recommended):**
```typescript
// Environment variable
ENABLE_DEVELOPER_FEATURES=false

// In code
if (process.env.ENABLE_DEVELOPER_FEATURES === 'true') {
  // Show developer features
} else {
  // Hide developer features
}
```

This allows **instant disable** without code changes or database rollback.

---

## Communication Plan

### Internal Team

**Week 1:**
- "We're adding developer features to the platform"
- "No impact on existing features"
- "Database migration scheduled for Monday 8 AM"

**Week 2:**
- "Backend API deployed, no user-facing changes"
- "Testing developer features in staging"

**Week 3:**
- "Developer dashboard launching Friday"
- "Existing users unaffected"

### Users (If Any Impact)

**Notification:**
```
Subject: New Feature: Developer Accounts

We're excited to announce a new account type for real estate
developers! This allows developers to manage residential
projects and units more effectively.

What's changing for you:
- Nothing! Your experience remains the same.
- You'll now see even more properties (developer units).

Questions? Contact support@jahongir-app.uz
```

---

## Success Criteria

### Integration Successful If:

**Week 1-2 (Foundation):**
- ✅ Migration runs without errors
- ✅ All existing tests still pass
- ✅ Existing users can still use platform normally
- ✅ Developer profile can be created
- ✅ Developer dashboard accessible

**Week 3-4 (Projects):**
- ✅ Developer can create project
- ✅ Developer can add units
- ✅ Developer units appear in public search
- ✅ Existing property search unaffected

**Week 5-6 (Leads):**
- ✅ Developer receives leads
- ✅ Lead assignment works
- ✅ Existing messaging system works

**Week 7-10 (Polish):**
- ✅ All features stable
- ✅ No regression bugs
- ✅ Performance acceptable
- ✅ Ready for launch

---

## Key Principles to Remember

1. **Additive, Not Disruptive**
   - Always add new features, never break existing

2. **Reuse, Don't Rebuild**
   - Use existing services, components, infrastructure

3. **Parallel, Not Sequential**
   - New features run alongside existing ones

4. **Reversible, Not Permanent**
   - Always have a rollback plan

5. **Test, Don't Assume**
   - Verify existing features still work after each change

---

## Quick Reference

### When in Doubt, Ask:

- ✅ "Does this change affect existing users?"
  - **If YES:** Rethink approach, make it optional
  - **If NO:** Proceed

- ✅ "Can I reuse an existing service/component?"
  - **If YES:** Use it, don't rebuild
  - **If NO:** Create new one, don't modify existing

- ✅ "Is this field required or optional?"
  - **Make it optional** (nullable) unless absolutely critical

- ✅ "Will this migration fail on existing data?"
  - **If YES:** Change approach, use default values
  - **If NO:** Proceed

---

## Document Maintenance

**Update this document when:**
- Adding new developer features
- Changing integration approach
- Discovering new issues
- Learning new best practices

**Last Updated:** December 12, 2025
**Next Review:** After Week 2 implementation
