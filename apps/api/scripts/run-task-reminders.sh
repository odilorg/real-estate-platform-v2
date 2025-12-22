#\!/bin/bash

# Task Reminder Cron Job
# Run this script every 15 minutes via cron

cd /var/www/realestate-staging/apps/api

# Load environment variables (filter out comments and empty lines)
if [ -f ../../.env ]; then
  export $(grep -v '^#' ../../.env | grep -v '^$' | xargs)
fi

# Run the reminder script
npx ts-node --transpile-only src/cron/task-reminders.ts 2>&1

echo "[$(date)] Task reminders job completed"
