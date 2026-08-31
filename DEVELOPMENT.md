# Development Guide

This guide covers the development workflow and best practices for the Indian Administrative Location API project.

## Development Phases

The project is built in **11 phases**, each with clear deliverables:

### Phase 1: Project Structure & Configuration ✅
- [x] Folder structure created
- [x] package.json files configured
- [x] TypeScript configuration
- [x] Environment variables defined
- [x] README files created
- [x] .gitignore configured

**Status**: Complete

### Phase 2: Prisma Schema & Database Connection ⏳
- [ ] Define Prisma schema with all models
- [ ] Setup NeonDB connection
- [ ] Create Prisma client wrapper
- [ ] Create database connection tests
- [ ] Run initial migrations

**Expected Duration**: 1-2 hours

### Phase 3: Database Migration & Seed Data ⏳
- [ ] Run migrations to create tables
- [ ] Create seed script with sample data
- [ ] Populate test data (10-20 records per table)
- [ ] Test data retrieval
- [ ] Verify relationships

**Expected Duration**: 1-2 hours

### Phase 4: Python Data Import Pipeline ⏳
- [ ] Build Excel reader with validation
- [ ] Create data cleaner and transformer
- [ ] Build upsert logic for all tables
- [ ] Create logging and error handling
- [ ] Generate import summary reports
- [ ] Test with small dataset

**Expected Duration**: 3-4 hours

