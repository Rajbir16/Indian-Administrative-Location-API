# Indian Administrative Location API — Frontend

A React + TypeScript web application for exploring Indian administrative location data through the Indian Administrative Location API.

The application provides village search, hierarchical location browsing, user authentication, and API key management through a responsive dashboard interface.

---

## Features

- 🇮🇳 Indian administrative location explorer
- 🔎 Village search
- 🗺️ State → District → Sub-District → Village hierarchy
- 📊 Location statistics
- 🔐 JWT-based user authentication
- 🔑 API key management
- ➕ API key creation
- ❌ API key revocation
- ⚡ Redis-backed API caching
- 🛡️ Redis-backed API rate limiting
- ⏳ Loading and error handling
- 📱 Responsive user interface
- 🔗 REST API integration using Axios
- ⚙️ TypeScript-based frontend
- 🚀 Vite development and production builds

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | User interface |
| TypeScript | Type-safe development |
| Vite | Development server and production build |
| Axios | REST API communication |
| CSS | Responsive application styling |
| Express | Backend REST API |
| PostgreSQL | Location data storage |
| Prisma | Database ORM |
| Redis | Caching and rate limiting |
| JWT | User authentication |

---

## Project Structure

```text
frontend/
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types/
│       └── index.ts
│
├── .env.example
├── .env.production.example
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

---

## Application Features

### 1. Village Search

Users can search for a village by name.

Example:

```text
Manibeli
```

The application displays:

- Village name
- Village code
- State
- District
- Sub-District

Example hierarchy:

```text
MAHARASHTRA
    ↓
Nandurbar
    ↓
Akkalkuwa
    ↓
Manibeli
```

---

### 2. Administrative Location Explorer

The application provides a hierarchical location selector:

```text
State
  ↓
District
  ↓
Sub-District
  ↓
Villages
```

The next selection becomes available after the previous administrative level is selected.

Example:

```text
Maharashtra
     ↓
Nandurbar
     ↓
Akkalkuwa
     ↓
Villages
```

---

### 3. Location Statistics

The dashboard displays the available administrative data:

```text
30       States & UTs
581      Districts
5,422    Sub-Districts
564K+    Villages
```

---

### 4. Authentication

The frontend supports JWT-based authentication.

Users can log in using their registered email and password.

After successful authentication, the JWT token is stored locally and used for authenticated API requests.

The backend provides:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

Protected requests use:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

### 5. API Key Management

Authenticated users can manage API keys from the dashboard.

Supported operations include:

- Create API key
- View API keys
- Revoke API key
- View API key status

API keys use the configured prefix:

```text
INDIAN_LOC_
```

Example:

```text
INDIAN_LOC_xxxxxxxxxxxxxxxxxxxxxxxxx
```

API keys are intended for programmatic API access.

---

## Backend API

The frontend communicates with the backend running on:

```text
http://localhost:3000
```

Location API base URL:

```text
http://localhost:3000/api/v1
```

Authentication API base URL:

```text
http://localhost:3000/api/auth
```

---

## Location API Endpoints

### Get All States

```http
GET /api/v1/states
```

Returns all active states and union territories.

---

### Get Districts

```http
GET /api/v1/districts/:stateCode
```

Example:

```http
GET /api/v1/districts/27
```

---

### Get Sub-Districts

```http
GET /api/v1/subdistricts/:districtCode
```

Example:

```http
GET /api/v1/subdistricts/497
```

---

### Get Villages

```http
GET /api/v1/villages/:subDistrictCode
```

Example:

```http
GET /api/v1/villages/03950
```

---

### Search Villages

```http
GET /api/v1/villages/search?q=Manibeli
```

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

## Authentication Endpoints

### Register

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

---

### Login

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

### Get Current Authentication Information

```http
GET /api/auth/me
```

Requires:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## API Key Management

API key management requires JWT authentication.

### Get API Keys

```http
GET /api/auth/api-keys
```

---

### Create API Key

```http
POST /api/auth/api-keys
```

Example request:

```json
{
  "name": "My Application"
}
```

---

### Revoke API Key

```http
DELETE /api/auth/api-keys/:id
```

---

### Test API Key Authentication

```http
GET /api/auth/api-key-test
```

The API key is supplied using the authentication mechanism implemented by the backend.

---

## Redis

Redis is used by the backend for performance and API protection.

### Redis Caching

Frequently requested location data is cached in Redis.

For example:

```text
GET /api/v1/states
```

The request follows this flow:

```text
Request
   ↓
Check Redis
   ↓
