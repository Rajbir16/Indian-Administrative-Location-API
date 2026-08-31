# Database Design & Schema

Complete database schema documentation for the Indian Administrative Location API.

## Overview

The database follows a normalized relational design (3NF) using PostgreSQL. It consists of 9 tables organized into three logical groups:

1. **Location Hierarchy** - 5 tables for administrative divisions
2. **User Management** - 3 tables for authentication and access control
3. **Analytics** - 1 table for request logging

## Schema Diagram

```
Country (1)
  |
  +--- State (36)
        |
        +--- District (~700)
              |
              +--- SubDistrict (~6000)
                    |
                    +--- Village (~600k)

User (n)
  |
  +--- ApiKey (n)
  |
  +--- UserStateAccess (n) ← State
  |
  +--- ApiLog (n)
           |
           +--- ApiKey
```

## Table Specifications

### 1. Country

Represents countries (currently only India).

**Schema:**
```sql
CREATE TABLE country (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) UNIQUE NOT NULL,
  code        VARCHAR(10) UNIQUE NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status      VARCHAR(20) DEFAULT 'active'
);
```

**Purpose:** Root of location hierarchy
**Records:** 1 (India)
**Key Fields:**
- `id` - Primary key
- `code` - ISO 3166-1 code (IN for India)
- `name` - Country name
- `status` - active/inactive

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `code`, `name`

---

### 2. State

Represents Indian states and union territories.

**Schema:**
```sql
CREATE TABLE state (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(10) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  country_id  INTEGER NOT NULL REFERENCES country(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status      VARCHAR(20) DEFAULT 'active'
);
```

**Purpose:** Administrative division level 1
**Records:** 36 (28 states + 8 UTs)
**Key Fields:**
- `code` - MDDS state code (STC)
- `name` - State name
- `country_id` - Foreign key to Country

**Relationships:**
- One Country has many States
- One State has many Districts

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `code`
- FOREIGN KEY INDEX on `country_id`

**Example:**
```
Code: 27
Name: Maharashtra
Country ID: 1
```

---

### 3. District

Represents districts within states.

**Schema:**
```sql
CREATE TABLE district (
  id        SERIAL PRIMARY KEY,
  code      VARCHAR(10) UNIQUE NOT NULL,
  name      VARCHAR(255) NOT NULL,
  state_id  INTEGER NOT NULL REFERENCES state(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status    VARCHAR(20) DEFAULT 'active'
);
```

**Purpose:** Administrative division level 2
**Records:** ~700
**Key Fields:**
- `code` - MDDS district code (DTC)
- `name` - District name
- `state_id` - Foreign key to State

**Relationships:**
- One State has many Districts
- One District has many SubDistricts

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `code`
- FOREIGN KEY INDEX on `state_id`

**Example:**
```
Code: 497
Name: Nandurbar
State ID: 27
```

---

### 4. SubDistrict

Represents sub-districts (taluks/blocks) within districts.

**Schema:**
```sql
CREATE TABLE sub_district (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(10) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  district_id INTEGER NOT NULL REFERENCES district(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status      VARCHAR(20) DEFAULT 'active'
);
```

**Purpose:** Administrative division level 3
**Records:** ~6,000
**Key Fields:**
- `code` - MDDS sub-district code (Sub_DT)
- `name` - Sub-district name
- `district_id` - Foreign key to District

**Relationships:**
- One District has many SubDistricts
- One SubDistrict has many Villages

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `code`
- FOREIGN KEY INDEX on `district_id`

**Example:**
```
Code: 03950
Name: Akkalkuwa
District ID: 497
```

---

### 5. Village

Represents villages/localities.

**Schema:**
```sql
CREATE TABLE village (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(10) UNIQUE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  sub_district_id INTEGER NOT NULL REFERENCES sub_district(id) ON DELETE CASCADE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status          VARCHAR(20) DEFAULT 'active'
);
```

**Purpose:** Administrative division level 4 (leaf level)
**Records:** ~600,000
**Key Fields:**
- `code` - MDDS village code (PLCN)
- `name` - Village/area name
- `sub_district_id` - Foreign key to SubDistrict

