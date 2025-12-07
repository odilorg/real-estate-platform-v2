# Deep Code Audit Report

## 1. Executive Summary
The codebase is structured well and follows modern practices (NestJS, Next.js, Turborepo). However, a deep audit reveals **critical gaps** between the "MVP Feature Plan" requirements and the current implementation, specifically regarding **Currency Handling** and **Location Hierarchy**.

## 2. Gap Analysis: Requirements vs. Implementation

### 2.1 Currency Handling (Critical)
- **Requirement**: "Input: Amount + Currency Toggle (USD/UZS). Logic: Store as entered, but backend handles conversion rates for search."
- **Implementation State**:
  - **Database**: `Currency` enum exists in Prisma schema.
  - **DTO (`CreatePropertyDto`)**: **MISSING**. The DTO only has `price` (number). There is no field to specify the currency of the input price.
  - **Search Logic (`PropertiesService`)**: **BROKEN**. The `findAll` method compares `minPrice`/`maxPrice` directly against the `price` column without any conversion logic. If a user lists a property for 50,000 (USD) and another for 500,000,000 (UZS), the search filter will treat these numbers as being on the same scale.

### 2.2 Location Hierarchy (Moderate)
- **Requirement**: "Location: Deep hierarchy support: City -> District (Tuman) -> Neighborhood (Mahalla)."
- **Implementation State**:
  - **Schema**: Has `city` and `district`. **MISSING** `mahalla` or `neighborhood` field.
  - **DTO**: Has `city` and `district` (optional strings).
  - **Search**: Supports City and District filtering, but no Mahalla support.

### 2.3 Frontend "Add Property" (Verification Needed)
- The frontend (likely `apps/web/src/app/[locale]/properties/new`) needs to be checked to see if it even offers a currency toggle. If it does, the backend will reject it or ignore it due to the DTO mismatch.

### 2.4 Security & Code Quality
- **DTO Validation**: Used `zod` which is good. Validation rules seem reasonable (e.g., `positive()` for price).
- **Hardcoded Secrets**: `.env.example` is present. Code seems to use `ConfigModule` correctly.
- **Auth**: Guards (`JwtAuthGuard`) are applied to critical endpoints (`create`, `update`, `remove`).

## 3. Recommendations
1.  **Update Database Schema**:
    - Add `currency` field to `Property` model.
    - Add `mahalla` field to `Property` model.
2.  **Update DTOs**:
    - Add `currency` enum to `CreatePropertyDto`.
    - Add `mahalla` string to `CreatePropertyDto`.
3.  **Refactor Search Logic**:
    - Implement a `currency` aware search. Either normalize all prices to USD in a hidden column (`priceUsd`) on save, or perform dynamic conversion in the query (harder with Prisma). *Recommended: Store `priceUsd` for search indexing.*
4.  **Update Frontend**:
    - Ensure currency toggle passes the correct enum value.
