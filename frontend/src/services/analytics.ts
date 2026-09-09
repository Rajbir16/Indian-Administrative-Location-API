import { api } from "./api";

export interface PlanDefinition {
  name: "FREE" | "PREMIUM" | "PRO" | "UNLIMITED";
  price: number;
  dailyRequestLimit: number;
  burstPerMinuteLimit: number;
  stateAccessPolicy: string;
}

export interface UserUsage {
  plan: PlanDefinition;
  requestsToday: number;
  remainingDailyRequests: number;
  monthlyRequestCount: number;
  averageResponseTime: number;
  successfulRequestPercentage: number;
}

export interface UserUsageHistory {
  timezone: string;
  dailyRequests: Array<{
    date: string;
    count: number;
  }>;
}

export interface AnalyticsSummary {
  totalVillages: number;
  activeUsers: number;
  todayRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  revenue: number | null;
  timezone: string;
}

export interface AdminAnalytics {
  timezone: string;
  topStates: Array<{ state: string; villageCount: number }>;
  dailyRequests: Array<{ date: string; count: number }>;
  planDistribution: Record<string, number>;
  responseTimes: {
    average: number | null;
    p95: number | null;
    p99: number | null;
  };
  endpointBreakdown: Array<{ endpoint: string; count: number }>;
  heatmap: Array<{
    dayOfWeek: number;
    hour: number;
    count: number;
  }>;
}

export const getUserUsage = async () =>
  (await api.get<{ data: UserUsage }>("/usage")).data.data;

export const getUserUsageHistory = async () =>
  (await api.get<{ data: UserUsageHistory }>("/usage/history")).data.data;

export const getAdminAnalyticsSummary = async () =>
  (
    await api.get<{ data: AnalyticsSummary }>(
      "/admin/analytics/summary"
    )
  ).data.data;

export const getAdminAnalytics = async () =>
  (
    await api.get<{ data: AdminAnalytics }>(
      "/admin/analytics"
    )
  ).data.data;