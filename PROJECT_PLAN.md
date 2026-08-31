# Indian Administrative Location API - Implementation Plan

**Date:** 2026-08-30  
**Status:** Planning Phase  

---

## 1. PROJECT ANALYSIS

### Objective
Build a production-ready full-stack platform for querying Indian administrative location hierarchies using MDDS dataset data.

### Key Features
- ✅ Location hierarchy management (Country → State → District → SubDistrict → Village)
- ✅ REST API with filtering and search
- ✅ JWT & API-key authentication
- ✅ Redis caching and rate limiting
- ✅ React + Vite dashboard
- ✅ Python data import pipeline
- ✅ Analytics with Recharts
- ✅ Vercel deployment ready

---

## 2. PROPOSED FOLDER STRUCTURE

```
Indian-Administrative-Location-API/
│
├── backend/                          # Express.js server
│   ├── src/
│   │   ├── server.ts                 # Express app entry
│   │   ├── config/                   # Configuration files
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── environment.ts
│   │   │
│   │   ├── routes/                   # Route definitions
│   │   │   ├── v1.ts
│   │   │   ├── auth.ts
│   │   │   ├── admin.ts
│   │   │   └── b2b.ts
│   │   │
│   │   ├── controllers/              # Business logic
│   │   │   ├── locationController.ts
│   │   │   ├── authController.ts
│   │   │   ├── apiKeyController.ts
│   │   │   └── analyticsController.ts
│   │   │
│   │   ├── services/                 # Data layer logic
│   │   │   ├── locationService.ts
│   │   │   ├── userService.ts
│   │   │   ├── cacheService.ts
│   │   │   └── analyticsService.ts
│   │   │
│   │   ├── middleware/               # Express middleware
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   ├── rateLimit.ts
│   │   │   └── validation.ts
│   │   │
│   │   ├── utils/                    # Utility functions
│   │   │   ├── jwt.ts
│   │   │   ├── bcrypt.ts
│   │   │   ├── logger.ts
│   │   │   └── validators.ts
│   │   │
│   │   └── types/                    # TypeScript types
│   │       └── index.ts
│   │
│   ├── .env.example
│   ├── .env.production.example
│   ├── tsconfig.json
│   ├── package.json
│   └── README.md
│
├── frontend/                         # React + Vite app
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   │
│   │   ├── components/               # Reusable components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── LocationPicker.tsx
│   │   │   └── AnalyticsChart.tsx
│   │   │
│   │   ├── pages/                    # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── LocationExplorer.tsx
│   │   │   ├── VillageSearch.tsx
│   │   │   ├── VillageDetail.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── ApiKeys.tsx
│   │   │   └── Analytics.tsx
│   │   │
│   │   ├── services/                 # API client
│   │   │   ├── api.ts
│   │   │   └── auth.ts
│   │   │
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   └── useApi.ts
│   │   │
│   │   ├── types/                    # TypeScript types
│   │   │   └── index.ts
│   │   │
│   │   ├── styles/                   # CSS/styling
│   │   │   └── index.css
│   │   │
│   │   └── utils/                    # Utility functions
│   │       └── localStorage.ts
│   │
│   ├── .env.example
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── README.md
│
├── prisma/                           # Prisma ORM
│   ├── schema.prisma                 # Database schema
│   ├── migrations/
│   └── seed.ts                       # Seed script
│
├── data-import/                      # Python data import
│   ├── importer.py                   # Main import script
│   ├── validators.py                 # Data validation
│   ├── config.py                     # Configuration
│   ├── requirements.txt              # Python dependencies
│   ├── .env.example
│   └── README.md
│
├── docs/                             # Documentation
│   ├── API.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   ├── DATA_IMPORT.md
│   └── ARCHITECTURE.md
│
├── .gitignore
├── README.md
└── DEVELOPMENT.md
```

---

## 3. TECHNOLOGY STACK & DEPENDENCIES

