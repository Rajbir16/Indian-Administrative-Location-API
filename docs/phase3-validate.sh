#!/bin/bash
# Phase 3 Validation and Setup Script
# This script helps verify your database setup is ready for Phase 3
# Run from project root: bash docs/phase3-validate.sh

echo "======================================"
echo "Phase 3 - Database Setup Validator"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for checks
CHECKS_PASSED=0
CHECKS_TOTAL=0

# Helper function
check_item() {
  CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $1"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo -e "${RED}✗${NC} $1"
  fi
}

# Check 1: Node.js installed
echo "1. Checking prerequisites..."
node --version > /dev/null 2>&1
check_item "Node.js installed: $(node --version)"

npm --version > /dev/null 2>&1
check_item "npm installed: $(npm --version)"

echo ""

# Check 2: Backend folder exists
echo "2. Checking project structure..."
[ -d "backend" ] && check_item "backend/ folder exists" || echo -e "${RED}✗${NC} backend/ folder exists"
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))

[ -f "backend/package.json" ] && check_item "backend/package.json exists" || echo -e "${RED}✗${NC} backend/package.json exists"
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))

[ -f "prisma/schema.prisma" ] && check_item "prisma/schema.prisma exists" || echo -e "${RED}✗${NC} prisma/schema.prisma exists"
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))

echo ""

# Check 3: Dependencies installed
echo "3. Checking backend dependencies..."
[ -d "backend/node_modules" ] && {
  check_item "backend/node_modules exists (dependencies installed)"
} || {
  echo -e "${YELLOW}!${NC} backend/node_modules not found - run 'cd backend && npm install'"
  CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
}

echo ""

# Check 4: Environment file
echo "4. Checking environment configuration..."
[ -f "backend/.env" ] && {
  echo -e "${GREEN}✓${NC} backend/.env exists"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
  
  # Check for DATABASE_URL
  if grep -q "^DATABASE_URL=" backend/.env; then
    echo -e "${GREEN}✓${NC} DATABASE_URL found in .env"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo -e "${YELLOW}!${NC} DATABASE_URL not set - edit backend/.env"
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
  fi
} || {
  echo -e "${YELLOW}!${NC} backend/.env not found"
  echo "     Run: cp backend/.env.example backend/.env"
  echo "     Then edit backend/.env with your database URL"
  CHECKS_TOTAL=$((CHECKS_TOTAL + 2))
}

echo ""

# Check 5: PostgreSQL connection (if .env exists)
echo "5. Checking database connectivity..."
if [ -f "backend/.env" ]; then
  if [ -x "$(command -v psql)" ]; then
    echo -e "${GREEN}✓${NC} PostgreSQL client installed"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
  else
    echo -e "${YELLOW}!${NC} PostgreSQL client not installed"
    echo "     Install: brew install postgresql (macOS) or apt install postgresql-client (Linux)"
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
  fi
else
  CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
fi

echo ""
echo "======================================"
echo "Summary"
echo "======================================"
echo "Checks passed: $CHECKS_PASSED / $CHECKS_TOTAL"
echo ""

if [ "$CHECKS_PASSED" -eq "$CHECKS_TOTAL" ]; then
  echo -e "${GREEN}✅ All checks passed! Ready for Phase 3${NC}"
  echo ""
  echo "Next steps:"
  echo "1. cd backend"
  echo "2. npm run prisma:generate"
  echo "3. npm run prisma:migrate"
  echo "4. npm run prisma:seed"
  echo "5. tsx src/utils/test-db-connection.ts"
else
  echo -e "${YELLOW}⚠ Some checks need attention${NC}"
  echo ""
  echo "Please review the items above and:"
  echo "1. Install missing prerequisites"
  echo "2. Create backend/.env with DATABASE_URL"
  echo "3. Run 'cd backend && npm install'"
  echo "4. Run this script again"
fi

echo ""
