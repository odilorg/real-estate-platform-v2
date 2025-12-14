# Developer CRM MVP - Detailed Implementation Plan

**Target User:** Real Estate Developers (Zastroyshik) in Uzbekistan
**Timeline:** 10 weeks
**Start Date:** December 16, 2025
**Launch Date:** February 24, 2026

---

## Executive Summary

### What We're Building

A **CRM platform for real estate developers** in Uzbekistan to manage:
- Residential projects (complexes, towers, buildings)
- Unit inventory (apartments, commercial spaces)
- Direct buyer leads (B2C sales)
- Sales team performance
- Payment plans and installments

### Why Developer-First?

1. **Higher revenue:** Developers have 100+ units per project vs agencies with 10-20 listings
2. **Less competition:** Domtut/Realting focus on resale market
3. **Sticky customers:** Developers need long-term tools (2-3 year projects)
4. **Clear pain points:** No good tools for project/unit management in Uzbekistan

### Success Metrics (3 Months Post-Launch)

- 5 developers signed up (Tashkent City, Boulevard, etc.)
- 10 projects (residential complexes) managed
- 500+ units tracked
- 200+ direct buyer leads
- 50+ sales completed

---

## 🚀 Implementation Progress Tracker

**Last Updated:** December 12, 2025 (Night Session - Auto)

### ✅ Completed
- **Week 1, Day 1-2:** Database Schema - Developer, DeveloperProject, City, District, Mahalla models ✅
- **Week 1, Day 3-4:** Developer Backend Module - Service, Controller, Module ✅
- **Week 1, Day 5:** Frontend - Developer Dashboard Layout ✅
  - DeveloperNav component with 6 navigation items
  - DeveloperStats component with 4 stat cards
  - Dashboard page with layout
  - RU/UZ translations added
- **Week 2:** Developer Settings & Onboarding ✅
  - Settings page with react-hook-form + zod validation
  - Complete form sections: Basic Info, Contact, Legal
  - Form validation with error handling
  - Success/error states and user feedback
  - RU/UZ translations
- **Week 2:** Team Management ✅
  - Team members page with grid layout
  - Add member modal with role selection
  - Empty state with CTAs
  - Team member cards with contact info
  - RU/UZ translations
- **Week 2:** Leads Management Frontend ✅
  - Leads list page with status tracking
  - Statistics cards (new, qualified, negotiating, conversion rate)
  - Lead status badges with icons
  - Search and filter functionality
  - Empty state design
  - Complete table view with all lead details
  - RU/UZ translations
- **Week 3, Day 1-2:** DeveloperProject Backend Module - Service, Controller, Module ✅
  - Full CRUD operations
  - Statistics tracking
  - Public and authenticated endpoints
- **Week 3, Day 3-4:** Projects Frontend - List & Create UI ✅
  - ProjectCard component with bilingual support, status badges, progress bars
  - Projects list page with empty state and grid layout
  - Project creation form with validation (name RU/UZ, address, city, district, units, completion date)
  - All components compiling successfully

### 🔄 In Progress
- **Week 4:** Unit Management System (NEXT)

### ⏸️ Pending
- Week 3, Day 5: Project Detail Page & Media Management
- Week 4: Unit Management (Backend & Frontend)
- Week 5-6: Lead Management Backend
- Week 7-8: Sales Team & Pipeline
- Week 9: Payment Plans
- Week 10: Polish & Launch

### 📊 Overall Progress: ~45% (9/20 major milestones)

### 📝 Recent Session Notes
**December 12, 2025 (Night - Autonomous):**
- Installed form validation packages (react-hook-form, zod, @hookform/resolvers)
- Completed Developer Settings page with full form validation
- Built Team Management page with empty states and add member modal
- Created Leads Management page with status tracking, filters, and stats
- Added comprehensive RU/UZ translations for all new pages
- All pages compiling successfully with 0 errors
- Frontend now has: Dashboard, Projects (list/create), Settings, Team, Leads

**December 12, 2025 (Evening):**
- Completed Projects Frontend UI with full bilingual support
- Created reusable ProjectCard component with status tracking
- Built project creation form with location hierarchy (city → district)
- Empty state UX designed for first-time users

**December 12, 2025 (Earlier):**
- Created complete backend infrastructure for Developers and Projects
- Built foundation frontend dashboard with navigation and stats
- All server compilations successful

