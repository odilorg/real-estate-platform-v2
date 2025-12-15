# Agency CRM Implementation Plan
# Real Estate Platform v2 - Uzbekistan Market

**Created:** December 15, 2025  
**Target Market:** Uzbekistan Real Estate Agencies  
**MVP Timeline:** 10 weeks (2 development sprints)  
**Tech Stack:** Next.js 15 + NestJS + PostgreSQL + Prisma

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Database Schema Design](#2-database-schema-design)
3. [API Endpoints (NestJS)](#3-api-endpoints-nestjs)
4. [Frontend Components (Next.js)](#4-frontend-components-nextjs)
5. [MVP Features Breakdown](#5-mvp-features-breakdown)
6. [Development Phases](#6-development-phases)
7. [Technical Considerations](#7-technical-considerations)
8. [Testing Strategy](#8-testing-strategy)
9. [Deployment Considerations](#9-deployment-considerations)
10. [Risk Mitigation](#10-risk-mitigation)

---

## 1. Executive Summary

### 1.1 Project Goals

Build a comprehensive Agency CRM module for real estate agencies in Uzbekistan to:
- Manage leads from multiple sources (Telegram, OLX, walk-ins)
- Track deals through pipeline stages
- Monitor agent performance
- Calculate and track commissions
- Support Telegram-first communication (88% adoption rate)
- Enable mobile-first workflows (90% of agents work from phones)

### 1.2 Key Differentiators

- **Telegram-Native:** Unlike competitors (OLX, Makler.uz), deep Telegram integration
- **Mobile-First:** PWA with offline support for field agents
- **Uzbekistan-Specific:** Dual currency (UZS/у.е.), AML compliance, notary workflows
- **Bilingual:** Russian (primary) + Uzbek (secondary)
- **Multi-Tenancy:** Complete data isolation between agencies

### 1.3 Success Metrics

**MVP Launch (Week 10):**
- 5-10 pilot agencies onboarded
- 20-50 active agents using daily
- <500ms API response time
- 95%+ mobile usability score

**Post-MVP (Month 6):**
- 50 agencies, 200+ agents
- 30% increase in agent productivity
- $10K MRR

---

## 2. Database Schema Design

### 2.1 New Prisma Models

Add these models to `/home/odil/projects/real-estate-platform-v2/packages/database/prisma/schema.prisma`:

```prisma
// ==========================================
// AGENCY CRM MODELS
// ==========================================

// Agency CRM subscription and settings
model AgencyCRM {
  id                String    @id @default(cuid())
  agencyId          String    @unique
  agency            Agency    @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  
  // Subscription
  subscriptionTier  AgencyTier @default(FREE_TRIAL)
  subscriptionStart DateTime   @default(now())
  subscriptionEnd   DateTime?
  maxAgents         Int        @default(1)
  
  // Settings
  settings          Json?      // { leadAutoAssign: "ROUND_ROBIN", currency: "UZS", timezone: "Asia/Tashkent" }
  
  // Commission defaults
  defaultCommissionRate Float  @default(3.0) // 3%
  agencyFeePercent      Float  @default(0)   // % agency keeps from commission
  
  // Telegram integration
  telegramBotToken      String?
  telegramChannelId     String?
  telegramWebhookUrl    String?
  
  // Features enabled
  features          Json?      // { telegram: true, whatsapp: false, calendar: true }
  
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  
  @@index([agencyId])
  @@index([subscriptionTier])
}

enum AgencyTier {
  FREE_TRIAL      // 1 agent, 14 days
  SOLO            // 1 agent, $29/month
  SMALL           // 3 agents, $79/month
  GROWING         // 10 agents, $149/month
  ENTERPRISE      // Unlimited, custom pricing
}

// Agency member (agent or admin)
model AgencyMember {
  id              String         @id @default(cuid())
  agencyId        String
  agency          Agency         @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  userId          String
  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Role & Permissions
  role            AgencyRole     @default(AGENT)
  permissions     Json?          // { canManageAgents: false, canViewReports: true }
  
  // Agent Profile
  agentType       AgentType?     @default(GENERAL)
  specializations String[]       // ["RESIDENTIAL", "COMMERCIAL", "RENTAL"]
  districts       String[]       // Districts/areas they cover
  languages       String[]       // ["RUSSIAN", "UZBEK", "ENGLISH"]
  
  // Contact
  phone           String?
  telegram        String?        // @username
  whatsapp        String?
  
  // License (regulatory compliance)
  licenseNumber   String?
  licenseExpiry   DateTime?
  
  // Status
  isActive        Boolean        @default(true)
  joinedAt        DateTime       @default(now())
  
  // Performance (auto-updated)
  totalLeads      Int            @default(0)
  totalDeals      Int            @default(0)
  totalRevenue    Float          @default(0)
  conversionRate  Float          @default(0)
  
  // Relations
  assignedLeads   AgencyLead[]   @relation("LeadAssignedTo")
  deals           AgencyDeal[]   @relation("DealOwner")
  commissions     AgencyCommission[]
  activities      AgencyActivity[]
  tasks           AgencyTask[]   @relation("TaskAssignedTo")
  
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  @@unique([agencyId, userId])
  @@index([agencyId])
  @@index([userId])
  @@index([role])
  @@index([isActive])
}

enum AgencyRole {
  OWNER           // Agency owner (full access)
  ADMIN           // Admin (manage agents, view all data)
  SENIOR_AGENT    // Senior agent (can mentor juniors)
  AGENT           // Regular agent
  COORDINATOR     // Support staff (scheduling, documents)
}

enum AgentType {
  GENERAL         // Works with all property types
  RESIDENTIAL     // Apartments, houses only
  COMMERCIAL      // Offices, retail spaces
  RENTAL          // Specializes in rentals
  LUXURY          // High-end properties
}

// Agency lead (potential client)
model AgencyLead {
  id              String         @id @default(cuid())
  agencyId        String
  agency          Agency         @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  
  // Contact Info
  firstName       String
  lastName        String
  phone           String
  email           String?
  telegram        String?        // @username or phone
  whatsapp        String?
  
  // Property Requirements
  propertyType    PropertyType?
  listingType     ListingType?   // SALE, RENT, etc.
  budget          Float?
  budgetCurrency  Currency       @default(YE)
  bedrooms        Int?
  districts       String[]       // Preferred districts
  requirements    String?        @db.Text
  
  // Lead Info
  source          LeadSource     @default(WALK_IN)
  status          LeadStatus     @default(NEW)
  priority        LeadPriority   @default(MEDIUM)
  tags            String[]       // ["FIRST_TIME_BUYER", "INVESTOR", "URGENT"]
  
  // Assignment
  assignedToId    String?
  assignedTo      AgencyMember?  @relation("LeadAssignedTo", fields: [assignedToId], references: [id], onDelete: SetNull)
  assignedAt      DateTime?
  
  // Tracking
  lastContactedAt DateTime?
  nextFollowUpAt  DateTime?
  totalContacts   Int            @default(0)
  
  // Conversion
  convertedAt     DateTime?
  convertedToDealId String?
  conversionValue Float?
  
  // Notes
  notes           String?        @db.Text
  
  // Relations
  deal            AgencyDeal?
  activities      AgencyActivity[]
  
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  @@index([agencyId])
  @@index([status])
  @@index([assignedToId])
  @@index([source])
  @@index([agencyId, status, assignedToId])
  @@index([nextFollowUpAt])
}

enum LeadPriority {
  URGENT          // Hot lead, respond immediately
  HIGH            // Qualified, ready to buy
  MEDIUM          // Interested, needs nurturing
  LOW             // Long-term, low urgency
}

// Agency deal (transaction pipeline)
model AgencyDeal {
  id              String         @id @default(cuid())
  agencyId        String
  agency          Agency         @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  
  // Deal Info
  leadId          String         @unique
  lead            AgencyLead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  propertyId      String?
  property        Property?      @relation(fields: [propertyId], references: [id], onDelete: SetNull)
  
  // Deal Details
  dealType        DealType       @default(BUYER)
  dealValue       Float          // Property price
  currency        Currency       @default(YE)
  
  // Pipeline
  stage           DealStage      @default(QUALIFIED)
  status          DealStatus     @default(ACTIVE)
  probability     Int            @default(50) // 0-100%
  expectedCloseDate DateTime?
  actualCloseDate DateTime?
  
  // Ownership
  ownerId         String         // Agent responsible
  owner           AgencyMember   @relation("DealOwner", fields: [ownerId], references: [id], onDelete: Restrict)
  
  // Commission
  commissionRate  Float          // 3.0 = 3%
  commissionAmount Float         @default(0)
  commissionSplit Json?          // [{ memberId: "x", percent: 50 }, { memberId: "y", percent: 50 }]
  
  // Notary & Registration
  notaryScheduled DateTime?
  notaryCompleted Boolean        @default(false)
  registrationId  String?        // State cadastre registration number
  registrationDate DateTime?
  
  // Closing
  closeReason     String?        // If closed-lost: reason
  notes           String?        @db.Text
  
  // Relations
  activities      AgencyActivity[]
  commissions     AgencyCommission[]
  tasks           AgencyTask[]
  
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  @@index([agencyId])
  @@index([stage])
  @@index([status])
  @@index([ownerId])
  @@index([agencyId, status, stage])
  @@index([expectedCloseDate])
}

enum DealType {
  BUYER           // Representing buyer
  SELLER          // Representing seller
  BOTH            // Representing both sides (double commission)
}

enum DealStage {
  QUALIFIED       // Lead qualified, deal created
  VIEWING_SCHEDULED
  VIEWING_COMPLETED
  OFFER_MADE
  NEGOTIATION
  AGREEMENT_REACHED
  NOTARY_SCHEDULED
  DOCUMENTS_PENDING
  REGISTRATION_PENDING
  CLOSED_WON
  CLOSED_LOST
}

enum DealStatus {
  ACTIVE          // Currently active
  ON_HOLD         // Paused (client traveling, etc.)
  WON             // Successfully closed
  LOST            // Deal fell through
}

// Commission tracking
model AgencyCommission {
  id              String         @id @default(cuid())
  agencyId        String
  agency          Agency         @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  
  // Deal Reference
  dealId          String
  deal            AgencyDeal     @relation(fields: [dealId], references: [id], onDelete: Cascade)
  
  // Agent
  memberId        String
  member          AgencyMember   @relation(fields: [memberId], references: [id], onDelete: Restrict)
  
  // Commission Details
  grossAmount     Float          // Total commission before agency cut
  agencyFee       Float          // Amount agency keeps
  netAmount       Float          // Amount agent receives
  currency        Currency       @default(YE)
  
  // Payment
  status          CommissionStatus @default(PENDING)
  dueDate         DateTime?
  paidDate        DateTime?
  paymentMethod   String?        // "BANK_TRANSFER", "CASH"
  paymentNotes    String?
  
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  @@index([agencyId])
  @@index([memberId])
  @@index([dealId])
  @@index([status])
  @@index([agencyId, status, memberId])
}

enum CommissionStatus {
  PENDING         // Deal closed, commission calculated
  APPROVED        // Approved by admin
  PAID            // Paid to agent
  DISPUTED        // Issue with commission
}

// Activity log (interactions with leads/clients)
model AgencyActivity {
  id              String         @id @default(cuid())
  agencyId        String
  agency          Agency         @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  
  // Related Entity
  leadId          String?
  lead            AgencyLead?    @relation(fields: [leadId], references: [id], onDelete: Cascade)
  dealId          String?
  deal            AgencyDeal?    @relation(fields: [dealId], references: [id], onDelete: Cascade)
  
  // Activity Details
  type            ActivityType
  title           String         // "Called client", "Sent property list"
  description     String?        @db.Text
  outcome         String?        // "ANSWERED", "NO_ANSWER", "VOICEMAIL"
  
  // Agent
  memberId        String
  member          AgencyMember   @relation(fields: [memberId], references: [id], onDelete: Cascade)
  
  // Metadata
  metadata        Json?          // { duration: 120, platform: "TELEGRAM" }
  
  createdAt       DateTime       @default(now())
  
  @@index([agencyId])
  @@index([leadId])
  @@index([dealId])
  @@index([memberId])
  @@index([type])
  @@index([agencyId, memberId, createdAt])
}

enum ActivityType {
  CALL            // Phone call
  TELEGRAM        // Telegram message
  WHATSAPP        // WhatsApp message
  EMAIL           // Email sent
  MEETING         // In-person meeting
  VIEWING         // Property viewing
  NOTE            // General note
  STATUS_CHANGE   // Lead/deal status changed
}

// Task management (reminders, follow-ups)
model AgencyTask {
  id              String         @id @default(cuid())
  agencyId        String
  agency          Agency         @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  
  // Task Details
  title           String
  description     String?        @db.Text
  type            TaskType       @default(FOLLOW_UP)
  priority        TaskPriority   @default(MEDIUM)
  
  // Assignment
  assignedToId    String
  assignedTo      AgencyMember   @relation("TaskAssignedTo", fields: [assignedToId], references: [id], onDelete: Cascade)
  
  // Related Entity
  leadId          String?
  dealId          String?
  deal            AgencyDeal?    @relation(fields: [dealId], references: [id], onDelete: Cascade)
  
  // Timing
  dueDate         DateTime
  reminderSent    Boolean        @default(false)
  completedAt     DateTime?
  
  // Status
  status          TaskStatus     @default(PENDING)
  
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  @@index([agencyId])
  @@index([assignedToId])
  @@index([status])
  @@index([dueDate])
  @@index([agencyId, assignedToId, status])
}

enum TaskType {
  FOLLOW_UP       // Call client back
  VIEWING         // Schedule viewing
  SEND_LISTINGS   // Send property options
  DOCUMENT        // Upload/request document
  MEETING         // Schedule meeting
  OTHER
}

enum TaskPriority {
  URGENT
  HIGH
  MEDIUM
  LOW
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

// Update existing Agency model to add relations
model Agency {
  // ... existing fields ...
  
  // New relations
  crmSettings     AgencyCRM?
  members         AgencyMember[]
  leads           AgencyLead[]
  deals           AgencyDeal[]
  commissions     AgencyCommission[]
  activities      AgencyActivity[]
  tasks           AgencyTask[]
  
  // ... rest of model ...
}

// Update existing User model to add AgencyMember relation
model User {
  // ... existing fields ...
  
  agencyMemberships AgencyMember[]
  
  // ... rest of model ...
}

// Update existing Property model to add AgencyDeal relation
model Property {
  // ... existing fields ...
  
  agencyDeals     AgencyDeal[]
  
  // ... rest of model ...
}
```

### 2.2 Migration Strategy

**Migration File:** `/home/odil/projects/real-estate-platform-v2/packages/database/prisma/migrations/XXX_add_agency_crm/migration.sql`

**Steps:**
1. Create migration: `pnpm --filter @repo/database prisma migrate dev --name add_agency_crm`
2. Generate client: `pnpm --filter @repo/database prisma generate`
3. Rebuild packages in order:
   ```bash
   pnpm --filter @repo/database build
   pnpm --filter @repo/shared build
   pnpm --filter @repo/api build
   pnpm --filter @repo/web build
   ```

**Indexes Created:** 
- 45+ indexes for query optimization
- Composite indexes for common filter patterns (agency + status + member)
- Time-based indexes for tasks and follow-ups

**Data Integrity:**
- CASCADE deletes for owned entities (leads, deals when agency deleted)
- RESTRICT deletes for references (can't delete agent with active deals)
- SetNull for optional references (property deleted, deal remains)

---

## 3. API Endpoints (NestJS)

### 3.1 Module Structure

Create: `/home/odil/projects/real-estate-platform-v2/apps/api/src/modules/agency-crm/`

```
agency-crm/
├── agency-crm.module.ts
├── controllers/
│   ├── agency-settings.controller.ts
│   ├── agency-members.controller.ts
│   ├── agency-leads.controller.ts
│   ├── agency-deals.controller.ts
│   ├── agency-commissions.controller.ts
│   ├── agency-activities.controller.ts
│   ├── agency-tasks.controller.ts
│   └── agency-analytics.controller.ts
├── services/
│   ├── agency-settings.service.ts
│   ├── agency-members.service.ts
│   ├── agency-leads.service.ts
│   ├── agency-deals.service.ts
│   ├── agency-commissions.service.ts
│   ├── agency-activities.service.ts
│   ├── agency-tasks.service.ts
│   └── agency-analytics.service.ts
├── guards/
│   ├── agency-ownership.guard.ts
│   └── agency-permission.guard.ts
└── dto/
    ├── agency-settings.dto.ts
    ├── agency-member.dto.ts
    ├── agency-lead.dto.ts
    ├── agency-deal.dto.ts
    └── agency-commission.dto.ts
```

### 3.2 Key API Endpoints

#### A. Agency Settings

```typescript
// Base: /api/agency-crm/:agencyId

// GET /api/agency-crm/:agencyId/settings
// Get agency CRM settings
// Auth: OWNER, ADMIN
// Response: AgencyCRM

// PATCH /api/agency-crm/:agencyId/settings
// Update settings (commission rates, lead assignment rules)
// Auth: OWNER, ADMIN
// Body: UpdateAgencySettingsDto
// Response: AgencyCRM

// POST /api/agency-crm/:agencyId/telegram/setup
// Setup Telegram bot integration
// Auth: OWNER, ADMIN
// Body: { botToken: string }
// Response: { webhookUrl: string }
```

#### B. Agency Members (Agents)

```typescript
// Base: /api/agency-crm/:agencyId/members

// GET /api/agency-crm/:agencyId/members
// List all members
// Auth: OWNER, ADMIN, AGENT (limited)
// Query: ?role=AGENT&isActive=true&page=1&limit=20
// Response: PaginatedResponse<AgencyMember>

// POST /api/agency-crm/:agencyId/members
// Add new member (invite agent)
// Auth: OWNER, ADMIN
// Body: CreateAgencyMemberDto
// Response: AgencyMember

// GET /api/agency-crm/:agencyId/members/:memberId
// Get member details + stats
// Auth: OWNER, ADMIN, self
// Response: AgencyMember + performance stats

// PATCH /api/agency-crm/:agencyId/members/:memberId
// Update member profile
// Auth: OWNER, ADMIN, self (limited fields)
// Body: UpdateAgencyMemberDto
// Response: AgencyMember

// DELETE /api/agency-crm/:agencyId/members/:memberId
// Remove member (soft delete)
// Auth: OWNER, ADMIN
// Response: { success: true }

// GET /api/agency-crm/:agencyId/members/:memberId/performance
// Get member performance metrics
// Auth: OWNER, ADMIN, self
// Query: ?period=MONTH&startDate=2025-01-01&endDate=2025-01-31
// Response: AgentPerformanceDto
```

#### C. Agency Leads

```typescript
// Base: /api/agency-crm/:agencyId/leads

// GET /api/agency-crm/:agencyId/leads
// List leads with filters
// Auth: OWNER, ADMIN, AGENT (own leads only)
// Query: ?status=NEW&assignedToId=xxx&source=TELEGRAM&page=1&limit=20
// Response: PaginatedResponse<AgencyLead>

// POST /api/agency-crm/:agencyId/leads
// Create new lead
// Auth: Any member
// Body: CreateAgencyLeadDto
// Response: AgencyLead

// GET /api/agency-crm/:agencyId/leads/:leadId
// Get lead details
// Auth: OWNER, ADMIN, assigned agent
// Response: AgencyLead + activities

// PATCH /api/agency-crm/:agencyId/leads/:leadId
// Update lead
// Auth: OWNER, ADMIN, assigned agent
// Body: UpdateAgencyLeadDto
// Response: AgencyLead

// POST /api/agency-crm/:agencyId/leads/:leadId/assign
// Assign lead to agent
// Auth: OWNER, ADMIN, SENIOR_AGENT
// Body: { assignedToId: string }
// Response: AgencyLead

// POST /api/agency-crm/:agencyId/leads/:leadId/status
// Update lead status
// Auth: OWNER, ADMIN, assigned agent
// Body: { status: LeadStatus, notes?: string }
// Response: AgencyLead

// POST /api/agency-crm/:agencyId/leads/:leadId/convert
// Convert lead to deal
// Auth: OWNER, ADMIN, assigned agent
// Body: ConvertLeadDto
// Response: AgencyDeal

// DELETE /api/agency-crm/:agencyId/leads/:leadId
// Delete lead (archive)
// Auth: OWNER, ADMIN
// Response: { success: true }

// POST /api/agency-crm/:agencyId/leads/import
// Bulk import leads (Excel/CSV)
// Auth: OWNER, ADMIN
// Body: multipart/form-data (file)
// Response: { imported: number, failed: number, errors: [] }
```

#### D. Agency Deals

```typescript
// Base: /api/agency-crm/:agencyId/deals

// GET /api/agency-crm/:agencyId/deals
// List deals with filters
// Auth: OWNER, ADMIN, AGENT (own deals only)
// Query: ?stage=NEGOTIATION&status=ACTIVE&ownerId=xxx&page=1
// Response: PaginatedResponse<AgencyDeal>

// POST /api/agency-crm/:agencyId/deals
// Create deal manually (or via lead conversion)
// Auth: OWNER, ADMIN, AGENT
// Body: CreateAgencyDealDto
// Response: AgencyDeal

// GET /api/agency-crm/:agencyId/deals/:dealId
// Get deal details
// Auth: OWNER, ADMIN, deal owner
// Response: AgencyDeal + full details

// PATCH /api/agency-crm/:agencyId/deals/:dealId
// Update deal
// Auth: OWNER, ADMIN, deal owner
// Body: UpdateAgencyDealDto
// Response: AgencyDeal

// POST /api/agency-crm/:agencyId/deals/:dealId/stage
// Move deal to next stage
// Auth: OWNER, ADMIN, deal owner
// Body: { stage: DealStage, notes?: string }
// Response: AgencyDeal

// POST /api/agency-crm/:agencyId/deals/:dealId/close
// Close deal (won or lost)
// Auth: OWNER, ADMIN, deal owner
// Body: { status: 'WON' | 'LOST', reason?: string }
// Response: AgencyDeal + AgencyCommission (if won)

// GET /api/agency-crm/:agencyId/deals/pipeline
// Get pipeline view (deals grouped by stage)
// Auth: OWNER, ADMIN
// Response: { [stage]: { count: number, totalValue: number, deals: [] } }
```

#### E. Agency Commissions

```typescript
// Base: /api/agency-crm/:agencyId/commissions

// GET /api/agency-crm/:agencyId/commissions
// List commissions
// Auth: OWNER, ADMIN, AGENT (own only)
// Query: ?status=PENDING&memberId=xxx&startDate=2025-01-01
// Response: PaginatedResponse<AgencyCommission>

// GET /api/agency-crm/:agencyId/commissions/:commissionId
// Get commission details
// Auth: OWNER, ADMIN, member (own only)
// Response: AgencyCommission

// POST /api/agency-crm/:agencyId/commissions/:commissionId/approve
// Approve commission for payment
// Auth: OWNER, ADMIN
// Response: AgencyCommission

// POST /api/agency-crm/:agencyId/commissions/:commissionId/pay
// Mark commission as paid
// Auth: OWNER, ADMIN
// Body: { paymentMethod: string, paymentNotes?: string, paidDate: Date }
// Response: AgencyCommission

// GET /api/agency-crm/:agencyId/commissions/summary
// Commission summary for period
// Auth: OWNER, ADMIN, AGENT (own summary)
// Query: ?memberId=xxx&startDate=2025-01-01&endDate=2025-01-31
// Response: { total: number, pending: number, paid: number, count: number }
```

#### F. Agency Activities

```typescript
// Base: /api/agency-crm/:agencyId/activities

// GET /api/agency-crm/:agencyId/activities
// List activities (activity feed)
// Auth: OWNER, ADMIN, AGENT (own only)
// Query: ?leadId=xxx&dealId=xxx&memberId=xxx&type=CALL&page=1
// Response: PaginatedResponse<AgencyActivity>

// POST /api/agency-crm/:agencyId/activities
// Log new activity
// Auth: Any member
// Body: CreateAgencyActivityDto
// Response: AgencyActivity

// GET /api/agency-crm/:agencyId/activities/:activityId
// Get activity details
// Auth: OWNER, ADMIN, activity creator
// Response: AgencyActivity
```

#### G. Agency Tasks

```typescript
// Base: /api/agency-crm/:agencyId/tasks

// GET /api/agency-crm/:agencyId/tasks
// List tasks
// Auth: OWNER, ADMIN, AGENT (own only)
// Query: ?status=PENDING&assignedToId=xxx&dueDate=2025-12-20
// Response: PaginatedResponse<AgencyTask>

// POST /api/agency-crm/:agencyId/tasks
// Create task
// Auth: OWNER, ADMIN, SENIOR_AGENT
// Body: CreateAgencyTaskDto
// Response: AgencyTask

// PATCH /api/agency-crm/:agencyId/tasks/:taskId
// Update task
// Auth: OWNER, ADMIN, assigned agent
// Body: UpdateAgencyTaskDto
// Response: AgencyTask

// POST /api/agency-crm/:agencyId/tasks/:taskId/complete
// Mark task complete
// Auth: OWNER, ADMIN, assigned agent
// Response: AgencyTask

// DELETE /api/agency-crm/:agencyId/tasks/:taskId
// Delete task
// Auth: OWNER, ADMIN, task creator
// Response: { success: true }

// GET /api/agency-crm/:agencyId/tasks/today
// Get today's tasks for current agent
// Auth: Any member
// Response: AgencyTask[]
```

#### H. Agency Analytics

```typescript
// Base: /api/agency-crm/:agencyId/analytics

// GET /api/agency-crm/:agencyId/analytics/dashboard
// Main dashboard metrics
// Auth: OWNER, ADMIN, AGENT (limited view)
// Query: ?period=MONTH&startDate=2025-01-01&endDate=2025-01-31
// Response: DashboardAnalyticsDto

// GET /api/agency-crm/:agencyId/analytics/leads
// Lead analytics
// Auth: OWNER, ADMIN
// Response: LeadAnalyticsDto (by source, status, conversion rate)

// GET /api/agency-crm/:agencyId/analytics/deals
// Deal analytics
// Auth: OWNER, ADMIN
// Response: DealAnalyticsDto (pipeline, win rate, avg deal value)

// GET /api/agency-crm/:agencyId/analytics/agents
// Agent performance comparison
// Auth: OWNER, ADMIN
// Response: AgentAnalyticsDto[] (leaderboard, metrics)

// GET /api/agency-crm/:agencyId/analytics/revenue
// Revenue analytics
// Auth: OWNER, ADMIN
// Response: RevenueAnalyticsDto (sales volume, commission earned)

// GET /api/agency-crm/:agencyId/analytics/export
// Export analytics data
// Auth: OWNER, ADMIN
// Query: ?format=CSV&type=LEADS&startDate=2025-01-01
// Response: CSV/Excel file download
```

### 3.3 Authentication & Authorization

**Guards:**

```typescript
// agency-ownership.guard.ts
// Verifies user is member of agency with sufficient role
@Injectable()
export class AgencyOwnershipGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const agencyId = request.params.agencyId;
    
    // Check if user is member of agency
    const member = await this.prisma.agencyMember.findFirst({
      where: {
        agencyId,
        userId: user.id,
        isActive: true
      }
    });
    
    if (!member) throw new ForbiddenException('Not a member of this agency');
    
    // Attach member to request for use in controllers
    request.agencyMember = member;
    return true;
  }
}

// agency-permission.guard.ts
// Checks if user has required role/permission
@Injectable()
export class AgencyPermissionGuard implements CanActivate {
  constructor(private requiredRoles: AgencyRole[]) {}
  
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const member = request.agencyMember;
    
    if (!this.requiredRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    
    return true;
  }
}
```

**Usage in Controllers:**

```typescript
@Controller('agency-crm/:agencyId')
@UseGuards(JwtAuthGuard, AgencyOwnershipGuard)
export class AgencyLeadsController {
  
  @Get('leads')
  @UseGuards(AgencyPermissionGuard([OWNER, ADMIN, AGENT]))
  async getLeads(@Param('agencyId') agencyId: string, @Query() query: any) {
    // Agent can only see own leads unless OWNER/ADMIN
  }
  
  @Post('members')
  @UseGuards(AgencyPermissionGuard([OWNER, ADMIN]))
  async addMember(@Param('agencyId') agencyId: string, @Body() dto: any) {
    // Only OWNER/ADMIN can add members
  }
}
```

### 3.4 API Response Formats

**Success Response:**
```typescript
{
  success: true,
  data: { /* entity */ },
  meta?: { /* pagination, etc */ }
}
```

**Paginated Response:**
```typescript
{
  success: true,
  data: [ /* entities */ ],
  meta: {
    page: 1,
    limit: 20,
    total: 145,
    totalPages: 8,
    hasMore: true
  }
}
```

**Error Response:**
```typescript
{
  success: false,
  error: {
    code: 'FORBIDDEN',
    message: 'Not a member of this agency',
    details?: { /* additional context */ }
  }
}
```

---

## 4. Frontend Components (Next.js)

### 4.1 Page Structure

Create: `/home/odil/projects/real-estate-platform-v2/apps/web/src/app/[locale]/agency/`

```
agency/
├── layout.tsx                     # Agency CRM layout with sidebar
├── page.tsx                       # Dashboard overview
├── settings/
│   └── page.tsx                   # Agency settings
├── members/
│   ├── page.tsx                   # Team management (list agents)
│   ├── [id]/
│   │   └── page.tsx               # Agent detail + performance
│   └── new/
│       └── page.tsx               # Add new agent
├── leads/
│   ├── page.tsx                   # Lead list + filters
│   ├── [id]/
│   │   └── page.tsx               # Lead detail
│   └── new/
│       └── page.tsx               # Add new lead
├── deals/
│   ├── page.tsx                   # Deal pipeline (kanban board)
│   ├── [id]/
│   │   └── page.tsx               # Deal detail
│   └── list/
│       └── page.tsx               # Deal list view (table)
├── commissions/
│   └── page.tsx                   # Commission tracking
├── properties/
│   └── page.tsx                   # Property inventory
├── analytics/
│   ├── page.tsx                   # Analytics dashboard
│   └── reports/
│       └── page.tsx               # Detailed reports
└── calendar/
    └── page.tsx                   # Calendar view (future)
```

### 4.2 Key Components

Create: `/home/odil/projects/real-estate-platform-v2/apps/web/src/components/agency-crm/`

```
agency-crm/
├── layout/
│   ├── AgencySidebar.tsx          # Navigation sidebar
│   ├── AgencyHeader.tsx           # Top header with agency switcher
│   └── AgencyMobileNav.tsx        # Mobile navigation
├── dashboard/
│   ├── DashboardMetrics.tsx       # KPI cards (leads, deals, revenue)
│   ├── LeadSourceChart.tsx        # Lead source breakdown (pie chart)
│   ├── DealPipelineChart.tsx      # Pipeline funnel chart
│   ├── AgentLeaderboard.tsx       # Top performers
│   └── RecentActivity.tsx         # Activity feed
├── leads/
│   ├── LeadList.tsx               # Lead table with sorting/filtering
│   ├── LeadCard.tsx               # Lead card (mobile view)
│   ├── LeadFilters.tsx            # Filter panel
│   ├── LeadForm.tsx               # Add/edit lead form
│   ├── LeadDetail.tsx             # Lead detail view
│   ├── LeadStatusBadge.tsx        # Status indicator
│   ├── LeadAssignModal.tsx        # Assign lead to agent
│   └── LeadActivityTimeline.tsx   # Interaction history
├── deals/
│   ├── DealPipeline.tsx           # Kanban board
│   ├── DealColumn.tsx             # Pipeline stage column
│   ├── DealCard.tsx               # Deal card in pipeline
│   ├── DealList.tsx               # Table view
│   ├── DealDetail.tsx             # Deal detail view
│   ├── DealForm.tsx               # Add/edit deal
│   ├── DealStageModal.tsx         # Move to next stage
│   └── DealCloseModal.tsx         # Close deal (won/lost)
├── members/
│   ├── MemberList.tsx             # Team list
│   ├── MemberCard.tsx             # Agent card
│   ├── MemberForm.tsx             # Add/edit member
│   ├── MemberPerformance.tsx      # Performance metrics
│   └── MemberRoleBadge.tsx        # Role indicator
├── commissions/
│   ├── CommissionList.tsx         # Commission table
│   ├── CommissionCard.tsx         # Commission summary card
│   ├── CommissionPayModal.tsx     # Mark as paid modal
│   └── CommissionChart.tsx        # Commission over time
├── activities/
│   ├── ActivityFeed.tsx           # Activity list
│   ├── ActivityItem.tsx           # Single activity
│   ├── ActivityForm.tsx           # Log activity
│   └── ActivityTypeIcon.tsx       # Icon for activity type
├── tasks/
│   ├── TaskList.tsx               # Task list
│   ├── TaskCard.tsx               # Task card
│   ├── TaskForm.tsx               # Add/edit task
│   └── TaskCalendar.tsx           # Calendar view (future)
├── analytics/
│   ├── MetricCard.tsx             # Single metric card
│   ├── LeadSourceChart.tsx        # Lead source pie chart
│   ├── ConversionFunnel.tsx       # Conversion funnel
│   ├── RevenueChart.tsx           # Revenue line chart
│   └── AgentPerformanceChart.tsx  # Agent comparison bar chart
└── shared/
    ├── AgencySelectDropdown.tsx   # Agency switcher (if multi-agency)
    ├── AgentAvatar.tsx            # Agent avatar with status
    ├── CurrencyDisplay.tsx        # Format UZS/у.е.
    ├── TelegramButton.tsx         # Click-to-Telegram
    ├── WhatsAppButton.tsx         # Click-to-WhatsApp
    ├── QuickActions.tsx           # Floating action button
    └── EmptyState.tsx             # No data placeholder
```

### 4.3 Mobile-First Design Patterns

**Key Principles:**
1. **Touch-friendly:** Minimum 44px touch targets
2. **Bottom navigation:** Primary actions at bottom (reachable with thumb)
3. **Swipe gestures:** Swipe to archive lead, swipe to complete task
4. **Offline-first:** Cache recent data, sync when online
5. **Progressive Web App:** Install prompt, push notifications

**Mobile Components:**
- Bottom sheet modals (not full-screen modals)
- Floating action button (FAB) for quick add
- Swipeable cards for leads/deals
- Pull-to-refresh on lists
- Skeleton loaders while fetching

**Example - Mobile Lead Card:**
```tsx
<div className="swipe-card" onSwipe={handleArchive}>
  <div className="p-4 bg-white border-b">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-semibold">{lead.firstName} {lead.lastName}</h3>
        <p className="text-sm text-gray-600">{lead.phone}</p>
      </div>
      <LeadStatusBadge status={lead.status} />
    </div>
    <div className="mt-2 flex gap-2">
      <TelegramButton username={lead.telegram} />
      <WhatsAppButton phone={lead.whatsapp} />
      <button onClick={handleCall}>Call</button>
    </div>
    <p className="mt-2 text-sm text-gray-700">{lead.requirements}</p>
  </div>
</div>
```

### 4.4 Internationalization (i18n)

**Translation Files:**
```
apps/web/messages/
├── ru/
│   └── agency-crm.json
└── uz/
    └── agency-crm.json
```

**Sample Translation Keys:**
```json
// ru/agency-crm.json
{
  "agency_crm": {
    "dashboard": {
      "title": "Панель управления",
      "new_leads": "Новые лиды",
      "active_deals": "Активные сделки",
      "revenue_month": "Доход за месяц"
    },
    "leads": {
      "title": "Лиды",
      "add_lead": "Добавить лид",
      "status": {
        "NEW": "Новый",
        "CONTACTED": "Связались",
        "QUALIFIED": "Квалифицирован",
        "CONVERTED": "Конвертирован",
        "LOST": "Потерян"
      }
    },
    "deals": {
      "pipeline": "Воронка сделок",
      "stage": {
        "QUALIFIED": "Квалифицирован",
        "VIEWING_SCHEDULED": "Просмотр назначен",
        "NEGOTIATION": "Переговоры",
        "CLOSED_WON": "Закрыта (успешно)"
      }
    }
  }
}
```

**Usage in Components:**
```tsx
import { useTranslations } from 'next-intl';

export default function LeadList() {
  const t = useTranslations('agency_crm.leads');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{t('add_lead')}</button>
    </div>
  );
}
```

---

## 5. MVP Features Breakdown

### 5.1 Priority P0 (Launch Blockers) - Weeks 1-8

#### Feature 1: Lead Management (Week 1-2)
**Effort:** 5 story points

**Database:**
- AgencyLead model (already defined)

**Backend:**
- `LeadsService`: CRUD operations
- `LeadsController`: API endpoints
- Lead assignment logic (manual, round-robin)
- Lead deduplication (check phone)

**Frontend:**
- Lead list page with filters
- Add/edit lead form
- Lead detail view
- Lead assignment modal
- Activity timeline

**Acceptance Criteria:**
- Agent can add lead in <30 seconds from mobile
- Leads can be filtered by status, source, assigned agent
- Duplicate phone numbers are flagged
- Agent receives notification when lead assigned

---

#### Feature 2: Client Database (Week 2)
**Effort:** 3 story points

**Database:**
- Uses AgencyLead model

**Backend:**
- Search by name, phone
- Filter by tags, status, date range
- Export to CSV

**Frontend:**
- Client search
- Client profile view
- Communication history
- Contact buttons (Telegram, WhatsApp, call)

**Acceptance Criteria:**
- Search results in <500ms
- Click-to-Telegram/WhatsApp works
- Export CSV includes all fields

---

#### Feature 3: Deal Pipeline (Week 3-4)
**Effort:** 8 story points

**Database:**
- AgencyDeal model
- Deal stage transitions

**Backend:**
- DealService: CRUD, stage management
- DealController: API endpoints
- Commission auto-calculation on close
- Deal metrics aggregation

**Frontend:**
- Kanban board (drag-and-drop)
- Deal detail view
- Stage transition modal
- Close deal modal (won/lost)
- Deal list view (table)

**Acceptance Criteria:**
- Drag-and-drop works on desktop
- Mobile view uses buttons (not drag)
- Commission auto-calculated when deal closed
- Pipeline shows total value per stage

---

#### Feature 4: Agent Management (Week 4-5)
**Effort:** 5 story points

**Database:**
- AgencyMember model
- Role-based permissions

**Backend:**
- MembersService: CRUD, performance metrics
- MembersController: API endpoints
- Permission checks in guards

**Frontend:**
- Team list
- Add member form (invite by email/phone)
- Member profile + performance
- Role assignment

**Acceptance Criteria:**
- Owner can add/remove agents
- Agents see only own leads (unless admin)
- Performance metrics auto-update (leads, deals, revenue)
- License expiry warning (30 days before)

---

#### Feature 5: Commission Tracking (Week 5-6)
**Effort:** 5 story points

**Database:**
- AgencyCommission model
- Commission status workflow

**Backend:**
- CommissionService: calculation, approval, payment
- CommissionController: API endpoints
- Commission split logic (multiple agents)

**Frontend:**
- Commission list
- Commission detail
- Approve/pay modal
- Agent commission dashboard

**Acceptance Criteria:**
- Commission auto-created when deal closed
- Agency fee deducted correctly
- Agent sees pending vs paid commission
- Owner can mark as paid with notes

---

#### Feature 6: Basic Reporting (Week 6-7)
**Effort:** 5 story points

**Database:**
- Aggregation queries

**Backend:**
- AnalyticsService: dashboard metrics
- AnalyticsController: API endpoints
- Lead source breakdown
- Deal pipeline metrics
- Agent leaderboard

**Frontend:**
- Dashboard with KPI cards
- Lead source pie chart
- Pipeline funnel chart
- Agent performance table
- Date range selector

**Acceptance Criteria:**
- Dashboard loads in <1 second
- Charts render correctly on mobile
- Date range filter works
- Export to Excel/CSV

---

#### Feature 7: Telegram Integration (Week 7-8)
**Effort:** 8 story points

**Database:**
- AgencyCRM.telegramBotToken field

**Backend:**
- Telegram bot service
- Webhook handler
- Click-to-Telegram deep links

**Frontend:**
- Telegram setup wizard
- Telegram button on all client profiles
- Telegram notifications toggle

**Acceptance Criteria:**
- Agent clicks Telegram button → opens chat
- New lead notification sent via Telegram
- Viewing reminder sent 1 hour before
- Bot can receive messages (logged as activity)

---

#### Feature 8: Bilingual Support (Week 8)
**Effort:** 3 story points

**Database:**
- No changes (uses existing i18n)

**Backend:**
- API returns text in user's language

**Frontend:**
- Russian (primary) translation
- Uzbek (secondary) translation
- Language toggle in header
- Save preference per user

**Acceptance Criteria:**
- All UI elements translated (Ru + Uz)
- Language persists after refresh
- Reports/exports in selected language
- Property listings can be in either language

---

#### Feature 9: Mobile-Responsive Design (Week 1-8, ongoing)
**Effort:** Built into each feature

**Technical:**
- Tailwind CSS mobile-first breakpoints
- Touch-friendly buttons (44px min)
- Bottom navigation on mobile
- Swipe gestures for actions
- Offline data caching (Service Worker)

**Acceptance Criteria:**
- 95+ Google Lighthouse mobile score
- Works on iPhone SE (smallest screen)
- Works offline (basic operations)
- Install prompt shows on mobile

---

#### Feature 10: Authentication & Authorization (Week 1, foundational)
**Effort:** 3 story points

**Database:**
- AgencyMember roles

**Backend:**
- Agency ownership guard
- Permission guard
- Row-level security (agents see own data)

**Frontend:**
- Protected routes
- Role-based UI (hide actions if no permission)

**Acceptance Criteria:**
- Non-members can't access agency data
- Agents can't see other agents' leads
- Owners/admins can see all data
- Unauthorized requests return 403

---

### 5.2 Total MVP Effort

**Story Points:** 48 (equivalent to ~8-10 weeks with 2 developers)

**Critical Path:**
1. Authentication & DB setup (Week 1)
2. Lead Management (Week 1-2)
3. Deal Pipeline (Week 3-4)
4. Agent Management (Week 4-5)
5. Commission Tracking (Week 5-6)
6. Reporting (Week 6-7)
7. Telegram Integration (Week 7-8)
8. Polish & Testing (Week 8-10)

---

## 6. Development Phases

### Phase 1: Foundation (Weeks 1-2)

**Goal:** Database schema, authentication, basic CRUD

**Tasks:**
1. Create Prisma schema migration
2. Generate Prisma client
3. Set up agency-crm module structure
4. Implement authentication guards
5. Create lead management endpoints
6. Build lead list frontend
7. Build add/edit lead form
8. Implement client search

**Deliverable:** Can add/view/edit leads

**Testing:**
- Unit tests for LeadsService
- Integration tests for leads API
- E2E test: Add lead → Assign → View

---

### Phase 2: Deal Pipeline (Weeks 3-4)

**Goal:** Deal management, pipeline visualization

**Tasks:**
1. Implement deal endpoints
2. Commission calculation logic
3. Build kanban board component
4. Build deal detail view
5. Implement drag-and-drop (desktop)
6. Implement stage buttons (mobile)
7. Build close deal modal
8. Commission auto-creation on close

**Deliverable:** Can convert lead → deal → close → commission

**Testing:**
- Unit tests for DealService
- Unit tests for commission calculation
- Integration tests for deal API
- E2E test: Lead → Deal → Close Won → Commission Created

---

### Phase 3: Agent Dashboard (Weeks 5-6)

**Goal:** Agent management, performance tracking, commissions

**Tasks:**
1. Implement members endpoints
2. Performance metrics aggregation
3. Build team management page
4. Build agent profile page
5. Commission endpoints
6. Commission list/detail frontend
7. Approve/pay commission flow

**Deliverable:** Owner can manage team, track performance, pay commissions

**Testing:**
- Unit tests for MembersService
- Unit tests for CommissionService
- Integration tests for members/commissions API
- E2E test: Add Agent → Assign Lead → Close Deal → Pay Commission

---

### Phase 4: Analytics & Telegram (Weeks 7-8)

**Goal:** Reporting, Telegram integration

**Tasks:**
1. Analytics service (aggregation queries)
2. Analytics endpoints
3. Dashboard frontend (KPI cards)
4. Charts (lead source, pipeline, revenue)
5. Agent leaderboard
6. Telegram bot service
7. Telegram webhook handler
8. Telegram setup wizard frontend
9. Click-to-Telegram buttons
10. Telegram notifications (new lead, reminder)

**Deliverable:** Dashboard with analytics, Telegram integration working

**Testing:**
- Unit tests for AnalyticsService
- Integration tests for analytics API
- Telegram bot manual testing (add lead via bot)
- E2E test: Click Telegram button → Opens chat

---

### Phase 5: Polish & Launch Prep (Weeks 9-10)

**Goal:** Mobile optimization, testing, deployment

**Tasks:**
1. Mobile UI polish (swipe gestures, touch targets)
2. Offline support (Service Worker)
3. PWA manifest and install prompt
4. Performance optimization (lazy loading, caching)
5. Bilingual translation (Russian + Uzbek)
6. End-to-end testing (all critical flows)
7. Load testing (100 concurrent users)
8. Security audit (OWASP top 10)
9. Documentation (API docs, user guides)
10. Deployment to staging
11. Pilot agency onboarding (3-5 agencies)
12. Feedback collection and bug fixes

**Deliverable:** Production-ready MVP

**Testing:**
- Full regression test suite
- Mobile testing (iOS + Android)
- Performance testing (Lighthouse, WebPageTest)
- Security testing (pen test)
- User acceptance testing (pilot agencies)

---

### Phase 6: Post-Launch Iteration (Weeks 11-14)

**Goal:** P1 features based on feedback

**Potential Features (prioritize based on pilot feedback):**
1. Automated follow-ups (reminders)
2. Calendar view for viewings
3. Document upload (client docs, contracts)
4. Advanced filters (budget range, property type)
5. Bulk actions (assign multiple leads)
6. WhatsApp integration (click-to-chat)
7. Task management (to-do lists)
8. Email notifications (alternative to Telegram)
9. AML compliance checklist
10. Notary appointment scheduling

**Deliverable:** Enhanced CRM based on real-world usage

---

## 7. Technical Considerations

### 7.1 Integration with Existing Platform

**Shared Authentication:**
- Agency CRM uses existing JWT authentication
- User model extended with `agencyMemberships` relation
- No separate login for CRM (same session)

**Shared Database:**
- Agency CRM tables in same PostgreSQL database
- Uses existing Prisma client
- Foreign keys reference existing tables (User, Agency, Property)

**Shared UI Components:**
- Reuse existing shadcn/ui components
- Extend with CRM-specific components
- Consistent design language

**API Integration:**
- Agency CRM module imported in main app.module.ts
- Uses existing middleware (CORS, rate limiting, logging)
- Shares common services (Prisma, Email, SMS)

**Example Integration:**
```typescript
// apps/api/src/app.module.ts
@Module({
  imports: [
    // ... existing modules
    AgencyCrmModule, // New module
  ],
})
export class AppModule {}
```

---

### 7.2 Multi-Tenancy Approach

**Strategy:** Row-Level Security (soft multi-tenancy)

**Implementation:**
- Every CRM entity has `agencyId` field
- Guards ensure user can only access own agency data
- Indexes include `agencyId` for performance
- No data shared between agencies

**Isolation:**
```typescript
// All queries scoped to agency
async getLeads(agencyId: string, filters: any) {
  return this.prisma.agencyLead.findMany({
    where: {
      agencyId, // Always filter by agency
      ...filters
    }
  });
}
```

**Cross-Agency Prevention:**
```typescript
// Guard prevents access to other agencies
@UseGuards(AgencyOwnershipGuard)
async getLead(@Param('agencyId') agencyId: string, @Param('leadId') leadId: string) {
  // Guard has already verified user is member of agencyId
  const lead = await this.prisma.agencyLead.findFirst({
    where: { id: leadId, agencyId } // Double-check agency
  });
  
  if (!lead) throw new NotFoundException();
  return lead;
}
```

**Future Option:** Hard multi-tenancy (separate DB per agency) if scaling requires

---

### 7.3 Performance Optimizations

**Database:**
- 45+ indexes for common queries (see schema)
- Composite indexes for multi-column filters
- Connection pooling (Prisma default: 10 connections)
- Query optimization (avoid N+1, use `include` wisely)

**Caching:**
- Redis for:
  - Dashboard metrics (cache 5 minutes)
  - Agent performance stats (cache 1 hour)
  - Session data
- Cache invalidation on data change

**API:**
- Pagination (default 20, max 100 per page)
- Field selection (only return requested fields)
- Lazy loading for relations
- Streaming for large exports

**Frontend:**
- React Server Components (SSR where possible)
- Client-side caching (SWR or React Query)
- Optimistic updates (update UI before API response)
- Skeleton loaders (perceived performance)
- Image optimization (Next.js Image component)
- Code splitting (lazy load routes)

**Example - Cached Dashboard:**
```typescript
// Cache dashboard metrics for 5 minutes
@CacheTTL(300) // 5 minutes
async getDashboardMetrics(agencyId: string, period: string) {
  // Expensive aggregation query
  const metrics = await this.prisma.agencyLead.groupBy({
    by: ['status'],
    where: { agencyId, createdAt: { gte: startDate } },
    _count: true
  });
  
  return this.formatMetrics(metrics);
}
```

---

### 7.4 Security Considerations

**Authentication:**
- JWT tokens (existing implementation)
- Refresh token rotation
- Token expiry: 15 minutes (access), 7 days (refresh)

**Authorization:**
- Role-Based Access Control (RBAC)
- Row-level security (agency isolation)
- Permission checks in guards + service layer (defense in depth)

**Data Protection:**
- HTTPS only (enforce in production)
- HTTP-only cookies (not localStorage)
- CSRF protection (NestJS default)
- Rate limiting (10 req/sec per IP)
- Input validation (Zod schemas)
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (React auto-escaping)

**Sensitive Data:**
- Phone numbers: store normalized (+998901234567)
- License numbers: encrypted at rest (future)
- Commission amounts: access restricted to owner/admin/self
- Notes: sanitize HTML input

**AML Compliance:**
- Audit trail (all activities logged)
- Document storage (encrypted S3)
- Client verification checklist
- Suspicious activity flagging

**Example - Input Validation:**
```typescript
// CreateLeadDto with Zod validation
import { z } from 'zod';

export const CreateLeadSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().regex(/^\+998\d{9}$/), // Uzbekistan format
  email: z.string().email().optional(),
  budget: z.number().positive().optional(),
  requirements: z.string().max(1000).optional(),
});

export type CreateLeadDto = z.infer<typeof CreateLeadSchema>;
```

---

### 7.5 Bilingual Implementation

**Strategy:** next-intl (existing)

**Translation Files:**
```
apps/web/messages/
├── ru/
│   ├── common.json          (existing)
│   └── agency-crm.json      (new)
└── uz/
    ├── common.json          (existing)
    └── agency-crm.json      (new)
```

**Component Usage:**
```tsx
import { useTranslations } from 'next-intl';

export default function LeadList() {
  const t = useTranslations('agency_crm');
  
  return <h1>{t('leads.title')}</h1>;
}
```

**Server-Side:**
```tsx
import { getTranslations } from 'next-intl/server';

export default async function LeadPage({ params: { locale } }) {
  const t = await getTranslations({ locale, namespace: 'agency_crm' });
  
  return <h1>{t('leads.title')}</h1>;
}
```

**Date/Number Formatting:**
```tsx
import { useFormatter } from 'next-intl';

export default function CommissionCard({ amount, date }) {
  const format = useFormatter();
  
  return (
    <div>
      <p>{format.number(amount, { style: 'currency', currency: 'UZS' })}</p>
      <p>{format.dateTime(date, { dateStyle: 'medium' })}</p>
    </div>
  );
}
```

---

### 7.6 Telegram Integration Approach

**Architecture:**
1. Agency owner creates Telegram bot via @BotFather
2. Owner enters bot token in CRM settings
3. CRM registers webhook with Telegram API
4. Webhook endpoint receives Telegram updates
5. CRM processes updates (new messages, commands)

**Telegram Bot Features:**

**Agent Commands:**
- `/start` - Link Telegram account to CRM
- `/addlead` - Quick add lead
- `/today` - Today's tasks
- `/leads` - My active leads

**Notifications:**
- New lead assigned
- Viewing reminder (1 hour before)
- Task due soon
- Deal stage changed

**Client-Facing Bot (Future):**
- Search properties
- Request viewing
- Get property alerts

**Implementation:**
```typescript
// telegram-bot.service.ts
@Injectable()
export class TelegramBotService {
  private bot: TelegramBot;
  
  async setupBot(agencyId: string, botToken: string) {
    this.bot = new TelegramBot(botToken);
    
    // Register webhook
    const webhookUrl = `${process.env.API_URL}/telegram/${agencyId}/webhook`;
    await this.bot.setWebhook(webhookUrl);
    
    return { webhookUrl };
  }
  
  async sendMessage(chatId: string, text: string) {
    await this.bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Open CRM', url: 'https://crm.example.com' }]
        ]
      }
    });
  }
  
  async handleWebhook(agencyId: string, update: TelegramUpdate) {
    const message = update.message;
    
    if (message.text === '/addlead') {
      // Guide user through lead creation
      await this.sendMessage(message.chat.id, 'Send client name:');
    }
    
    // Log all messages as activities
    await this.logActivity(agencyId, {
      type: 'TELEGRAM',
      description: message.text,
      metadata: { chatId: message.chat.id }
    });
  }
}
```

**Deep Links:**
```tsx
// Click-to-Telegram button
<a href={`tg://user?id=${client.telegramUserId}`}>
  Open Telegram
</a>

// Or use username
<a href={`https://t.me/${client.telegramUsername}`}>
  @{client.telegramUsername}
</a>
```

---

### 7.7 Mobile PWA Requirements

**Manifest:**
```json
// apps/web/public/manifest.json
{
  "name": "Agency CRM - Real Estate",
  "short_name": "Agency CRM",
  "description": "Real estate agency management system",
  "start_url": "/agency",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Service Worker:**
```typescript
// apps/web/public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('agency-crm-v1').then((cache) => {
      return cache.addAll([
        '/agency',
        '/agency/leads',
        '/agency/deals',
        // Cache critical pages for offline
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if available, else fetch
      return response || fetch(event.request);
    })
  );
});
```

**Push Notifications:**
```typescript
// Request permission
const permission = await Notification.requestPermission();

if (permission === 'granted') {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY'
  });
  
  // Send subscription to backend
  await fetch('/api/notifications/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription)
  });
}
```

**Install Prompt:**
```tsx
'use client';
import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);
  
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    setDeferredPrompt(null);
  };
  
  if (!deferredPrompt) return null;
  
  return (
    <button onClick={handleInstall}>
      Install App
    </button>
  );
}
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

**Backend (Jest):**

```typescript
// leads.service.spec.ts
describe('LeadsService', () => {
  let service: LeadsService;
  let prisma: PrismaService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [LeadsService, PrismaService],
    }).compile();
    
    service = module.get<LeadsService>(LeadsService);
    prisma = module.get<PrismaService>(PrismaService);
  });
  
  it('should create lead', async () => {
    const dto = { firstName: 'John', lastName: 'Doe', phone: '+998901234567' };
    const result = await service.createLead('agency-123', dto);
    
    expect(result).toHaveProperty('id');
    expect(result.firstName).toBe('John');
  });
  
  it('should detect duplicate phone', async () => {
    await service.createLead('agency-123', { /* lead 1 */ });
    
    await expect(
      service.createLead('agency-123', { phone: '+998901234567' }) // same phone
    ).rejects.toThrow('Duplicate lead');
  });
  
  it('should calculate commission correctly', () => {
    const dealValue = 100000;
    const commissionRate = 3; // 3%
    const agencyFee = 20; // 20% of commission
    
    const result = service.calculateCommission(dealValue, commissionRate, agencyFee);
    
    expect(result.grossAmount).toBe(3000); // 3% of 100000
    expect(result.agencyFee).toBe(600); // 20% of 3000
    expect(result.netAmount).toBe(2400); // 3000 - 600
  });
});
```

**Frontend (Vitest + Testing Library):**

```typescript
// LeadList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import LeadList from './LeadList';

describe('LeadList', () => {
  it('renders lead list', () => {
    const leads = [
      { id: '1', firstName: 'John', lastName: 'Doe', status: 'NEW' }
    ];
    
    render(<LeadList leads={leads} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('NEW')).toBeInTheDocument();
  });
  
  it('filters leads by status', async () => {
    const { getByRole } = render(<LeadList />);
    
    const filter = getByRole('combobox', { name: 'Status' });
    fireEvent.change(filter, { target: { value: 'CONTACTED' } });
    
    // Assert filtered results
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });
});
```

**Coverage Goals:**
- Services: 90%+
- Controllers: 80%+
- Utils: 95%+
- Components: 70%+

---

### 8.2 Integration Tests

**API Tests (Supertest):**

```typescript
// leads.e2e-spec.ts
describe('Leads API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Login to get token
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    authToken = response.body.accessToken;
  });
  
  it('/api/agency-crm/:agencyId/leads (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/agency-crm/agency-123/leads')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'John',
        lastName: 'Doe',
        phone: '+998901234567'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.firstName).toBe('John');
  });
  
  it('/api/agency-crm/:agencyId/leads (GET) - filters work', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/agency-crm/agency-123/leads?status=NEW&page=1&limit=10')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.meta).toHaveProperty('total');
  });
  
  it('rejects unauthorized access', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/agency-crm/agency-123/leads');
    
    expect(response.status).toBe(401);
  });
});
```

---

### 8.3 End-to-End Tests

**Critical User Flows (fe-pilot):**

```yaml
# test/e2e/agency-crm-critical-flows.yaml
name: Agency CRM Critical Flows
url: https://staging.example.com