**Relationships:**
- One SubDistrict has many Villages
- Many Villages per SubDistrict

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `code`
- FOREIGN KEY INDEX on `sub_district_id`
- INDEX on `name` (full-text search)
- COMPOSITE INDEX on (sub_district_id, name)

**Example:**
```
Code: 525002
Name: Manibeli
SubDistrict ID: 03950
```

**Note:** This table will contain the largest volume of data (~600k records). Indexes on name and sub_district_id are critical for performance.

---

### 6. User

Represents registered users of the system.

**Schema:**
```sql
CREATE TABLE user (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  first_name      VARCHAR(255),
  last_name       VARCHAR(255),
  plan_type       VARCHAR(20) DEFAULT 'free',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status          VARCHAR(20) DEFAULT 'active'
);
```

**Purpose:** Store user accounts for dashboard access
**Records:** Variable (grows with user signups)
**Key Fields:**
- `email` - Unique email address
- `password_hash` - Bcrypt-hashed password (NEVER plaintext)
- `plan_type` - free, basic, premium, enterprise
- `status` - active, suspended, deleted

**Relationships:**
- One User has many ApiKeys
- One User has many ApiLogs
- One User has many UserStateAccess records

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `email`

**Security Notes:**
- Password MUST be hashed with bcrypt before storage
- Never expose password_hash in API responses
- Implement password reset via email token

---

### 7. ApiKey

Represents API keys for B2B/programmatic access.

**Schema:**
```sql
CREATE TABLE api_key (
  id            SERIAL PRIMARY KEY,
  key           VARCHAR(255) UNIQUE NOT NULL,
  secret_hash   VARCHAR(255) NOT NULL,
  name          VARCHAR(255),
  user_id       INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  last_used_at  TIMESTAMP,
  request_count INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status        VARCHAR(20) DEFAULT 'active'
);
```

**Purpose:** Enable programmatic API access with rate limiting per key
**Records:** Variable (one or more per user)
**Key Fields:**
- `key` - Public API key (shared with client)
- `secret_hash` - Hashed secret key (NEVER exposed)
- `user_id` - Owner of the key
- `request_count` - Total requests made with this key
- `last_used_at` - Timestamp of last API call
- `status` - active, revoked, expired

**Relationships:**
- Many ApiKeys per User
- One ApiKey has many ApiLogs

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `key`
- FOREIGN KEY INDEX on `user_id`

**Security Notes:**
- `key` is shown only once when created
- `secret_hash` is never exposed after creation
- Implement key rotation mechanism

**Example:**
```
Key: INDIAN_LOC_a1b2c3d4e5f6
Secret Hash: $2b$10$... (bcrypt hash)
User ID: 42
Status: active
```

---

### 8. UserStateAccess

Represents state-level access control for users.

**Schema:**
```sql
CREATE TABLE user_state_access (
  id        SERIAL PRIMARY KEY,
  user_id   INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  state_id  INTEGER NOT NULL REFERENCES state(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint to prevent duplicates
ALTER TABLE user_state_access ADD CONSTRAINT uq_user_state UNIQUE (user_id, state_id);
```

**Purpose:** Implement state-level access control
**Records:** Variable (typically few per user)
**Key Fields:**
- `user_id` - User who has access
- `state_id` - State they can access

**Usage:** Restrict users to access only specific states' data

**Relationships:**
- Many UserStateAccess records per User
- Many UserStateAccess records per State
- Join table for User-State many-to-many relationship

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on (user_id, state_id)
- INDEX on `user_id`
- INDEX on `state_id`

**Queries:**
```sql
-- Find states accessible by user
SELECT s.* FROM state s
JOIN user_state_access usa ON s.id = usa.state_id
WHERE usa.user_id = 42;

-- Find users with access to a state
SELECT u.* FROM user u
JOIN user_state_access usa ON u.id = usa.user_id
WHERE usa.state_id = 27;
```

---

### 9. ApiLog

