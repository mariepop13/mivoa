'use client';

import { memo } from 'react';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CharactersBadgeProps {
  characters?: string[];
  colorClass?: string;
  className?: string;
}

function CharactersBadgeComponent({
  characters,
  colorClass,
  className,
}: CharactersBadgeProps): React.JSX.Element | null {
  if (!characters || characters.length === 0) {
    return null;
  }

  const sortedCharacters = [...characters].sort((a, b) => a.localeCompare(b));

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {sortedCharacters.map((character, index) => (
        <span
          key={`${character}-${index}`}
          className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border', colorClass)}
          aria-label={`Character: ${character}`}
          title={character}
        >
          <Users className="h-3 w-3" aria-hidden="true" />
          <span>{character}</span>
        </span>
      ))}
    </div>
  );
}

export const CharactersBadge = memo(CharactersBadgeComponent);

