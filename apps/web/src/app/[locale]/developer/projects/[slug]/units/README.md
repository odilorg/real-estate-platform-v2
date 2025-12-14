# Unit Management UI

Complete unit management interface for developer projects.

## Overview

This module provides a full-featured interface for managing property units within developer projects. It includes filtering, CRUD operations, bulk upload, and status management.

## Features

### 1. Unit List Page (`page.tsx`)
- **Path**: `/developer/projects/[slug]/units`
- **Features**:
  - Displays all units in a paginated table (50 per page)
  - Quick stats cards (Total, Available, Reserved, Sold)
  - Advanced filtering by status, floor, bedrooms, price
  - Search by unit number
  - Responsive design with mobile support

### 2. Filters (`UnitFilters.tsx`)
- **Status dropdown**: All, Available, Reserved, Sold, Handed Over
- **Floor range**: Min/Max inputs
- **Bedrooms**: Checkboxes (Studio, 1BR, 2BR, 3BR, 4BR, 5+BR)
- **Price range**: Min/Max inputs
- **Search**: Unit number search
- **Clear filters** button (appears when filters are active)

### 3. Unit Table (`UnitTable.tsx`)
- **Columns**:
  - Unit Number (with block info)
  - Floor
  - Bedrooms (shows "Studio" for 0)
  - Bathrooms
  - Area (m²)
  - Price (with currency and payment plan indicator)
  - Status (colored badge)
  - Actions (Edit, Change Status, Delete)

- **Row Actions**:
  - Edit button → Opens EditUnitModal
  - Status dropdown → Quick status change
  - Delete button → Confirmation + API call

### 4. Create Unit Modal (`CreateUnitModal.tsx`)
- **Form Fields**:
  - **Required**: Unit Number, Floor, Bedrooms, Bathrooms, Area, Price, Currency
  - **Optional**: Block, Entrance, Living Area, Kitchen Area
  - **Payment Plan**: Checkbox to enable, then shows Down Payment % and Installment Months

- **Validation**: Uses Zod schema
- **API**: `POST /developer-projects/{projectId}/units`

### 5. Edit Unit Modal (`EditUnitModal.tsx`)
- Same form as CreateUnitModal
- Pre-populated with current unit data
- **API**: `PUT /developer-projects/{projectId}/units/{unitId}`

### 6. Bulk Upload Modal (`BulkUploadModal.tsx`)
- **CSV Upload**: Drag & drop or click to upload
- **Template Download**: Provides CSV template with headers and examples
- **Preview**: Shows first 10 rows before upload
- **Validation**: Client-side parsing with error display
- **Upload Result**: Shows success/failed count with detailed errors
- **API**: `POST /developer-projects/{projectId}/units/bulk`

**CSV Template**:
```csv
unitNumber,floor,bedrooms,bathrooms,area,price,block,entrance,currency
101,1,2,1,65,75000,A,1,UZS
102,1,3,2,85,95000,A,1,UZS
```

### 7. Status Management
- **Status Badge** (`UnitStatusBadge.tsx`): Color-coded status display
  - AVAILABLE: Green
  - RESERVED: Yellow
  - SOLD: Red
  - HANDED_OVER: Blue

- **Status Actions** (`UnitActions.tsx`): Dropdown for quick status change
  - Shows all status options with icons
  - Current status is highlighted
  - **API**: `PATCH /developer-projects/{projectId}/units/{unitId}/status`

### 8. Data Fetching Hook (`useUnits.ts`)
- Custom React hook for fetching units
- Handles filters, pagination, loading, error states
- Provides `refetch()` method for manual refresh
- **API**: `GET /developer-projects/{projectId}/units?filters`

## File Structure

```
units/
├── page.tsx                      # Main unit list page
├── components/
│   ├── UnitTable.tsx            # Table with unit rows
│   ├── UnitFilters.tsx          # Filter controls
│   ├── CreateUnitModal.tsx      # Create unit form
│   ├── EditUnitModal.tsx        # Edit unit form
│   ├── BulkUploadModal.tsx      # CSV upload
│   ├── UnitStatusBadge.tsx      # Status badge display
│   └── UnitActions.tsx          # Status dropdown menu
├── hooks/
│   └── useUnits.ts              # Data fetching hook
└── README.md                    # This file
```

