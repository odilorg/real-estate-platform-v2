# Memory Leak Investigation Checklist

## Current Status (2025-12-18)

- **VPS Monitoring:** PM2 safeguards enabled
  - API: max_memory_restart = 500M
  - Web: max_memory_restart = 1G
- **Baseline Memory:** API=60MB, Web=50MB
- **Historical Issues:** 340 restarts in 6h (now reset to 0)

---

## Common Node.js Memory Leak Sources

### 1. Event Listeners Not Removed

**Risk:** High
**Where to check:** All services, controllers, gateways

```typescript
// ❌ BAD - Memory leak
class MyService {
  constructor(private eventEmitter: EventEmitter) {
    // Listener added every time service is instantiated
    this.eventEmitter.on('event', this.handler);
  }
}

// ✅ GOOD - Clean up
class MyService implements OnModuleDestroy {
  constructor(private eventEmitter: EventEmitter) {
    this.eventEmitter.on('event', this.handler);
  }

  onModuleDestroy() {
    this.eventEmitter.off('event', this.handler);
  }
}
```

**Action Items:**
- [ ] Check WebSocket gateway (`MessagesGateway`) for proper cleanup
- [ ] Review all `EventEmitter` usage
- [ ] Check NestJS `@OnEvent()` decorators

---

### 2. Database Connections Not Closed

**Risk:** Critical
**Where to check:** Prisma service, custom database queries

```typescript
// ❌ BAD - Connection leak
async function query() {
  const prisma = new PrismaClient(); // Creates new connection each time
  return prisma.user.findMany();
}

// ✅ GOOD - Reuse connection
@Injectable()
class DatabaseService {
  constructor(private prisma: PrismaService) {} // Singleton

  async query() {
    return this.prisma.user.findMany();
  }
}
```

**Action Items:**
- [ ] Verify Prisma is singleton (injected via DI)
- [ ] Check for manual `new PrismaClient()` calls
- [ ] Review database connection pooling settings

---

### 3. Timers/Intervals Not Cleared

**Risk:** High
**Where to check:** Scheduled tasks, polling services

```typescript
// ❌ BAD - Interval leak
class NotificationService {
  constructor() {
    setInterval(() => this.checkNotifications(), 60000); // Never cleared
  }
}

// ✅ GOOD - Clear on destroy
class NotificationService implements OnModuleDestroy {
  private intervalId: NodeJS.Timeout;

  constructor() {
    this.intervalId = setInterval(() => this.checkNotifications(), 60000);
  }

  onModuleDestroy() {
    clearInterval(this.intervalId);
  }
}
```

**Action Items:**
- [ ] Check `SavedSearchNotificationsService` (runs hourly)
- [ ] Review `OtpService` cleanup task
- [ ] Find all `setInterval`, `setTimeout` calls

---

### 4. Global Variable Accumulation

**Risk:** Medium
**Where to check:** Caching, logging, analytics

```typescript
// ❌ BAD - Global cache grows indefinitely
const cache = new Map(); // Never cleared

export function cacheData(key, value) {
  cache.set(key, value); // Grows forever
}

// ✅ GOOD - Time-based eviction
const cache = new Map();

export function cacheData(key, value, ttl = 3600000) {
  cache.set(key, value);
  setTimeout(() => cache.delete(key), ttl);
}
```

**Action Items:**
- [ ] Check Redis usage (should be external, not in-memory)
- [ ] Review any in-memory caching
- [ ] Check analytics/logging buffers

---

### 5. Closures Holding References

**Risk:** Medium
**Where to check:** Callbacks, middleware, request handlers

```typescript
// ❌ BAD - Closure holds large object
function processRequest(req, res) {
  const largeData = loadLargeDataset(); // 100MB

  setTimeout(() => {
    // Closure keeps largeData in memory even after request ends
    console.log(largeData.summary);
  }, 60000);
}

// ✅ GOOD - Extract only needed data
function processRequest(req, res) {
  const largeData = loadLargeDataset();
  const summary = largeData.summary; // Small string

  setTimeout(() => {
    console.log(summary); // Only holds small string
  }, 60000);
}
```

