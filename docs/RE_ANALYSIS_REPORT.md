# Re-Analysis of Codebase

## 1. Executive Summary
The codebase has undergone significant structural updates with the introduction of modular services (`PriceHistory`, `POI`, `Valuation`) and a `PropertyQueryBuilder` pattern. 
- **Currency Support**: Backend infrastructure (`priceUsd` field, DTO updates, QueryBuilder logic) is largely in place. Frontend `AdvancedFilters` is missing the currency toggle UI.
- **Location Hierarchy**: `Mahalla` support is fully implemented in the database and mostly wired up in the backend/frontend logic (search params added, backend search includes it).
- **New Features**: Automated Points of Interest (POI) fetching via OpenStreetMap, Price History tracking, and Analytics services have been added.

## 2. Recent Architectural Changes
### 2.1 Backend Services
- **`PropertyQueryBuilder`**: A new class in `apps/api/src/modules/properties/property-query-builder.ts` now handles the construction of complex Prisma `where` clauses, extracting this logic from `PropertiesService`.
    - **Impact**: Any changes to search logic (like our currency fix) must be done here, not just in the service.
- **`PriceHistoryService`**: Tracks price changes over time (`price_history` table).
    - **Impact**: `PropertiesService.update` now calls this service to record changes when price differs.
- **`POIService`**: Automates fetching nearby amenities (Schools, Metro, etc.) using the Overpass API (OpenStreetMap) when a property is created with coordinates.
    - **Impact**: `PropertiesService.create` triggers this asynchronously.

### 2.2 Frontend Components
- **`AdvancedFilters`**: Still lacks a UI toggle for currency (USD vs UZS). It hardcodes the label `Цена (у.е.)`.
- **`PropertiesPage`**: Updated to handle new search parameters but needs to ensure the `mahalla` and `currency` params are correctly passed to the API.

## 3. Status of "Project Takeover" Fixes
### 3.1 Currency Fixes
- **Backend**:
    - `PropertyQueryBuilder` *was* modified (by me) to include currency conversion logic using `EXCHANGE_RATE_UZS_TO_USD`.
    - `CreatePropertyDto` *was* updated (by me) to include the `priceUsd` field logic indirectly via service/DTOs.
    - `PropertyFilterDto` *was* updated (by me) to include optional `currency`.
- **Frontend**:
    - **MISSING**: The `AdvancedFilters` component does NOT have a currency toggle. Users cannot currently select "UZS" in the filter UI.

### 3.2 Mahalla Fixes
- **Backend**:
    - `Property` model includes `mahalla`.
    - `PropertyQueryBuilder` includes `mahalla` search logic.
- **Frontend**:
    - `AdvancedFilters` was updated (by me) to include the "Mahalla" input field.
    - `PropertiesPage` was updated (by me) to pass the `mahalla` URL query param.

## 4. Recommendations
1.  **Frontend Currency Toggle**: The critical missing piece is the UI in `AdvancedFilters` to let users switch between USD and UZS. This needs to be added to match the backend logic.
2.  **Database Migration**: verify `priceUsd` and `mahalla` columns exist and are populated (migration was stalled/interrupted previously).
3.  **Verify New Services**: Ensure the `POIService` fetch logic doesn't block the main thread or cause timeouts during property creation (it appears to be fire-and-forget, which is good).
