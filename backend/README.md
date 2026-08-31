# Indian Administrative Location API — Backend

A TypeScript-based REST API for accessing structured Indian administrative location data.

The backend provides APIs for states, districts, sub-districts, and villages, along with village search, JWT authentication, API-key authentication, Redis caching, and Redis-based rate limiting.

---

## Features

- RESTful API using Express.js
- TypeScript for type-safe development
- PostgreSQL database
- NeonDB PostgreSQL hosting
- Prisma ORM
- Indian administrative location hierarchy
- State, District, Sub-District, and Village APIs
- Village search
- JWT-based authentication
- User registration and login
- Protected authentication endpoints
- API key creation
- API key authentication
- API key revocation
- Redis caching
- Redis-based rate limiting
- Environment variable validation with Zod
- Helmet security middleware
- CORS configuration
- Morgan HTTP request logging
- Graceful server shutdown
- Health check endpoint
- Input and configuration validation

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API framework |
| TypeScript | Type-safe backend development |
| PostgreSQL | Relational database |
| NeonDB | Hosted PostgreSQL database |
| Prisma | Database ORM |
| Redis | Caching and rate limiting |
| JWT | User authentication |
| Zod | Environment validation |
| Helmet | HTTP security headers |
| CORS | Cross-origin request handling |
| Morgan | HTTP request logging |

---

## Project Structure

```text
backend/
├── src/
│   ├── server.ts
│   │
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── environment.ts
│   │   └── index.ts
│   │
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── apiKey.ts
│   │
│   ├── routes/
│   │   ├── location.routes.ts
│   │   ├── auth.routes.ts
│   │   └── apiKey.routes.ts
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   └── utils/
│       └── test-db-connection.ts
│
├── prisma/
│   └── schema.prisma
│
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

# Development Setup

## Prerequisites

Make sure the following are installed:

- Node.js
- npm
- PostgreSQL-compatible database
- Redis instance

The project uses NeonDB for PostgreSQL and can use Redis locally or a hosted Redis provider such as Upstash.

---

## Installation

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Generate the Prisma client:

```bash
npx prisma generate
```

---

## Environment Variables

Create a `.env` file in the backend directory.

Example:

```env
DATABASE_URL=your_postgresql_connection_string

JWT_SECRET=your_secure_jwt_secret_at_least_32_characters_long
JWT_EXPIRY=7d

REDIS_URL=your_redis_connection_url

PORT=3000
NODE_ENV=development

CORS_ORIGIN=http://localhost:5173

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

API_KEY_PREFIX=INDIAN_LOC_
```

### Environment Variables Description

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL/NeonDB connection string |
| `JWT_SECRET` | Secret used to sign JWT tokens |
| `JWT_EXPIRY` | JWT token expiration duration |
| `REDIS_URL` | Redis connection URL |
| `PORT` | Backend server port |
| `NODE_ENV` | Application environment |
| `CORS_ORIGIN` | Allowed frontend origin |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit time window |
| `RATE_LIMIT_MAX_REQUESTS` | Maximum requests allowed per window |
| `API_KEY_PREFIX` | Prefix used for generated API keys |

Redis is optional for local development. If `REDIS_URL` is not configured, the application can continue without Redis.

---

# Running the Application

## Development

Start the development server:

```bash
npm run dev
```

The backend normally runs at:

```text
http://localhost:3000
```

---

## Production Build

Compile the TypeScript project:

```bash
npm run build
```

Start the compiled application:

```bash
npm start
```

---

# Database

The project uses PostgreSQL through Prisma ORM.

The database is hosted using NeonDB.

Prisma is responsible for database access and querying.

Generate the Prisma client:

```bash
npx prisma generate
```

Run Prisma migrations when required:

```bash
npx prisma migrate dev
```

Open Prisma Studio:

```bash
npx prisma studio
```

---

# Administrative Location Hierarchy

The location data follows this hierarchy:

```text
State / Union Territory
        ↓
District
        ↓
Sub-District
        ↓