### Phase 5: Express REST APIs ⏳
- [ ] Setup Express middleware (CORS, helmet, logging)
- [ ] Implement location endpoints (/api/v1/*)
- [ ] Add error handling middleware
- [ ] Create response formatting utilities
- [ ] Test all endpoints

**Expected Duration**: 3-4 hours

### Phase 6: Authentication & API Keys ⏳
- [ ] Implement JWT token generation and verification
- [ ] Create bcrypt password hashing utilities
- [ ] Build user registration endpoint
- [ ] Build login endpoint with token generation
- [ ] Implement API key generation and validation
- [ ] Create authorization middleware
- [ ] Test auth flow end-to-end

**Expected Duration**: 3-4 hours

### Phase 7: React Frontend ⏳
- [ ] Setup React + Vite project structure
- [ ] Create layout components (Header, Sidebar)
- [ ] Build location explorer pages
- [ ] Implement search functionality
- [ ] Create authentication pages (Login, Register)
- [ ] Add navigation and routing
- [ ] Test all pages

**Expected Duration**: 4-5 hours

### Phase 8: Redis Caching & Rate Limiting ⏳
- [ ] Setup Redis connection handling
- [ ] Implement cache service layer
- [ ] Add caching to frequently accessed endpoints
- [ ] Configure express-rate-limit
- [ ] Create rate limit middleware
- [ ] Test rate limiting behavior
- [ ] Implement graceful Redis fallback

**Expected Duration**: 2-3 hours

### Phase 9: Testing & Error Handling ⏳
- [ ] Write API endpoint tests
- [ ] Write authentication flow tests
- [ ] Test rate limiting
- [ ] Test data import pipeline
- [ ] Add error scenarios testing
- [ ] Test error handling middleware
- [ ] Frontend component testing

**Expected Duration**: 3-4 hours

### Phase 10: Deployment Preparation ⏳
- [ ] Create production build configurations
- [ ] Setup CI/CD pipeline basics
- [ ] Test Vercel deployment
- [ ] Configure NeonDB for production
- [ ] Configure Upstash Redis
- [ ] Document deployment steps

**Expected Duration**: 2-3 hours

### Phase 11: Documentation ⏳
- [ ] Complete API documentation
- [ ] Add setup instructions
- [ ] Document architecture decisions
- [ ] Add deployment guide
- [ ] Create troubleshooting guide
- [ ] Add examples and use cases

**Expected Duration**: 2-3 hours

## Total Estimated Development Time: 30-45 hours

## Development Workflow

### 1. Before Starting Work

```bash
# Pull latest changes
git pull origin main

# Create feature branch
git checkout -b feature/description

# Install latest dependencies
npm install  # in backend
npm install  # in frontend
pip install -r requirements.txt  # in data-import
```

### 2. Development Setup

```bash
# Terminal 1: Backend development server
cd backend
npm run dev

# Terminal 2: Frontend development server
cd frontend
npm run dev

# Terminal 3: Database studio (if needed)
cd backend
npm run prisma:studio
```

**Frontend**: http://localhost:5173  
**Backend**: http://localhost:3000  
**Prisma Studio**: http://localhost:5555

### 3. Making Changes

- Work on one feature at a time
- Follow naming conventions (see below)
- Type check frequently: `npm run type-check`
- Test changes before committing

### 4. Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:watch

# Frontend tests (when test setup is ready)
cd frontend
npm run test

# Type checking
npm run type-check
```

### 5. Committing Code

```bash
# Add changes
git add .

# Commit with descriptive message
git commit -m "feat: add village search endpoint"

# Push to remote
git push origin feature/description
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `test:` - Test additions
- `chore:` - Build/config changes

## Code Conventions

### File Naming
- **Folders**: lowercase, kebab-case
- **Components**: PascalCase (e.g., `LocationPicker.tsx`)
- **Utilities**: camelCase (e.g., `validators.ts`)
- **Tests**: `*.test.ts` or `*.spec.ts`

### TypeScript
- Use strict mode
- Define types/interfaces for all parameters and returns
- Avoid `any` type
- Use enums for constants

### Backend
- Controllers handle HTTP requests
- Services contain business logic
- Middleware handles cross-cutting concerns
- Utils contain reusable functions

### Frontend
- Components are functional with hooks
- Custom hooks for shared logic
- Services handle API calls
- Types exported from types/index.ts

## Environment Variables

**Never commit .env files**

Always use `.env.example` as template:

```bash
cp .env.example .env
# Edit .env with local values
```

For deployment, set environment variables in hosting platform:
- **Vercel**: Project Settings → Environment Variables
- **NeonDB**: Connection string in dashboard
- **Upstash**: REST URL and token in dashboard

## Database Development

### Creating a Migration

```bash
cd backend

# Make changes to prisma/schema.prisma
# Then run:
npm run prisma:migrate

# Name the migration descriptively, e.g.:
# What is this migration called? › add_village_search_index
```

### Testing Database Changes

```bash
# View data in Prisma Studio
npm run prisma:studio

# Run seed with test data
npm run prisma:seed

# Test queries in Node REPL
node --input-type=module
> import { prisma } from './src/config/database.js'
> await prisma.state.findMany()
```

### Resetting Database (Development Only)

```bash
# WARNING: Deletes all data!
npm run prisma:migrate reset
```

## Performance Considerations

### Backend
- Use indexes on frequently queried columns
- Implement pagination for large result sets
- Cache expensive queries with Redis
- Batch insert operations (villages)
- Use connection pooling

### Frontend
- Lazy load pages with React.lazy()
- Memoize expensive computations
- Optimize re-renders with React.memo()
- Lazy load images
- Code splitting with Vite

### Database
- Create indexes for search columns
- Use EXPLAIN ANALYZE for query optimization
- Archive old API logs
- Monitor connection count

## Security Checklist

- [ ] No hardcoded secrets in code
- [ ] All .env files in .gitignore
- [ ] JWT secret is strong (min 32 chars)
- [ ] Passwords hashed with bcrypt
- [ ] Input validation on all endpoints
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Error messages don't leak info
- [ ] Environment variables documented
- [ ] No sensitive data in logs

## Debugging

### Backend Debugging

```bash
# Development with inspect
node --inspect-brk ./dist/server.js

# In VS Code, attach debugger:
# Run → Start Debugging (Chrome DevTools)
```

### Frontend Debugging

```bash
# Vite preserves source maps
# Use browser DevTools directly
# Access http://localhost:5173 in Chrome
```

### Database Debugging

```bash
# Connect directly to PostgreSQL
psql postgresql://user:password@localhost/indian_locations

# Common queries
SELECT * FROM state LIMIT 5;
SELECT * FROM village WHERE name LIKE '%Manibeli%' LIMIT 10;
```

## Common Issues & Solutions

### Port Already in Use
```bash
# Find process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

### Module Not Found
```bash
# Ensure dependencies are installed
npm install

# Clear cache
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Error
```bash
# Check .env DATABASE_URL
# Test connection:
psql "$DATABASE_URL"

# Verify database exists
createdb indian_locations  # if needed
```

### TypeScript Errors
```bash
# Run type checker
npm run type-check

# Ensure tsconfig.json is correct
# Clear TypeScript cache
rm -rf dist/
npm run build
```

## Learning Resources

### Backend
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Prisma Docs](https://www.prisma.io/docs/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Redis Commands](https://redis.io/commands/)

### Frontend
- [React Hooks Guide](https://react.dev/reference/react)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Recharts Examples](https://recharts.org/examples)

### Database
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [SQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Indexes Guide](https://www.postgresql.org/docs/current/indexes.html)

## Getting Help

1. **Check logs**: Backend console, browser DevTools, log files
2. **Search documentation**: Refer to tech stack docs
3. **Review similar code**: Look for existing patterns in codebase
4. **Test in isolation**: Create minimal reproduction
5. **Debug step by step**: Use debugger or console.log()

## Phase Completion Checklist

When completing a phase, verify:
- [ ] Code builds without errors
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Unit tests pass (`npm run test`)
- [ ] All new code documented
- [ ] Changes committed with descriptive message
- [ ] No secrets in code or logs
- [ ] README updated if needed
- [ ] Next phase ready to start

---

**Remember**: Build incrementally, test frequently, and commit regularly!
