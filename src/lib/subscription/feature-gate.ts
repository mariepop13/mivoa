import type { SubscriptionPlan, PlanLimits } from './types';
import { PLAN_LIMITS, UNLIMITED_ENTRIES } from './constants';
import type { OpenRouterModel } from '@/ai/types/model';

export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function canUseModel(plan: SubscriptionPlan, modelId: string): boolean {
  const limits = getPlanLimits(plan);
  return limits.modelsAccess.includes(modelId);
}

export function canExport(plan: SubscriptionPlan): boolean {
  const limits = getPlanLimits(plan);
  return limits.exportEnabled;
}

export function canCreateEntry(
  plan: SubscriptionPlan,
  entriesUsed: number,
  limit: number
): boolean {
  if (limit === UNLIMITED_ENTRIES || limit === Infinity) {
    return true;
  }
  return entriesUsed < limit;
}

export function getAnalysisLevel(plan: SubscriptionPlan): 'basic' | 'enhanced' | 'full' {
  switch (plan) {
    case 'free':
      return 'basic';
    case 'basic':
      return 'enhanced';
    case 'pro':
      return 'full';
    default:
      return 'basic';
  }
}

export function filterAvailableModels(
  plan: SubscriptionPlan,
  models: OpenRouterModel[]
): OpenRouterModel[] {
  const limits = getPlanLimits(plan);
  return models.filter((model) => limits.modelsAccess.includes(model.id));
}

export function isLimitReached(usage: number, limit: number): boolean {
  return usage >= limit;
}

export function getMaxResolution(plan: SubscriptionPlan): 'standard' | 'high' {
  const limits = getPlanLimits(plan);
  return limits.exportResolution;
}

export type FeatureLevel = 'basic' | 'intermediate' | 'advanced';

export function getFeatureLevel(plan: SubscriptionPlan): FeatureLevel {
  switch (plan) {
    case 'pro':
      return 'advanced';
    case 'basic':
      return 'intermediate';
    case 'free':
    default:
      return 'basic';
  }
}

