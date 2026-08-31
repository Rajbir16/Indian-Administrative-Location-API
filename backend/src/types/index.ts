// TypeScript Type Definitions for Indian Location API

// ==================================================
// LOCATION HIERARCHY TYPES
// ==================================================

export interface LocationHierarchy {
  state: {
    id: number;
    code: string;
    name: string;
  };
  district: {
    id: number;
    code: string;
    name: string;
  };
  subDistrict: {
    id: number;
    code: string;
    name: string;
  };
  village: {
    id: number;
    code: string;
    name: string;
  };
}

export interface Village {
  id: number;
  code: string;
  name: string;
  subDistrictId: number;
  createdAt: Date;
  updatedAt: Date;
  status: string;
}

export interface SubDistrict {
  id: number;
  code: string;
  name: string;
  districtId: number;
  createdAt: Date;
  updatedAt: Date;
  status: string;
}

export interface District {
  id: number;
  code: string;
  name: string;
  stateId: number;
  createdAt: Date;
  updatedAt: Date;
  status: string;
}

export interface State {
  id: number;
  code: string;
  name: string;
  countryId: number;
  createdAt: Date;
  updatedAt: Date;
  status: string;
}

export interface Country {
  id: number;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
  status: string;
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
  createdAt: Date;
  updatedAt: Date;
  status: string;
}

export interface ApiKey {
  id: number;
  key: string;
  name?: string;
  userId: number;
  lastUsedAt?: Date;
  requestCount: number;
  createdAt: Date;
  updatedAt: Date;
  status: string;
}

// ==================================================
// REQUEST/RESPONSE TYPES
// ==================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
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
  timestamp: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
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
// ERROR TYPES
// ==================================================

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

// ==================================================
// API LOG TYPES
// ==================================================

export interface ApiLogEntry {
  id: number;
  endpoint: string;
  method: string;
  statusCode?: number;
  responseTime: number;
  userAgent?: string;
  ipAddress?: string;
  userId?: number;
  apiKeyId?: number;
  errorMessage?: string;
  createdAt: Date;
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
}

// Note: More types will be added as development progresses
