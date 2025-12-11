# Real Estate Platform v2 - Development Context

**Last Updated:** December 11, 2025
**Current Feature:** Phone Authentication with SMS OTP

---

## 🖥️ VPS & Environment Setup

### VPS Details
- **Host:** 62.72.22.205
- **Port:** 2222
- **User:** root
- **SSH Key:** `/home/odil/projects/id_rsa`

### SSH Command
```bash
ssh -i /home/odil/projects/id_rsa -p 2222 root@62.72.22.205
```

### ⚠️ CRITICAL: Development Workflow

**WE WORK DIRECTLY ON THE VPS SERVER, NOT LOCALLY!**

This is the established development workflow:
- **Primary development environment:** VPS at `/var/www/realestate-staging`
- **Changes are made, tested, and deployed directly on VPS**
- **Local environment** (`/home/odil/projects/real-estate-platform-v2`) is used only for:
  - Git operations (commit, push)
  - Code editing when convenient
  - Quick reference

**Typical Workflow:**
1. SSH to VPS: `ssh -i /home/odil/projects/id_rsa -p 2222 root@62.72.22.205`
2. Make changes on VPS at `/var/www/realestate-staging`
3. Test directly on staging: https://staging.jahongir-app.uz
4. When satisfied, commit locally and push to git
5. Pull changes on VPS to keep in sync

**DO NOT assume local testing is required. VPS is the primary dev environment.**

### Environment Structure

1. **Local Repository** (Git operations only)
   - Path: `/home/odil/projects/real-estate-platform-v2`
   - Used for: Git commits, code editing, quick reference
   - Branch: `develop`

2. **VPS Staging = Primary Development Environment**
   - Path: `/var/www/realestate-staging`
   - Domain: https://staging.jahongir-app.uz
   - Git branch: `develop`
   - Managed by PM2: `realestate-staging-api` and `realestate-staging-web`
   - **This is where we develop, test, and iterate**

---

## 📦 Project Structure

```
real-estate-platform-v2/
├── apps/
│   ├── api/          # NestJS backend (port 3001)
│   └── web/          # Next.js frontend (port 3000)
├── packages/
│   ├── database/     # Prisma schema & migrations
│   ├── shared/       # Shared types & DTOs
│   └── ui/           # Shared UI components
└── .github/
    └── workflows/    # CI/CD pipelines
```

---

## 🔄 Git & CI/CD Setup

### Repository
- **GitHub:** https://github.com/odilorg/real-estate-platform-v2.git
- **Local Branch:** `feature/phone-authentication`
- **Staging Branch:** `develop`
- **Production Branch:** `main` (not used yet)

### CI/CD Workflow

```mermaid
graph LR
A[Push to develop] --> B[CI Pipeline]
B --> C[Lint & Typecheck]
C --> D[Run Tests]
D --> E{Tests Pass?}
E -->|Yes| F[Deploy to Staging]
E -->|No| G[Deployment Blocked]
F --> H[Pull on VPS]
H --> I[Build & Restart PM2]
```

### GitHub Actions Files
1. **`.github/workflows/ci.yml`** - Runs lint, typecheck, and tests
2. **`.github/workflows/deploy-staging.yml`** - Auto-deploys to staging after CI passes

### Deployment Process
1. Commit changes locally
2. Push to `develop` branch on GitHub
3. CI pipeline runs automatically
4. If tests pass → Auto-deploy to staging
5. VPS pulls code, builds, and restarts PM2 services

---

## 🎯 Current Feature: Phone Authentication

### What We Built

**Backend (NestJS):**
- ✅ Database schema updates (User, OtpCode models)
- ✅ OTP Service with rate limiting & brute force protection
- ✅ SMS Service with Eskiz integration (Uzbekistan SMS provider)
- ✅ Auth endpoints for phone registration & login
- ✅ Phone auth DTOs with validation

**Frontend (Next.js):**
- ✅ PhoneInput component (auto-formatting +998 XX XXX XX XX)
- ✅ OtpInput component (6-digit code entry)
- ✅ LoginModal & RegisterModal components
- ✅ Navbar integration with modal triggers
- ✅ Russian & Uzbek translations

### Key Files Modified

**Backend:**
```
apps/api/src/modules/
├── otp/
│   ├── otp.module.ts
│   └── otp.service.ts
├── sms/
│   └── sms.service.ts (added Eskiz provider)
└── auth/
    ├── auth.controller.ts (5 new endpoints)
    ├── auth.service.ts (3 new methods)
    └── auth.module.ts

packages/database/prisma/schema.prisma (User & OtpCode models)
packages/shared/src/dto/index.ts (Phone auth DTOs)
```

**Frontend:**
```
apps/web/src/
├── components/
│   ├── auth/
│   │   ├── LoginModal.tsx
│   │   └── RegisterModal.tsx
│   └── navbar.tsx
├── lib/auth.ts (phone auth functions)
└── app/[locale]/auth/
    ├── login/page.tsx (restructured)
    └── register/page.tsx (restructured)

packages/ui/src/
├── primitives/dialog.tsx
└── composites/
    ├── phone-input.tsx
    └── otp-input.tsx
```

### Authentication Flow

**Phone Registration:**
1. User enters name + phone (+998 XX XXX XX XX)
2. Backend sends 6-digit OTP via Eskiz SMS
3. User enters OTP
4. Backend verifies OTP → Creates account → Returns JWT token

**Phone Login:**
1. User enters phone number
2. Backend sends OTP
3. User enters OTP
4. Backend verifies → Returns JWT token

**Alternative:** Email/password and Google OAuth still work

---

## 🔧 Environment Variables

### Backend (apps/api/.env)
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/realestate_dev"

