import type { SubscriptionPlan, PlanLimits, SupporterCosmetics } from './types';
import { PLAN_LIMITS, SUPPORTER_ACCENT_COLORS } from './constants';

export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function canUseAdvancedAnalysis(plan: SubscriptionPlan): boolean {
  const limits = getPlanLimits(plan);
  return limits.advancedAnalysis;
}

export function canUseMultiEntryAnalysis(plan: SubscriptionPlan): boolean {
  const limits = getPlanLimits(plan);
  return limits.multiEntryAnalysis;
}

export function canUsePeriodSummary(plan: SubscriptionPlan): boolean {
  const limits = getPlanLimits(plan);
  return limits.periodSummary;
}

export function canExportPDF(plan: SubscriptionPlan): boolean {
  const limits = getPlanLimits(plan);
  return limits.exportPDF;
}

export function canExportBackup(plan: SubscriptionPlan): boolean {
  const limits = getPlanLimits(plan);
  return limits.exportBackup;
}

export function canUseCustomTemplates(plan: SubscriptionPlan): boolean {
  const limits = getPlanLimits(plan);
  return limits.customTemplates;
}

export function canUseSemanticSearch(plan: SubscriptionPlan): boolean {
  const limits = getPlanLimits(plan);
  return limits.semanticSearch;
}

export function getAnalysisLevel(plan: SubscriptionPlan): 'basic' | 'full' {
  return canUseAdvancedAnalysis(plan) ? 'full' : 'basic';
}

export type FeatureLevel = 'basic' | 'advanced';

export function getFeatureLevel(plan: SubscriptionPlan): FeatureLevel {
  return plan === 'pro' ? 'advanced' : 'basic';
}

export function hasSupporterBadge(plan: SubscriptionPlan): boolean {
  return plan !== 'free';
}

export function getSupporterAccentColors(plan: SubscriptionPlan): string[] {
  return plan !== 'free' ? SUPPORTER_ACCENT_COLORS : [];
}

export function getSupporterCosmetics(plan: SubscriptionPlan): SupporterCosmetics {
  return {
    badge: hasSupporterBadge(plan),
    accentColors: getSupporterAccentColors(plan),
  };
}

