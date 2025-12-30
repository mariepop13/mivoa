export function getTemplateDescription(
  templateId: string,
  t: (key: string, fallback?: string) => string
): string {
  const descriptions: Record<string, string> = {
    gratitude: t('templateGratitudeDescription'),
    reflection: t('templateReflectionDescription'),
    daily: t('templateDailyDescription'),
    goals: t('templateGoalsDescription'),
  };
  return descriptions[templateId] || '';
}

