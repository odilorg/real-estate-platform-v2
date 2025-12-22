# Task Reminders Cron Job Setup

This document explains how to set up the automated task reminder system.

## How It Works

The task reminder system checks for upcoming and overdue tasks every 15 minutes and sends notifications to assigned users.

**Script Location:** `apps/api/scripts/run-task-reminders.sh`

**What it checks:**
- Tasks due within the next hour (upcoming reminders)
- Tasks that are overdue
- Only sends reminders for tasks with `reminderType` set
- Excludes snoozed tasks
- Marks tasks as `reminderSent: true` after sending

## Setup Options

### Option 1: System Cron (Recommended)

Add this line to your crontab to run every 15 minutes:

```bash
# Open crontab editor
crontab -e

# Add this line (runs every 15 minutes)
*/15 * * * * /var/www/realestate-staging/apps/api/scripts/run-task-reminders.sh >> /var/log/task-reminders.log 2>&1
```

**Verify cron is running:**
```bash
# List active cron jobs
crontab -l

# Check log output
tail -f /var/log/task-reminders.log
```

### Option 2: PM2 Cron

Use PM2's built-in cron support:

```bash
# Add to PM2 ecosystem config
pm2 start apps/api/scripts/run-task-reminders.sh --name task-reminders --cron "*/15 * * * *"

# Or add to ecosystem.config.js:
{
  name: 'task-reminders',
  script: './apps/api/scripts/run-task-reminders.sh',
  cron_restart: '*/15 * * * *',
  autorestart: false,
}

# Save PM2 config
pm2 save
```

### Option 3: Manual Testing

Run the script manually for testing:

```bash
cd /var/www/realestate-staging/apps/api
bash scripts/run-task-reminders.sh

# Or run the TypeScript file directly
npx ts-node src/cron/task-reminders.ts
```

## Notification Channels

The reminder system supports multiple notification channels (configured per task via `notifyVia` field):

### Currently Implemented:
- ✅ **In-app notifications** - Creates AgencyNotification records

### TODO (Placeholders in code):
- ⏳ **EMAIL** - Email notifications
- ⏳ **PUSH** - Push notifications
- ⏳ **SMS** - SMS notifications  
- ⏳ **WHATSAPP** - WhatsApp notifications

## Monitoring

### Check if cron is working:

```bash
# View recent log output
tail -n 50 /var/log/task-reminders.log

# Watch logs in real-time
tail -f /var/log/task-reminders.log

# Check database for sent reminders
psql realestate_staging -c "SELECT id, title, reminderSent FROM \"AgencyTask\" WHERE \"reminderSent\" = true LIMIT 10;"
```

### Troubleshooting:

**Cron not running:**
```bash
# Check if cron service is active
systemctl status cron

# Restart cron service
systemctl restart cron
```

**Script errors:**
```bash
# Check script permissions
ls -la /var/www/realestate-staging/apps/api/scripts/run-task-reminders.sh

# Make executable if needed
chmod +x /var/www/realestate-staging/apps/api/scripts/run-task-reminders.sh

# Run manually to see errors
bash /var/www/realestate-staging/apps/api/scripts/run-task-reminders.sh
```

**Environment variables not loading:**
```bash
# Check .env file exists
ls -la /var/www/realestate-staging/.env

# Manually source and test
cd /var/www/realestate-staging/apps/api
export $(cat ../../.env | xargs)
npx ts-node src/cron/task-reminders.ts
```

## Customization

### Change reminder timing:

Edit the cron schedule in crontab:

```bash
# Every 15 minutes (default)
*/15 * * * *

# Every 5 minutes (more frequent)
*/5 * * * *

# Every 30 minutes (less frequent)
*/30 * * * *

# Every hour at minute 0
0 * * * *
```

### Modify reminder logic:

Edit `apps/api/src/cron/task-reminders.ts`:

- Change reminder window (currently 1 hour before due date)
- Add custom notification logic
- Filter tasks by priority or type
- Implement email/SMS/push notification integrations

## Integration with External Services

### Email (TODO):

Add email service configuration to send reminder emails:

```typescript
// In src/cron/task-reminders.ts
import { EmailService } from '../modules/email/email.service';

// Send email
await emailService.send({
  to: assignedTo.user.email,
  subject: 'Task Reminder',
  template: 'task-reminder',
  data: { task, isOverdue },
});
```

### SMS (TODO):

Integrate with Twilio or similar SMS provider.

### Push Notifications (TODO):

Integrate with Firebase Cloud Messaging or OneSignal.

---

**Last Updated:** 2025-12-19
**Status:** Cron script ready, needs crontab setup