### Backend (Node.js + Express)
```
Core:
- express@4.18.x
- typescript@5.x
- @types/express
- @types/node

Database & ORM:
- @prisma/client
- prisma (dev dependency)

Authentication:
- jsonwebtoken
- bcryptjs
- @types/jsonwebtoken

Caching & Rate Limiting:
- redis
- express-rate-limit
- rate-limit-redis

Validation:
- zod (or joi)
- express-validator

Utilities:
- dotenv
- cors
- helmet
- morgan (logging)
- uuid

Development:
- ts-node
- nodemon
- @types/jest
- jest
- tsx
```

### Frontend (React + Vite)
```
Core:
- react@18.x
- react-dom@18.x
- react-router-dom
- vite
- typescript

UI & Styling:
- tailwindcss (for styling)
- recharts (analytics)

State & HTTP:
- axios (or fetch)
- zustand (or context for state)

Development:
- @vitejs/plugin-react
- @types/react
- @types/node
```

### Python (Data Import)
```
- pandas
- openpyxl
- psycopg2-binary (PostgreSQL driver)
- python-dotenv
- requests (for logging)
```

### Infrastructure
```
- NeonDB (PostgreSQL)
- Upstash Redis
- Vercel (deployment)
```

---

## 4. REQUIRED ENVIRONMENT VARIABLES