## API Integration

All components integrate with the backend API at `http://localhost:3001`:

### Endpoints Used
1. `GET /developer-projects/{projectId}/units` - List units with filters
2. `POST /developer-projects/{projectId}/units` - Create single unit
3. `PUT /developer-projects/{projectId}/units/{id}` - Update unit
4. `DELETE /developer-projects/{projectId}/units/{id}` - Delete unit
5. `PATCH /developer-projects/{projectId}/units/{id}/status` - Change status
6. `POST /developer-projects/{projectId}/units/bulk` - Bulk upload

### Query Parameters (for GET)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `status`: Filter by status
- `floorMin`, `floorMax`: Floor range
- `bedrooms`: Array of bedroom counts
- `priceMin`, `priceMax`: Price range
- `search`: Unit number search

## Dependencies

- **react-dropzone**: File upload UI
- **zod**: Form validation
- **lucide-react**: Icons
- **next-intl**: Internationalization
- **react-hook-form** (optional): Could be added for form management

## Usage

### Navigate to Units Page
1. Go to Project Detail page: `/developer/projects/[slug]`
2. Click "Units" tab
3. Click "Go to Units Page" button
4. Or directly navigate to: `/developer/projects/[slug]/units`

### Create Single Unit
1. Click "Add Unit" button
2. Fill in required fields
3. Optionally enable payment plan
4. Click "Create Unit"

### Bulk Upload Units
1. Click "Bulk Upload" button
2. Download CSV template
3. Fill template with unit data
4. Upload CSV file
5. Review preview
6. Click "Upload Units"

### Edit Unit
1. Click Edit icon on any row
2. Update fields
3. Click "Update Unit"

### Change Status
1. Click More (⋮) icon on any row
2. Select new status from dropdown
3. Status updates immediately

### Delete Unit
1. Click Delete (trash) icon
2. Confirm deletion
3. Unit removed from list

## Responsive Design

- **Desktop**: Full table with all columns
- **Tablet**: Horizontal scroll for table
- **Mobile**: Optimized for touch, stacked filters

## Color Scheme

Follows existing developer CRM design:
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Error: Red (#EF4444)
- Info: Blue (#3B82F6)

## Loading States

- Skeleton loaders for table
- Spinner for modals during submission
- Disabled buttons during async operations

## Error Handling

- Form validation errors shown under fields
- API errors shown as alerts
- Network errors caught and displayed
- Bulk upload errors listed per row

## Future Enhancements

### Possible Improvements
1. **Export to CSV**: Download units as CSV
2. **Unit Images**: Upload floor plan images
3. **Unit History**: Track status changes over time
4. **Advanced Search**: Search by multiple criteria
5. **Saved Filters**: Save frequently used filter combinations
6. **Print View**: Printable unit list
7. **Unit Comparison**: Compare multiple units side-by-side
8. **Real-time Updates**: WebSocket for live status changes
9. **Unit Analytics**: Charts showing sales progress
10. **Duplicate Unit**: Quick create based on existing unit

### Performance Optimizations
1. Virtual scrolling for large datasets (1000+ units)
2. Debounced search input
3. Memoized filter components
4. Optimistic UI updates for status changes
5. Background bulk upload processing

## Testing

To test the UI:

1. **Start backend**: `cd apps/api && npm run start:dev`
2. **Start frontend**: `cd apps/web && npm run dev`
3. **Navigate to**: `http://localhost:3000/developer/projects/[project-slug]/units`
4. **Test scenarios**:
   - Create unit via form
   - Create units via CSV upload (use template)
   - Edit unit details
   - Change unit status
   - Delete unit
   - Filter by different criteria
   - Pagination with large dataset

## Notes

- **Authorization**: Add JWT token to API calls (TODO comments in code)
- **Translations**: Add i18n keys for all UI text (currently hardcoded English)
- **Validation**: Client-side validation matches backend DTOs
- **Accessibility**: Add ARIA labels for screen readers
- **Analytics**: Track user actions (create, edit, delete, status change)

## Support

For issues or questions:
- Check backend API docs for endpoint details
- Review backend unit tests for expected behavior
- Ensure backend is running on port 3001
