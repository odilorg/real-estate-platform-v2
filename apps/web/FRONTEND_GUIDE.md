# Frontend Development Guide - Real Estate Platform

**Project**: Real Estate Platform - Next.js Frontend
**Date**: December 8, 2025
**Status**: ✅ Ready for Development

---

## 🎉 Current Status

The frontend application is **already set up** with a modern tech stack and many features implemented!

### Tech Stack ✅

- **Framework**: Next.js 15.0.0 (App Router)
- **React**: 19.0.0 (Latest)
- **TypeScript**: 5.7.2
- **Styling**: TailwindCSS 3.4.17
- **Maps**: Leaflet + React-Leaflet
- **Real-time**: Socket.io Client 4.8.1
- **i18n**: next-intl 4.5.8
- **Testing**: Vitest + React Testing Library
- **UI Components**: Custom `@repo/ui` package

---

## 📁 Project Structure

```
apps/web/
├── src/
│   ├── app/[locale]/          # Next.js App Router pages
│   │   ├── page.tsx           # Home page
│   │   ├── layout.tsx         # Root layout
│   │   ├── auth/              # Authentication pages
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── callback/
│   │   ├── properties/        # Property pages
│   │   │   ├── page.tsx       # List page
│   │   │   ├── [id]/          # Detail page
│   │   │   ├── [id]/edit/     # Edit page
│   │   │   └── new/           # Create page
│   │   ├── compare/           # Compare properties
│   │   ├── mortgage-calculator/
│   │   └── admin/             # Admin panel
│   ├── components/            # React components
│   │   ├── navbar.tsx
│   │   ├── property-list-item.tsx
│   │   ├── image-gallery.tsx
│   │   ├── property-wizard/  # Multi-step property creation
│   │   ├── interactive-map.tsx
│   │   ├── mortgage-calculator.tsx
│   │   └── ... (30+ components)
│   ├── context/               # React Context
│   │   ├── AuthContext.tsx
│   │   ├── ComparisonContext.tsx
│   │   └── Providers.tsx
│   ├── lib/                   # Utilities
│   │   ├── api.ts            # API client
│   │   ├── auth.ts           # Auth functions
│   │   ├── utils.ts          # Helpers
│   │   └── overpass.ts       # POI data
│   ├── i18n/                  # Internationalization
│   │   ├── config.ts
│   │   ├── routing.ts
│   │   └── request.ts
│   └── middleware.ts          # Next.js middleware
├── messages/                  # i18n translations
│   ├── en.json
│   └── uz.json
├── test/                      # Tests
├── .env.local                 # Environment variables (created)
├── .env.example               # Example env file (created)
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd /home/odil/projects/real-estate-platform-v2
pnpm install
```

### 2. Configure Environment Variables

The `.env.local` file has been created. Update it with your credentials:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Frontend URL
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# Google OAuth (Optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Map Configuration
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token

# Socket.io
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 3. Start the Backend API

```bash
# In one terminal
cd apps/api
pnpm dev
```

The API will run on http://localhost:3001

### 4. Start the Frontend

```bash
# In another terminal
cd apps/web
pnpm dev
```

The frontend will run on http://localhost:3000

---

## 🎨 What's Already Built

### ✅ Authentication System
**Location**: `src/app/[locale]/auth/`

**Features**:
- Login page (`/auth/login`)
- Registration page (`/auth/register`)
- OAuth callback page (`/auth/callback`)
- Auth context with JWT token management
- Protected routes
- User session persistence

**Components**:
- `src/context/AuthContext.tsx` - Global auth state
- `src/lib/auth.ts` - Auth API functions
- Token stored in localStorage
- Automatic token refresh

### ✅ Property Features
**Location**: `src/app/[locale]/properties/`

**Pages**:
1. **List Page** (`/properties`)
   - Property search and filtering
   - Advanced filters component
   - Pagination
   - Map view option

2. **Detail Page** (`/properties/[id]`)
   - Property information
   - Image gallery
   - Location map
   - Nearby POIs
   - Price history chart
   - Mortgage calculator
   - Contact owner

3. **Create Page** (`/properties/new`)
   - Multi-step wizard
   - Property type selection
   - Location picker with map
   - Basic information
   - Building features
   - Photos & description
   - Review and submit

4. **Edit Page** (`/properties/[id]/edit`)
   - Update existing property
   - Same wizard as create

**Components**:
- `property-list-item.tsx` - Property card
- `property-detailed-info.tsx` - Full details
- `property-wizard/` - Multi-step form
- `image-gallery.tsx` - Photo viewer
- `property-location-map.tsx` - Interactive map
- `nearby-pois.tsx` - Points of interest
- `price-history-chart.tsx` - Price trends
- `property-amenities.tsx` - Features list

### ✅ Comparison Feature
**Location**: `src/app/[locale]/compare/`