Cache HIT ─────────→ Return cached response
   │
   └── Cache MISS
          ↓
       PostgreSQL
          ↓
      Store in Redis
          ↓
       Return response
```

Cached responses include:

```json
{
  "success": true,
  "count": 30,
  "cached": true,
  "data": []
}
```

---

## Rate Limiting

The API uses Redis-backed rate limiting to control excessive requests.

Default configuration:

```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

The API provides rate-limit information through response headers:

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

## Data Hierarchy

The administrative location hierarchy is:

```text
State / Union Territory
        ↓
District
        ↓
Sub-District
        ↓
Village
```

This hierarchy allows users and applications to navigate Indian administrative location data in a structured manner.

---

## Environment Variables

The frontend can use environment variables to configure the backend API.

Example:

```env
VITE_API_URL=http://localhost:3000/api
```

Additional environment configuration can be maintained in:

```text
.env.example
.env.production.example
```

### Important

Do not commit `.env` files containing secrets to GitHub.

---

## Installation

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

---

## Development

Start the Vite development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

Make sure the backend is also running.

---

## Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Start the backend:

```bash
npm run dev
```

The backend will normally run on:

```text
http://localhost:3000
```

The backend requires the configured PostgreSQL database and Redis connection.

---

## Production Build

Build the frontend:

```bash
npm run build
```

The production files are generated in:

```text
dist/
```

Preview the production build:

```bash
npm run preview
```

---

## Type Checking

Run TypeScript type checking:

```bash
npm run type-check
```

---

## Linting

Run the configured linter:

```bash
npm run lint
```

---

## Error Handling

The application handles common API failures, including:

- Empty village search queries
- Backend connection failures
- Failed location requests
- Failed authentication
- Failed API-key operations
- Loading states
- Invalid requests

Error messages are displayed to the user through the interface.

---

## Security

The project implements multiple security mechanisms.

### Backend Security

- Helmet security middleware
- CORS configuration
- JWT authentication
- Protected authentication endpoints
- API-key authentication
- API-key revocation
- Redis-based rate limiting
- Environment-based configuration

### Frontend Security

- JWT stored locally for authenticated sessions
- API credentials are not hard-coded
- Environment variables are used for configuration
- Secret environment files should not be committed

---

## Architecture

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
          │   PostgreSQL     │          │      Redis       │
          │      NeonDB      │          │ Cache + Rate     │
          │                  │          │     Limiting     │
          └──────────────────┘          └──────────────────┘
```

---

## Project Status

The core application functionality has been implemented and tested.

### Backend

- [x] PostgreSQL database connection
- [x] Prisma database access
- [x] Administrative location data
- [x] State API
- [x] District API
- [x] Sub-District API
- [x] Village API
- [x] Village search
- [x] JWT authentication
- [x] API key creation
- [x] API key authentication
- [x] API key revocation
- [x] Redis connection
- [x] Redis caching
- [x] Redis rate limiting

### Frontend

- [x] React + TypeScript application
- [x] Location explorer
- [x] State selection
- [x] District selection
- [x] Sub-District selection
- [x] Village listing
- [x] Village search
- [x] Location statistics
- [x] Login interface
- [x] Authentication state
- [x] API key management
- [x] API key creation
- [x] API key revocation
- [x] Loading states
- [x] Error handling
- [x] Responsive interface
- [x] Production build

---

## Testing

The following functionality has been tested during development:

### Health Check

```http
GET /health
```

### Location APIs

```http
GET /api/v1/states
GET /api/v1/districts/:stateCode
GET /api/v1/subdistricts/:districtCode
GET /api/v1/villages/:subDistrictCode
GET /api/v1/villages/search?q=Manibeli
```

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

### API Keys

```http
GET /api/auth/api-keys
POST /api/auth/api-keys
DELETE /api/auth/api-keys/:id
GET /api/auth/api-key-test
```

### Redis

Redis caching and rate limiting have been tested successfully.

---

## Local Development Workflow

Run the backend first:

```bash
cd backend
npm run dev
```

Then run the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

The frontend communicates with:

```text
http://localhost:3000
```

---

## Production Considerations

Before production deployment:

1. Replace development secrets with secure production secrets.
2. Use a secure production PostgreSQL connection.
3. Configure a production Redis instance.
4. Configure the production frontend API URL.
5. Configure production CORS origins.
6. Keep `.env` files out of source control.
7. Use HTTPS in production.
8. Build and test both frontend and backend before deployment.

---

## License

This project was developed as part of an internship project involving an Indian administrative location API and dashboard.