scenarios:
  - name: Agent adds lead and converts to deal
    steps:
      - action: navigate
        url: /agency/leads
      
      - action: click
        selector: 'button:has-text("Add Lead")'
      
      - action: fill
        fields:
          - selector: 'input[name="firstName"]'
            value: "John"
          - selector: 'input[name="lastName"]'
            value: "Doe"
          - selector: 'input[name="phone"]'
            value: "+998901234567"
      
      - action: click
        selector: 'button:has-text("Save")'
      
      - action: wait
        condition: 'text=Lead created'
      
      - action: click
        selector: 'button:has-text("Convert to Deal")'
      
      - action: fill
        fields:
          - selector: 'input[name="dealValue"]'
            value: "100000"
      
      - action: click
        selector: 'button:has-text("Create Deal")'
      
      - action: assert
        condition: 'url=/agency/deals/*'

  - name: Owner manages commissions
    steps:
      - action: navigate
        url: /agency/commissions
      
      - action: assert
        condition: 'text=Pending Commissions'
      
      - action: click
        selector: 'tr:has-text("John Doe") button:has-text("Pay")'
      
      - action: fill
        fields:
          - selector: 'select[name="paymentMethod"]'
            value: "BANK_TRANSFER"
      
      - action: click
        selector: 'button:has-text("Confirm Payment")'
      
      - action: assert
        condition: 'text=Commission marked as paid'
