# Current Features Analysis & Adjusted CRM MVP Plan

**Document Version:** 1.0
**Date:** December 12, 2025
**Status:** Gap Analysis Complete

---

## Executive Summary

### Current State
The platform is a **well-built consumer real estate marketplace** (similar to Domtut/Realting/Uybor) with 80% of core property listing features complete. However, it lacks **agency CRM capabilities** needed for the Uzbekistan market.

### Key Finding
**Good News:** Strong foundation exists. We're not starting from scratch.
**Challenge:** Need to pivot from B2C (consumer marketplace) to **B2B2C** (agency CRM + marketplace).

### Estimated Work Remaining
- **Database Schema:** 40% additional work (add CRM models, enhance existing)
- **Backend API:** 50% additional work (new CRM endpoints)
- **Frontend UI:** 60% additional work (agent dashboards, lead management)
- **Integrations:** 80% new work (Telegram, AI, etc.)

**Adjusted Timeline:** 8-9 weeks (was 11 weeks from scratch)

---

## Table of Contents

1. [What's Already Implemented](#whats-already-implemented)
2. [What Needs Enhancement](#what-needs-enhancement)
3. [What's Completely Missing](#whats-completely-missing)
4. [Gap Analysis by Feature Category](#gap-analysis-by-feature-category)
5. [Adjusted MVP Plan](#adjusted-mvp-plan)
6. [Database Schema Changes Required](#database-schema-changes-required)
7. [Implementation Priority Matrix](#implementation-priority-matrix)

---

## What's Already Implemented

### ✅ Authentication & Users (95% Complete)

**Database Models:**
```prisma
✅ User (with phone, email, passwordHash)
✅ OtpCode (phone verification, 3min expiry, brute force protection)
✅ UserRole enum (USER, AGENT, ADMIN)
```

**API Modules:**
```
✅ /api/auth/register (email + phone)
✅ /api/auth/login (email + phone)
✅ /api/auth/phone/request-otp
✅ /api/auth/phone/verify-otp
✅ /api/auth/google (OAuth)
✅ /api/users (CRUD)
```

**Frontend Pages:**
```
✅ /auth/login
✅ /auth/register
✅ /auth/callback (OAuth)
✅ /dashboard/profile
```

**Services Configured:**
```
✅ Eskiz SMS (OTP delivery)
✅ Brevo SMTP (email notifications)
✅ Google OAuth
✅ JWT authentication
```

**What's Missing:**
- ❌ Agency-level user roles (Agency Admin vs Agent)
- ❌ Invite system for adding agents to agency
- ❌ Multi-tenant data isolation per agency

---

### ✅ Property Management (85% Complete for Marketplace, 40% for CRM)

**Database Model:**
```prisma
✅ Property (comprehensive model with 40+ fields)
  ✅ marketType (NEW_BUILDING / SECONDARY)
  ✅ district, mahalla (string fields)
  ✅ renovation (NONE, COSMETIC, EURO, DESIGNER, NEEDS_REPAIR)
  ✅ buildingClass (ECONOMY, COMFORT, BUSINESS, ELITE)
  ✅ parkingType (STREET, UNDERGROUND, GARAGE, MULTI_LEVEL)
  ✅ price, priceUsd, currency
  ✅ bedrooms, bathrooms, area, floor, totalFloors
  ✅ yearBuilt, ceilingHeight
  ✅ balcony, loggia, parking
  ✅ buildingType, buildingName
  ✅ hasConcierge, hasGatedArea, hasGarbageChute
  ✅ views counter, featured flag, verified flag
  ❌ descriptionRu / descriptionUz (only single description field)
  ❌ developerName, completionDate, paymentPlan (for NEW_BUILDING)
```

**API Endpoints:**
```
✅ POST /api/properties (create)
✅ GET /api/properties (list with extensive filtering)
✅ GET /api/properties/:id (detail)
✅ PUT /api/properties/:id (update)
✅ DELETE /api/properties/:id (delete)
✅ POST /api/upload (image upload to R2)
```

**Frontend Pages:**
```
✅ /properties (list with filters)
✅ /properties/new (creation wizard)
✅ /properties/:id (detail view)
✅ /properties/:id/edit
```

**Advanced Features:**
```
✅ PropertyImage (with ordering)
✅ PropertyAmenity (flexible amenities)
✅ PriceHistory (automatic price change tracking)
✅ PropertyStatusHistory (status change log)
✅ PropertyAnalytics (daily metrics)
✅ PropertyView (view tracking with IP, user agent)
✅ PropertyPOI (nearby points of interest)
✅ NearbyAmenity (metro, schools, etc.)
✅ LocationService (geocoding, POI fetching)
✅ ValuationService (price estimation)
✅ RecommendationService (similar properties)
```

**What's Missing for CRM:**
- ❌ Bilingual descriptions (Russian + Uzbek separate fields)
- ❌ City/District/Mahalla models (currently just strings)
- ❌ New build specific fields (developer, completion date, payment plan)
- ❌ Property sharing templates (WhatsApp, Telegram formats)
- ❌ QR code generation
- ❌ Watermarking on upload
- ❌ AI description generation

---

### ✅ Agency & Agents (60% Complete Structure, 20% CRM Functionality)

**Database Models:**
```prisma
✅ Agency (name, slug, logo, description, website, email, phone, address, verified)
✅ Agent (userId, agencyId, photo, bio, phone, email, whatsapp, telegram)
  ✅ licenseNumber, specializations, languages, areasServed
  ✅ yearsExperience, totalDeals, rating, reviewCount
  ✅ verified, superAgent flags
✅ AgentReview (rating, comment, dealType)
```

**API Modules:**
```
✅ /api/agencies (CRUD)
✅ /api/agents (CRUD)
✅ /api/agents/:id/reviews
```

**Frontend Pages:**
```
✅ /agencies (list)
✅ /agencies/:slug (detail)
✅ /agents (list)
✅ /agents/:id (profile)
```

**What's Missing for CRM:**
- ❌ Multi-tenant isolation (agents can't be restricted to their agency's data)
- ❌ Agency Admin role (to manage agents within agency)
- ❌ Agent invite/onboarding flow
- ❌ Agency dashboard (performance metrics, agent management)
- ❌ Agency mini-website (public property showcase)
- ❌ Commission tracking per agent
- ❌ Agent performance analytics
- ❌ Lead assignment to agents

---

### ✅ Favorites & Collections (100% Complete for Consumers)

**Database Models:**
```prisma
✅ Favorite (user favorites properties)
✅ Collection (user organizes properties in folders)
✅ CollectionProperty (many-to-many with notes)
```

**API & Frontend:**
```
✅ /api/favorites (add, remove, list)
✅ /api/collections (CRUD)
✅ /dashboard/favorites
```

**Status:** Complete for consumer use case. Not needed for CRM.

---

### ✅ Messaging System (80% Complete for Property Inquiries)

**Database Models:**
```prisma
✅ Conversation (propertyId, participant1, participant2)
✅ Message (conversationId, senderId, content, read, readAt)
```

**API & Frontend:**
```
✅ /api/messages (send, list, mark as read)
✅ /dashboard/messages
```

**What's Missing for CRM:**
- ❌ Lead capture from messages (messages don't create Lead records)
- ❌ Telegram message integration
- ❌ WhatsApp message integration
- ❌ Voice message transcription
- ❌ Message templates

---

### ✅ Viewing Scheduler (70% Complete, Needs CRM Enhancements)

**Database Model:**
```prisma
✅ Viewing (propertyId, requesterId, ownerId, date, time, status, message, notes)
✅ ViewingStatus enum (PENDING, CONFIRMED, CANCELLED, COMPLETED)
```

**API:**
```
✅ /api/viewings (request, confirm, cancel)
```

**What's Missing for CRM:**
- ❌ Calendar view for agents
- ❌ SMS confirmation to client (Eskiz is configured, just needs integration)
- ❌ Google Calendar sync
- ❌ Daily agenda email
- ❌ Viewing linked to Lead (not just property + requester)

---

### ✅ Reviews & Ratings (100% Complete)

**Database Models:**
```prisma
✅ Review (property reviews)
✅ AgentReview (agent reviews)
```

**API & Frontend:**
```
✅ /api/reviews (CRUD)
✅ /api/agents/:id/reviews
```

**Status:** Complete. Not critical for CRM MVP.

---

### ✅ Saved Searches (100% Complete)

**Database Model:**
```prisma
✅ SavedSearch (filters as JSON, notifications enabled)
```

**API & Frontend:**
```
✅ /api/saved-searches
✅ /dashboard/saved-searches
```

**Status:** Complete for consumers. Could be useful for agents searching for client needs.

---

### ✅ Analytics & Tracking (90% Complete for Property Insights)

**Database Models:**
```prisma
✅ PropertyAnalytics (daily metrics: views, favorites, contacts)
✅ PropertyView (individual view tracking)
✅ RecentlyViewed (user view history)
✅ AdminLog (audit trail for admin actions)
```

**API & Frontend:**
```
✅ /api/properties/:id/analytics
✅ /dashboard/analytics
```

**What's Missing for CRM:**
- ❌ Agent performance analytics
- ❌ Lead conversion metrics
- ❌ Response time tracking
- ❌ Deal closure rate

---

### ✅ Advanced Services (Property Intelligence)

**Backend Services:**
```
✅ LocationService (geocoding, reverse geocoding, POI fetching from OpenStreetMap)
✅ ValuationService (price estimation based on similar properties)
✅ RecommendationService (find similar properties)
✅ PriceHistoryService (track price changes)
✅ POIService (fetch nearby amenities)
✅ AnalyticsService (property metrics)
✅ StatusHistoryService (track property status changes)
```

**Status:** These are excellent foundations that can be leveraged for CRM features (e.g., AI price suggestions use ValuationService).

---

### ✅ Infrastructure & Integrations

**Configured Services:**
```
✅ Cloudflare R2 (image storage, S3-compatible)
✅ Eskiz SMS (Uzbekistan SMS provider)
✅ Brevo SMTP (transactional emails)
✅ Redis (ready for queues, caching)
✅ PostgreSQL + Prisma ORM
✅ Next.js 14 (App Router)
✅ NestJS (backend API)
✅ Multi-language (next-intl: Russian + Uzbek)
```

**What's Missing:**
- ❌ Telegram Bot API integration
- ❌ WhatsApp Business API integration
- ❌ Anthropic Claude API (for AI features)
- ❌ Currency conversion API (USD ↔ UZS)
- ❌ QR code generation library

---

## What Needs Enhancement

### 🔧 Property Model Enhancements

**Current:** Single `description` field (no language separation)

**Needed:**
```prisma
model Property {
  // Change from:
  description String

  // To:
  descriptionRu String @db.Text
  descriptionUz String? @db.Text

  // Add for NEW_BUILDING properties:
  developerName   String?
  completionDate  DateTime?
  paymentPlan     String? @db.Text

  // Enhance location:
  cityId      String?
  city        City? @relation(...)
  districtId  String?
  district    District? @relation(...)
  mahallaId   String?
  mahalla     Mahalla? @relation(...)
}
```

**Migration Required:** Yes (alter table, data migration for existing descriptions)

---

### 🔧 Agency Multi-Tenancy

**Current:** Agency and Agent exist but no data isolation

**Needed:**
```prisma
model User {
  // Add:
  agencyId String?
  agency   Agency? @relation(...)
  agentRole AgentRole? // AGENCY_ADMIN | AGENT
}

enum AgentRole {
  AGENCY_ADMIN  // Can manage agency, invite agents
  AGENT         // Regular agent
}

model Property {
  // Add:
  agencyId String?
  agency   Agency? @relation(...)
  // Properties belong to agencies, not just users
}
```

**Code Changes:**
- Add row-level security in queries (filter by agencyId)
- Add agency context to JWT tokens
- Add permission guards for agency resources

---

### 🔧 Viewing → Calendar Integration

**Current:** Basic viewing requests

**Needed:**
- Calendar view component (full calendar with time slots)
- SMS confirmation trigger (Eskiz already configured)
- Google Calendar .ics export
- Daily digest email

**Code Changes:**
- New `CalendarService` in backend
- Calendar UI component in frontend (`@fullcalendar/react`)
- Scheduled job for daily digest emails

---

## What's Completely Missing

### ❌ Lead Management System (0% - CRITICAL FOR CRM)

**Database Models Needed:**
```prisma
enum LeadSource {
  WEBSITE
  TELEGRAM
  WHATSAPP
  PHONE_CALL
  WALK_IN
  REFERRAL
  MANUAL
}

enum LeadStatus {
  NEW
  CONTACTED
  VIEWING_SCHEDULED
  OFFER_MADE
  CONTRACT_SIGNED
  CLOSED_WON
  CLOSED_LOST
}

model Lead {
  id              String     @id @default(cuid())
  agencyId        String
  agency          Agency     @relation(...)

  // Client Info
  name            String
  phone           String
  email           String?

  // Source & Context
  source          LeadSource
  sourceDetails   String?    // e.g., "Telegram @username"
  propertyId      String?
  property        Property?  @relation(...)
  message         String?    @db.Text

  // Assignment
  assignedToId    String?
  assignedTo      User?      @relation(...)
  assignedAt      DateTime?

  // Status
  status          LeadStatus @default(NEW)
  statusChangedAt DateTime   @default(now())

  // Metadata
  lastContactedAt DateTime?
  nextFollowUpAt  DateTime?
  priority        Int        @default(0)

  // Relations
  notes           LeadNote[]
  activities      LeadActivity[]
  viewing         Viewing?

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@index([agencyId, status])
  @@index([assignedToId])
  @@index([source])
  @@index([createdAt])
}

model LeadNote {
  id        String   @id @default(cuid())
  leadId    String
  lead      Lead     @relation(...)
  userId    String   // Agent who added note
  content   String   @db.Text
  isVoiceNote Boolean @default(false)
  audioUrl    String? // For voice messages
  createdAt DateTime @default(now())

  @@index([leadId])
}

model LeadActivity {
  id          String       @id @default(cuid())
  leadId      String
  lead        Lead         @relation(...)
  userId      String?
  type        ActivityType
  description String
  metadata    Json?        // Extra data (old status, new status, etc.)
  createdAt   DateTime     @default(now())

  @@index([leadId, createdAt])
}

enum ActivityType {
  CREATED
  ASSIGNED
  STATUS_CHANGED
  NOTE_ADDED
  CONTACTED
  EMAIL_SENT
  SMS_SENT
  VIEWING_SCHEDULED
  OFFER_MADE
}
```

**API Endpoints Needed:**
```
POST   /api/leads              (create lead)
GET    /api/leads              (list with filters: status, assigned to, source)
GET    /api/leads/:id          (detail)
PUT    /api/leads/:id          (update)
PUT    /api/leads/:id/assign   (assign to agent)
PUT    /api/leads/:id/status   (change status → auto-log activity)
POST   /api/leads/:id/notes    (add note)
GET    /api/leads/:id/timeline (activity feed)
GET    /api/leads/overdue      (leads needing follow-up)
```

**Frontend Pages Needed:**
```
/dashboard/leads              (inbox view)
/dashboard/leads/kanban       (pipeline view)
/dashboard/leads/:id          (detail with timeline)
/dashboard/leads/:id/convert  (convert to deal)
```

**Estimated Work:** 2-3 weeks

---

### ❌ Location Hierarchy Models (0%)

**Current:** `city`, `district`, `mahalla` are just strings

**Needed:**
```prisma
model City {
  id         String     @id @default(cuid())
  nameRu     String
  nameUz     String
  country    String     @default("Uzbekistan")
  districts  District[]
  properties Property[]
  agencies   Agency[]
}

model District {
  id         String     @id @default(cuid())
  cityId     String
  city       City       @relation(...)
  nameRu     String
  nameUz     String
  mahallas   Mahalla[]
  properties Property[]
}

model Mahalla {
  id         String     @id @default(cuid())
  districtId String
  district   District   @relation(...)
  nameRu     String
  nameUz     String
  properties Property[]
}
```

**Seed Data Required:**
- Tashkent: 11 districts, ~220 mahallas
- Samarkand: 9 districts, ~90 mahallas
- Total: ~310 records

**UI Components Needed:**
- Cascading dropdowns (City → District → Mahalla)
- Autocomplete for mahalla search

**Estimated Work:** 1 week (including seed data collection)

---

### ❌ Telegram Bot Integration (0% - CRITICAL FOR UZBEKISTAN)

**What's Needed:**

**1. Database:**
```prisma
model TelegramBotConfig {
  id         String  @id @default(cuid())
  agencyId   String  @unique
  agency     Agency  @relation(...)
  botToken   String  // From @BotFather
  channelId  String? // Optional: auto-post channel
  isActive   Boolean @default(true)
}

model Lead {
  // Add:
  telegramUserId   String?
  telegramUsername String?
}
```

**2. Backend Service:**
```typescript
// apps/api/src/modules/telegram/
- telegram.module.ts
- telegram.service.ts (bot logic)
- telegram.controller.ts (webhook)
```

**3. Bot Features:**
- `/start` - Subscribe to updates
- `/search` - Find properties (interactive filters)
- Property inquiry → Create Lead
- Auto-post new properties to channel

**4. Libraries:**
```bash
pnpm add grammy  # Modern Telegram bot framework
```

**Estimated Work:** 2 weeks

---

### ❌ AI Features (0% - DIFFERENTIATOR)

**1. AI Description Generator:**

**Service:**
```typescript
// apps/api/src/modules/ai/
- ai.module.ts
- ai.service.ts (Claude API integration)
- description-generator.service.ts
```

**API:**
```
POST /api/properties/generate-description
Body: { propertyType, bedrooms, area, district, mahalla, features, photos }
Response: {
  ru: { short, detailed, instagram },
  uz: { short, detailed, instagram }
}
```

**Frontend:**
```
Property Creation Wizard:
- [Generate AI Description] button
- Preview modal with editable output
- Language tabs (RU / UZ)
```

**2. AI Price Suggestion:**

**Service:**
```typescript
// Leverage existing ValuationService
- Enhance with more sophisticated algorithm
- Add "market insights" (days to sell, confidence level)
```

**API:**
```
GET /api/properties/price-suggestion?district=...&bedrooms=...&area=...
Response: {
  recommended: 72000,
  range: { low: 65000, high: 80000 },
  pricePerSqm: 847,
  confidence: "MEDIUM",
  similarCount: 8,
  insight: "Properties at this price sell in avg 21 days"
}
```

**Estimated Work:** 1 week

---

### ❌ Commission Tracking (0%)

**Database:**
```prisma
model Deal {
  id            String     @id @default(cuid())
  leadId        String     @unique
  lead          Lead       @relation(...)
  propertyId    String
  property      Property   @relation(...)

  agentId       String
  agent         User       @relation(...)
  agencyId      String
  agency        Agency     @relation(...)

  salePrice     Float      // Final sale price
  currency      Currency
  priceUSD      Float      // Normalized

  commissionRate    Float  // e.g., 3.0 (%)
  commissionAmount  Float  // Calculated
  agentShare        Float? // Agent's cut
  agencyShare       Float? // Agency's cut

  closedAt      DateTime
  createdAt     DateTime   @default(now())

  @@index([agentId])
  @@index([agencyId])
  @@index([closedAt])
}
```

**API:**
```
POST /api/deals              (close deal from lead)
GET  /api/deals              (list deals, filter by agent/agency/date)
GET  /api/agents/:id/performance (deals, commissions, conversion rate)
```

**Frontend:**
```
/dashboard/deals             (closed deals list)
/dashboard/performance       (agent performance dashboard)
```

**Estimated Work:** 1 week

---

### ❌ Agency Mini-Websites (0%)

**Current:** Agency has `slug` field but no public showcase

**Needed:**

**1. Dynamic Routing:**
```typescript
// apps/web/src/app/[agencySlug]/page.tsx
// OR apps/web/src/app/agencies/[slug]/public/page.tsx

export async function generateStaticParams() {
  const agencies = await prisma.agency.findMany();
  return agencies.map(a => ({ agencySlug: a.slug }));
}
```

**2. Agency Public Pages:**
```
/agencies/:slug/public
  ├─ Hero (logo, name, description)
  ├─ Property Grid (agency's active listings)
  ├─ Filters (type, bedrooms, district, price)
  ├─ Contact Form → Creates Lead
  └─ Agent Team (photos, contacts)
```

**3. Lead Capture:**
```typescript
// Contact form submission
POST /api/agencies/:slug/leads
→ Create Lead with source: WEBSITE
→ Assign to agent (round-robin)
→ Send notification to agent
```

**Estimated Work:** 1 week

---

### ❌ Property Sharing & QR Codes (0%)

**1. Sharing Templates:**

**Service:**
```typescript
// apps/api/src/modules/properties/sharing.service.ts

generateWhatsAppMessage(property): string
generateTelegramMessage(property): string
generateEmailTemplate(property): string
```

**API:**
```
GET /api/properties/:id/share?format=whatsapp|telegram|email
```

**Frontend:**
```
Property Detail Page (Agent View):
- [Share to WhatsApp] → Copy formatted message
- [Share to Telegram] → Copy formatted message
- [Send Email] → Pre-filled email template
```

**2. QR Code Generator:**

**Library:**
```bash
pnpm add qrcode @types/qrcode
```

**Service:**
```typescript
// apps/api/src/modules/properties/qr-code.service.ts

generatePropertyQR(propertyId): Promise<Buffer>
generateAgencyQR(agencySlug): Promise<Buffer>
generateAgentVCardQR(agent): Promise<Buffer>
```

**API:**
```
GET /api/properties/:id/qr-code (returns PNG image)
GET /api/agencies/:slug/qr-code
GET /api/agents/:id/qr-code
```

**Estimated Work:** 3-4 days

---

### ❌ Follow-Up Reminder System (0%)

**Database:**
```prisma
model Lead {
  // Add:
  nextFollowUpAt DateTime?
  reminderSent   Boolean @default(false)
}

model FollowUpReminder {
  id        String   @id @default(cuid())
  leadId    String
  lead      Lead     @relation(...)
  agentId   String
  dueAt     DateTime
  completed Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([agentId, dueAt, completed])
}
```

**Scheduled Jobs:**
```typescript
// apps/api/src/modules/scheduler/

@Cron('0 9 * * *')  // Daily at 9 AM
async sendDailyDigest() {
  // Find all agents with overdue leads
  // Send email with:
  //   - Overdue follow-ups
  //   - Today's viewings
  //   - New leads assigned
}

@Cron('*/30 * * * *')  // Every 30 minutes
async checkOverdueLeads() {
  // Find leads with lastContactedAt > 48 hours ago
  // Send reminder email + SMS to assigned agent
  // Update reminderSent flag
}
```

**Frontend:**
```
Dashboard:
- "⚠️ Overdue Follow-ups (3)" widget
- List of leads needing attention
- [Snooze] [Mark as Contacted] actions
```

**Estimated Work:** 1 week

---

## Gap Analysis by Feature Category

### Phase 1: Foundation
| Feature | Current | Needed | Work |
|---------|---------|--------|------|
| Multi-tenancy | ⚠️ 30% | Agency data isolation, roles | 1 week |
| Location Hierarchy | ❌ 0% | City/District/Mahalla models + seed | 1 week |
| Bilingual Fields | ❌ 0% | Separate RU/UZ descriptions | 3 days |
| Auth System | ✅ 95% | Agent invite flow | 2 days |

**Total Phase 1:** 2.5 weeks (was 2 weeks from scratch) ✅ **Faster**

---

### Phase 2: Listing Management
| Feature | Current | Needed | Work |
|---------|---------|--------|------|
| Property CRUD | ✅ 90% | Add new build fields, bilingual descriptions | 3 days |
| Image Upload | ✅ 100% | Add watermarking | 2 days |
| Public Listing Page | ✅ 80% | Add sharing buttons, QR code | 2 days |
| Location Picker | ❌ 0% | Cascading dropdowns UI | 3 days |

**Total Phase 2:** 1.5 weeks (was 2 weeks) ✅ **Faster**

---

### Phase 3: Lead Management
| Feature | Current | Needed | Work |
|---------|---------|--------|------|
| Lead Model | ❌ 0% | Full Lead schema + API | 1 week |
| Lead Inbox | ❌ 0% | Table view + filters | 3 days |
| Kanban Pipeline | ❌ 0% | Drag-drop board | 3 days |
| Lead Assignment | ❌ 0% | Manual + auto round-robin | 2 days |
| Telegram Bot | ❌ 0% | Bot setup + integration | 2 weeks |

**Total Phase 3:** 3.5 weeks (was 3 weeks) ⚠️ **Slightly longer (Telegram is complex)**

---

### Phase 4: Agent Tools
| Feature | Current | Needed | Work |
|---------|---------|--------|------|
| Viewing Scheduler | ✅ 70% | Calendar UI + SMS confirmation | 4 days |
| Follow-Up Reminders | ❌ 0% | Scheduled jobs + digest emails | 4 days |
| Commission Tracking | ❌ 0% | Deal model + close flow | 3 days |
| Performance Dashboard | ❌ 0% | Agent metrics UI | 2 days |

**Total Phase 4:** 2 weeks (was 2 weeks) ✅ **Same**

---

### Phase 5: AI Features
| Feature | Current | Needed | Work |
|---------|---------|--------|------|
| Valuation Service | ✅ 80% | Enhance with better algorithm | 1 day |
| AI Descriptions | ❌ 0% | Claude API integration + UI | 3 days |
| Price Suggestions | ⚠️ 50% | Leverage existing ValuationService | 2 days |

**Total Phase 5:** 0.75 weeks (was 1 week) ✅ **Faster (ValuationService helps)**

---

### Phase 6: Agency Branding
| Feature | Current | Needed | Work |
|---------|---------|--------|------|
| Agency Model | ✅ 100% | Already has slug, description | 0 days |
| Mini-Website | ❌ 0% | Public page template | 3 days |
| Sharing Templates | ❌ 0% | WhatsApp/Telegram formatters | 2 days |
| QR Codes | ❌ 0% | QR generation service | 1 day |

**Total Phase 6:** 0.75 weeks (was 1 week) ✅ **Faster (Agency model exists)**

---

### Summary of Adjusted Timeline

| Phase | Original | Adjusted | Change |
|-------|----------|----------|--------|
| Phase 1: Foundation | 2 weeks | 2.5 weeks | +0.5 week (location seed data) |
| Phase 2: Listings | 2 weeks | 1.5 weeks | -0.5 week (CRUD exists) |
| Phase 3: Leads + Telegram | 3 weeks | 3.5 weeks | +0.5 week (Telegram complexity) |
| Phase 4: Agent Tools | 2 weeks | 2 weeks | Same |
| Phase 5: AI Features | 1 week | 0.75 week | -0.25 week (Valuation exists) |
| Phase 6: Branding | 1 week | 0.75 week | -0.25 week (Agency exists) |
| **TOTAL** | **11 weeks** | **11 weeks** | **Same** |

**BUT:** With parallel development (front-end + back-end teams), can compress to **8-9 weeks**.

---

## Adjusted MVP Plan

### PHASE 1: Enhanced Foundation (2.5 Weeks)

#### Week 1: Multi-Tenancy & Location Hierarchy

**Database Changes:**
```prisma
// 1. Add City, District, Mahalla models
// 2. Update Property to reference these models
// 3. Add agencyId to Property
// 4. Add agentRole to User
// 5. Migration script to convert existing city/district/mahalla strings
```

**Backend:**
- Implement row-level security in queries (filter by agencyId)
- Add agency context to JWT tokens
- Create seed script for Tashkent + Samarkand locations

**Frontend:**
- Cascading location picker component
- Agency admin dashboard (basic layout)
- Agent list within agency

**Deliverables:**
- ✅ Each agency has isolated data
- ✅ Location hierarchy (City → District → Mahalla) functional
- ✅ Seed data: ~310 mahallas loaded

---

#### Week 2: Bilingual Descriptions & New Build Fields

**Database Changes:**
```prisma
model Property {
  // Change:
  description     String → REMOVE
  descriptionRu   String @db.Text
  descriptionUz   String? @db.Text

  // Add for NEW_BUILDING:
  developerName   String?
  completionDate  DateTime?
  paymentPlan     String? @db.Text
}
```

**Migration:**
- Copy existing `description` to `descriptionRu`
- Set `descriptionUz` to NULL (agents will fill in later)

**Frontend:**
- Update property form: separate RU/UZ description textareas
- Conditional fields for NEW_BUILDING (developer, completion date)

**Deliverables:**
- ✅ Properties have separate Russian and Uzbek descriptions
- ✅ New build properties capture developer info

---

### PHASE 2: Enhanced Listing Management (1.5 Weeks)

#### Week 3-4: Watermarking & Location UI

**Backend:**
```typescript
// Upload service enhancement
import sharp from 'sharp';

async uploadWithWatermark(imageBuffer, agencyId) {
  const agency = await getAgency(agencyId);
  const logoBuffer = await fetch(agency.logoUrl).then(r => r.buffer());

  const watermarked = await sharp(imageBuffer)
    .composite([{
      input: logoBuffer,
      gravity: 'southwest',
      opacity: 0.8,
    }])
    .toBuffer();

  return uploadToR2(watermarked);
}
```

**Frontend:**
- Location picker component (City → District → Mahalla cascading)
- Property sharing buttons (WhatsApp, Telegram, Copy Link)
- QR code display on property detail page

**Deliverables:**
- ✅ Images auto-watermarked with agency logo
- ✅ Location selection works down to mahalla level
- ✅ Properties shareable with formatted messages

---

### PHASE 3: Lead Management + Telegram (3.5 Weeks)

#### Week 5: Lead Model & Basic Inbox

**Database:**
```prisma
model Lead { /* Full schema from "What's Missing" section */ }
model LeadNote { ... }
model LeadActivity { ... }
```

**Backend API:**
```
POST   /api/leads
GET    /api/leads (filters: status, assigned to, source)
GET    /api/leads/:id
PUT    /api/leads/:id
PUT    /api/leads/:id/assign
PUT    /api/leads/:id/status
POST   /api/leads/:id/notes
```

**Frontend:**
```
/dashboard/leads (table view)
- Columns: Name, Phone, Source, Property, Status, Assigned To, Created
- Filters: Status, Source, Agent
- Actions: Assign, Change Status, Add Note
```

**Deliverables:**
- ✅ Lead model functional
- ✅ Leads can be created manually
- ✅ Lead inbox shows all agency leads

---

#### Week 6: Kanban Pipeline & Assignment

**Frontend:**
```
/dashboard/leads/kanban
- Columns: NEW | CONTACTED | VIEWING | OFFER | CLOSED
- Drag & drop cards between columns
- Card shows: Name, Phone, Property, Days since created
- Click card → Open detail panel
```

**Backend:**
- Auto-assign logic (round-robin among available agents)
- Status change → log activity automatically
- Email notification on assignment

**Deliverables:**
- ✅ Kanban board functional
- ✅ Leads auto-assigned to agents
- ✅ Agents notified via email + SMS

---

#### Week 7-8: Telegram Bot Integration

**Setup:**
1. Create bot via @BotFather
2. Add `TELEGRAM_BOT_TOKEN` to .env
3. Set webhook to API

**Bot Commands:**
```
/start - Subscribe to property updates
/search - Find properties (interactive)
/contact - Speak with agent
```

**Bot Flows:**

**Flow 1: Property Search**
```
User: /search
Bot: What are you looking for?
     [Apartment] [House] [Commercial]
User: Clicks Apartment
Bot: How many rooms?
     [Studio] [1] [2] [3] [4+]
User: Clicks 3
Bot: Which district?
     [Yunusobod] [Chilonzor] [Sergeli] ...
User: Clicks Chilonzor
Bot: Max budget (USD)?
     Type amount or click: [$50k] [$70k] [$100k]
User: Types "75000"
Bot: Found 12 properties. Here are the top 3:

     [Photo carousel]
     🏠 3-room, Chilonzor, 5-mahalla
     💰 $72,000
     📐 85 m²
     🏢 7/12 floor

     [View More] [Contact Agent]
```

**Flow 2: Lead Capture**
```
User: Clicks "Contact Agent"
Bot: Great! Please share your contact:
     [Share Phone Number] button
User: Shares phone
Bot: Thanks! Our agent will contact you within 30 minutes.

→ Create Lead in CRM:
  - source: TELEGRAM
  - telegramUserId: {userId}
  - telegramUsername: @{username}
  - propertyId: {propertyId}
  - status: NEW
→ Assign to agent (round-robin)
→ Send SMS to agent: "Yangi mijoz: {name}, {phone}"
```

**Flow 3: Auto-Posting**
```
Agent creates new property in CRM
→ POST /api/properties
→ Trigger: Post to Telegram channel

Bot sends to channel:
"🏠 Yangi e'lon!
3-xonali kvartira, Chilonzor

💰 $72,000
📐 85 m²
📍 5-mahalla
🏢 7/12 qavat
✨ Evrostandart

📞 @{agencybot}

[View Photos]"
```

**Deliverables:**
- ✅ Telegram bot functional
- ✅ Leads captured from Telegram
- ✅ Properties searchable via bot
- ✅ Auto-posting to channels

---

### PHASE 4: Agent Productivity Tools (2 Weeks)

#### Week 9: Calendar & SMS Confirmations

**Frontend:**
```typescript
// Install full calendar
pnpm add @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid

// Calendar view component
/dashboard/viewings
- Month/Week/Day views
- Click time slot → Create viewing modal
- Shows: Client name, Property, Time
```

**Backend:**
```typescript
// Viewing service enhancement
async confirmViewing(viewingId) {
  const viewing = await findViewing(viewingId);

  // Send SMS via Eskiz
  await smsService.send(viewing.requester.phone, `
    Ko'rish tasdiqlandi:
    📅 ${formatDate(viewing.date)}
    🕐 ${viewing.time}
    📍 ${viewing.property.address}
    👤 Agent: ${viewing.owner.firstName}
    📞 ${viewing.owner.phone}
  `);

  // Update status
  await updateStatus(viewingId, 'CONFIRMED');
}
```

**Deliverables:**
- ✅ Calendar view shows all viewings
- ✅ SMS sent to client on confirmation
- ✅ Agents can create viewings easily

---

#### Week 10: Follow-Up Reminders & Commission

**Scheduled Jobs:**
```typescript
@Cron('0 9 * * *')
async sendDailyDigest() {
  const agents = await getAllAgentsWithTasks();

  for (const agent of agents) {
    const overdue = await getOverdueLeads(agent.id);
    const today = await getTodayViewings(agent.id);

    await emailService.send(agent.email, {
      template: 'daily-digest',
      data: { overdue, today, agent },
    });
  }
}
```

**Commission Tracking:**
```
Lead Detail Page:
- [Close Deal] button (when status = OFFER_MADE)
- Modal:
  - Sale Price: $72,000
  - Commission %: 3%
  - Commission $: $2,160 (auto-calculated)
  - Agent: {current agent}
  - [Confirm Close]

→ Create Deal record
→ Update Lead status to CLOSED_WON
→ Add to agent's commission total
```

**Deliverables:**
- ✅ Daily digest emails
- ✅ Overdue lead warnings
- ✅ Commission tracking functional

---

### PHASE 5: AI Features (0.75 Week = 4 Days)

#### Day 1-2: AI Description Generator

**Backend:**
```typescript
// apps/api/src/modules/ai/ai.service.ts
import Anthropic from '@anthropic-ai/sdk';

async generateDescriptions(property) {
  const prompt = `
You are a real estate copywriter in Uzbekistan.

Generate property descriptions for:
- Type: ${property.bedrooms}-room apartment
- Location: ${property.district}, ${property.mahalla}, Tashkent
- Area: ${property.area} m²
- Floor: ${property.floor}/${property.totalFloors}
- Price: $${property.price}
- Finishing: ${property.renovation}

Generate 3 versions:
1. Short (2-3 sentences)
2. Detailed (1 paragraph)
3. Instagram caption (with emojis, hashtags)

Output in BOTH Russian and Uzbek as JSON.
  `;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  return JSON.parse(message.content[0].text);
}
```

**API:**
```
POST /api/properties/generate-description
Body: { propertyType, bedrooms, area, ... }
Response: {
  ru: { short, detailed, instagram },
  uz: { short, detailed, instagram }
}
```

**Frontend:**
```
Property Form:
- [✨ Generate AI Description] button
- Loading state (5-10 seconds)
- Preview modal with language tabs
- [Use This] or [Edit] options
```

**Deliverables:**
- ✅ AI generates descriptions in RU + UZ
- ✅ Agent can preview and edit before saving

---

#### Day 3-4: Enhanced Price Suggestions

**Backend:**
```typescript
// Enhance existing ValuationService
async suggestPrice(property) {
  // Find similar properties
  const similar = await findSimilarProperties({
    district: property.districtId,
    bedrooms: property.bedrooms,
    area: property.area * 0.9, // ±10%
    status: 'SOLD',
    soldWithin: '6 months',
  });

  // Calculate statistics
  const avgPrice = mean(similar.map(p => p.price));
  const pricePerSqm = avgPrice / property.area;
  const avgDaysToSell = mean(similar.map(p => p.daysOnMarket));

  return {
    recommended: Math.round(avgPrice),
    range: {
      low: Math.round(avgPrice * 0.9),
      high: Math.round(avgPrice * 1.1),
    },
    pricePerSqm,
    marketInsight: `Properties at this price sell in avg ${avgDaysToSell} days`,
    confidence: similar.length > 5 ? 'HIGH' : 'MEDIUM',
    similarCount: similar.length,
  };
}
```

**Frontend:**
```
Property Form:
- Price field shows suggestion badge
- [💡 Get Price Suggestion] button
- Modal with recommended price + range
- Market insight displayed
- [Use Recommended] fills price field
```

**Deliverables:**
- ✅ Price suggestions based on market data
- ✅ Confidence level and insights shown

---

### PHASE 6: Agency Branding (0.75 Week = 4 Days)

#### Day 1-2: Agency Mini-Website

**Frontend:**
```typescript
// apps/web/src/app/agencies/[slug]/public/page.tsx

export default async function AgencyPublicPage({ params }) {
  const agency = await getAgency(params.slug);
  const properties = await getAgencyProperties(agency.id, { status: 'ACTIVE' });

  return (
    <>
      <AgencyHero agency={agency} />
      <PropertyFilters />
      <PropertyGrid properties={properties} />
      <ContactForm agencyId={agency.id} />
      <AgentTeam agents={agency.agents} />
    </>
  );
}
```

**Contact Form → Lead:**
```typescript
// When form submitted
POST /api/agencies/:slug/leads
Body: { name, phone, email, message, propertyId? }

→ Create Lead:
  - agencyId: {agency.id}
  - source: WEBSITE
  - status: NEW
→ Assign to agent (round-robin)
→ Send notification
```

**Deliverables:**
- ✅ Each agency has public page: `/agencies/{slug}/public`
- ✅ Shows agency info + property listings
- ✅ Contact form creates leads

---

#### Day 3-4: Sharing & QR Codes

**Sharing Service:**
```typescript
generateWhatsAppMessage(property) {
  return `
🏠 ${property.bedrooms}-xonali kvartira, ${property.district}

💰 Narx: $${property.price}
📐 Maydoni: ${property.area} m²
🏢 Qavat: ${property.floor}/${property.totalFloors}
📍 ${property.district}, ${property.mahalla}

✨ ${property.renovation}
🔑 Yashashga tayyor

📞 Agent: ${agent.firstName}
📱 ${agent.phone}
🔗 ${propertyUrl}
  `.trim();
}
```

**QR Code Service:**
```typescript
import QRCode from 'qrcode';

async generatePropertyQR(propertyId) {
  const url = `https://jahongir-app.uz/properties/${propertyId}`;
  return await QRCode.toDataURL(url, { width: 300 });
}
```

**Frontend:**
```
Property Detail (Agent View):
- [Share] dropdown
  - [📋 Copy WhatsApp Message]
  - [📋 Copy Telegram Message]
  - [📧 Send Email]
- [QR Code] button → Shows QR, download options
```

**Deliverables:**
- ✅ One-click WhatsApp/Telegram sharing
- ✅ QR codes for property marketing

---

## Database Schema Changes Required

### Priority 1: Critical for CRM (Week 1-2)

```prisma
// 1. Location Hierarchy
model City {
  id         String     @id @default(cuid())
  nameRu     String
  nameUz     String
  country    String     @default("Uzbekistan")
  districts  District[]
  properties Property[]
  agencies   Agency[]
  createdAt  DateTime   @default(now())

  @@index([nameRu])
  @@index([nameUz])
}

model District {
  id         String     @id @default(cuid())
  cityId     String
  city       City       @relation(fields: [cityId], references: [id])
  nameRu     String
  nameUz     String
  mahallas   Mahalla[]
  properties Property[]
  createdAt  DateTime   @default(now())

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
  createdAt  DateTime   @default(now())

  @@index([districtId])
  @@index([nameRu])
}

// 2. Update Property Model
model Property {
  // ... existing fields ...

  // CHANGE: Location (from string to relational)
  cityId      String?
  city        City?     @relation(fields: [cityId], references: [id])
  districtId  String?
  district    District? @relation(fields: [districtId], references: [id])
  mahallaId   String?
  mahalla     Mahalla?  @relation(fields: [mahallaId], references: [id])

  // CHANGE: Bilingual descriptions
  descriptionRu String  @db.Text
  descriptionUz String? @db.Text

  // ADD: Multi-tenancy
  agencyId    String?
  agency      Agency?   @relation(fields: [agencyId], references: [id])

  // ADD: New build fields
  developerName  String?
  completionDate DateTime?
  paymentPlan    String? @db.Text

  // ... rest of existing fields ...
}

// 3. Update User Model
model User {
  // ... existing fields ...

  // ADD: Agency membership
  agencyId   String?
  agency     Agency?    @relation(fields: [agencyId], references: [id])
  agentRole  AgentRole?

  // ... existing relations ...
  leads      Lead[]     @relation("AssignedLeads")
  deals      Deal[]
}

enum AgentRole {
  AGENCY_ADMIN
  AGENT
}

// 4. Update Agency Model
model Agency {
  // ... existing fields ...

  // ADD: Customization
  primaryColor   String @default("#3B82F6")
  secondaryColor String @default("#1E40AF")

  // ... existing relations ...
  properties Property[]
  users      User[]
  leads      Lead[]
  deals      Deal[]
  telegramBot TelegramBotConfig?
}
```

### Priority 2: Lead Management (Week 5)

```prisma
enum LeadSource {
  WEBSITE
  TELEGRAM
  WHATSAPP
  PHONE_CALL
  WALK_IN
  REFERRAL
  MANUAL
}

enum LeadStatus {
  NEW
  CONTACTED
  VIEWING_SCHEDULED
  OFFER_MADE
  CONTRACT_SIGNED
  CLOSED_WON
  CLOSED_LOST
}

model Lead {
  id              String     @id @default(cuid())
  agencyId        String
  agency          Agency     @relation(fields: [agencyId], references: [id], onDelete: Cascade)

  // Client Info
  name            String
  phone           String
  email           String?

  // Source & Context
  source          LeadSource
  sourceDetails   String?    // e.g., "Telegram @username"
  propertyId      String?
  property        Property?  @relation(fields: [propertyId], references: [id], onDelete: SetNull)
  message         String?    @db.Text

  // Telegram specific
  telegramUserId   String?
  telegramUsername String?

  // Assignment
  assignedToId    String?
  assignedTo      User?      @relation("AssignedLeads", fields: [assignedToId], references: [id], onDelete: SetNull)
  assignedAt      DateTime?

  // Status
  status          LeadStatus @default(NEW)
  statusChangedAt DateTime   @default(now())

  // Follow-up
  lastContactedAt DateTime?
  nextFollowUpAt  DateTime?
  priority        Int        @default(0)

  // Relations
  notes           LeadNote[]
  activities      LeadActivity[]
  viewing         Viewing?
  deal            Deal?

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@index([agencyId, status])
  @@index([assignedToId])
  @@index([source])
  @@index([status, assignedToId])
  @@index([createdAt])
  @@index([nextFollowUpAt])
}

model LeadNote {
  id          String   @id @default(cuid())
  leadId      String
  lead        Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  userId      String
  content     String   @db.Text
  isVoiceNote Boolean  @default(false)
  audioUrl    String?
  createdAt   DateTime @default(now())

  @@index([leadId])
  @@index([leadId, createdAt])
}

enum ActivityType {
  CREATED
  ASSIGNED
  STATUS_CHANGED
  NOTE_ADDED
  CONTACTED
  EMAIL_SENT
  SMS_SENT
  VIEWING_SCHEDULED
  OFFER_MADE
}

model LeadActivity {
  id          String       @id @default(cuid())
  leadId      String
  lead        Lead         @relation(fields: [leadId], references: [id], onDelete: Cascade)
  userId      String?
  type        ActivityType
  description String
  metadata    Json?
  createdAt   DateTime     @default(now())

  @@index([leadId])
  @@index([leadId, createdAt])
}
```

### Priority 3: Commission Tracking (Week 10)

```prisma
model Deal {
  id              String   @id @default(cuid())
  leadId          String   @unique
  lead            Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  propertyId      String
  property        Property @relation(fields: [propertyId], references: [id])

  agentId         String
  agent           User     @relation(fields: [agentId], references: [id])
  agencyId        String
  agency          Agency   @relation(fields: [agencyId], references: [id])

  salePrice       Float
  currency        Currency
  priceUSD        Float

  commissionRate  Float    // e.g., 3.0 (%)
  commissionAmount Float   // Calculated
  agentShare      Float?
  agencyShare     Float?

  closedAt        DateTime
  createdAt       DateTime @default(now())

  @@index([agentId])
  @@index([agencyId])
  @@index([closedAt])
  @@index([agencyId, closedAt])
}
```

### Priority 4: Telegram Integration (Week 7)

```prisma
model TelegramBotConfig {
  id        String  @id @default(cuid())
  agencyId  String  @unique
  agency    Agency  @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  botToken  String  // From @BotFather
  channelId String? // Optional: auto-post channel
  isActive  Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Implementation Priority Matrix

### Must-Have for MVP Launch (Weeks 1-8)

| Feature | Priority | Weeks | Dependencies |
|---------|----------|-------|--------------|
| Multi-tenancy (Agency isolation) | 🔴 Critical | 1 | None |
| Location Hierarchy + Seed | 🔴 Critical | 1 | None |
| Bilingual Descriptions | 🔴 Critical | 0.5 | None |
| Lead Model + API | 🔴 Critical | 1 | Multi-tenancy |
| Lead Inbox UI | 🔴 Critical | 0.5 | Lead Model |
| Kanban Pipeline | 🔴 Critical | 0.5 | Lead Model |
| Telegram Bot | 🔴 Critical | 2 | Lead Model |
| Viewing Calendar + SMS | 🟠 High | 0.5 | Existing Viewing model |
| AI Descriptions | 🟠 High | 0.5 | Property Model |

**Total:** ~8 weeks for critical path

---

### Nice-to-Have for MVP+ (Weeks 9-11)

| Feature | Priority | Weeks | Can Launch Without? |
|---------|----------|-------|---------------------|
| Follow-Up Reminders | 🟡 Medium | 1 | Yes (manual follow-up) |
| Commission Tracking | 🟡 Medium | 0.5 | Yes (spreadsheet backup) |
| Agency Mini-Websites | 🟡 Medium | 0.5 | Yes (share individual listings) |
| Property Sharing Templates | 🟡 Medium | 0.25 | Yes (manual copy-paste) |
| QR Codes | 🟡 Medium | 0.25 | Yes (nice-to-have) |
| AI Price Suggestions | 🟡 Medium | 0.5 | Yes (manual pricing) |

---

### Post-MVP (Future Phases)

| Feature | Estimated Effort | Notes |
|---------|------------------|-------|
| WhatsApp Business API | 2 weeks | Requires Meta verification (2-4 weeks wait) |
| Voice Message Transcription | 1 week | Whisper API integration |
| Advanced Analytics Dashboard | 2 weeks | Agent performance, conversion funnels |
| Contract Builder | 2 weeks | Legal templates, e-signatures |
| Document Vault | 1 week | File upload + organization |
| Multi-Branch Support | 1 week | Branch-level permissions |
| Marketplace (Public Listings) | 3 weeks | SEO, public search, lead gen |
| Mobile Apps (iOS/Android) | 8 weeks | React Native or native |

---

## Next Steps

### Immediate Actions (This Week)

1. **Review & Approve Plan**
   - Stakeholder sign-off on adjusted MVP scope
   - Confirm 8-week critical path is acceptable

2. **Set Up Development Environment**
   - Create feature branch: `feature/crm-mvp`
   - Set up staging database for migrations
   - Configure Anthropic API key for AI features

3. **Start Phase 1 - Week 1**
   - Implement City/District/Mahalla models
   - Create seed script for Tashkent + Samarkand
   - Add multi-tenancy fields to User and Property

4. **Collect Mahalla Data**
   - Research Tashkent districts and mahallas (manual or scrape)
   - Research Samarkand districts and mahallas
   - Prepare CSV for seeding

### Week 1 Deliverables

- ✅ Database migration with location hierarchy
- ✅ Seed data loaded (~310 mahallas)
- ✅ Multi-tenancy fields added
- ✅ Agency admin can see their agents
- ✅ Location picker UI component (City → District → Mahalla)

---

## Conclusion

### Current State Summary
- **80% consumer marketplace** features complete
- **20% CRM** features exist (basic agency/agent models)
- **Strong foundation** to build upon

### Work Required
- **Database:** 6 new models, 3 model enhancements, 1 major migration
- **Backend:** 8 new modules, 5 module enhancements, 30+ new endpoints
- **Frontend:** 15 new pages/components, 10 component enhancements
- **Integrations:** Telegram (2 weeks), AI (4 days), QR codes (1 day)

### Timeline
- **Critical Path:** 8 weeks (multi-tenancy → leads → Telegram → AI)
- **Full MVP:** 11 weeks (including nice-to-haves)
- **With Parallel Teams:** 8-9 weeks

### Risk Mitigation
- **Telegram Bot Complexity:** Start early (Week 7), dedicate 2 full weeks
- **Mahalla Data Collection:** Manual entry fallback if scraping fails
- **Migration of Existing Data:** Test thoroughly on staging first

### Success Metrics
- ✅ 10 agencies signed up (pilot program)
- ✅ 50 agents actively using system
- ✅ 500 properties listed
- ✅ 1,000 leads tracked
- ✅ 200 viewings scheduled
- ✅ 50 deals closed with commission tracking

---

**Document Status:** Ready for Implementation
**Next Update:** After Phase 1 completion (Week 2)
