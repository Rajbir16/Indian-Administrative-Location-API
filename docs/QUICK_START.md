# Quick Start Guide - Phase 3 Database Setup

This guide will get you from code to working database in 5 minutes (assuming you have PostgreSQL).

## TL;DR (Quick Start)

```bash
# 1. Setup database
# Skip if using NeonDB - it's already created

# macOS
brew install postgresql
brew services start postgresql
createdb indian_locations

# Linux
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb indian_locations

# Windows - Download installer: https://www.postgresql.org/download/windows/

# 2. Configure environment
cd backend
cp .env.example .env
# Edit .env and add DATABASE_URL

# 3. Install and setup
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 4. Verify
tsx src/utils/test-db-connection.ts
```

That's it! Your database is ready.

---

## Detailed Steps

### Step 1: Verify Prerequisites (2 min)

**Check Node.js and npm:**
```bash
node --version   # Should be 18+
npm --version
```

**Check if PostgreSQL is installed:**
```bash
which psql  # macOS/Linux
psql --version
```

### Step 2: Start PostgreSQL Database (5 min)

#### Option A: Local PostgreSQL

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
1. Download from https://www.postgresql.org/download/windows/
2. Run installer, remember password
3. PostgreSQL starts automatically

**Verify PostgreSQL is running:**
```bash
# Connect to default postgres database
psql -U postgres

# You should see:
# psql (14.0, server 14.0)
# Type "help" for help.
# postgres=#

# Exit
\q
```

#### Option B: Use NeonDB (Free Cloud PostgreSQL)

1. Visit https://console.neon.tech
2. Sign up (no credit card needed)
3. Create project
4. Copy connection string from dashboard
5. Skip to "Step 4: Configure .env"

#### Option C: Docker PostgreSQL

```bash
docker run --name indian-locations-db \
  -e POSTGRES_DB=indian_locations \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15
```

### Step 3: Create Database (2 min)

**For Local PostgreSQL:**

```bash
# Create database
createdb -U postgres indian_locations

# Or using psql:
psql -U postgres -c "CREATE DATABASE indian_locations;"

# Verify
psql -U postgres -l | grep indian_locations
```

**For NeonDB:**
Skip this - database is already created.

### Step 4: Configure Environment (2 min)

```bash
cd backend

# Copy example environment file
cp .env.example .env

# Edit .env
# Windows: notepad .env
# macOS: open -a TextEdit .env
# Linux: nano .env
```

Set these values based on your database choice:

**Local PostgreSQL (default user):**
```
DATABASE_URL=postgresql://postgres:@localhost:5432/indian_locations
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
```

**Local PostgreSQL (with custom user):**
```
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/indian_locations
```

**NeonDB:**
```
DATABASE_URL=postgresql://USER:PASSWORD@REGION.neon.tech/DATABASE?sslmode=require
```

**Docker PostgreSQL:**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/indian_locations
```

Keep other variables as default (they'll work fine).

### Step 5: Install Dependencies (3 min)

```bash
cd backend
npm install
```

This installs:
- Prisma (database ORM)
- Express (for later phases)
- TypeScript
- And other dependencies

Wait for it to complete. You should see:
```
added XXX packages in XXX seconds
```

### Step 6: Generate Prisma Client (1 min)

```bash
npm run prisma:generate
```

This reads `prisma/schema.prisma` and generates database client code.

### Step 7: Run Migrations (2 min)

```bash
npm run prisma:migrate
```

When prompted for migration name, type: `init`

This will:
1. Create the migration
2. Execute SQL to create all 9 tables
3. Show migration status

You should see:
```
✔ Prisma Migrate created the following migration:
migrations/
  └─ 20240130_init/
    └─ migration.sql

✔ Database migrated to migration_20240130_init
```

### Step 8: Seed Sample Data (1 min)

```bash
npm run prisma:seed
```

This populates the database with sample data:
- 1 Country (India)
- 3 States (Maharashtra, Andhra Pradesh, Goa)
- 3 Districts
- 2 Sub-Districts
- 5 Villages (including Manibeli)
- 1 Demo User

You should see:
```
✅ Database seed completed successfully!

Summary:
  - Country: 1
  - States: 3
  - Districts: 3
  - Sub-Districts: 2
  - Villages: 5
  - Users: 1
```

### Step 9: Verify Connection (1 min)

```bash
# Test database connectivity
tsx src/utils/test-db-connection.ts
```

You should see:
```
✓ Prisma connection successful
✓ Found country: India
  States in this country: 3