Stores API request logs for analytics and auditing.

**Schema:**
```sql
CREATE TABLE api_log (
  id              SERIAL PRIMARY KEY,
  endpoint        VARCHAR(255) NOT NULL,
  method          VARCHAR(10) NOT NULL,
  status_code     INTEGER,
  response_time   INTEGER NOT NULL, -- milliseconds
  user_agent      TEXT,
  ip_address      VARCHAR(45), -- IPv4 or IPv6
  user_id         INTEGER REFERENCES user(id) ON DELETE SET NULL,
  api_key_id      INTEGER REFERENCES api_key(id) ON DELETE SET NULL,
  error_message   TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:** Log all API requests for analytics, monitoring, and rate limiting
**Records:** High volume (~millions over time)
**Key Fields:**
- `endpoint` - API path (e.g., /api/v1/villages/search)
- `method` - HTTP method (GET, POST, etc.)
- `status_code` - HTTP response code
- `response_time` - Execution time in milliseconds
- `user_id` - User making request (if authenticated)
- `api_key_id` - API key used (if B2B)
- `error_message` - Error details if request failed

**Relationships:**
- Many ApiLogs per User (optional)
- Many ApiLogs per ApiKey (optional)

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `created_at` (crucial for time-based queries)
- INDEX on `user_id` (analytics queries)
- INDEX on `api_key_id` (per-key rate limiting)
- COMPOSITE INDEX on (user_id, created_at)
- COMPOSITE INDEX on (api_key_id, created_at)

**Analytics Queries:**
```sql
-- Requests per endpoint today
SELECT endpoint, COUNT(*) as count
FROM api_log
WHERE created_at::date = CURRENT_DATE
GROUP BY endpoint
ORDER BY count DESC;

-- Average response time per endpoint
SELECT endpoint, AVG(response_time) as avg_time
FROM api_log
GROUP BY endpoint;

-- Failed requests (4xx, 5xx)
SELECT * FROM api_log
WHERE status_code >= 400
ORDER BY created_at DESC
LIMIT 100;

-- Top users
SELECT user_id, COUNT(*) as count
FROM api_log
WHERE user_id IS NOT NULL
GROUP BY user_id
ORDER BY count DESC
LIMIT 10;
```

**Note:** This table grows rapidly. Consider archiving old logs monthly.

---

## Data Types & Constraints

### Column Types

| Type | Usage | Examples |
|------|-------|----------|
| SERIAL | Auto-increment ID | Primary keys |
| VARCHAR(n) | Text with max length | Names, codes, emails |
| INTEGER | Whole numbers | Counts, milliseconds |
| TIMESTAMP | Date and time | Audit fields |
| TEXT | Large text | Error messages |

### Constraints

| Constraint | Purpose | Examples |
|-----------|---------|----------|
| PRIMARY KEY | Unique identifier | `id SERIAL PRIMARY KEY` |
| UNIQUE | Prevent duplicates | `code VARCHAR(10) UNIQUE` |
| FOREIGN KEY | Referential integrity | `country_id INT REFERENCES country(id)` |
| NOT NULL | Mandatory fields | `name VARCHAR(255) NOT NULL` |
| DEFAULT | Auto-populated values | `status VARCHAR(20) DEFAULT 'active'` |
| CHECK | Value validation | `status IN ('active', 'inactive')` |

### ON DELETE Behavior

- **CASCADE**: Delete related records (used for location hierarchy)
- **SET NULL**: Nullify foreign key (used for optional relationships)
- **RESTRICT**: Prevent deletion if related records exist (not used here)

---

## Indexes & Performance

### Strategic Indexes

**Location Hierarchy Search:**
```sql
-- Village search by name
CREATE INDEX idx_village_name ON village(name);
CREATE INDEX idx_village_subdist_name ON village(sub_district_id, name);

-- District by state
CREATE INDEX idx_district_state ON district(state_id);
```

**User & Authentication:**
```sql
-- User lookup
CREATE INDEX idx_user_email ON user(email);