**Features**:
- Compare up to 3 properties side-by-side
- Persistent comparison bar
- Global comparison context
- Add/remove properties
- View detailed comparison

**Components**:
- `comparison-bar.tsx` - Floating action bar
- `src/context/ComparisonContext.tsx` - State management

### ✅ Mortgage Calculator
**Location**: `src/app/[locale]/mortgage-calculator/`

**Features**:
- Standalone mortgage calculator page
- Embeddable calculator card
- Advanced options (down payment, interest rate, term)
- Monthly payment calculation
- Total interest calculation
- Amortization details

**Components**:
- `mortgage-calculator.tsx` - Full calculator
- `mortgage-calculator-card.tsx` - Compact version
- `mortgage-calculator-advanced.tsx` - Detailed options

### ✅ Maps & Location
**Technology**: Leaflet + OpenStreetMap

**Features**:
- Interactive property map
- Location picker for creating properties
- Nearby POI display
- Custom markers
- Zoom controls
- Search location

**Components**:
- `interactive-map.tsx` - Main map component
- `property-map.tsx` - Property marker display
- `location-picker.tsx` - Location selection
- `src/lib/overpass.ts` - POI data fetching

### ✅ Admin Panel
**Location**: `src/app/[locale]/admin/`

**Status**: Page exists, needs implementation
**Planned Features**:
- User management
- Property moderation
- Analytics dashboard
- System settings

### ✅ Navigation & Layout
**Components**:
- `navbar.tsx` - Main navigation
- `src/app/[locale]/layout.tsx` - Root layout
- `language-switcher.tsx` - i18n toggle

**Features**:
- Responsive design
- User menu
- Language selection (English/Uzbek)
- Mobile-friendly

### ✅ Image Handling
**Components**:
- `image-uploader.tsx` - Drag & drop upload
- `image-gallery.tsx` - Photo viewer with lightbox

**Features**:
- Multiple file upload
- Drag and drop
- Preview before upload
- Primary image selection
- Image reordering

### ✅ Internationalization (i18n)
**Languages**: English, Uzbek (Cyrillic)

**Files**:
- `messages/en.json`
- `messages/uz.json`

**Routes**:
- English: `/en/...`
- Uzbek: `/uz/...`

**Usage**:
```tsx
import { useTranslations } from 'next-intl';

const t = useTranslations('PropertyList');
<h1>{t('title')}</h1>
```

---

## 🔗 API Integration

### API Client
**File**: `src/lib/api.ts`

**Usage**:
```typescript
import { api } from '@/lib/api';

// GET request
const properties = await api.get('/properties');

// POST request
const property = await api.post('/properties', propertyData);

// PUT request
await api.put(`/properties/${id}`, updateData);

// DELETE request
await api.delete(`/properties/${id}`);
```

**Features**:
- Automatic JWT token injection
- Error handling
- TypeScript support
- Request/response typing from `@repo/shared`

### Authentication
**File**: `src/lib/auth.ts`

**Functions**:
```typescript
// Login
await login({ email, password });

// Register
await register({ email, password, firstName, lastName });

// Get current user
const user = await getMe();

// Logout
logout();

// Check authentication
if (isAuthenticated()) { ... }

// Get token
const token = getToken();
```

---

## 🧪 Testing

### Run Tests

```bash
# Run tests
pnpm test

# Run with UI
pnpm test:ui

# Run with coverage
pnpm test:coverage
```

### Test Files
**Location**: `src/components/__tests__/`

**Example**: `property-list-item.test.tsx`

---

## 🎨 Styling with TailwindCSS

### Configuration
**File**: `tailwind.config.ts`

**Usage**:
```tsx
<div className="container mx-auto px-4">
  <h1 className="text-3xl font-bold text-gray-900">
    Title
  </h1>
  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
    Click me
  </button>
</div>
```

### Utilities
**File**: `src/lib/utils.ts`

```typescript
import { cn } from '@/lib/utils';

<div className={cn("base-class", isActive && "active-class")} />
```

---

## 📦 Shared Packages

### @repo/shared
**Location**: `packages/shared/`

**Exports**:
- DTOs (Data Transfer Objects)
- Types
- Validation schemas (Zod)
- Constants

**Usage**:
```typescript
import { PropertyFilterDto, Currency, PropertyType } from '@repo/shared';
```

### @repo/ui
**Location**: `packages/ui/`

**Components**: (to be implemented)
- Buttons
- Inputs
- Cards
- Modals
- etc.

---

## 🔄 Real-time Features (Socket.io)

### Configuration
**Installed**: socket.io-client@4.8.1

**Usage** (to be implemented):
```typescript
import { io } from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

socket.on('newMessage', (message) => {
  // Handle new message
});
```

---

## 📝 What Needs Implementation

