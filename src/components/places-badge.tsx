'use client';

import { memo } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlacesBadgeProps {
  places?: string[];
  colorClass?: string;
  className?: string;
}

function PlacesBadgeComponent({ places, colorClass, className }: PlacesBadgeProps): React.JSX.Element | null {
  if (!places || places.length === 0) {
    return null;
  }

  const sortedPlaces = [...places].sort((a, b) => a.localeCompare(b));

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {sortedPlaces.map((place, index) => (
        <span
          key={`${place}-${index}`}
          className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border', colorClass)}
          aria-label={`Place: ${place}`}
          title={place}
        >
          <MapPin className="h-3 w-3" aria-hidden="true" />
          <span>{place}</span>
        </span>
      ))}
    </div>
  );
}

export const PlacesBadge = memo(PlacesBadgeComponent);
