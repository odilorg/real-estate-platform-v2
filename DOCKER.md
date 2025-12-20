# 🐳 Docker Development Guide - Real Estate Platform v2

> **Docker-First Development:** Services in Docker, Development servers outside Docker

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [What's Included](#-whats-included)
- [Daily Workflow](#-daily-workflow)
- [Docker Commands](#-docker-commands)
- [Database Operations](#-database-operations)
- [Troubleshooting](#-troubleshooting)
- [Migration Guide](#-migration-guide-from-local-to-docker)
- [Production Deployment](#-production-deployment)

---

## 🚀 Quick Start

### First-Time Setup

```bash
# 1. Start Docker services (PostgreSQL, Redis, MailHog)
docker-compose up -d

# 2. Check services are running
docker-compose ps

# 3. Update your .env file (if needed)
# Copy from .env.docker.example and update DATABASE_URL

# 4. Run database migrations
cd packages/database
pnpm db:migrate
cd ../..

# 5. Start development servers (as usual)
pnpm dev

# 6. Open your app
# Frontend: http://localhost:3000
# API: http://localhost:3001
# MailHog: http://localhost:8025
```

---

## 📦 What's Included

### Services in Docker

| Service | Port | Description | Access |
|---------|------|-------------|--------|
| **PostgreSQL 16** | 5432 | Database | `postgresql://postgres:postgres@localhost:5432/realestate` |
| **Redis 7** | 6379 | Cache | `redis://localhost:6379` |
| **MailHog** | 1025 (SMTP)<br>8025 (Web) | Email testing | http://localhost:8025 |

### What Runs OUTSIDE Docker

- **Next.js dev server** (`pnpm --filter web dev`) - Port 3000
- **NestJS API dev server** (`pnpm --filter api dev`) - Port 3001
- **Your code editor**

**Why this approach?**
- ✅ Fast hot reload (no Docker overhead)
- ✅ Easy debugging
- ✅ Consistent services (PostgreSQL, Redis)
- ✅ No conflicts with other projects

---

## 🔄 Daily Workflow

### Starting Work (Morning)

```bash
# 1. Start Docker services
docker-compose up -d

# 2. Verify services are healthy
docker-compose ps

# 3. Start dev servers
pnpm dev

# 4. Code as usual...
```

### Ending Work (Evening)

```bash
# 1. Stop dev servers (Ctrl+C)

# 2. Stop Docker services
docker-compose down

# (Optional) Keep services running for faster startup tomorrow:
# Just leave them running, they use minimal resources when idle
```

### After Changing Database Schema

```bash
# 1. Ensure Docker PostgreSQL is running
docker-compose ps

# 2. Navigate to database package
cd packages/database

# 3. Generate Prisma client
pnpm db:generate

# 4. Create migration
pnpm db:migrate

# 5. Rebuild dependent packages
cd ../..
pnpm --filter @repo/shared build
pnpm --filter api build

# 6. Restart dev servers (Ctrl+C, then pnpm dev)
```

---

## 🔧 Docker Commands

### Service Management

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgres

# Stop all services (keep data)
docker-compose down

# Stop all services and DELETE DATA (⚠️ careful!)
docker-compose down -v

# Restart services
docker-compose restart

# View logs
docker-compose logs
docker-compose logs postgres
docker-compose logs -f redis    # Follow logs (streaming)
```

### Check Status

```bash
# List running containers
docker-compose ps

# View resource usage
docker stats

# Check container health
docker-compose ps
# Look for "healthy" status
```

### Clean Up

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything unused (⚠️ careful!)
docker system prune -a
```

---

## 🗄️ Database Operations

### Access PostgreSQL CLI

```bash
# Enter PostgreSQL container
docker-compose exec postgres psql -U postgres -d realestate

# Useful psql commands:
\l              # List databases
\dt             # List tables
\d table_name   # Describe table
\q              # Quit
```

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres realestate > backup_$(date +%Y%m%d).sql

# Restore from backup
docker-compose exec -T postgres psql -U postgres -d realestate < backup_20251218.sql
```

### Reset Database

```bash
# Option 1: Drop and recreate (manual)
docker-compose exec postgres psql -U postgres -c "DROP DATABASE realestate;"
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE realestate;"

# Option 2: Remove volume and restart (⚠️ DELETES ALL DATA)
docker-compose down -v
docker-compose up -d

# Then run migrations again
cd packages/database
pnpm db:migrate
```

### Prisma Studio (Database GUI)

```bash
# Open Prisma Studio
cd packages/database
pnpm db:studio

# Opens at http://localhost:5555
```

---

## 🔴 Redis Operations

### Access Redis CLI

```bash
# Enter Redis container
docker-compose exec redis redis-cli

# Useful commands:
PING            # Test connection
KEYS *          # List all keys
GET key         # Get value
SET key value   # Set value
FLUSHALL        # Clear all data (⚠️)
exit            # Quit
```

### Monitor Redis

```bash
# Watch Redis commands in real-time
docker-compose exec redis redis-cli MONITOR
```

### Clear Redis Cache

```bash
# Option 1: Use Redis CLI
docker-compose exec redis redis-cli FLUSHALL

# Option 2: Restart container
docker-compose restart redis
```

---

## 📧 MailHog (Email Testing)

### Access MailHog

- **Web UI:** http://localhost:8025
- **SMTP Server:** localhost:1025

### Configuration in .env

```env
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM="noreply@realestate.local"
```

### Testing Emails

1. Your app sends email to MailHog (localhost:1025)
2. Open http://localhost:8025 to view received emails
3. No emails are actually sent (safe for development)

---

## 🐛 Troubleshooting

### Issue: Port already in use

**Symptom:** `Error: bind: address already in use`

**Cause:** Another service using the port

**Fix:**
```bash
# Find process using port 5432 (PostgreSQL)
lsof -i :5432

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - '5433:5432'  # Use different host port

# Update DATABASE_URL in .env:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5433/realestate"
```

### Issue: Container won't start

**Symptom:** Container status is "Exited" or "Restarting"

**Cause:** Configuration error or corrupt data

**Fix:**
```bash
# View logs
docker-compose logs postgres

# If data is corrupt, remove volume and restart
docker-compose down -v
docker-compose up -d
```

### Issue: "Connection refused" from app

**Symptom:** App can't connect to PostgreSQL/Redis

**Cause:** Docker services not running or wrong host

**Fix:**
```bash
# 1. Check Docker services are running
docker-compose ps

# 2. Verify .env has correct connection strings
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/realestate"
# REDIS_URL="redis://localhost:6379"

# 3. Restart services
docker-compose restart
```

### Issue: Slow performance on macOS

**Cause:** Docker volume performance on macOS

**Fix:**
- Use named volumes (already configured in docker-compose.yml)
- Enable VirtioFS in Docker Desktop settings
- Increase memory/CPU allocation in Docker Desktop

---

## 🔄 Migration Guide (From Local to Docker)

### Step 1: Backup Existing Database

```bash
# If you have local PostgreSQL, backup first
pg_dump -U postgres realestate > backup_before_docker.sql
```

### Step 2: Start Docker Services

```bash
docker-compose up -d
```

### Step 3: Update Environment Variables

```bash
# Update .env file with Docker connection strings
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/realestate"
REDIS_URL="redis://localhost:6379"
SMTP_HOST="localhost"
SMTP_PORT="1025"
```

### Step 4: Import Database (Option 1: From Backup)

```bash
# Import backup into Docker PostgreSQL
docker-compose exec -T postgres psql -U postgres -d realestate < backup_before_docker.sql
```

### Step 5: Import Database (Option 2: Fresh Migrations)

```bash
cd packages/database
pnpm db:migrate
pnpm db:seed  # If you have seed data
```

### Step 6: Test

```bash
# Start dev servers
pnpm dev

# Test app
# Frontend: http://localhost:3000
# API: http://localhost:3001
```

---

## 🚀 Production Deployment

### Using Docker on VPS

```bash
# 1. Copy docker-compose.yml to VPS
scp docker-compose.yml user@vps:/var/www/project/

# 2. SSH to VPS
ssh user@vps

# 3. Update docker-compose.yml for production
# - Change passwords
# - Remove MailHog
# - Add production SMTP

# 4. Start services
cd /var/www/project
docker-compose up -d

# 5. Run migrations
cd packages/database
pnpm db:migrate:deploy

# 6. Start app with PM2
pm2 start ecosystem.config.js
```

### Production docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    # Don't expose port externally in production
    # Only accessible from Docker internal network

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  redis-data:
```

---

## 📚 Additional Resources

- **Docker Documentation:** https://docs.docker.com/
- **Docker Compose Reference:** https://docs.docker.com/compose/
- **PostgreSQL Docker Image:** https://hub.docker.com/_/postgres
- **Redis Docker Image:** https://hub.docker.com/_/redis
- **MailHog:** https://github.com/mailhog/MailHog

---

## 🎯 Best Practices

### ✅ DO:

- Start Docker services before `pnpm dev`
- Use named volumes for data persistence
- Backup database before `docker-compose down -v`
- Monitor Docker resource usage (`docker stats`)
- Stop services when not working to save resources
- Use MailHog for email testing in development

### ❌ DON'T:

- Delete volumes without backup (`docker-compose down -v`)
- Run dev servers inside Docker (slower hot reload)
- Expose database ports in production
- Hardcode passwords in docker-compose.yml
- Forget to start Docker services before dev

---

**Last Updated:** 2025-12-18
**Docker Version:** 28.2.2
**Docker Compose Version:** 1.29.2

For questions or issues, see Troubleshooting section above.