---

## Table of Contents

1. [Week 0: Pre-Development Setup](#week-0-pre-development-setup)
2. [Week 1-2: Developer Foundation](#week-1-2-developer-foundation)
3. [Week 3-4: Project & Unit Management](#week-3-4-project--unit-management)
4. [Week 5-6: Lead Management](#week-5-6-lead-management)
5. [Week 7-8: Sales Team & Pipeline](#week-7-8-sales-team--pipeline)
6. [Week 9: Payment Plans](#week-9-payment-plans)
7. [Week 10: Polish & Launch](#week-10-polish--launch)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Plan](#deployment-plan)
10. [Post-Launch Roadmap](#post-launch-roadmap)

---

## Week 0: Pre-Development Setup

### Day 0: Environment & Planning

**Git Setup:**
```bash
# Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/developer-crm-mvp

# Create planning directory
mkdir -p docs/developer-crm
```

**Environment Variables:**
```bash
# Add to apps/api/.env
ANTHROPIC_API_KEY=sk-ant-...  # For AI features later
CURRENCY_API_KEY=...          # For USD/UZS conversion

# Add to apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_ENABLE_DEVELOPER_FEATURES=true
```

**Install Additional Dependencies:**
```bash
# Backend
cd apps/api
pnpm add @anthropic-ai/sdk
pnpm add qrcode @types/qrcode
pnpm add date-fns

# Frontend
cd apps/web
pnpm add @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid
pnpm add @dnd-kit/core @dnd-kit/sortable  # For Kanban drag-drop
pnpm add recharts  # For charts/analytics
pnpm add react-hook-form zod @hookform/resolvers
```

**Development Tools:**
```bash
# Install database GUI (optional but helpful)
pnpm add -D prisma-dbml-generator

# Add to prisma/schema.prisma
generator dbml {
  provider = "prisma-dbml-generator"
}
```

**Acceptance Criteria:**
- ✅ Feature branch created
- ✅ All dependencies installed
- ✅ Environment variables configured
- ✅ Dev server runs without errors (`pnpm dev`)

---

## Week 1-2: Developer Foundation

### Week 1, Day 1-2: Database Schema

**File:** `packages/database/prisma/schema.prisma`

**Changes:**

```prisma
// 1. Update UserRole enum
enum UserRole {
  USER
  AGENT
  AGENCY_ADMIN
  DEVELOPER_ADMIN         // NEW
  DEVELOPER_SALES_AGENT   // NEW
  ADMIN
}

// 2. Add Developer model
model Developer {
  id              String    @id @default(cuid())

  // Basic Info
  name            String
  nameUz          String?
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
  subscriptionTier String   @default("FREE")  // FREE, PRO, ENTERPRISE
  subscriptionExpiry DateTime?

  // Stats (updated automatically)
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
  leads           Lead[]
  deals           Deal[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([slug])
  @@index([city])
  @@index([verified])
  @@index([subscriptionTier])
}

// 3. Add DeveloperProject model
model DeveloperProject {
  id              String    @id @default(cuid())
  developerId     String
  developer       Developer @relation(fields: [developerId], references: [id], onDelete: Cascade)

  // Basic Info
  name            String
  nameUz          String?
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
  amenities       String[]  // pool, gym, playground, etc.
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

  // Stats (auto-updated)
  unitsTotal      Int       @default(0)
  unitsAvailable  Int       @default(0)
  unitsReserved   Int       @default(0)
  unitsSold       Int       @default(0)

  // Relations
  properties      Property[]

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

// 4. Project media models
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

// 5. Update User model
model User {
  // ... existing fields ...

  // Add developer membership
  developerId   String?
  developer     Developer? @relation("DeveloperSalesTeam", fields: [developerId], references: [id])

  // ... existing relations ...
}

// 6. Update Property model
model Property {
  // ... existing fields ...

  // Add developer ownership
  developerId        String?
  developer          Developer? @relation(fields: [developerId], references: [id])

  developerProjectId String?
  developerProject   DeveloperProject? @relation(fields: [developerProjectId], references: [id])

  // Unit details (for developer properties)
  buildingBlock      String?   // "Block A", "Tower 1"
  unitNumber         String?   // "305", "A-12"
  entrance           String?   // Entrance number

  // Unit status (for developers)
  unitStatus         UnitStatus? @default(AVAILABLE)
  reservedUntil      DateTime?   // Reservation expiry
  reservedBy         String?     // Lead ID or client name

  // Payment plan
  paymentPlanAvailable Boolean @default(false)
  downPaymentPercent   Int?    // e.g., 30
  installmentMonths    Int?    // e.g., 12, 24, 36
  paymentPlanDetails   String? @db.Text

  // Delivery
  estimatedDelivery  DateTime?
  isReadyToMoveIn    Boolean   @default(false)
  handoverDate       DateTime? // When unit was handed to buyer

  // Change description to bilingual
  descriptionRu      String    @db.Text
  descriptionUz      String?   @db.Text

  // ... rest of existing fields ...
}

enum UnitStatus {
  AVAILABLE   // For sale
  RESERVED    // Temporarily held
  SOLD        // Contract signed
  HANDED_OVER // Keys given to buyer
}

// 7. Add City, District, Mahalla models (location hierarchy)
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

**Migration:**
```bash
# Create migration
npx prisma migrate dev --name add_developer_models

# If errors, create draft first
npx prisma migrate dev --create-only --name add_developer_models
# Then manually edit migration SQL if needed
# Then apply
npx prisma migrate deploy
```

**Seed Data Script:**
```typescript
// packages/database/prisma/seed-locations.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLocations() {
  // Tashkent
  const tashkent = await prisma.city.create({
    data: {
      nameRu: 'Ташкент',
      nameUz: 'Toshkent',
      latitude: 41.2995,
      longitude: 69.2401,
    },
  });

  // Tashkent Districts
  const districts = [
    { nameRu: 'Юнусабад', nameUz: 'Yunusobod' },
    { nameRu: 'Чиланзар', nameUz: 'Chilonzor' },
    { nameRu: 'Яшнабад', nameUz: 'Yashnobod' },
    { nameRu: 'Мирзо-Улугбекский', nameUz: 'Mirzo Ulug\'bek' },
    { nameRu: 'Мирабадский', nameUz: 'Mirobod' },
    { nameRu: 'Алмазарский', nameUz: 'Olmazor' },
    { nameRu: 'Учтепинский', nameUz: 'Uchtepa' },
    { nameRu: 'Сергелийский', nameUz: 'Sergeli' },
    { nameRu: 'Шайхантахурский', nameUz: 'Shayxontohur' },
    { nameRu: 'Бектемирский', nameUz: 'Bektemir' },
    { nameRu: 'Яккасарайский', nameUz: 'Yakkasaroy' },
  ];

  for (const district of districts) {
    await prisma.district.create({
      data: {
        cityId: tashkent.id,
        ...district,
      },
    });
  }

  // Add mahallas (example for Yunusobod)
  const yunusobod = await prisma.district.findFirst({
    where: { nameUz: 'Yunusobod' },
  });

  if (yunusobod) {
    const mahallas = [
      '1-mahalla', '2-mahalla', '3-mahalla', '4-mahalla', '5-mahalla',
      '6-mahalla', '7-mahalla', '8-mahalla', '9-mahalla', '10-mahalla',
      '11-mahalla', '12-mahalla', '13-mahalla', '14-mahalla', '15-mahalla',
    ];

    for (const mahalla of mahallas) {
      await prisma.mahalla.create({
        data: {
          districtId: yunusobod.id,
          nameRu: mahalla,
          nameUz: mahalla,
        },
      });
    }
  }

  // Samarkand
  const samarkand = await prisma.city.create({
    data: {
      nameRu: 'Самарканд',
      nameUz: 'Samarqand',
      latitude: 39.6542,
      longitude: 66.9597,
    },
  });

  const samarkandDistricts = [
    { nameRu: 'Дагбитский', nameUz: 'Dagbit' },
    { nameRu: 'Сиабский', nameUz: 'Siob' },
    { nameRu: 'Самаркандский', nameUz: 'Samarqand' },
    // Add more...
  ];

  for (const district of samarkandDistricts) {
    await prisma.district.create({
      data: {
        cityId: samarkand.id,
        ...district,
      },
    });
  }

  console.log('✅ Locations seeded successfully');
}

seedLocations()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Run Seed:**
```bash
npx ts-node packages/database/prisma/seed-locations.ts
```

**Acceptance Criteria:**
- ✅ Migration runs without errors
- ✅ All new models visible in Prisma Studio
- ✅ Tashkent + Samarkand cities seeded
- ✅ 11 Tashkent districts seeded
- ✅ At least 50 mahallas seeded

---

### Week 1, Day 3-4: Developer Auth & Module Setup

**Backend Module Structure:**
```bash
apps/api/src/modules/developers/
├── developers.module.ts
├── developers.controller.ts
├── developers.service.ts
├── dto/
│   ├── create-developer.dto.ts
│   ├── update-developer.dto.ts
│   └── developer-filter.dto.ts
└── guards/
    └── developer-admin.guard.ts
```

**File:** `apps/api/src/modules/developers/developers.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { DevelopersController } from './developers.controller';
import { DevelopersService } from './developers.service';

@Module({
  controllers: [DevelopersController],
  providers: [DevelopersService],
  exports: [DevelopersService],
})
export class DevelopersModule {}
```

**File:** `apps/api/src/modules/developers/developers.service.ts`
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeveloperDto, UpdateDeveloperDto } from './dto';

@Injectable()
export class DevelopersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateDeveloperDto) {
    // Generate slug from name
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const developer = await this.prisma.developer.create({
      data: {
        ...dto,
        slug,
        salesTeam: {
          connect: { id: userId }, // Creator becomes admin
        },
      },
    });

    // Update user role to DEVELOPER_ADMIN
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: 'DEVELOPER_ADMIN',
        developerId: developer.id,
      },
    });

    return developer;
  }

  async findAll(filters?: any) {
    return this.prisma.developer.findMany({
      where: {
        ...filters,
      },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            completionDate: true,
          },
        },
        _count: {
          select: {
            projects: true,
            properties: true,
            leads: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const developer = await this.prisma.developer.findUnique({
      where: { id },
      include: {
        projects: true,
        salesTeam: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    if (!developer) {
      throw new NotFoundException('Developer not found');
    }

    return developer;
  }

  async update(id: string, dto: UpdateDeveloperDto) {
    return this.prisma.developer.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    return this.prisma.developer.delete({
      where: { id },
    });
  }

  async updateStats(developerId: string) {
    const [totalProjects, totalUnits, unitsSold] = await Promise.all([
      this.prisma.developerProject.count({
        where: { developerId },
      }),
      this.prisma.property.count({
        where: { developerId },
      }),
      this.prisma.property.count({
        where: {
          developerId,
          unitStatus: 'SOLD',
        },
      }),
    ]);

    return this.prisma.developer.update({
      where: { id: developerId },
      data: {
        totalProjects,
        totalUnits,
        unitsSold,
        unitsAvailable: totalUnits - unitsSold,
      },
    });
  }
}
```

**File:** `apps/api/src/modules/developers/developers.controller.ts`
```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DevelopersService } from './developers.service';
import { CreateDeveloperDto, UpdateDeveloperDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators';
import { User } from '@repo/database';

@Controller('developers')
@UseGuards(JwtAuthGuard)
export class DevelopersController {
  constructor(private developersService: DevelopersService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateDeveloperDto) {
    return this.developersService.create(user.id, dto);
  }

  @Get()
  findAll(@Query() filters: any) {
    return this.developersService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.developersService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDeveloperDto) {
    return this.developersService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.developersService.delete(id);
  }

  @Post(':id/update-stats')
  updateStats(@Param('id') id: string) {
    return this.developersService.updateStats(id);
  }
}
```

**Register Module:**
```typescript
// apps/api/src/app.module.ts
import { DevelopersModule } from './modules/developers/developers.module';

@Module({
  imports: [
    // ... existing modules
    DevelopersModule,
  ],
})
export class AppModule {}
```

**Acceptance Criteria:**
- ✅ POST /api/developers creates developer
- ✅ GET /api/developers lists all developers
- ✅ GET /api/developers/:id returns single developer
- ✅ PUT /api/developers/:id updates developer
- ✅ Creating developer sets user role to DEVELOPER_ADMIN

---

### Week 1, Day 5: Frontend - Developer Dashboard Layout

**Directory Structure:**
```bash
apps/web/src/app/[locale]/developer/
├── layout.tsx
├── page.tsx (dashboard)
├── settings/
│   └── page.tsx
├── team/
│   └── page.tsx
└── components/
    ├── DeveloperNav.tsx
    └── DeveloperStats.tsx
```

**File:** `apps/web/src/app/[locale]/developer/layout.tsx`
```typescript
import { DeveloperNav } from './components/DeveloperNav';

export default function DeveloperLayout({
  children,
}: {
  children: React.Node;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DeveloperNav />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
```

**File:** `apps/web/src/app/[locale]/developer/components/DeveloperNav.tsx`
```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Building2,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
} from 'lucide-react';

export function DeveloperNav() {
  const t = useTranslations('developer');
  const pathname = usePathname();

  const navigation = [
    { name: t('dashboard'), href: '/developer', icon: LayoutDashboard },
    { name: t('projects'), href: '/developer/projects', icon: Building2 },
    { name: t('leads'), href: '/developer/leads', icon: MessageSquare },
    { name: t('team'), href: '/developer/team', icon: Users },
    { name: t('analytics'), href: '/developer/analytics', icon: BarChart3 },
    { name: t('settings'), href: '/developer/settings', icon: Settings },
  ];

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <span className="text-xl font-bold text-gray-900">
              Developer CRM
            </span>
          </div>
          <div className="hidden md:flex md:space-x-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    inline-flex items-center px-3 py-2 text-sm font-medium rounded-md
                    ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
```

**File:** `apps/web/src/app/[locale]/developer/page.tsx`
```typescript
import { DeveloperStats } from './components/DeveloperStats';

export default async function DeveloperDashboard() {
  // TODO: Fetch developer data from API
  const stats = {
    totalProjects: 3,
    totalUnits: 450,
    unitsAvailable: 280,
    unitsSold: 170,
    activeLeads: 42,
    salesThisMonth: 12,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your projects and sales
        </p>
      </div>

      <DeveloperStats stats={stats} />

      {/* Projects Overview */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Recent Projects</h2>
        {/* TODO: Project list */}
      </div>

      {/* Recent Leads */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Recent Leads</h2>
        {/* TODO: Lead list */}
      </div>
    </div>
  );
}
```

**File:** `apps/web/src/app/[locale]/developer/components/DeveloperStats.tsx`
```typescript
'use client';

import { Building2, Package, TrendingUp, Users } from 'lucide-react';

interface DeveloperStatsProps {
  stats: {
    totalProjects: number;
    totalUnits: number;
    unitsAvailable: number;
    unitsSold: number;
    activeLeads: number;
    salesThisMonth: number;
  };
}

export function DeveloperStats({ stats }: DeveloperStatsProps) {
  const cards = [
    {
      name: 'Total Projects',
      value: stats.totalProjects,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Units',
      value: stats.totalUnits,
      icon: Package,
      color: 'bg-green-500',
    },
    {
      name: 'Units Sold',
      value: stats.unitsSold,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      name: 'Active Leads',
      value: stats.activeLeads,
      icon: Users,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.name} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className={`${card.color} rounded-lg p-3`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {card.name}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**Translations:**
```json
// apps/web/messages/ru.json
{
  "developer": {
    "dashboard": "Панель",
    "projects": "Проекты",
    "leads": "Лиды",
    "team": "Команда",
    "analytics": "Аналитика",
    "settings": "Настройки"
  }
}

// apps/web/messages/uz.json
{
  "developer": {
    "dashboard": "Boshqaruv paneli",
    "projects": "Loyihalar",
    "leads": "Mijozlar",
    "team": "Jamoa",
    "analytics": "Analitika",
    "settings": "Sozlamalar"
  }
}
```

**Acceptance Criteria:**
- ✅ `/developer` route accessible
- ✅ Navigation shows all sections
- ✅ Stats cards display correctly
- ✅ Translations work in RU and UZ

---

### Week 2, Day 1-2: Developer Settings & Onboarding

**File:** `apps/web/src/app/[locale]/developer/settings/page.tsx`
```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const developerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  nameUz: z.string().optional(),
  descriptionRu: z.string().optional(),
  descriptionUz: z.string().optional(),
  phone: z.string().min(10, 'Phone number required'),
  email: z.string().email().optional(),
  website: z.string().url().optional().or(z.literal('')),
  telegram: z.string().optional(),
  city: z.string().min(1, 'City required'),
  licenseNumber: z.string().optional(),
  innTin: z.string().optional(),
});

type DeveloperFormData = z.infer<typeof developerSchema>;

export default function DeveloperSettings() {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeveloperFormData>({
    resolver: zodResolver(developerSchema),
  });

  const onSubmit = async (data: DeveloperFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/developers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Developer profile created successfully!');
      } else {
        throw new Error('Failed to create profile');
      }
    } catch (error) {
      console.error(error);
      alert('Error creating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Developer Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your company profile and settings
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Basic Information</h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Company Name (Russian) *
              </label>
              <input
                type="text"
                {...register('name')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Company Name (Uzbek)
              </label>
              <input
                type="text"
                {...register('nameUz')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Description (Russian)
              </label>
              <textarea
                {...register('descriptionRu')}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Description (Uzbek)
              </label>
              <textarea
                {...register('descriptionUz')}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Contact Information</h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                type="tel"
                {...register('phone')}
                placeholder="+998 90 123 45 67"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Website
              </label>
              <input
                type="url"
                {...register('website')}
                placeholder="https://example.com"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Telegram
              </label>
              <input
                type="text"
                {...register('telegram')}
                placeholder="@username"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Legal Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Legal Information</h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                City *
              </label>
              <select
                {...register('city')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="">Select city</option>
                <option value="Tashkent">Tashkent</option>
                <option value="Samarkand">Samarkand</option>
              </select>
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.city.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                License Number
              </label>
              <input
                type="text"
                {...register('licenseNumber')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                INN/TIN
              </label>
              <input
                type="text"
                {...register('innTin')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

**Acceptance Criteria:**
- ✅ Settings form validates input
- ✅ Can create developer profile
- ✅ Form shows error messages
- ✅ Bilingual fields (RU/UZ) work

---

## Week 3-4: Project & Unit Management

### Week 3, Day 1-2: Projects Backend

**Backend Module:**
```bash
apps/api/src/modules/developer-projects/
├── developer-projects.module.ts
├── developer-projects.controller.ts
├── developer-projects.service.ts
└── dto/
    ├── create-project.dto.ts
    └── update-project.dto.ts
```

**File:** `apps/api/src/modules/developer-projects/developer-projects.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';

@Injectable()
export class DeveloperProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(developerId: string, dto: CreateProjectDto) {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const project = await this.prisma.developerProject.create({
      data: {
        ...dto,
        slug,
        developerId,
      },
    });

    // Update developer stats
    await this.updateDeveloperStats(developerId);

    return project;
  }

  async findAll(developerId: string) {
    return this.prisma.developerProject.findMany({
      where: { developerId },
      include: {
        city: true,
        district: true,
        mahalla: true,
        _count: {
          select: {
            properties: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.developerProject.findUnique({
      where: { id },
      include: {
        city: true,
        district: true,
        mahalla: true,
        images: true,
        videos: true,
        properties: {
          select: {
            id: true,
            unitNumber: true,
            buildingBlock: true,
            price: true,
            unitStatus: true,
            bedrooms: true,
            area: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    return this.prisma.developerProject.update({
      where: { id },
      data: dto,
    });
  }

  async updateStats(projectId: string) {
    const [total, available, reserved, sold] = await Promise.all([
      this.prisma.property.count({
        where: { developerProjectId: projectId },
      }),
      this.prisma.property.count({
        where: {
          developerProjectId: projectId,
          unitStatus: 'AVAILABLE',
        },
      }),
      this.prisma.property.count({
        where: {
          developerProjectId: projectId,
          unitStatus: 'RESERVED',
        },
      }),
      this.prisma.property.count({
        where: {
          developerProjectId: projectId,
          unitStatus: 'SOLD',
        },
      }),
    ]);

    return this.prisma.developerProject.update({
      where: { id: projectId },
      data: {
        unitsTotal: total,
        unitsAvailable: available,
        unitsReserved: reserved,
        unitsSold: sold,
      },
    });
  }

  private async updateDeveloperStats(developerId: string) {
    const totalProjects = await this.prisma.developerProject.count({
      where: { developerId },
    });

    await this.prisma.developer.update({
      where: { id: developerId },
      data: { totalProjects },
    });
  }
}
```

**Endpoint:** `POST /api/developer-projects`

**Acceptance Criteria:**
- ✅ Can create project
- ✅ Project linked to developer
- ✅ Slug auto-generated from name
- ✅ Stats updated automatically

---

Due to character limits, I'll create this as a file. Let me continue with the complete implementation plan.
