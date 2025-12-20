#!/bin/bash

# Script to update .env file for Docker services
# This will backup your current .env and update it with Docker connection strings

set -e

echo "🐳 Updating .env file for Docker services..."

# Backup current .env
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backed up current .env"
fi

# Update DATABASE_URL
if grep -q "DATABASE_URL" .env 2>/dev/null; then
    sed -i.tmp 's|DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:postgres@localhost:5434/realestate"|g' .env
    echo "✅ Updated DATABASE_URL"
else
    echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5434/realestate"' >> .env
    echo "✅ Added DATABASE_URL"
fi

# Update REDIS_URL
if grep -q "REDIS_URL" .env 2>/dev/null; then
    sed -i.tmp 's|REDIS_URL=.*|REDIS_URL="redis://localhost:6381"|g' .env
    echo "✅ Updated REDIS_URL"
else
    echo 'REDIS_URL="redis://localhost:6381"' >> .env
    echo "✅ Added REDIS_URL"
fi

# Update SMTP settings
if grep -q "SMTP_HOST" .env 2>/dev/null; then
    sed -i.tmp 's|SMTP_HOST=.*|SMTP_HOST="localhost"|g' .env
    sed -i.tmp 's|SMTP_PORT=.*|SMTP_PORT="1027"|g' .env
    echo "✅ Updated SMTP settings"
else
    echo 'SMTP_HOST="localhost"' >> .env
    echo 'SMTP_PORT="1027"' >> .env
    echo 'SMTP_USER=""' >> .env
    echo 'SMTP_PASSWORD=""' >> .env
    echo 'SMTP_FROM="noreply@realestate.local"' >> .env
    echo "✅ Added SMTP settings"
fi

# Clean up temp files
rm -f .env.tmp

echo ""
echo "✅ .env file updated successfully!"
echo ""
echo "📝 Updated settings:"
echo "   DATABASE_URL: postgresql://postgres:postgres@localhost:5434/realestate"
echo "   REDIS_URL: redis://localhost:6381"
echo "   SMTP_HOST: localhost"
echo "   SMTP_PORT: 1027"
echo ""
echo "🚀 Next: Run 'pnpm dev' to start your development servers"
