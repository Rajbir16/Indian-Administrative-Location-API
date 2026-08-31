// TypeScript Type Definitions for Indian Location API Frontend

// ==================================================
// LOCATION HIERARCHY TYPES
// ==================================================

export interface Village {
  id: number;
  code: string;
  name: string;
  subDistrictId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubDistrict {
  id: number;
  code: string;
  name: string;
  districtId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface District {
  id: number;
  code: string;
  name: string;
  stateId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface State {
  id: number;
  code: string;
  name: string;
  countryId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Country {
  id: number;
  name: string;
  code: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ==================================================
// USER & AUTHENTICATION TYPES
// ==================================================

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  planType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: number;
  key: string;
  name?: string;
  lastUsedAt?: string;
  requestCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthToken {
  token: string;
  expiresAt: string;
}

// ==================================================
// REQUEST/RESPONSE TYPES
// ==================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface SearchVillagesRequest {
  query: string;
  limit?: number;
  offset?: number;
}

// ==================================================
// LOCATION EXPLORER TYPES
// ==================================================

export interface LocationFilters {
  stateId?: number;
  districtId?: number;
  subDistrictId?: number;
}

export interface LocationSelection {
  state?: State | null;
  district?: District | null;
  subDistrict?: SubDistrict | null;
  village?: Village | null;
}

// ==================================================
// ANALYTICS TYPES
// ==================================================

export interface ApiUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  topEndpoints: Array<{
    endpoint: string;
    count: number;
  }>;
  topSearchTerms: Array<{
    query: string;
    count: number;
  }>;
  requestsByDay: Array<{
    date: string;
    count: number;
  }>;
}

// ==================================================
// UI STATE TYPES
// ==================================================

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface AuthState extends LoadingState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Note: More types will be added as development progresses
