'use client';

import { memo } from 'react';
import { PlacesBadge } from '@/components/places-badge';
import { CharactersBadge } from '@/components/characters-badge';
import { ThemesBadge } from '@/components/themes-badge';
import { MoodsBadge } from '@/components/moods-badge';
import { MapPin, Users, Tag, Smile, type LucideIcon } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

interface EntryDetectionsProps {
  places?: string[];
  characters?: string[];
  themes?: string[];
  themeEmojis?: Record<string, string>;
  moods?: string[];
  moodEmojis?: Record<string, string>;
  className?: string;
}

const RAINBOW_COLORS = [
  'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700',
  'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
  'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700',
  'bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-700',
] as const;

const RAINBOW_COLORS_LENGTH = RAINBOW_COLORS.length;

interface DetectionSectionConfig {
  key: string;
  hasData: boolean;
  icon: LucideIcon;
  translationKey: string;
  badgeComponent: React.ReactNode;
}

function buildDetectionSection(
  config: DetectionSectionConfig,
  t: (key: string) => string
): React.ReactNode | null {
  if (!config.hasData) {
    return null;
  }

  const Icon = config.icon;

  return (
    <div className="space-y-1.5" key={config.key}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t(config.translationKey)}</span>
      </div>
      {config.badgeComponent}
    </div>
  );
}

function EntryDetectionsComponent({ places, characters, themes, themeEmojis, moods, moodEmojis, className }: EntryDetectionsProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const hasPlaces = places && places.length > 0;
  const hasCharacters = characters && characters.length > 0;
  const hasThemes = themes && themes.length > 0;
  const hasMoods = moods && moods.length > 0;

  if (!hasPlaces && !hasCharacters && !hasThemes && !hasMoods) {
    return null;
  }

  const sections: React.ReactNode[] = [];
  let sectionIndex = 0;

  const sectionConfigs = [
    {
      key: 'moods',
      hasData: hasMoods,
      icon: Smile,
      translationKey: 'moods',
      createBadge: (index: number) => <MoodsBadge moods={moods} moodEmojis={moodEmojis} colorClass={RAINBOW_COLORS[index % RAINBOW_COLORS_LENGTH]} />,
    },
    {
      key: 'themes',
      hasData: hasThemes,
      icon: Tag,
      translationKey: 'themes',
      createBadge: (index: number) => <ThemesBadge themes={themes} themeEmojis={themeEmojis} colorClass={RAINBOW_COLORS[index % RAINBOW_COLORS_LENGTH]} />,
    },
    {
      key: 'characters',
      hasData: hasCharacters,
      icon: Users,
      translationKey: 'characters',
      createBadge: (index: number) => <CharactersBadge characters={characters} colorClass={RAINBOW_COLORS[index % RAINBOW_COLORS_LENGTH]} />,
    },
    {
      key: 'places',
      hasData: hasPlaces,
      icon: MapPin,
      translationKey: 'places',
      createBadge: (index: number) => <PlacesBadge places={places} colorClass={RAINBOW_COLORS[index % RAINBOW_COLORS_LENGTH]} />,
    },
  ];

  for (const config of sectionConfigs) {
    if (!config.hasData) {
      continue;
    }

    const badge = config.createBadge(sectionIndex);
    const section = buildDetectionSection(
      {
        key: config.key,
        hasData: true,
        icon: config.icon,
        translationKey: config.translationKey,
        badgeComponent: badge,
      },
      t
    );
    sections.push(section);
    sectionIndex++;
  }

  const containerClassName = cn(
    'px-4 sm:px-6 py-3 sm:py-4 border-t border-border/50 bg-muted/20 space-y-3',
    className
  );

  return (
    <div className={containerClassName}>
      {sections}
    </div>
  );
}

export const EntryDetections = memo(EntryDetectionsComponent);

