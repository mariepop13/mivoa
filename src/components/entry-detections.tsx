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
  'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700',
  'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
  'bg-rose-100 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-700',
  'bg-stone-100 dark:bg-stone-900/20 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700',
] as const;

const RAINBOW_COLORS_LENGTH = RAINBOW_COLORS.length;

type SectionKey = 'moods' | 'themes' | 'characters' | 'places';

interface SectionConfig {
  key: SectionKey;
  hasData: boolean;
  icon: LucideIcon;
  translationKey: string;
}

interface BuildSectionParams {
  key: string;
  icon: LucideIcon;
  translationKey: string;
  badgeComponent: React.ReactNode;
}

function buildDetectionSection(
  params: BuildSectionParams,
  t: (key: string) => string
): React.ReactNode | null {
  const Icon = params.icon;

  return (
    <div className="space-y-1.5" key={params.key}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t(params.translationKey)}</span>
      </div>
      {params.badgeComponent}
    </div>
  );
}

function createBadgeForSection(
  key: SectionKey,
  index: number,
  props: EntryDetectionsProps
): React.ReactNode {
  const colorClass = RAINBOW_COLORS[index % RAINBOW_COLORS_LENGTH];
  
  switch (key) {
    case 'moods':
      return <MoodsBadge moods={props.moods} moodEmojis={props.moodEmojis} colorClass={colorClass} />;
    case 'themes':
      return <ThemesBadge themes={props.themes} themeEmojis={props.themeEmojis} colorClass={colorClass} />;
    case 'characters':
      return <CharactersBadge characters={props.characters} colorClass={colorClass} />;
    case 'places':
      return <PlacesBadge places={props.places} colorClass={colorClass} />;
    default:
      return null;
  }
}

function hasDataForSection(key: SectionKey, props: EntryDetectionsProps): boolean {
  switch (key) {
    case 'moods':
      return Boolean(props.moods && props.moods.length > 0);
    case 'themes':
      return Boolean(props.themes && props.themes.length > 0);
    case 'characters':
      return Boolean(props.characters && props.characters.length > 0);
    case 'places':
      return Boolean(props.places && props.places.length > 0);
    default:
      return false;
  }
}

function buildSectionConfigs(props: EntryDetectionsProps): SectionConfig[] {
  return [
    { key: 'moods', hasData: hasDataForSection('moods', props), icon: Smile, translationKey: 'moods' },
    { key: 'themes', hasData: hasDataForSection('themes', props), icon: Tag, translationKey: 'themes' },
    { key: 'characters', hasData: hasDataForSection('characters', props), icon: Users, translationKey: 'characters' },
    { key: 'places', hasData: hasDataForSection('places', props), icon: MapPin, translationKey: 'places' },
  ];
}

function renderSections(
  configs: SectionConfig[],
  props: EntryDetectionsProps,
  t: (key: string) => string
): React.JSX.Element[] {
  return configs.map((config, index) => {
    const badge = createBadgeForSection(config.key, index, props);
    return buildDetectionSection(
      {
        key: config.key,
        icon: config.icon,
        translationKey: config.translationKey,
        badgeComponent: badge,
      },
      t
    ) as React.JSX.Element;
  });
}

function EntryDetectionsComponent({
  places,
  characters,
  themes,
  themeEmojis,
  moods,
  moodEmojis,
  className,
}: EntryDetectionsProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const props = { places, characters, themes, themeEmojis, moods, moodEmojis };
  const sectionConfigs = buildSectionConfigs(props);
  const sectionsWithData = sectionConfigs.filter(config => config.hasData);
  
  if (sectionsWithData.length === 0) {
    return null;
  }

  const sections = renderSections(sectionsWithData, props, t);
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

