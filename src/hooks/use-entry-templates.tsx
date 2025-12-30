'use client';

import { useMemo } from 'react';
import { useTranslation } from './use-translation';

export interface EntryTemplate {
  id: string;
  name: string;
  title: string;
  content: string;
}

export function useEntryTemplates(): EntryTemplate[] {
  const { t } = useTranslation();

  return useMemo(() => [
    {
      id: 'gratitude',
      name: t('templateGratitude'),
      title: t('templateGratitudeTitle'),
      content: t('templateGratitudeContent'),
    },
    {
      id: 'reflection',
      name: t('templateReflection'),
      title: t('templateReflectionTitle'),
      content: t('templateReflectionContent'),
    },
    {
      id: 'daily',
      name: t('templateDaily'),
      title: t('templateDailyTitle'),
      content: t('templateDailyContent'),
    },
    {
      id: 'goals',
      name: t('templateGoals'),
      title: t('templateGoalsTitle'),
      content: t('templateGoalsContent'),
    },
  ], [t]);
}

