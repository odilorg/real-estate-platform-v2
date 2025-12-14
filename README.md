# Real Estate Platform v2

A modern, full-stack real estate platform for the Uzbekistan market, featuring property listings, developer/agent management, advanced search with filters, and bilingual support (Russian/Uzbek).

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Frontend Structure](#frontend-structure)
- [Internationalization](#internationalization)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Overview

This is a comprehensive real estate platform built with TypeScript monorepo architecture, designed specifically for the Uzbekistan market. The platform enables:

- **Property Owners** to list properties for sale or rent
- **Real Estate Agents** to manage their listings and client relationships
- **Developers** to showcase their construction projects and new buildings
- **Buyers/Renters** to search, filter, and discover properties
- **Agencies** to manage their agents and properties

The platform supports both **Russian** and **Uzbek** languages and includes Uzbekistan-specific features like mahalla (neighborhood) filtering, proximity to metro stations, and local currency (UZS).

## Key Features

### Property Management
- **Multi-type listings**: Apartments, houses, commercial, land
- **Listing types**: Sale, rent, daily rent
- **Market types**: New buildings, secondary market
- **Rich property data**: Floor plans, amenities, images, 360° tours
- **Advanced filters**: Price, area, rooms, floor, district, metro proximity
- **Geo-location search**: Radius-based property discovery

### User Roles & Features
- **Regular Users**: Save searches, create collections, favorite properties, write reviews
- **Agents**: Professional profiles, verified badges, ratings, property portfolio
- **Developers**: Company profiles, project portfolios, team management
- **Agencies**: Multi-agent management, agency branding
- **Admins**: Full platform management, verification, moderation

### Platform Features
- **Bilingual**: Complete Russian/Uzbek translation support
- **Responsive Design**: Mobile-first, works on all devices
- **Authentication**: JWT-based with email/phone verification
- **Phone Authentication**: SMS-based login with Uzbekistan phone format (+998)
- **Search**: Full-text search with Prisma
- **Filters**: 20+ filter criteria including custom Uzbek-specific filters
- **Pagination**: Efficient large dataset handling
- **Reviews & Ratings**: Property, agent, and developer reviews
- **Messaging**: In-platform communication between users
- **Viewing Scheduler**: Book property viewings
- **Comparison**: Side-by-side property comparison (up to 4)
- **Collections**: Organize properties into custom lists
- **Saved Searches**: Save filter criteria and get notifications

## Tech Stack

### Frontend
- **Framework**: Next.js 15.1 (App Router, React Server Components)
- **React**: 19.0 (latest)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Fetch API
- **Internationalization**: next-intl
- **State Management**: React Context + Hooks

### Backend
- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Database ORM**: Prisma 6.x
- **Database**: PostgreSQL 16+
- **Authentication**: Passport.js + JWT
- **Validation**: Zod schemas
- **API Architecture**: RESTful
- **Documentation**: Swagger/OpenAPI (planned)

### Infrastructure & Tools
- **Monorepo**: Turborepo + pnpm workspaces
- **Package Manager**: pnpm 9.x
- **Node**: 20.x LTS
- **Background Jobs**: BullMQ + Redis (worker service)
- **Process Manager**: PM2 (production)
- **Web Server**: Nginx (reverse proxy)
- **Version Control**: Git

### Mobile (In Development)
- **Framework**: React Native
- **Platform**: Expo

### Shared Packages
- **@repo/shared**: DTOs, types, constants, validation schemas
- **@repo/database**: Prisma client and schema
- **@repo/ui**: Shared React components
- **@repo/config**: ESLint, TypeScript configs

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │  Mobile App  │  │ Admin Panel  │      │
│  │  (Next.js)   │  │ (React Native)│  │  (Next.js)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API (HTTP/JSON)
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Backend (NestJS)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Layer (Controllers)                  │   │
│  │  Properties │ Users │ Agents │ Developers │ Auth     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Business Logic (Services)                  │   │
│  │  Validation │ Authorization │ Data Processing        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Data Layer (Prisma ORM)                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  Properties │ Users │ Agents │ Developers │ Reviews        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Background Jobs (Worker Service)                │
│  Email Sending │ Image Processing │ Notifications           │
│                    (BullMQ + Redis)                          │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **Client Request** → Next.js frontend (Server/Client Components)
2. **API Call** → NestJS backend API endpoint
3. **Authentication** → JWT Guard validates token
4. **Validation** → Zod schema validates request DTO
5. **Business Logic** → Service layer processes request
6. **Database Query** → Prisma queries PostgreSQL
7. **Response** → JSON response back to client
8. **State Update** → React state updates, UI re-renders

### Monorepo Architecture

```
root/
├── apps/
│   ├── api/         # NestJS backend (port 3001)
│   ├── web/         # Next.js frontend (port 3000)
│   ├── mobile/      # React Native mobile app
│   └── worker/      # Background job processor
├── packages/
│   ├── shared/      # DTOs, types, constants (shared code)
│   ├── database/    # Prisma schema and client
│   ├── ui/          # Shared React components
│   └── config/      # Shared configs (ESLint, TS)
└── docs/            # Documentation
```

**Why Monorepo?**
- **Code Sharing**: DTOs, types, constants shared between frontend/backend
- **Type Safety**: End-to-end TypeScript types from DB to UI
- **Single Source of Truth**: Database schema drives all types
- **Easier Refactoring**: Changes propagate across packages
- **Simplified Development**: Run all services with one command

## Project Structure

```
real-estate-platform-v2/
├── apps/
│   ├── api/                          # NestJS Backend API
│   │   ├── src/
│   │   │   ├── main.ts               # Application entry point
│   │   │   ├── app.module.ts         # Root module
│   │   │   ├── modules/              # Feature modules
│   │   │   │   ├── auth/             # Authentication (JWT, phone)
│   │   │   │   ├── users/            # User management
│   │   │   │   ├── properties/       # Property CRUD & search
│   │   │   │   ├── agents/           # Agent profiles
│   │   │   │   ├── developers/       # Developer companies
│   │   │   │   ├── agencies/         # Agency management
│   │   │   │   ├── reviews/          # Review system
│   │   │   │   ├── messages/         # Messaging
│   │   │   │   ├── viewings/         # Property viewings
│   │   │   │   └── collections/      # User collections
│   │   │   └── common/               # Shared utilities
│   │   │       ├── guards/           # Auth guards
│   │   │       ├── decorators/       # Custom decorators
│   │   │       └── pipes/            # Validation pipes
│   │   ├── test/                     # E2E tests
│   │   └── package.json
│   │
│   ├── web/                          # Next.js Frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── [locale]/        # Internationalized routes
│   │   │   │   │   ├── page.tsx     # Home page
│   │   │   │   │   ├── properties/  # Property pages
│   │   │   │   │   │   ├── page.tsx              # List
│   │   │   │   │   │   └── [id]/page.tsx         # Detail
│   │   │   │   │   ├── agents/      # Agent pages
│   │   │   │   │   │   ├── page.tsx              # List
│   │   │   │   │   │   └── [id]/page.tsx         # Profile
│   │   │   │   │   ├── developers/  # Developer pages (planned)
│   │   │   │   │   ├── agencies/    # Agency pages
│   │   │   │   │   ├── auth/        # Login/register
│   │   │   │   │   ├── profile/     # User profile
│   │   │   │   │   ├── developer/   # Developer dashboard
│   │   │   │   │   └── collections/ # User collections
│   │   │   │   └── layout.tsx       # Root layout
│   │   │   ├── components/          # React components
│   │   │   │   ├── navbar.tsx
│   │   │   │   ├── footer.tsx
│   │   │   │   ├── property-card.tsx
│   │   │   │   ├── property-list-item.tsx
│   │   │   │   ├── comparison-bar.tsx
│   │   │   │   └── ...
│   │   │   ├── context/             # React Context providers
│   │   │   │   ├── auth-context.tsx
│   │   │   │   └── comparison-context.tsx
│   │   │   └── lib/                 # Utilities
│   │   ├── messages/                # i18n translations
│   │   │   ├── ru.json              # Russian
│   │   │   └── uz.json              # Uzbek
│   │   ├── public/                  # Static assets
│   │   ├── middleware.ts            # Next.js middleware (i18n)
│   │   └── next.config.ts
│   │
│   ├── mobile/                       # React Native Mobile App
│   │   └── (Expo project structure)
│   │
│   └── worker/                       # Background Jobs Worker
│       ├── src/
│       │   ├── queues/               # Job queues
│       │   └── processors/           # Job processors
│       └── package.json
│
├── packages/
│   ├── shared/                       # Shared Code
│   │   ├── src/
│   │   │   ├── dto/                  # Data Transfer Objects
│   │   │   │   └── index.ts          # Zod schemas for validation
│   │   │   ├── types/                # TypeScript types
│   │   │   │   └── index.ts
│   │   │   └── constants/            # Enums and constants
│   │   │       └── index.ts          # Property types, roles, etc.
│   │   └── package.json
│   │
│   ├── database/                     # Prisma Database Package
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Database schema (single source of truth)
│   │   │   ├── migrations/           # Database migrations
│   │   │   └── seed.ts               # Seed data
│   │   ├── src/
│   │   │   └── index.ts              # Exports Prisma client
│   │   └── package.json
│   │
│   ├── ui/                           # Shared UI Components
│   │   ├── src/
│   │   │   └── components/           # shadcn/ui components
│   │   └── package.json
│   │
│   └── config/                       # Shared Configurations
│       ├── eslint-config/            # ESLint config
│       └── typescript-config/        # TypeScript config
│
├── docs/                             # Documentation
│   ├── TASKS.md                      # Implementation checklist
│   ├── SESSION_LOG.md                # Development session logs
│   ├── CONVENTIONS.md                # Coding standards
│   └── AI_INSTRUCTIONS.md            # AI development guidelines
│
├── turbo.json                        # Turborepo configuration
├── pnpm-workspace.yaml               # pnpm workspace configuration
├── package.json                      # Root package.json
└── README.md                         # This file
```

## Database Schema

### Core Models Overview

The database uses PostgreSQL with Prisma ORM. Here are the main models:

#### User Management
- **User**: Core user model with roles (USER, AGENT, DEVELOPER_ADMIN, DEVELOPER_SALES_AGENT, ADMIN)
- **Agent**: Professional agent profiles (one-to-one with User)
- **Developer**: Real estate development companies
- **Agency**: Real estate agencies (many agents)

#### Property Management
- **Property**: Main property listings with extensive fields
  - Basic: title, description, price, currency, type, status
  - Location: address, city, district, mahalla, coordinates, metro distance
  - Details: bedrooms, bathrooms, area, floor, year built
  - Features: parking, balcony, renovation, amenities
  - Relations: owner (User), agent, developer, agency
- **DeveloperProject**: Construction projects (new buildings)

#### Engagement
- **Review**: Property reviews
- **AgentReview**: Agent reviews
- **Favorite**: User's favorite properties
- **Viewing**: Scheduled property viewings
- **Message**: User-to-user messaging
- **Conversation**: Message threads

#### Collections
- **Collection**: User-created property lists
- **CollectionProperty**: Properties in collections

#### Search
- **SavedSearch**: User's saved search criteria with notification preferences

### Key Relationships

```
User ──< Properties (owns many)
User ─── Agent (one-to-one, optional)
User ──< Favorites
User ──< Collections
User ──< SavedSearches
User ──> Developer (many-to-one, optional)

Property ──> User (owner)
Property ──> Agent (optional)
Property ──> Developer (optional)
Property ──> Agency (optional)
Property ──> DeveloperProject (optional)
Property ──< Reviews
Property ──< Favorites

Agent ──> Agency (optional)
Agent ──< Properties
Agent ──< AgentReviews

Developer ──< DeveloperProjects
Developer ──< Properties
Developer ──< Users (team members)

Agency ──< Agents
Agency ──< Properties
```

### Database Indexes

Optimized for common queries:
- Property: type, listingType, city, district, status, featured, createdAt
- User: email (unique), role
- Agent: verified, superAgent
- Developer: verified, featured, slug (unique)

## Getting Started

### Prerequisites

- **Node.js**: 20.x LTS or higher
- **pnpm**: 9.x or higher (`npm install -g pnpm`)
- **PostgreSQL**: 16+ (local or remote)
- **Redis**: Latest (for background jobs)
- **Git**: Latest

### Installation

```bash
# Clone the repository
git clone https://github.com/odilorg/real-estate-platform-v2.git
cd real-estate-platform-v2

# Install dependencies (all workspaces)
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Edit .env files with your configuration
# - DATABASE_URL (PostgreSQL connection string)
# - JWT_SECRET (generate a secure random string)
# - REDIS_URL (if using worker service)
# - NEXT_PUBLIC_API_URL (API base URL for frontend)
```

### Database Setup

```bash
# Navigate to database package
cd packages/database

# Generate Prisma client
pnpm db:generate

# Run migrations (creates all tables)
pnpm db:migrate

# (Optional) Seed database with sample data
pnpm db:seed
```

### Start Development Servers

```bash
# From root directory

# Option 1: Run all services (frontend + backend + worker)
pnpm dev

# Option 2: Run specific services
pnpm --filter api dev      # API only (http://localhost:3001)
pnpm --filter web dev      # Web only (http://localhost:3000)
pnpm --filter worker dev   # Worker only
```

### Access the Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api (Swagger, if enabled)

## Development

### Common Commands

```bash
# Install dependencies
pnpm install

# Run all apps in development mode
pnpm dev

# Build all apps for production
pnpm build

# Lint all code
pnpm lint

# Format code (if Prettier is configured)
pnpm format

# Type check all TypeScript
pnpm typecheck

# Clean all build artifacts and node_modules
pnpm clean
```

### Working with Specific Packages

```bash
# Run commands in specific workspace
pnpm --filter <package-name> <command>

# Examples:
pnpm --filter api dev              # Run API in dev mode
pnpm --filter web build            # Build web app
pnpm --filter @repo/shared build   # Build shared package
pnpm --filter @repo/database db:migrate  # Run migrations

# Add dependency to specific package
pnpm --filter api add express
pnpm --filter web add react-query
pnpm --filter @repo/shared add zod
```

### Database Management

```bash
# Generate Prisma client (after schema changes)
pnpm --filter @repo/database db:generate

# Create a new migration
pnpm --filter @repo/database db:migrate

# Reset database (DESTRUCTIVE - deletes all data)
pnpm --filter @repo/database db:reset

# Open Prisma Studio (GUI for database)
pnpm --filter @repo/database db:studio

# Seed database with sample data
pnpm --filter @repo/database db:seed
```

### Code Generation

When you modify the Prisma schema:

1. **Update schema**: `packages/database/prisma/schema.prisma`
2. **Generate client**: `pnpm --filter @repo/database db:generate`
3. **Create migration**: `pnpm --filter @repo/database db:migrate`
4. **Update DTOs**: `packages/shared/src/dto/index.ts` (if needed)

The Prisma client will auto-generate TypeScript types that flow through:
- Backend services (type-safe queries)
- Shared DTOs (validation schemas)
- Frontend (type-safe API calls)

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**
   - Backend: `apps/api/src/modules/`
   - Frontend: `apps/web/src/`
   - Shared types: `packages/shared/src/`
   - Database: `packages/database/prisma/schema.prisma`

3. **Test your changes**
   ```bash
   pnpm dev  # Test locally
   ```

4. **Lint and type check**
   ```bash
   pnpm lint
   pnpm typecheck
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

## API Documentation

### Base URLs

- **Development**: `http://localhost:3001/api`
- **Staging**: `https://staging.jahongir-app.uz/api`
- **Production**: `https://api.jahongir-app.uz` (when deployed)

### Authentication

Most endpoints use JWT authentication via Bearer token:

```bash
# Login to get token
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}

# Use token in subsequent requests
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Main Endpoints

#### Properties
- `GET /api/properties` - List properties (with filters, pagination)
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties` - Create property (auth required)
- `PUT /api/properties/:id` - Update property (auth required)
- `DELETE /api/properties/:id` - Delete property (auth required)

#### Users
- `GET /api/users/me` - Get current user (auth required)
- `PUT /api/users/me` - Update current user (auth required)

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/phone/request` - Request phone verification
- `POST /api/auth/phone/verify` - Verify phone code

#### Agents
- `GET /api/agents` - List all agents (public)
- `GET /api/agents/:id` - Get agent profile (public)
- `POST /api/agents/register` - Register as agent (auth required)
- `PUT /api/agents/me` - Update own profile (auth required)

#### Developers
- `GET /api/developers` - List all developers (public)
- `GET /api/developers/slug/:slug` - Get developer by slug (public)
- `POST /api/developers` - Create developer (admin only)
- `PUT /api/developers/:id` - Update developer (auth required)

#### Reviews
- `GET /api/reviews?propertyId=xxx` - Get reviews for property
- `POST /api/reviews` - Create review (auth required)

For detailed API documentation, see the Swagger docs at `/api` when running the API server.

## Frontend Structure

### Routing (Next.js App Router)

The frontend uses Next.js 15's App Router with internationalized routes:

```
/[locale]/                    → Home page
/[locale]/properties          → Property listing
/[locale]/properties/[id]     → Property detail
/[locale]/agents              → Agents listing
/[locale]/agents/[id]         → Agent profile
/[locale]/developers          → Developers listing (planned)
/[locale]/developers/[slug]   → Developer profile (planned)
/[locale]/agencies            → Agencies listing
/[locale]/agencies/[slug]     → Agency profile
/[locale]/auth/login          → Login page
/[locale]/auth/register       → Register page
/[locale]/profile             → User profile (auth required)
/[locale]/collections         → User collections (auth required)
```

**Locale Support**: `ru` (Russian), `uz` (Uzbek)
- Russian: `/` (default, no prefix)
- Uzbek: `/uz/`

### Component Organization

- **Pages**: `apps/web/src/app/[locale]/*/page.tsx` (route components)
- **Layouts**: `apps/web/src/app/[locale]/*/layout.tsx` (shared layouts)
- **Components**: `apps/web/src/components/*.tsx` (reusable components)
- **Context**: `apps/web/src/context/*.tsx` (global state providers)

### State Management

- **Global Auth**: `AuthContext` (user, login, logout)
- **Comparison**: `ComparisonContext` (property comparison, localStorage-backed)
- **Local State**: React `useState` and `useReducer` hooks
- **Server State**: React Server Components (RSC) for data fetching

### Styling

- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built accessible components (built on Radix UI)
- **Custom Components**: `@repo/ui` package for shared components

## Internationalization

The platform supports **Russian** and **Uzbek** languages using `next-intl`.

### Adding Translations

1. **Add keys to translation files**:
   - Russian: `apps/web/messages/ru.json`
   - Uzbek: `apps/web/messages/uz.json`

   ```json
   // ru.json
   {
     "home": {
       "title": "Недвижимость в Узбекистане",
       "search": "Поиск"
     }
   }
   ```

2. **Use in components**:
   ```tsx
   import { useTranslations } from 'next-intl';

   export default function HomePage() {
     const t = useTranslations('home');
     return <h1>{t('title')}</h1>;
   }
   ```

### Locale Switching

Users can switch languages via the navbar. The locale is stored in the URL path.

## Testing

### Unit Tests (Backend)

```bash
# Run all tests
pnpm --filter api test

# Run tests in watch mode
pnpm --filter api test:watch

# Run tests with coverage
pnpm --filter api test:cov
```

### E2E Tests (Backend)

```bash
pnpm --filter api test:e2e
```

### Frontend Tests (if configured)

```bash
pnpm --filter web test
```

## Deployment

### Backend Deployment (API + Worker)

**Using PM2 on VPS**:

```bash
# SSH into server
ssh -i /path/to/key -p 2222 root@62.72.22.205

# Navigate to project
cd /var/www/realestate-staging

# Pull latest code
git pull origin main

# Install dependencies
pnpm install

# Build packages in order
pnpm --filter @repo/shared build
pnpm --filter @repo/database build
pnpm --filter api build
pnpm --filter worker build

# Run migrations (if needed)
pnpm --filter @repo/database db:migrate

# Restart services with PM2
pm2 restart realestate-staging-api
pm2 restart realestate-staging-worker

# Check status
pm2 status
pm2 logs realestate-staging-api
```

**PM2 Ecosystem File** (example):

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'realestate-api',
      script: './apps/api/dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'realestate-worker',
      script: './apps/worker/dist/index.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

### Frontend Deployment (Next.js)

**Using Vercel** (recommended for Next.js):

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Using PM2** (on VPS):

```bash
# Build Next.js app
pnpm --filter web build

# Start with PM2
pm2 start npm --name "realestate-web" -- start

# Or use standalone mode
pm2 start apps/web/.next/standalone/server.js --name "realestate-web"
```

### Environment Variables (Production)

Required environment variables for production:

**Backend** (`apps/api/.env`):
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/realestate_prod
JWT_SECRET=<strong-secret-key>
JWT_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
```

**Frontend** (`apps/web/.env`):
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Nginx Configuration (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name staging.jahongir-app.uz;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Contributing

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for TypeScript, React, Next.js
- **Naming Conventions**:
  - Components: PascalCase (`PropertyCard.tsx`)
  - Files: kebab-case (`property-card.tsx`)
  - Functions: camelCase (`getUserById`)
  - Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)

### Git Workflow

1. Create feature branch from `main`
2. Make changes and commit with descriptive messages
3. Push to origin
4. Create Pull Request
5. Code review
6. Merge to `main`

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:
- `feat(properties): add metro distance filter`
- `fix(auth): resolve JWT expiration bug`
- `docs(readme): update installation instructions`

### Documentation

- Update README when adding major features
- Document complex business logic with comments
- Keep API documentation in sync with code
- Update `docs/TASKS.md` with completed tasks

## Project Status

### Completed Features
- ✅ User authentication (email/password + phone)
- ✅ Property CRUD with advanced filters
- ✅ Agent profiles and listing
- ✅ Agency management
- ✅ Developer dashboard (internal)
- ✅ Reviews and ratings
- ✅ Saved searches and collections
- ✅ Property comparison
- ✅ Messaging system
- ✅ Bilingual support (RU/UZ)

### In Progress
- 🚧 Developer public pages (listing + profile)
- 🚧 Mobile app (React Native)
- 🚧 Advanced analytics dashboard

### Planned Features
- 📋 Payment integration
- 📋 Mortgage calculator
- 📋 Virtual property tours (360°)
- 📋 AI-powered property recommendations
- 📋 Market analytics and insights

## Support

For questions or issues:
- Create an issue in the repository
- Contact the development team

## License

MIT License - see LICENSE file for details

---

**Built with ❤️ for the Uzbekistan real estate market**