**Action Items:**
- [ ] Review file upload handlers
- [ ] Check image processing services
- [ ] Review request middleware

---

### 6. Circular References

**Risk:** Low (V8 handles most)
**Where to check:** Complex object relationships

```typescript
// ❌ RISKY - Circular reference
class Property {
  agent: Agent;
}

class Agent {
  properties: Property[]; // Circular: Property -> Agent -> Property
}
```

**Action Items:**
- [ ] Review Prisma relations (usually safe)
- [ ] Check custom object serialization

---

## Investigation Tools

### Tool 1: PM2 Memory Monitoring

```bash
# Real-time monitoring
pm2 monit

# Memory usage over time
pm2 status

# Auto-restart on memory limit (already enabled)
pm2 describe realestate-staging-api | grep max_memory_restart
```

### Tool 2: Node.js Heap Snapshot

```typescript
// Add to your API (temporary, for debugging)
import * as heapdump from 'heapdump';

@Get('/debug/heap-snapshot')
async takeHeapSnapshot() {
  const filename = `/tmp/heapdump-${Date.now()}.heapsnapshot`;
  heapdump.writeSnapshot(filename);
  return { filename };
}
```

Then analyze in Chrome DevTools:
1. Download heapsnapshot file from VPS
2. Open Chrome DevTools → Memory → Load
3. Look for objects growing over time

### Tool 3: PM2 Plus (Optional - Paid)

```bash
pm2 link <secret> <public>
```

Provides:
- Real-time memory graphs
- Automatic leak detection
- Exception tracking

---

## Monitoring Plan

### Daily Checks (Automated)

Add to your deployment script:

```bash
# Check memory before deployment
ssh user@vps "pm2 status | grep realestate"

# If memory > 400MB, investigate before deploying
```

### Weekly Review

```bash
# Check restart count
pm2 status | grep -E "↺|restart"

# If restart count > 100/week → Memory leak investigation

# Check logs for memory restarts
pm2 logs | grep "max_memory_restart"
```

---

## Quick Fixes to Implement Now

### Fix 1: Add OnModuleDestroy to All Services

```typescript
// In every service with timers, listeners, or connections
export class MyService implements OnModuleDestroy {
  onModuleDestroy() {
    // Clean up timers
    // Remove event listeners
    // Close connections
  }
}
```

### Fix 2: Review Scheduled Tasks

Check these files:
- `apps/api/src/modules/saved-searches/saved-search-notifications.service.ts`
- `apps/api/src/modules/otp/otp.service.ts`

Ensure they have proper cleanup.

### Fix 3: Connection Pooling

In `.env`:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/db?connection_limit=10&pool_timeout=20"
```

---

## Signs of Memory Leak

### Monitor These Metrics

1. **Memory Growth:** Memory increases steadily over hours/days
2. **Never Stabilizes:** Memory never plateaus
3. **Restart Triggers:** PM2 restarts due to max_memory_restart
4. **Slow Performance:** API becomes slow before restart

### Baseline (Healthy)

- API: 60-150MB (normal)
- Web: 50-200MB (normal)
- Restarts: <10/day (deployments only)

### Red Flags (Memory Leak)

- API: >400MB (investigate)
- Web: >800MB (investigate)
- Restarts: >50/day (likely memory issue)

---

## Next Steps

1. **Monitor for 24 hours:** Check if memory grows steadily
2. **Review code:** Use checklist above
3. **Enable detailed logging:** Track memory on each request
4. **Profile production:** Take heap snapshots if issue persists

---

**Created:** 2025-12-18
**Safeguards Active:** PM2 max_memory_restart (API=500M, Web=1G)
**Baseline:** API=60MB, Web=50MB
**Status:** Monitoring phase
