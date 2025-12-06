# Real Estate Platform v2

A full-stack real estate platform built with TypeScript monorepo architecture.

## Tech Stack

- **Monorepo**: Turborepo + pnpm
- **Backend**: NestJS + Prisma + PostgreSQL
- **Frontend**: Next.js 15 + React 19 + TailwindCSS
- **Mobile**: React Native (Expo)
- **Workers**: BullMQ + Redis

## Project Structure

```
apps/
  api/          # NestJS backend API
  web/          # Next.js frontend
  mobile/       # React Native app
  worker/       # Background job processor

packages/
  shared/       # Shared types, DTOs, constants
  database/     # Prisma schema and client
  ui/           # Shared React components
  config/       # Shared ESLint, TS configs

docs/
  TASKS.md          # Implementation checklist
  SESSION_LOG.md    # AI session handoff notes
  CONVENTIONS.md    # Coding standards
  AI_INSTRUCTIONS.md # Instructions for AI coders
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 16+
- Redis (for workers)

### Installation

```bash
# Clone the repo
git clone https://github.com/odilorg/real-estate-platform-v2.git
cd real-estate-platform-v2

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL

# Generate Prisma client
pnpm --filter @repo/database db:generate

# Run migrations
pnpm --filter @repo/database db:migrate

# Start development
pnpm dev
```

## Development

```bash
# Run all apps
pnpm dev

# Run specific app
pnpm --filter api dev
pnpm --filter web dev

# Build all
pnpm build

# Lint all
pnpm lint
```

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/realestate"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Redis (for workers)
REDIS_URL="redis://localhost:6379"
```

## License

MIT