```

**Run Tests:**
```bash
# On VPS (preferred)
ssh -i /home/odil/projects/id_rsa -p 2222 root@62.72.22.205 \
  "fe-pilot run /root/test/agency-crm-critical-flows.yaml --output /tmp/results"

# Locally
fe-pilot run test/e2e/agency-crm-critical-flows.yaml
```

---

### 8.4 Mobile Testing

**Devices to Test:**
- iPhone SE (smallest iOS)
- iPhone 14 Pro (notch)
- Samsung Galaxy S21 (Android)
- iPad Mini (tablet)

**Tools:**
- BrowserStack (real devices)
- Chrome DevTools (device emulation)
- fe-snapshot (visual regression)

**Checklist:**
- Touch targets ≥44px
- Text readable without zoom
- Forms usable on mobile keyboard
- Swipe gestures work
- Offline mode works
- PWA install prompt shows
- Push notifications work

**Visual Regression:**
```bash
# Capture mobile screenshots
fe-snapshot https://staging.example.com/agency/leads \
  --viewport mobile \
  --output /tmp/leads-mobile.png

# Compare to baseline
diff /tmp/leads-mobile.png test/screenshots/leads-mobile-baseline.png
```

---

### 8.5 Performance Testing

**Tools:**
- Lighthouse CI
- WebPageTest
- k6 (load testing)

**Targets:**
- API response time: <500ms (p95)
- Page load: <2s (First Contentful Paint)
- Time to Interactive: <3s
- Lighthouse Performance: >90
- Mobile Lighthouse: >85

**Load Test (k6):**
```javascript
// test/load/agency-crm-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp up to 10 users
    { duration: '3m', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
  },
};

