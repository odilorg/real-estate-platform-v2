# Real Estate Platform - Mobile App

React Native mobile application for the Real Estate Platform built with Expo.

## 📱 Tech Stack

- **Framework:** Expo SDK 54
- **Navigation:** Expo Router (file-based routing)
- **Language:** TypeScript
- **API Client:** Axios
- **Shared Code:** @repo/shared (monorepo workspace)

## 🏗️ Project Structure

```
apps/mobile/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Home screen
│   │   ├── search.tsx     # Search screen
│   │   ├── favorites.tsx  # Favorites screen
│   │   └── profile.tsx    # Profile screen
│   ├── auth/              # Authentication screens
│   ├── property/          # Property detail screens
│   └── _layout.tsx        # Root layout
├── src/
│   ├── components/        # Reusable UI components
│   ├── services/          # API services
│   │   └── api.ts         # API client
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript types
│   ├── constants/         # App constants
│   └── hooks/             # Custom React hooks
├── assets/                # Images, fonts
├── app.json               # Expo configuration
├── package.json
└── tsconfig.json

```

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x LTS
- pnpm 8.x
- Expo CLI (`npx expo`)
- iOS Simulator (macOS) or Android Emulator

### Installation

```bash
# From project root
pnpm install

# Or install mobile app dependencies only
pnpm --filter mobile install
```

### Development

```bash
# Start Expo development server
cd apps/mobile
pnpm start

# Run on iOS (requires macOS)
pnpm ios

# Run on Android
pnpm android

# Run on web
pnpm web
```

### Testing with Expo Go

1. Install Expo Go app on your phone
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. Start development server: `pnpm start`

3. Scan QR code with:
   - iOS: Camera app
   - Android: Expo Go app

## 🔌 API Integration

The app connects to the staging API at:
`https://staging.jahongir-app.uz/api`

Configure API URL in `src/services/api.ts`:

```typescript
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://staging.jahongir-app.uz/api';
```

## 📦 Shared Code

The mobile app uses `@repo/shared` from the monorepo for:

- TypeScript types
- DTOs (Data Transfer Objects)
- Validation schemas (Zod)
- Constants

## 🎨 Features (Planned)

### ✅ Completed
- [x] Project setup with Expo
- [x] Navigation structure (tabs)
- [x] Basic screen layout
- [x] API service configuration

### 🚧 In Progress
- [ ] Authentication screens (login, register)
- [ ] Property listing screens
- [ ] Property detail screen
- [ ] Search functionality
- [ ] Favorites management

### 📋 Planned
- [ ] User profile management
- [ ] Property filters
- [ ] Map integration
- [ ] Push notifications
- [ ] Dark mode support
- [ ] Offline mode
- [ ] Image gallery
- [ ] Share property
- [ ] Contact agent/developer

## 🔧 Configuration

### Environment Variables

Create `app.json` extra config:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://staging.jahongir-app.uz/api"
    }
  }
}
```

### TypeScript Paths

Configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@repo/shared": ["../../packages/shared/src"]
    }
  }
}
```

## 📱 Build for Production

### Android

```bash
# Build APK
eas build --platform android --profile preview

# Build AAB for Google Play
eas build --platform android --profile production
```

### iOS

```bash
# Build for TestFlight
eas build --platform ios --profile production
```

## 🐛 Troubleshooting

### Metro bundler issues

```bash
# Clear Metro cache
pnpm start --clear

# Or
npx expo start -c
```

### Module resolution issues

```bash
# Rebuild dependencies
rm -rf node_modules
pnpm install
```

### iOS Simulator not opening

```bash
# Reset iOS Simulator
xcrun simctl erase all
```

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 📞 Support

For issues and questions, contact the development team.

---

**Note:** This mobile app is part of a monorepo. Always run `pnpm install` from the project root to ensure all workspace dependencies are properly linked.