### High Priority

1. **Dashboard Pages**
   - User dashboard
   - Agent dashboard
   - Property owner dashboard
   - Favorites page
   - Saved searches page
   - Viewing requests page

2. **Messaging System**
   - Chat interface
   - Conversation list
   - Real-time notifications
   - Socket.io integration

3. **Agent & Agency Pages**
   - Agent profiles
   - Agent listings
   - Agency pages
   - Agent directory

4. **Review System**
   - Property reviews
   - Agent reviews
   - Rating display
   - Review forms

5. **Admin Panel**
   - User management
   - Property moderation
   - Analytics
   - System settings

### Medium Priority

6. **User Profile**
   - Profile page
   - Edit profile
   - Change password
   - Notification settings

7. **Advanced Search**
   - Saved searches
   - Search alerts
   - Map-based search
   - Nearby search

8. **Social Features**
   - Share properties
   - Property views tracking
   - Recently viewed

### Low Priority

9. **Email Notifications**
   - Property matches
   - New messages
   - Viewing confirmations

10. **Mobile App** (Future)
    - React Native app
    - Uses same backend API

---

## 🏗️ Development Workflow

### 1. Create a New Page

```bash
# Create page file
touch src/app/[locale]/my-page/page.tsx
```

```tsx
// src/app/[locale]/my-page/page.tsx
import { useTranslations } from 'next-intl';

export default function MyPage() {
  const t = useTranslations('MyPage');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
    </div>
  );
}
```

### 2. Create a Component

```bash
# Create component file
touch src/components/my-component.tsx
```

```tsx
// src/components/my-component.tsx
'use client';

import { useState } from 'react';

export function MyComponent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### 3. Add API Integration

```typescript
// src/lib/properties.ts
import { api } from './api';
import type { Property } from '@repo/shared';

export async function getProperties(): Promise<Property[]> {
  return api.get<Property[]>('/properties');
}

export async function getProperty(id: string): Promise<Property> {
  return api.get<Property>(`/properties/${id}`);
}
```

### 4. Add Translations

```json
// messages/en.json
{
  "MyPage": {
    "title": "My Page Title",
    "description": "Page description"
  }
}
```

---

## 🐛 Debugging

### Check API Connection

```typescript
// Test in browser console
fetch('http://localhost:3001/api/properties')
  .then(r => r.json())
  .then(console.log);
```

### Check Authentication

```typescript
// Browser console
localStorage.getItem('token');
```

### Next.js Dev Tools

- **React Dev Tools**: Install browser extension
- **Next.js Dev**: Built-in (shows at bottom of page)

---

## 📚 Useful Commands

```bash
# Development
pnpm dev           # Start dev server
pnpm build         # Build for production
pnpm start         # Start production server

# Code Quality
pnpm lint          # Run ESLint
pnpm typecheck     # TypeScript check

# Testing
pnpm test          # Run tests
pnpm test:ui       # Test UI
pnpm test:coverage # Coverage report
```

---

## 🔐 Authentication Flow

1. User visits `/auth/login`
2. Submits credentials
3. `login()` function calls API
4. API returns JWT token
5. Token saved to localStorage
6. AuthContext updates with user data
7. User redirected to dashboard
8. Token included in all API requests
9. On page refresh, token validated via `getMe()`

---

## 🗺️ Map Configuration

### Get Mapbox Token (Free)

1. Visit https://www.mapbox.com/
2. Sign up for free account
3. Create access token
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
   ```

**Note**: Leaflet with OpenStreetMap works without token, but Mapbox provides better features.

---

## 📱 Responsive Design

All pages use Tailwind responsive utilities:

```tsx
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Full width on mobile, half on tablet, third on desktop */}
</div>
```

Breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

---

## 🎯 Next Steps

1. ✅ **Environment configured** - `.env.local` created
2. ✅ **Dependencies installed** - `pnpm install`
3. 🔄 **Start backend** - `cd apps/api && pnpm dev`
4. 🔄 **Start frontend** - `cd apps/web && pnpm dev`
5. 🔄 **Open browser** - http://localhost:3000
6. 🚀 **Start building!**

### Recommended Development Order:

1. **User Dashboard** - Show user's properties, favorites, messages
2. **Messaging System** - Real-time chat with property inquiries
3. **Reviews** - Add property and agent reviews
4. **Agent Features** - Agent profiles and directory
5. **Admin Panel** - Complete admin functionality

---

## 📞 Support

- **Backend API Docs**: See `apps/api/TESTING_PROGRESS.md`
- **Test Coverage**: 37.75% (389 passing tests)
- **Backend Status**: ✅ Production-ready with comprehensive tests

---

**Last Updated**: December 8, 2025
**Status**: ✅ Ready for Active Development
**Next Phase**: Build User Dashboard & Messaging
