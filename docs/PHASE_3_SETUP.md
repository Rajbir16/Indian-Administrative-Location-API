# Phase 3: Database Migration & Seed Data Setup Guide

## Objective

Set up the PostgreSQL database, run migrations to create tables, and seed sample data for development.

**Duration:** 30-45 minutes (depending on database setup)

**Deliverables:**
- ✅ PostgreSQL database created
- ✅ Prisma migrations executed
- ✅ 9 tables created with proper structure
- ✅ Sample data seeded (15 records)
- ✅ Database connection verified

---

## Prerequisites

### Required
- Node.js 18+ installed
- npm installed
- Backend dependencies installed (`npm install` in backend/)
- .env file configured with DATABASE_URL

### Database Options (Choose One)

#### Option A: PostgreSQL Local (Recommended for Development)

**On macOS (Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**On Linux (Ubuntu):**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**On Windows:**
- Download from https://www.postgresql.org/download/windows/
- Run installer and follow prompts
- Remember the password you set for `postgres` user

**Verify Installation:**
```bash
psql --version
psql -U postgres -c "SELECT version();"
```

#### Option B: NeonDB (Recommended for Production/Cloud Development)

1. Go to https://console.neon.tech
2. Sign up for free account
3. Create new project
4. Copy connection string (looks like: `postgresql://user:password@region.neon.tech/database`)
5. Note: Free tier includes database, no credit card needed

#### Option C: Docker PostgreSQL

```bash
docker run --name indian-locations-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=indian_locations \
  -p 5432:5432 \
  -d postgres:15

# Verify
psql -h localhost -U postgres -c "SELECT version();"
```

---

## Step 1: Create Database and Setup .env

### For Local PostgreSQL:

```bash
# Connect to PostgreSQL
psql -U postgres

# In psql prompt, create database:
CREATE DATABASE indian_locations;
CREATE USER indian_api WITH PASSWORD 'your_secure_password_here';
ALTER ROLE indian_api SET client_encoding TO 'utf8';
ALTER ROLE indian_api SET default_transaction_isolation TO 'read committed';
ALTER ROLE indian_api SET default_transaction_deferrable TO on;
ALTER ROLE indian_api SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE indian_locations TO indian_api;
\q  # Exit psql
```

### For NeonDB:

Skip database creation - NeonDB creates it for you.

### Create .env File:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set DATABASE_URL:

**Local PostgreSQL:**
```
DATABASE_URL=postgresql://indian_api:your_secure_password_here@localhost:5432/indian_locations
```

**NeonDB:**
```
DATABASE_URL=postgresql://user:password@region.neon.tech/database
```

**Docker PostgreSQL:**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/indian_locations
```

### Set Other Required Variables:

```env
# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long_should_be_changed
JWT_EXPIRY=7d

# Redis (can use local or skip for now)
REDIS_URL=redis://localhost:6379

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# API Key
API_KEY_PREFIX=INDIAN_LOC_
```

---

## Step 2: Install Backend Dependencies

```bash
cd backend

# Install npm packages
npm install

# Verify installation
npm list prisma
npm list @prisma/client
```

---

## Step 3: Generate Prisma Client

```bash
# Generate Prisma client from schema
npm run prisma:generate
```

Output should show:
```
✔ Generated Prisma Client (v5.7.1) to ./node_modules/.prisma/client
```

---

## Step 4: Create and Run Migrations

```bash
# Run migrations (creates database schema)
npm run prisma:migrate

# When prompted for migration name, enter something descriptive:
# > init  (or "initial_schema" or "create_location_tables")
```

**What happens:**
1. Prisma reads schema.prisma
2. Creates migration file in `prisma/migrations/`
3. Executes SQL to create all 9 tables
4. Creates _prisma_migrations table to track migrations

**Expected output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "indian_locations" at "localhost:5432"

✔ Prisma Migrate created the following migration:

migrations/
  └─ 20240130_init/
    └─ migration.sql

✔ Database migrated to migration_20240130_init
The following migration(s) have been applied:

migrations/
  └─ 20240130_init (4m)
```

---

## Step 5: Seed Sample Data

```bash
# Run seed script
npm run prisma:seed
```

**Expected output:**
```
🌱 Starting database seed...

Seeding Country...
✓ Country created: India

Seeding States...
✓ Created 3 states

Seeding Districts...
✓ Created 3 districts

Seeding Sub-Districts...
✓ Created 2 sub-districts

Seeding Villages...
✓ Created 5 villages

Seeding Sample User...
✓ Sample user created: demo@example.com

✅ Database seed completed successfully!

Summary:
  - Country: 1
  - States: 3
  - Districts: 3
  - Sub-Districts: 2
  - Villages: 5
  - Users: 1
```

---

## Step 6: Verify Database Connection

```bash
# Test database connection
tsx src/utils/test-db-connection.ts
```

**Expected output:**
```
🔍 Testing database connection...

Environment variables:
  NODE_ENV: development
  PORT: 3000
  Database URL: ...

Testing Prisma connection...
✓ Prisma connection successful

Checking database records...
  Countries: 1
  States: 3
  Districts: 3
  Sub-Districts: 2
  Villages: 5
  Users: 1

Testing sample query...
✓ Found country: India
  States in this country: 3

✅ Database connection test passed!
```

---

## Step 7: View Data in Prisma Studio (Optional)

```bash
# Open visual database browser
npm run prisma:studio

# Opens at http://localhost:5555
# Can browse all tables and data
# Can add/edit/delete records
# Useful for development debugging
```

---

## Step 8: Test Basic Queries

Open PostgreSQL client or use Prisma Studio to verify data:

```sql
-- View all states
SELECT * FROM state;

-- Expected:
-- id | code | name                | country_id
-- 1  | 27   | Maharashtra         | 1
-- 2  | 08   | Andhra Pradesh      | 1
-- 3  | 12   | Goa                 | 1

-- View all villages with their hierarchy
SELECT 
  v.id,
  v.name as village_name,
  sd.name as subdistrict_name,
  d.name as district_name,
  s.name as state_name
FROM village v
JOIN sub_district sd ON v.sub_district_id = sd.id
JOIN district d ON sd.district_id = d.id
JOIN state s ON d.state_id = s.id
ORDER BY s.name, d.name, sd.name, v.name;

-- Expected sample row:
-- 525002 | Manibeli | Akkalkuwa | Nandurbar | Maharashtra

-- Check user
SELECT * FROM user WHERE email = 'demo@example.com';
```

---

## Troubleshooting

### Error: "connect ECONNREFUSED"

**Cause:** PostgreSQL not running

**Solution:**
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows
# Open Services and start PostgreSQL service
```

### Error: "password authentication failed"

**Cause:** Wrong password or user

**Solution:**
```bash
# Verify user and password in .env
# Recreate user with:
psql -U postgres -c "DROP USER indian_api;"
psql -U postgres -c "CREATE USER indian_api WITH PASSWORD 'new_password';"
```

### Error: "database "indian_locations" does not exist"

**Cause:** Database not created

**Solution:**
```bash
psql -U postgres -c "CREATE DATABASE indian_locations;"
```

### Error: "no database_url environment variable found"

**Cause:** .env file not loaded

**Solution:**
```bash
# Verify .env exists in backend/
ls -la backend/.env

# Verify DATABASE_URL is set
cat backend/.env | grep DATABASE_URL
```

### Error: "unexpected end of file in Prisma schema"

**Cause:** Syntax error in schema.prisma

**Solution:**
```bash
# Validate schema
npm run prisma:validate

# Fix any errors shown
# Common issues: missing comma, unclosed brace
```

### Migration Already Applied

**Cause:** Running migrate when migration already applied

**Solution:**
```bash
# Skip - it's safe, Prisma will detect and skip
# Or reset database (development only!)
npm run prisma:migrate reset
```

---

## Understanding Migrations

### What Happened

Each migration:
1. Reads current schema.prisma
2. Compares to last migration
3. Generates SQL to apply changes
4. Creates folder in `prisma/migrations/`
5. Executes SQL against database

### Viewing Migration SQL

```bash
# See migration files
ls -la prisma/migrations/

# View generated SQL
cat prisma/migrations/*/migration.sql
```

### Making Schema Changes

After Phase 3, to modify schema:

```bash
# 1. Edit prisma/schema.prisma
# 2. Run migration
npm run prisma:migrate

# 3. Name the migration (e.g., "add_user_role_field")
# 4. Prisma generates and applies SQL
```

---

## Data Integrity Checks

```sql
-- Verify foreign key relationships
SELECT COUNT(*) as orphan_villages
FROM village v
WHERE v.sub_district_id NOT IN (SELECT id FROM sub_district);
-- Expected: 0

-- Verify all states have country
SELECT COUNT(*) FROM state WHERE country_id IS NULL;
-- Expected: 0

-- Verify cascade relationships
SELECT sd.id, sd.name FROM sub_district sd
LEFT JOIN district d ON sd.district_id = d.id
WHERE d.id IS NULL;
-- Expected: no rows (all sub-districts have parent district)
```

---

## Next Steps After Phase 3

After successful migration and seeding:

1. **Verify the data** - All tables populated correctly
2. **Test queries** - Location hierarchy works
3. **Check indexes** - Performance queries work
4. **Move to Phase 4** - Python data import pipeline

To view all data in browser:
```bash
npm run prisma:studio
```

---

## Summary

**Phase 3 Checklist:**
- [ ] PostgreSQL installed and running
- [ ] Database `indian_locations` created
- [ ] .env file configured with DATABASE_URL
- [ ] npm install completed
- [ ] npm run prisma:generate succeeded
- [ ] npm run prisma:migrate completed
- [ ] npm run prisma:seed completed
- [ ] Test connection passed
- [ ] Data visible in Prisma Studio

**On Completion:**
- ✅ 9 database tables created
- ✅ 15 sample records seeded
- ✅ Relationships verified
- ✅ Ready for Phase 4 (Python data import)

---

## Important Notes

### Development Database Tips

- **Keep local.db separate** if using SQLite fallback
- **Backup before major changes** in production
- **Use seed for testing** rather than manual inserts
- **Recreate from migrations** for fresh start: `npm run prisma:migrate reset`

### Production Considerations

- Use NeonDB for managed PostgreSQL
- Keep DATABASE_URL secure (never in version control)
- Use connection pooling for production
- Set up automated backups
- Monitor disk usage (600k villages will grow)

### Common Patterns

```bash
# Fresh start (development only!)
npm run prisma:migrate reset

# View all data
npm run prisma:studio

# Check schema validity
npm run prisma:validate

# Generate client after schema changes
npm run prisma:generate

# View a specific migration
cat prisma/migrations/*/migration.sql
```

---

**Ready to migrate? Run the steps above in order.**

For help, check troubleshooting section or review [docs/DATABASE.md](../docs/DATABASE.md) for detailed schema info.
