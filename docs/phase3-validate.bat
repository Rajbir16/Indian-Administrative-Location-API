@echo off
REM Phase 3 Validation Script for Windows
REM Run from project root: phase3-validate.bat

echo ======================================
echo Phase 3 - Database Setup Validator
echo ======================================
echo.

setlocal enabledelayedexpansion

REM Counter for checks
set CHECKS_PASSED=0
set CHECKS_TOTAL=0

REM Check 1: Node.js installed
echo 1. Checking prerequisites...
node --version >nul 2>&1
if %errorlevel% equ 0 (
  for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
  echo [OK] Node.js installed: !NODE_VERSION!
  set /a CHECKS_PASSED+=1
) else (
  echo [FAIL] Node.js not installed
)
set /a CHECKS_TOTAL+=1

npm --version >nul 2>&1
if %errorlevel% equ 0 (
  for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
  echo [OK] npm installed: !NPM_VERSION!
  set /a CHECKS_PASSED+=1
) else (
  echo [FAIL] npm not installed
)
set /a CHECKS_TOTAL+=1

echo.

REM Check 2: Project structure
echo 2. Checking project structure...
if exist "backend" (
  echo [OK] backend/ folder exists
  set /a CHECKS_PASSED+=1
) else (
  echo [FAIL] backend/ folder exists
)
set /a CHECKS_TOTAL+=1

if exist "backend\package.json" (
  echo [OK] backend/package.json exists
  set /a CHECKS_PASSED+=1
) else (
  echo [FAIL] backend/package.json exists
)
set /a CHECKS_TOTAL+=1

if exist "prisma\schema.prisma" (
  echo [OK] prisma/schema.prisma exists
  set /a CHECKS_PASSED+=1
) else (
  echo [FAIL] prisma/schema.prisma exists
)
set /a CHECKS_TOTAL+=1

echo.

REM Check 3: Dependencies
echo 3. Checking backend dependencies...
if exist "backend\node_modules" (
  echo [OK] backend/node_modules exists
  set /a CHECKS_PASSED+=1
) else (
  echo [WARN] backend/node_modules not found
  echo       Run: cd backend ^&^& npm install
)
set /a CHECKS_TOTAL+=1

echo.

REM Check 4: Environment file
echo 4. Checking environment configuration...
if exist "backend\.env" (
  echo [OK] backend/.env exists
  set /a CHECKS_PASSED+=1
  
  REM Check for DATABASE_URL
  findstr /C:"DATABASE_URL=" backend\.env >nul
  if %errorlevel% equ 0 (
    echo [OK] DATABASE_URL found in .env
    set /a CHECKS_PASSED+=1
  ) else (
    echo [WARN] DATABASE_URL not set in .env
  )
  set /a CHECKS_TOTAL+=1
) else (
  echo [WARN] backend/.env not found
  echo        Run: copy backend\.env.example backend\.env
  echo        Then edit backend\.env with database URL
  set /a CHECKS_TOTAL+=2
)

echo.
echo ======================================
echo Summary
echo ======================================
echo Checks passed: !CHECKS_PASSED! / !CHECKS_TOTAL!
echo.

if %CHECKS_PASSED% equ %CHECKS_TOTAL% (
  echo [SUCCESS] All checks passed! Ready for Phase 3
  echo.
  echo Next steps:
  echo 1. cd backend
  echo 2. npm run prisma:generate
  echo 3. npm run prisma:migrate
  echo 4. npm run prisma:seed
  echo 5. npx tsx src/utils/test-db-connection.ts
) else (
  echo [WARNING] Some checks need attention
  echo.
  echo Please review the items above and:
  echo 1. Install missing prerequisites
  echo 2. Create backend/.env with DATABASE_URL
  echo 3. Run 'cd backend ^&^& npm install'
  echo 4. Run this script again
)

echo.
endlocal
