# Codebase Analysis: Real Estate Platform v2

## Overview
The codebase is a **TypeScript Monorepo** using **Turborepo** and **pnpm**. It implements a full-stack real estate platform tailored for the Uzbekistan market, featuring specific localization and domain requirements (e.g., currency handling, local address hierarchy).

## detailed Architecture

### 1. Monorepo Structure
- **apps/**:
  - `api`: Backend (NestJS)
  - `web`: Frontend (Next.js 15, React 19)
  - `mobile`: Mobile App (React Native/Expo) - *Presence confirmed by folder, not deeply analyzed*
  - `worker`: Background processing (BullMQ)
- **packages/**:
  - `database`: Shared Prisma client and schema
  - `shared`: Shared Types/DTOs
  - `ui`: Shared React components
  - `config`: Shared configurations

### 2. Backend (NestJS)
- **Entry Point**: `app.module.ts` orchestrates `AuthModule`, `PropertiesModule`, and `UploadModule`.
- **Database**: Uses **Prisma** with **PostgreSQL**.
- **Key Modules**:
  - `Auth`: Handles user roles (USER, AGENT, ADMIN).
  - `Properties`: Manages property listings.
  - `Upload`: Likely handles image uploads (S3/R2 mentioned in requirements).

### 3. Frontend (Next.js)
- **Stack**: Next.js 15 (App Router likely), TailwindCSS.
- **Internationalization**: `messages` directory in `apps/web` suggests `next-intl` or similar setup for RU/UZ support.
- **Styling**: TailwindCSS configured.

### 4. Data Model (Prisma Schema)
The schema is rich and well-structured for real estate:
- **Core Entities**:
  - `User`: Supports multiple roles.
  - `Property`: Extensive fields for specs (floors, area, renovation), location (lat/long, district), and status.
  - `PropertyType`: Covers Apartment, House, Commercial, etc.
  - `ListingType`: Sale, Long/Daily Rent.
- **Agency & Agents**:
  - `Agency`: Profile for real estate agencies.
  - `Agent`: Profile linked to User and Agency, with verification, ratings, and stats.
- **Engagement**:
  - `Favorite`, `RecentlyViewed`, `SavedSearch`.
  - `Conversation`, `Message` for internal chat.
  - `Viewing` for scheduling appointments.
  - `Review` for property and agent ratings.
- **Localization**: `Currency` enum supports `YE` (conditional units) and `UZS`.

## Implementation Status vs. Requirements
- **Phase 1 (Inventory Engine)**:
  - **Auth**: Schema supports it. API module exists.
  - **Add Property**: Schema covers all fields (Location, Specs, Visuals, Pricing).
  - **Image Handling**: `UploadModule` and `PropertyImage` model exist.
- **Phase 2 (Search)**:
  - `SavedSearch` model exists.
  - Filter logic would need to be checked in `PropertiesService` (not viewed yet).
- **Phase 3 (Engagement)**:
  - Messaging (`Conversation`) and Favorites (`Favorite`) are modeled in the database.

## Recommendations
- **Search Implementation**: Ensure search logic (likely in `apps/api/src/modules/properties`) handles the currency conversion and complex filtering efficiently (possibly needing Full Text Search or a dedicated engine like Meilisearch/Typesense if implied by "Advanced Search").
- **Verification**: Verify the frontend "Add Property" wizard flows against the complex schema requirements.
