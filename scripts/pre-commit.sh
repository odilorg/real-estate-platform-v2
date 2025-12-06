#!/bin/bash

# Pre-commit checks for AI coder safety
# Run this before every commit: ./scripts/pre-commit.sh

set -e

echo "🔍 Running pre-commit checks..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILED=0

# 1. Check TypeScript compilation
echo "1️⃣  Checking TypeScript..."
if pnpm build 2>/dev/null; then
    echo -e "${GREEN}   ✓ TypeScript OK${NC}"
else
    echo -e "${RED}   ✗ TypeScript errors found${NC}"
    FAILED=1
fi
echo ""

# 2. Check for console.log statements (except in specific files)
echo "2️⃣  Checking for console.log..."
CONSOLE_LOGS=$(grep -r "console\.log" --include="*.ts" --include="*.tsx" packages/ apps/ 2>/dev/null | grep -v "node_modules" | grep -v ".d.ts" || true)
if [ -z "$CONSOLE_LOGS" ]; then
    echo -e "${GREEN}   ✓ No console.log found${NC}"
else
    echo -e "${YELLOW}   ⚠ console.log found (remove before production):${NC}"
    echo "$CONSOLE_LOGS" | head -5
    # Warning only, not a failure
fi
echo ""

# 3. Check for TODO comments
echo "3️⃣  Checking for TODO comments..."
TODOS=$(grep -r "TODO\|FIXME\|XXX\|HACK" --include="*.ts" --include="*.tsx" packages/ apps/ 2>/dev/null | grep -v "node_modules" || true)
if [ -z "$TODOS" ]; then
    echo -e "${GREEN}   ✓ No TODO comments found${NC}"
else
    echo -e "${YELLOW}   ⚠ TODO comments found (finish or remove):${NC}"
    echo "$TODOS" | head -5
    # Warning only, not a failure
fi
echo ""

# 4. Check for any files (to ensure changes exist)
echo "4️⃣  Checking staged files..."
STAGED=$(git diff --cached --name-only 2>/dev/null || echo "")
if [ -z "$STAGED" ]; then
    echo -e "${YELLOW}   ⚠ No files staged for commit${NC}"
else
    echo -e "${GREEN}   ✓ Files staged:${NC}"
    echo "$STAGED" | head -10
fi
echo ""

# 5. Check SESSION_LOG.md was updated (reminder)
echo "5️⃣  Reminder: Did you update SESSION_LOG.md?"
echo -e "${YELLOW}   → Update docs/SESSION_LOG.md with what you did${NC}"
echo ""

# Final result
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Safe to commit.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Fix before committing.${NC}"
    exit 1
fi
