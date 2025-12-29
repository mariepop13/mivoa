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


function buildDetectionSection(
  key: string,
  hasData: boolean,
  icon: LucideIcon,
  translationKey: string,
  badgeComponent: React.ReactNode,
  t: (key: string) => string
): React.ReactNode | null {
  if (!hasData) {
    return null;
  }

  const Icon = icon;

  return (
    <div className="space-y-1.5" key={key}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t(translationKey)}</span>
      </div>
      {badgeComponent}
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

  const moodsSection = buildDetectionSection(
    'moods',
    Boolean(hasMoods),
    Smile,
    'moods',
    <MoodsBadge moods={moods} moodEmojis={moodEmojis} colorClass={RAINBOW_COLORS[sectionIndex % RAINBOW_COLORS_LENGTH]} />,
    t
  );
  if (moodsSection) {
    sections.push(moodsSection);
    sectionIndex++;
  }

  const themesSection = buildDetectionSection(
    'themes',
    Boolean(hasThemes),
    Tag,
    'themes',
    <ThemesBadge themes={themes} themeEmojis={themeEmojis} colorClass={RAINBOW_COLORS[sectionIndex % RAINBOW_COLORS_LENGTH]} />,
    t
  );
  if (themesSection) {
    sections.push(themesSection);
    sectionIndex++;
  }

  const charactersSection = buildDetectionSection(
    'characters',
    Boolean(hasCharacters),
    Users,
    'characters',
    <CharactersBadge characters={characters} colorClass={RAINBOW_COLORS[sectionIndex % RAINBOW_COLORS_LENGTH]} />,
    t
  );
  if (charactersSection) {
    sections.push(charactersSection);
    sectionIndex++;
  }

  const placesSection = buildDetectionSection(
    'places',
    Boolean(hasPlaces),
    MapPin,
    'places',
    <PlacesBadge places={places} colorClass={RAINBOW_COLORS[sectionIndex % RAINBOW_COLORS_LENGTH]} />,
    t
  );
  if (placesSection) {
    sections.push(placesSection);
  }

  return (
    <div className={cn('px-4 sm:px-6 py-3 sm:py-4 border-t border-border/50 bg-muted/20 space-y-3', className)}>
      {sections}
    </div>
  );
}

export const EntryDetections = memo(EntryDetectionsComponent);