✅ Database connection test passed!
```

---

## View Data in Database Browser

```bash
# Open Prisma Studio (visual database browser)
npm run prisma:studio

# Opens at http://localhost:5555
```

In Prisma Studio you can:
- Browse all tables
- View records
- Add/edit/delete data
- Run queries
- Export data

---

## Verify Sample Location Hierarchy

Query the complete location hierarchy:

```bash
# Using psql
psql -U postgres -d indian_locations << 'EOF'

SELECT 
  c.name as country,
  s.name as state,
  d.name as district,
  sd.name as sub_district,
  v.name as village
FROM village v
JOIN sub_district sd ON v.sub_district_id = sd.id
JOIN district d ON sd.district_id = d.id
JOIN state s ON d.state_id = s.id
JOIN country c ON s.country_id = c.id
ORDER BY s.name, d.name, sd.name, v.name;

EOF
```

Expected output:
```
country | state        | district  | sub_district | village
--------|--------------|-----------|--------------|--------
India   | Maharashtra  | Nandurbar | Akkalkuwa    | Akkalkuwa
India   | Maharashtra  | Nandurbar | Akkalkuwa    | Gavhane
India   | Maharashtra  | Nandurbar | Akkalkuwa    | Manibeli
India   | Maharashtra  | Nandurbar | Akkalkuwa    | Pimpalkhut
India   | Maharashtra  | Nandurbar | Akkalkuwa    | Shipur
(5 rows)
```

---

## Troubleshooting

### "psql: command not found"

PostgreSQL not installed. Install using:
- macOS: `brew install postgresql`
- Linux: `sudo apt install postgresql postgresql-client`
- Windows: Download from postgresql.org

### "FATAL: database 'indian_locations' does not exist"

Create database:
```bash
createdb -U postgres indian_locations
```

### "password authentication failed"

Wrong password in DATABASE_URL. Check:
```bash
# Test connection
psql -U postgres -h localhost -d indian_locations
```

### "connect ECONNREFUSED"

PostgreSQL not running. Start with:
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows - restart service
```

### "The migration.sql file was modified"

Schema changed. To sync with database:
```bash
# Reset (WARNING: deletes data)
npm run prisma:migrate reset

# Or create new migration
npm run prisma:migrate
```

### "Prisma Client generation failed"

Regenerate:
```bash
npm run prisma:generate
npm install
```

---

## What's Next?

After successful Phase 3 setup:

1. **Keep the database running** - You'll need it for development
2. **Explore the data** - Use `npm run prisma:studio`
3. **Move to Phase 4** - Python data import pipeline
   - Supports importing full MDDS dataset
   - Can run multiple times without duplicates
   - Batch processes large data

### Running Backend Server (Phase 5+)

```bash
# In backend/ directory
npm run dev
```

Server starts at `http://localhost:3000`
Health check: `http://localhost:3000/health`

---

## Useful Commands for Development

```bash
# View database
npm run prisma:studio

# Validate schema
npm run prisma:validate

# Reset database (development only!)
npm run prisma:migrate reset

# Run specific seed
npm run prisma:seed

# Type checking
npm run type-check

# Start backend server
npm run dev

# Build backend
npm build
```

---

## Database Files

After Phase 3 setup, you'll have:

```
backend/
├── .env                    # Your configuration (not in git)
├── node_modules/          # Dependencies
└── src/
    └── config/
        ├── database.ts     # Prisma client
        ├── redis.ts        # Redis connection
        └── environment.ts  # Config validation

prisma/
├── schema.prisma          # Database schema
├── migrations/
│   └── [timestamp]_init/
│       └── migration.sql  # SQL that was executed
└── seed.ts                # Seed script
```

---

## Phase 3 Complete ✅

You've successfully:
- ✅ Set up PostgreSQL/NeonDB
- ✅ Created 9 database tables
- ✅ Seeded sample data (15 records)
- ✅ Verified data relationships
- ✅ Tested database connection

**Next Phase:** Phase 4 - Python Data Import Pipeline

The Python importer will handle loading the full MDDS dataset (~600,000 villages) into the database.

---

## Need Help?

- Check `docs/DATABASE.md` for schema details
- Check `docs/DEVELOPMENT.md` for development workflow
- Run validation script: `bash docs/phase3-validate.sh` (macOS/Linux)
- Check PostgreSQL logs: `tail -f /usr/local/var/log/postgres.log` (macOS)

---

**Estimated time to complete Phase 3: 15-30 minutes**

Happy coding! 🚀