Village
```

This structure allows applications to navigate Indian administrative locations efficiently.

---

# Location APIs

The location APIs are available under:

```text
/api/v1
```

---

## Get All States

```http
GET /api/v1/states
```

Returns all active states and union territories.

Example:

```json
{
  "success": true,
  "count": 30,
  "data": [
    {
      "id": 47,
      "code": "35",
      "name": "ANDAMAN & NICOBAR ISLANDS"
    }
  ]
}
```

---

## Get Districts by State Code

```http
GET /api/v1/districts/:stateCode
```

Example:

```http
GET /api/v1/districts/27
```

Returns districts belonging to the specified state.

---

## Get Sub-Districts by District Code

```http
GET /api/v1/subdistricts/:districtCode
```

Example:

```http
GET /api/v1/subdistricts/497
```

Returns sub-districts belonging to the specified district.

---

## Get Villages by Sub-District Code

```http
GET /api/v1/villages/:subDistrictCode
```

Example:

```http
GET /api/v1/villages/03950
```

Returns villages belonging to the specified sub-district.

---

## Search Villages

```http
GET /api/v1/villages/search?q=Manibeli
```

The search endpoint performs a case-insensitive village-name search.

Example response:

```json
{
  "success": true,
  "query": "Manibeli",
  "count": 1,
  "data": [
    {
      "code": "525002",
      "name": "Manibeli",
      "subDistrict": {
        "code": "03950",
        "name": "Akkalkuwa"
      },
      "district": {
        "code": "497",
        "name": "Nandurbar"
      },
      "state": {
        "code": "27",
        "name": "MAHARASHTRA"
      }
    }
  ]
}
```

---

# Health Check

The backend provides a health-check endpoint:

```http
GET /health
```

Example response:

```json
{
  "status": "ok",
  "timestamp": "2026-08-30T00:00:00.000Z",
  "environment": "development"
}
```

---

# Authentication

The backend uses JSON Web Tokens (JWT) for user authentication.

Authentication endpoints are available under:

```text
/api/auth
```

---

## User Registration

```http
POST /api/auth/register
```

Example request:

```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

A successful registration returns authentication information including a JWT token.

---

## User Login

```http
POST /api/auth/login
```

Example request:

```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

A successful login returns a JWT token.

---

## Get Current User

```http
GET /api/auth/me
```

Requires the JWT token in the Authorization header:

```http
Authorization: Bearer <JWT_TOKEN>
```

Example:

```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "userId": 1,
    "email": "user@example.com"
  }
}
```

---

# API Key Management

API key management is protected using JWT authentication.

The API key management base path is:

```text
/api/auth/api-keys
```

---

## Create API Key

```http
POST /api/auth/api-keys
```

Requires:

```http
Authorization: Bearer <JWT_TOKEN>
```

Example request:

```json
{
  "name": "My Application"
}
```

Generated API keys use the configured prefix:

```text
INDIAN_LOC_
```

Example:

```text
INDIAN_LOC_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## List API Keys

```http
GET /api/auth/api-keys
```

Requires:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## Revoke API Key

```http
DELETE /api/auth/api-keys/:id
```

Requires:

```http
Authorization: Bearer <JWT_TOKEN>
```

A revoked API key can no longer be used for API-key authentication.

---

## Test API Key Authentication

```http
GET /api/auth/api-key-test
```

The endpoint verifies the supplied API key and returns the associated API key and user information when authentication succeeds.

---

# Redis

Redis is used for two important backend functions:

1. Caching
2. Rate limiting

---

## Redis Caching

Location API responses can be cached in Redis to reduce repeated database queries and improve response performance.

Example flow:

```text
Client Request
      ↓
Check Redis Cache
      ↓
   ┌──┴──┐
   │     │
 HIT    MISS
   │     │
   │     ▼
   │  PostgreSQL
   │     │
   │     ▼
   │  Store in Redis
   │     │
   └──┬──┘
      ↓
Return Response
```

This reduces unnecessary database queries for frequently requested data.

---

## Redis Rate Limiting

The API uses Redis-backed rate limiting to control request frequency.

Default configuration:

