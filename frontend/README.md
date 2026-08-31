# Frontend - Indian Administrative Location API

React + Vite dashboard for exploring and managing Indian administrative location data.

## Features

- React 18 with TypeScript
- Vite for fast development and building
- Responsive design with Tailwind CSS
- Location hierarchy explorer
- Village search functionality
- User authentication (login/register)
- API key management
- Analytics dashboard with Recharts
- Axios for API communication
- Zustand for state management
- React Router for navigation

## Project Structure

```
src/
├── main.tsx               # React entry point
├── App.tsx                # Main app component
├── components/            # Reusable components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── LocationPicker.tsx
│   └── AnalyticsChart.tsx
├── pages/                 # Page components
│   ├── Dashboard.tsx
│   ├── LocationExplorer.tsx
│   ├── VillageSearch.tsx
│   ├── VillageDetail.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── ApiKeys.tsx
│   └── Analytics.tsx
├── services/              # API client
│   ├── api.ts             # Axios instance & common requests
│   └── auth.ts            # Authentication service
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts
│   └── useApi.ts
├── types/                 # TypeScript types
│   └── index.ts
├── styles/                # Global styles
│   └── index.css
├── utils/                 # Utility functions
│   └── localStorage.ts
└── index.html             # HTML entry point
```

## Development

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your API URL
```

### Running

```bash
# Development server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Server
Runs on `http://localhost:5173`

The Vite dev server includes proxy configuration to forward API requests to the backend.

## Environment Variables

```
VITE_API_URL              Backend API base URL (e.g., http://localhost:3000/api)
VITE_APP_NAME             Application display name
VITE_APP_DESCRIPTION      Application description
```

## Pages & Features

### Dashboard
- Overview of available features
- Quick statistics
- Recent activity

### Location Explorer
- Interactive selector for:
  - State
  - District
  - Sub-District
  - Village
- Display selected location details
- Hierarchy navigation

### Village Search
- Search villages by name
- Filter by region
- Display search results
- View village details

### Authentication
- **Login Page**: Sign in with email/password
- **Register Page**: Create new account
- Session management with JWT tokens
- Automatic token refresh

### API Management
- View generated API keys
- Create new API keys
- Revoke/delete keys
- Copy key to clipboard
- View key creation date and usage

### Analytics
- API request statistics
- Usage trends
- Most searched locations
- Response time charts
- User activity overview

## Styling

Uses Tailwind CSS for utility-first styling:

```bash
# Tailwind is already configured in Vite
# Add classes directly to components
```

## State Management

Uses Zustand for simple, effective state management:

```typescript
// Example: Auth store
import create from 'zustand'

interface AuthState {
  token: string | null
  setToken: (token: string) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
}))
```

## API Client

Axios instance with interceptors for:
- Automatic JWT token injection
- Error handling
- Request/response formatting

```typescript
import api from '@/services/api'

// Make authenticated request
const response = await api.get('/states')
```

## Custom Hooks

### useAuth()
Returns user authentication state and methods:
- `isAuthenticated`
- `user`
- `login(email, password)`
- `register(email, password)`
- `logout()`

### useApi()
Simplified API calls with loading/error states:
- `data`
- `loading`
- `error`
- `fetchData(endpoint)`

## Build & Optimization

```bash
# Production build
npm run build

# Output to dist/ folder
# Includes minification and optimization
```

## Deployment

See [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md) for:
- Vercel deployment
- Environment variable setup
- Build configuration
- Preview deployments

## Troubleshooting

### API Connection Error
- Verify `VITE_API_URL` in `.env`
- Ensure backend server is running
- Check CORS configuration on backend

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`

### Hot Reload Not Working
- Restart dev server: Ctrl+C, then `npm run dev`
- Check for file permission issues

## Browser Support

Modern browsers supporting:
- ES2020
- CSS Grid/Flexbox
- LocalStorage API
- Fetch API

## Performance

- Code splitting with Vite
- Lazy loading for pages
- Image optimization
- CSS minification
- Tree-shaking for unused code

## Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint
```

## Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Recharts Documentation](https://recharts.org/api)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