### Backend .env
```
# Database
DATABASE_URL=postgresql://user:password@host/dbname

# JWT
JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_EXPIRY=7d

# Redis
REDIS_URL=redis://default:password@host:6379
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# API Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend .env
```
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Indian Administrative Location API
```

### Python Import .env
```
DATABASE_URL=postgresql://user:password@host/dbname
EXCEL_FILE_PATH=./data/mdds_data.xlsx
LOG_FILE_PATH=./logs/import.log
BATCH_SIZE=5000
```

---

## 5. DATABASE SCHEMA OVERVIEW

### Core Hierarchy Tables
- **Country** - India record
- **State** - 36 states/UTs
- **District** - ~700 districts
- **SubDistrict** - ~6,000 sub-districts
- **Village** - ~600,000 villages

### User Management
- **User** - registered users with authentication
- **ApiKey** - API keys for B2B clients
- **UserStateAccess** - state-level access control

### Analytics
- **ApiLog** - API request logs for analytics

### Key Indexes
- Village.name (with pg_trgm for full-text search)
- Village.subDistrictId
- SubDistrict.districtId
- District.stateId
- ApiLog.createdAt
- ApiLog.userId
- ApiKey.key

---

## 6. API ENDPOINTS OVERVIEW

### Locations (Public with rate limiting)
```
GET  /api/v1/states
GET  /api/v1/districts?stateCode=27
GET  /api/v1/subdistricts?districtCode=497
GET  /api/v1/villages?subDistrictCode=03950
GET  /api/v1/villages/search?query=Manibeli
GET  /api/v1/villages/:id
```

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

### API Keys (User)
```
GET  /api/v1/apikeys
POST /api/v1/apikeys
DELETE /api/v1/apikeys/:id
```

### Analytics (User)
```
GET  /api/v1/analytics
GET  /api/v1/analytics/usage
```

### Admin
```
GET  /api/admin/users
POST /api/admin/users/:id/revoke
```

### B2B
```
GET  /api/b2b/locations (authenticated via API key)
```

---

## 7. TECHNICAL CONSIDERATIONS & DECISIONS

### Database
- **NeonDB (Serverless PostgreSQL)**: Chosen for Vercel compatibility and serverless scaling
- **Prisma ORM**: Type-safe database access with migrations
- **pg_trgm**: For efficient village name searches (can be added later)

### Authentication
- **JWT**: Stateless auth for scalability
- **API Keys**: For B2B clients with rate limiting per key
- **bcrypt**: Password hashing (NOT plaintext)

### Caching Strategy
- Cache frequently accessed:
  - States list (static)
  - Districts by state (low change frequency)
  - Search results (temporary)
  - User API usage counters

### Rate Limiting
- Global rate limit: 100 requests per 15 minutes (development)
- Per API key limits: Configurable
- Graceful degradation if Redis unavailable

### Data Import
- **Python script**: Separate from main app
- **Idempotent design**: Safe to run multiple times
- **Batch processing**: Villages in 5,000 record batches
- **Error handling**: Log failures, continue processing
- **Validation**: Duplicates, nulls, format checks

### Deployment Strategy
- Frontend → Vercel (Static + API routes if needed)
- Backend → Vercel Functions or external server
- Database → NeonDB
- Cache → Upstash Redis
- Environment separation: dev, staging, production

### Potential Issues & Solutions
| Issue | Solution |
|-------|----------|
| Redis unavailable in dev | Graceful fallback to direct DB queries |
| Large village dataset import | Batch processing, progress tracking |
| Database connection pooling | Prisma Client manages this |
| CORS in Vercel | Configure headers in deployment |
| Secrets in frontend | Use environment variables, never commit .env |

---

## 8. DEVELOPMENT PHASES

### Phase 1: Project Structure & Configuration ✅ COMPLETE
- [x] Initialize Git
- [x] Create folder structure
- [x] Setup package.json files
- [x] Create .env.example files
- [x] Setup TypeScript configuration
- [x] Create README files
- **Deliverable:** Clean, buildable project structure

### Phase 2: Prisma Schema & Database Connection ✅ COMPLETE
- [x] Create Prisma schema with all models (9 tables)
- [x] Setup NeonDB connection
- [x] Create Prisma client wrapper
- [x] Setup migrations
- [x] Create TypeScript types for backend and frontend
- [x] Create seed script with sample data (15 records)
- **Deliverable:** Database models defined, seed script ready

### Phase 3: Database Migration & Seed Data ⏳ IN PROGRESS
- [ ] Run migrations (`npm run prisma:migrate`)
- [ ] Execute seed script (`npm run prisma:seed`)
- [ ] Verify data retrieval
- [ ] Verify relationships integrity
- **Deliverable:** Database populated with test data
- **Setup Guide:** [docs/PHASE_3_SETUP.md](docs/PHASE_3_SETUP.md)
- **Validation Scripts:**
  - `bash docs/phase3-validate.sh` (Linux/macOS)
  - `docs/phase3-validate.bat` (Windows)
  - `python docs/phase3-verify.py` (Post-migration verification)

### Phase 4: Python Data Import Pipeline
- Build Excel reader with validation
- Create data cleaner and transformer
- Build upsert logic
- Create logging and summary reports
- **Deliverable:** Import script ready (tested with small dataset)

### Phase 5: Express REST APIs
- Setup Express app structure
- Implement location endpoints
- Add error handling middleware
- Create response formatting
- **Deliverable:** Working /api/v1 endpoints

### Phase 6: Authentication & API Keys
- JWT implementation
- bcrypt password hashing
- User registration & login
- API key generation & verification
- **Deliverable:** Auth middleware protecting endpoints

### Phase 7: React Frontend
- Setup React + Vite project
- Create layout components
- Build location explorer pages
- Implement search functionality
- **Deliverable:** Working UI for browsing locations

### Phase 8: Redis & Rate Limiting
- Setup Redis connection
- Implement caching service
- Add express-rate-limit
- Create cache invalidation strategy
- **Deliverable:** Caching and rate limiting working

### Phase 9: Testing & Error Handling
- Write API endpoint tests
- Test authentication flow
- Test rate limiting
- Error handling verification
- **Deliverable:** Test suite passing

### Phase 10: Deployment Preparation
- Create production build configurations
- Setup CI/CD basics
- Document deployment steps
- Test Vercel deployment
- **Deliverable:** Ready for production

### Phase 11: Documentation
- Complete API documentation
- Add setup instructions
- Document architecture
- Add deployment guide
- **Deliverable:** Professional documentation

---

## 9. STARTING CHECKLIST

Before starting Phase 1, verify:
- ✅ Project folder is empty (ready for scaffolding)
- ✅ Requirements analyzed
- ✅ Folder structure planned
- ✅ Dependencies identified
- ✅ Environment variables documented
- ✅ Database design confirmed
- ✅ API endpoints mapped
- ✅ Deployment strategy clear

---

## 10. NEXT STEPS

1. Review this plan
2. Ask questions about any section
3. Begin **PHASE 1: Project Structure & Configuration**
4. Verify project builds successfully
5. Proceed to Phase 2

---

**Note:** This is a professional, production-ready application. All code will be:
- Type-safe (TypeScript)
- Testable
- Deployable
- Documented
- Free of hardcoded secrets
- Following best practices