export default function() {
  const token = 'YOUR_TEST_TOKEN';
  
  // Get leads
  let res = http.get('https://staging.example.com/api/agency-crm/agency-123/leads', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

**Run Load Test:**
```bash
k6 run test/load/agency-crm-load.js
```

---

## 9. Deployment Considerations

### 9.1 Environment Variables

**New Variables for Agency CRM:**

```bash
# .env.production

# Telegram Bot
TELEGRAM_WEBHOOK_BASE_URL=https://api.example.com
TELEGRAM_BOT_TOKEN_DEFAULT= # Optional default bot

# Commission Calculations
DEFAULT_COMMISSION_RATE=3.0
DEFAULT_AGENCY_FEE_PERCENT=20

# Notifications
TELEGRAM_NOTIFICATIONS_ENABLED=true
EMAIL_NOTIFICATIONS_ENABLED=false

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
CACHE_TTL_DASHBOARD=300 # 5 minutes
CACHE_TTL_ANALYTICS=3600 # 1 hour

# File Upload (for documents)
AWS_S3_BUCKET=agency-crm-documents
AWS_S3_REGION=us-east-1
MAX_FILE_SIZE=10485760 # 10MB

# Subscription Limits
FREE_TRIAL_DAYS=14
SOLO_TIER_MAX_AGENTS=1
SMALL_TIER_MAX_AGENTS=3
GROWING_TIER_MAX_AGENTS=10
```

---

### 9.2 Database Migration

**Production Migration Steps:**

```bash
# 1. Backup database
pg_dump -U postgres -d real_estate_db > backup_before_agency_crm.sql

# 2. Run migration (on VPS)
cd /var/www/real-estate-platform-v2
pnpm --filter @repo/database prisma migrate deploy

# 3. Verify migration
pnpm --filter @repo/database prisma migrate status

# 4. Generate client
pnpm --filter @repo/database prisma generate

# 5. Rebuild packages
pnpm --filter @repo/database build
pnpm --filter @repo/shared build
pnpm --filter @repo/api build
pnpm --filter @repo/web build

# 6. Restart services
pm2 restart api
pm2 restart web

# 7. Verify API
curl https://api.example.com/health

# 8. Test CRM endpoints
curl -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/api/agency-crm/agency-123/leads
```

**Rollback Plan:**
```bash
# If migration fails, rollback
psql -U postgres -d real_estate_db < backup_before_agency_crm.sql

# Revert code
git reset --hard HEAD~1
pm2 restart all
```

---

### 9.3 Monitoring & Logging

**Metrics to Monitor:**

1. **API Performance:**
   - Response time (p50, p95, p99)
   - Request rate (req/sec)
   - Error rate (4xx, 5xx)

2. **Database:**
   - Query execution time
   - Connection pool usage
   - Slow queries (>100ms)

3. **User Activity:**
   - Active users (DAU/MAU)
   - Feature usage (leads added, deals closed)
   - Session duration

4. **Business Metrics:**
   - Agencies signed up
   - Agents active daily
   - Deals closed
   - Commission tracked

**Logging Strategy:**

```typescript
// Structured logging
import { Logger } from '@nestjs/common';

const logger = new Logger('AgencyCRM');

logger.log('Lead created', {
  agencyId: 'agency-123',
  leadId: 'lead-456',
  source: 'TELEGRAM',
  assignedTo: 'agent-789'
});

logger.error('Failed to send Telegram notification', {
  agencyId: 'agency-123',
  error: error.message,
  stack: error.stack
});
```

**Log Aggregation:**
- Production: Sentry (errors), Logtail (logs)
- View logs: `pm2 logs api`

---

### 9.4 Deployment Checklist

**Pre-Deployment:**
- [ ] All tests pass (unit, integration, e2e)
- [ ] Code reviewed and approved
- [ ] Database migration tested on staging
- [ ] Environment variables configured
- [ ] Backup database created
- [ ] Rollback plan documented

**Deployment Steps:**
1. [ ] Deploy to staging
2. [ ] Run smoke tests on staging
3. [ ] Get stakeholder approval
4. [ ] Deploy to production (off-peak hours)
5. [ ] Run health checks
6. [ ] Monitor errors for 1 hour
7. [ ] Announce launch to pilot agencies

**Post-Deployment:**
- [ ] Monitor Sentry for errors
- [ ] Check API response times
- [ ] Verify Telegram bot working
- [ ] Test critical flows (add lead, close deal)
- [ ] Check mobile PWA install prompt
- [ ] Gather initial user feedback

---

## 10. Risk Mitigation

### 10.1 Technical Risks

**Risk 1: Performance Degradation**
- **Impact:** High (poor UX, user churn)
- **Likelihood:** Medium
- **Mitigation:**
  - Load testing before launch (k6)
  - Database indexes on all query paths
  - Redis caching for expensive queries
  - CDN for static assets
  - Monitor response times (Sentry)
- **Contingency:** Horizontal scaling (add more API servers)

**Risk 2: Telegram API Changes**
- **Impact:** Medium (integration breaks)
- **Likelihood:** Low
- **Mitigation:**
  - Use official Telegram Bot API library
  - Version lock dependencies
  - Monitor Telegram API changelog
  - Have fallback (WhatsApp, SMS, email)
- **Contingency:** Quickly patch if API changes

**Risk 3: Database Migration Failure**
- **Impact:** Critical (data loss, downtime)
- **Likelihood:** Low
- **Mitigation:**
  - Test migration on staging first
  - Backup database before migration
  - Use Prisma migrate (safe, transactional)
  - Dry-run migration
- **Contingency:** Rollback plan (restore from backup)

**Risk 4: Mobile Browser Compatibility**
- **Impact:** Medium (some users can't use)
- **Likelihood:** Medium
- **Mitigation:**
  - Test on real devices (BrowserStack)
  - Use polyfills for older browsers
  - Progressive enhancement
  - Graceful degradation
- **Contingency:** Native app (React Native) if PWA insufficient

---

### 10.2 Product Risks

**Risk 5: Low Adoption (Agencies Don't Use)**
- **Impact:** Critical (project fails)
- **Likelihood:** Medium
- **Mitigation:**
  - Validate with pilot agencies BEFORE full build
  - Simple, intuitive UI (minimize learning curve)
  - Free trial period (14 days)
  - In-person onboarding + training
  - Telegram integration (familiar tool)
- **Contingency:** Pivot based on feedback

**Risk 6: Feature Creep (Too Complex)**
- **Impact:** High (delays launch, confuses users)
- **Likelihood:** High
- **Mitigation:**
  - Strict MVP scope (P0 features only)
  - User story prioritization (MoSCoW)
  - Time-boxed sprints
  - Say "no" to nice-to-haves
- **Contingency:** Cut P1 features if timeline slips

**Risk 7: Competition Copies Features**
- **Impact:** Medium (lose first-mover advantage)
- **Likelihood:** Medium
- **Mitigation:**
  - Launch fast (10 weeks)
  - Build strong agency relationships
  - Add defensible features (deep Telegram integration)
  - Focus on excellent UX
- **Contingency:** Iterate faster, add unique features

---

### 10.3 Market Risks

**Risk 8: Uzbekistan Market Too Small**
- **Impact:** High (can't achieve revenue goals)
- **Likelihood:** Low (267 agencies = sufficient)
- **Mitigation:**
  - Target 50 agencies in Year 1 (18% market share)
  - Expand to Kazakhstan, Kyrgyzstan later
  - Add developer CRM upsell
- **Contingency:** Expand to adjacent markets

**Risk 9: Agencies Prefer Free Tools (Excel)**
- **Impact:** Medium (slow adoption)
- **Likelihood:** Medium
- **Mitigation:**
  - Prove ROI (30% productivity increase)
  - Low pricing ($29/month for solo agent)
  - Free trial to reduce friction
  - Show time saved (5 hours/week)
- **Contingency:** Freemium model (free forever, paid features)

**Risk 10: Regulatory Changes Require Rework**
- **Impact:** Medium (feature rework)
- **Likelihood:** Low
- **Mitigation:**
  - Build AML compliance features proactively
  - Monitor regulatory news
  - Flexible architecture
- **Contingency:** Rapid iteration to comply

---

### 10.4 Mitigation Summary

**Reduce Likelihood:**
- Thorough testing (unit, integration, e2e)
- Staging environment (test before production)
- Code reviews (2 developers)
- User validation (pilot agencies)

**Reduce Impact:**
- Rollback plan (database backups)
- Monitoring (Sentry, Logtail)
- Graceful degradation (features fail safely)
- Clear documentation (recovery procedures)

**Accept Risk:**
- Some features may not be used (acceptable if core features work)
- Some agencies may churn (acceptable <5% monthly churn)

---

## Critical Files for Implementation

Based on this implementation plan, these are the 5 most critical files for implementation:

1. **`/home/odil/projects/real-estate-platform-v2/packages/database/prisma/schema.prisma`**
   - Reason: Core data model, must be correct from day 1, changes are expensive later

2. **`/home/odil/projects/real-estate-platform-v2/apps/api/src/modules/agency-crm/services/agency-leads.service.ts`**
   - Reason: Lead management is the foundation, most frequently used feature

3. **`/home/odil/projects/real-estate-platform-v2/apps/api/src/modules/agency-crm/services/agency-deals.service.ts`**
   - Reason: Deal pipeline and commission calculation logic, complex business rules

4. **`/home/odil/projects/real-estate-platform-v2/apps/web/src/app/[locale]/agency/leads/page.tsx`**
   - Reason: Primary interface agents use daily, must be fast and intuitive

5. **`/home/odil/projects/real-estate-platform-v2/apps/web/src/components/agency-crm/deals/DealPipeline.tsx`**
   - Reason: Kanban board is core differentiator, must work perfectly on mobile and desktop

---

## Appendix: External Dependencies

**New NPM Packages:**

```json
{
  "dependencies": {
    "telegraf": "^4.16.3",              // Telegram Bot API
    "bullmq": "^5.0.0",                 // Background jobs (reminders)
    "ioredis": "^5.3.0",                // Redis client
    "@react-spring/web": "^9.7.3",      // Drag-and-drop animations
    "date-fns": "^3.0.0",               // Date utilities
    "zod": "^3.22.4",                   // Schema validation (existing)
    "xlsx": "^0.18.5"                   // Excel export
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",     // E2E testing
    "k6": "^0.48.0"                    // Load testing
  }
}
```

**Infrastructure:**
- Redis (for caching + BullMQ)
- AWS S3 (for document storage)
- Sentry (error tracking)
- Logtail (log aggregation)

---

**Document Version:** 1.0  
**Last Updated:** December 15, 2025  
**Next Review:** After Phase 1 (Week 2)
