import { SubscriptionPlan } from "@prisma/client";

export interface PlanDefinition {
  name: SubscriptionPlan;
  price: number;
  dailyRequestLimit: number;
  burstPerMinuteLimit: number;
  stateAccessPolicy: "SINGLE_STATE" | "UP_TO_5_STATES" | "ALL_STATES";
}

const plans: Record<SubscriptionPlan, PlanDefinition> = {
  FREE: { name: "FREE", price: 0, dailyRequestLimit: 5000, burstPerMinuteLimit: 100, stateAccessPolicy: "SINGLE_STATE" },
  PREMIUM: { name: "PREMIUM", price: 49, dailyRequestLimit: 50000, burstPerMinuteLimit: 500, stateAccessPolicy: "UP_TO_5_STATES" },
  PRO: { name: "PRO", price: 199, dailyRequestLimit: 300000, burstPerMinuteLimit: 2000, stateAccessPolicy: "ALL_STATES" },
  UNLIMITED: { name: "UNLIMITED", price: 499, dailyRequestLimit: 1000000, burstPerMinuteLimit: 5000, stateAccessPolicy: "ALL_STATES" },
};

export const getPlanDefinition = (plan: SubscriptionPlan): PlanDefinition => plans[plan];
export const getAllPlanDefinitions = (): PlanDefinition[] => Object.values(plans);
export const isSubscriptionPlan = (value: string): value is SubscriptionPlan => Object.prototype.hasOwnProperty.call(plans, value);