# JWT
JWT_SECRET="<long-secret-key>"
JWT_EXPIRES_IN="7d"

# SMS Provider
SMS_PROVIDER="eskiz"
ESKIZ_EMAIL="odilorg@gmail.com"
ESKIZ_SECRET_KEY="cqrniYHlb7Wsos6UtMyYtoE3xh6XreOj7XpjSGf0"

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_CALLBACK_URL="http://localhost:3001/api/auth/google/callback"

# App
NODE_ENV="development"
API_PORT=3001
FRONTEND_URL="http://localhost:3000"
```

### Frontend (apps/web/.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

---

## 🚀 How to Deploy to Staging

### Current Status
- ✅ Feature complete on `feature/phone-authentication` branch
- ❌ Tests not written yet (BLOCKER for CI/CD)
- ❌ Changes not committed to git
- ❌ Not merged to `develop` branch

### Deployment Steps

**Option A: Proper CI/CD Flow (Recommended)**
```bash
# 1. Write tests (IN PROGRESS)
pnpm test

# 2. Commit changes
git add .
git commit -m "feat: add phone authentication with modal UI"

# 3. Push to feature branch
git push origin feature/phone-authentication

# 4. Create PR to develop
# Review on GitHub, then merge

# 5. CI/CD auto-deploys to staging
# Monitor: https://github.com/odilorg/real-estate-platform-v2/actions
```

**Option B: Manual Deployment (Bypass CI/CD)**
```bash
# SSH to VPS
ssh -i /home/odil/projects/id_rsa -p 2222 root@62.72.22.205

# Pull changes manually
cd /var/www/realestate-staging
git pull origin develop
pnpm install
pnpm build
pm2 restart realestate-staging-api realestate-staging-web
```

---

## 🧪 Testing Requirements

### Tests to Write (CURRENT TASK)

**Backend Unit Tests:**
- [ ] OTP Service (generation, validation, expiry, rate limiting)
- [ ] SMS Service (Eskiz provider, mock provider)
- [ ] Auth Service (phone registration, phone login, setPassword)

**Backend Integration Tests:**
- [ ] POST /auth/phone/register/request
- [ ] POST /auth/phone/register/verify
- [ ] POST /auth/phone/login/request
- [ ] POST /auth/phone/login/verify
- [ ] POST /auth/set-password

**Frontend Component Tests:**
- [ ] PhoneInput (formatting, validation)
- [ ] OtpInput (auto-focus, paste)
- [ ] LoginModal (phone flow, email flow, switching)
- [ ] RegisterModal (phone flow, email flow, switching)

---

## 📝 Important Notes

### ⚠️ CRITICAL WARNINGS
- **This is a LIVE production VPS** - Do NOT drop databases or modify production data
- **Two separate codebases:** Local dev ≠ Staging server
- **Always test locally first** before pushing to staging
- **Tests must pass** for CI/CD to deploy

### 🔐 Security
- SSH key at `/home/odil/projects/id_rsa` (keep secure)
- Eskiz SMS credentials in .env (real SMS service)
- JWT secret must be strong in production
- OTP rate limiting: 3 requests/min per phone
- OTP brute force protection: max 5 attempts per code

### 🎨 UI/UX Pattern
- **Phone authentication is PRIMARY** (like Cian.ru)
- Email/password as alternative
- Modal-based authentication (no page navigation)
- Auto-formatting phone input (+998 format)
- 60-second OTP resend timer
- Russian & Uzbek translations

---

## 🐛 Known Issues / TODO

- [ ] **BLOCKER:** Write tests for phone authentication
- [ ] Add "Forgot Password" functionality
- [ ] Add ability for phone users to add email/password later
- [ ] Implement 2FA for email users
- [ ] Add admin panel for OTP management
- [ ] Monitor SMS costs (Eskiz charges per SMS)
- [ ] Set up error monitoring (Sentry?)
- [ ] Add phone number verification for profile changes

---

## 🔍 Useful Commands

### Local Development
```bash
# Start dev servers
pnpm dev

# Run tests
pnpm test

# Build
pnpm build

# Database migrations
cd packages/database
pnpm prisma migrate dev
pnpm prisma studio
```

### On Staging VPS
```bash
# SSH
ssh -i /home/odil/projects/id_rsa -p 2222 root@62.72.22.205

# Check PM2 status
pm2 list
pm2 logs realestate-staging-api
pm2 logs realestate-staging-web

# Restart services
pm2 restart realestate-staging-api
pm2 restart realestate-staging-web

# Check git status
cd /var/www/realestate-staging
git status
git log --oneline -5
```

### GitHub Actions
```bash
# View workflows
https://github.com/odilorg/real-estate-platform-v2/actions

# Trigger manual deployment
# Go to Actions → Deploy to Staging → Run workflow
```

---

## 📞 Contact & Resources

- **Developer:** Odil
- **VPS Provider:** [Check with Odil]
- **Domain:** jahongir-app.uz
- **SMS Provider:** Eskiz (https://notify.eskiz.uz)
- **Repository:** https://github.com/odilorg/real-estate-platform-v2

---

**Last Session Work:**
- ✅ Completed phone authentication with OTP and modal UI
- ✅ Integrated Eskiz SMS API (test mode active)
- ✅ Deployed to staging via direct VPS work
- ✅ All changes committed and pushed to git
- 📋 **Current Status:** Phone auth live on staging at https://staging.jahongir-app.uz
- 📋 **Eskiz Test Mode:** Sends "Bu Eskiz dan test" SMS, OTP codes logged in PM2 logs
- 📋 **To exit test mode:** Top up Eskiz balance to send custom OTP messages