-- API key lookup
CREATE INDEX idx_apikey_key ON api_key(key);
CREATE INDEX idx_apikey_user ON api_key(user_id);
```

**Analytics:**
```sql
-- Time-based queries
CREATE INDEX idx_apilog_created ON api_log(created_at DESC);

-- User analytics
CREATE INDEX idx_apilog_user_created ON api_log(user_id, created_at DESC);

-- API key analytics
CREATE INDEX idx_apilog_apikey_created ON api_log(api_key_id, created_at DESC);
```

### Index Maintenance

```sql
-- Analyze index usage
SELECT * FROM pg_stat_user_indexes;

-- Reindex if needed
REINDEX INDEX index_name;

-- Vacuuming (cleanup)
VACUUM ANALYZE;
```

---

## Relationships

### Location Hierarchy (1-to-Many)

```
Country (1) ──→ (n) State
             ↓
          (1) ──→ (n) District
             ↓
          (1) ──→ (n) SubDistrict
             ↓
          (1) ──→ (n) Village
```

**Properties:**
- Parent deletion cascades to children
- Each child has exactly one parent
- Navigable in both directions with proper queries

### User Access Control (Many-to-Many)

```
User (n) ──→ UserStateAccess (join) ──→ (n) State
```

**Properties:**
- A user can have access to multiple states
- Multiple users can access the same state
- Enforced with unique constraint on (user_id, state_id)

### API Usage Tracking

```
User (1) ──→ (n) ApiLog
   ↓
ApiKey (1) ──→ (n) ApiLog
```

**Properties:**
- Requests can be user-authenticated or API-key authenticated
- Both are optional (public requests have neither)
- Enables per-user and per-key rate limiting

---

## Data Migration & Import

### Excel to Database Mapping

| Excel Column | Database Field | Table |
|-------------|--------|-------|
| MDDS STC | code | state |
| STATE NAME | name | state |
| MDDS DTC | code | district |
| DISTRICT NAME | name | district |
| MDDS Sub_DT | code | sub_district |
| SUB-DISTRICT NAME | name | sub_district |
| MDDS PLCN | code | village |
| Area Name | name | village |

### Import Process

1. Read Excel file with pandas
2. Validate and clean data
3. Create India country record
4. Upsert states (all 36)
5. Upsert districts (validate parent state exists)
6. Upsert sub-districts (validate parent district exists)
7. Batch insert villages (5,000 per batch)
8. Verify referential integrity
9. Generate summary report

---

## Deployment Considerations

### PostgreSQL Version
- **Minimum:** 12
- **Recommended:** 14+
- **NeonDB:** Latest (serverless PostgreSQL)

### Connection Pooling
- Use PgBouncer or built-in pooling
- Recommended pool size: 20-40 connections
- Timeout: 30 seconds

### Backup Strategy
- Daily automated backups
- 30-day retention
- Weekly full dumps
- Monthly archives

### Monitoring Queries
```sql
-- Table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Index usage
SELECT indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Slow queries (if log_min_duration_statement is set)
SELECT query, mean_time, max_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC;
```

---

## Troubleshooting

### Connection Issues
- Verify DATABASE_URL format
- Check PostgreSQL is running
- Verify credentials
- Check network access (firewall)

### Query Performance
- Analyze with `EXPLAIN ANALYZE`
- Check index usage: `pg_stat_user_indexes`
- Consider query rewriting
- Add missing indexes

### Data Integrity
- Check foreign key constraints
- Verify cascade delete behavior
- Run integrity checks

### Disk Space
- Monitor table/index sizes
- Archive old API logs
- Vacuum and analyze regularly

---

## Future Enhancements

1. **Full-Text Search**: Add pg_trgm for fuzzy village name search
2. **Partitioning**: Partition ApiLog by date for better performance
3. **Replication**: Set up read replicas for analytics
4. **Caching**: Layer with Redis for frequently accessed hierarchies
5. **Versioning**: Track historical changes with temporal tables
6. **Geospatial**: Add PostGIS for location-based queries

---

**Last Updated:** Phase 2 - Database Schema Design