```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

This corresponds to:

```text
100 requests per 15 minutes
```

Rate-limit information is exposed through HTTP response headers such as:

```text
X-RateLimit-Limit
X-RateLimit-Remaining
```

Example:

```text
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 96
```

---

# Security

The backend implements several security mechanisms.

## Helmet

Helmet is used to configure security-related HTTP headers.

## CORS

CORS is configured to control which frontend origins can access the API.

## JWT Authentication

Protected routes require a valid JWT token.

## API Key Authentication

API keys provide an authentication mechanism for programmatic API clients.

## API Key Revocation

API keys can be revoked so that they can no longer authenticate requests.

## Rate Limiting

Redis-based rate limiting helps protect the API from excessive requests.

## Environment Variables

Sensitive configuration such as database credentials and JWT secrets are stored through environment variables rather than source code.

---

# Logging

Morgan is used for HTTP request logging.

Example:

```text
GET /api/v1/states
GET /api/v1/villages/search?q=Manibeli
POST /api/auth/login
```

---

# Error Handling

The API returns structured JSON error responses.

Example:

```json
{
  "success": false,
  "error": "Not Found",
  "message": "The requested resource was not found"
}
```

Authentication errors may return responses such as:

```json
{
  "success": false,
  "error": "Authentication required",
  "message": "Authorization header is missing"
}
```

---

# API Response Format

Successful responses generally follow this structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Error responses generally follow:

```json
{
  "success": false,
  "error": "Error description"
}
```

---

# Testing

The following functionality has been tested during development.

## Backend Build

```bash
npm run build
```

TypeScript compilation completes successfully.

## Health Check

```http
GET /health
```

## Location APIs

```http
GET /api/v1/states
GET /api/v1/districts/:stateCode
GET /api/v1/subdistricts/:districtCode
GET /api/v1/villages/:subDistrictCode
GET /api/v1/villages/search?q=Manibeli
```

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

## API Keys

```http
POST /api/auth/api-keys
GET /api/auth/api-keys
DELETE /api/auth/api-keys/:id
GET /api/auth/api-key-test
```

## Redis

Redis connection, caching, and rate limiting have been tested successfully.

---

# Example API Workflow

A typical client workflow is:

```text
1. Request states
       ↓
2. Select a state
       ↓
3. Request districts
       ↓
4. Select a district
       ↓
5. Request sub-districts
       ↓
6. Select a sub-district
       ↓
7. Request villages
```

Village search can also be performed directly:

```text
Search "Manibeli"
       ↓
Village
       ↓
Akkalkuwa
       ↓
Nandurbar
       ↓
Maharashtra
```

---

# Troubleshooting

## Database Connection Error

Check:

```env
DATABASE_URL
```

Make sure the PostgreSQL/NeonDB connection string is valid.

Also verify that the database is accessible.

---

## Redis Connection Error

Check:

```env
REDIS_URL
```

Make sure the Redis connection URL and credentials are correct.

If Redis is not configured, the application can continue in local development without Redis.

---

## Port Already in Use

If port `3000` is already occupied, change:

```env
PORT=3000
```

to another available port.

For example:

```env
PORT=3001
```

Then restart the backend.

---

## Frontend Cannot Connect to Backend

Verify that the backend is running:

```text
http://localhost:3000
```

Also verify the frontend CORS origin:

```env
CORS_ORIGIN=http://localhost:5173
```

---

# Production Considerations

Before deploying the application:

1. Generate a strong production JWT secret.
2. Use secure production database credentials.
3. Configure production Redis.
4. Configure production CORS origins.
5. Use HTTPS.
6. Keep `.env` files out of source control.
7. Configure appropriate rate limits.
8. Build and test the backend before deployment.
9. Monitor application logs.
10. Never expose database credentials or JWT secrets publicly.

---

# Project Status

The core backend functionality has been implemented and tested.

### Database

- [x] PostgreSQL / NeonDB
- [x] Prisma ORM
- [x] Administrative location dataset

### Location APIs

- [x] States
- [x] Districts
- [x] Sub-Districts
- [x] Villages
- [x] Village search

### Authentication

- [x] User registration
- [x] User login
- [x] JWT authentication
- [x] Protected authentication endpoint

### API Keys

- [x] API key creation
- [x] API key listing
- [x] API key authentication
- [x] API key revocation

### Redis

- [x] Redis connection
- [x] Redis caching
- [x] Redis rate limiting

### Backend Infrastructure

- [x] TypeScript
- [x] Express.js
- [x] Helmet
- [x] CORS
- [x] Morgan logging
- [x] Environment validation
- [x] Error handling
- [x] Graceful shutdown
- [x] Health check

---

# Local Development Architecture

```text
                         ┌─────────────────────┐
                         │   React Frontend    │
                         │   Vite :5173        │
                         └──────────┬──────────┘
                                    │
                              HTTP / REST
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Express Backend   │
                         │   :3000             │
                         └─────────┬───────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
          ┌──────────────────┐          ┌──────────────────┐
          │    PostgreSQL    │          │      Redis       │
          │      NeonDB      │          │                  │
          │  Location Data   │          │ Cache + Rate     │
          │                  │          │     Limiting     │
          └──────────────────┘          └──────────────────┘
```

---

# License

This project was developed as part of an internship project focused on building a REST API and dashboard for Indian administrative location data.