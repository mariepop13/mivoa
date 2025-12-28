'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OpenRouterModel } from '@/ai/types/model';
import { formatPrice, formatContextLength, extractProvider } from '@/ai/services/model-service';

interface ModelCardProps {
  model: OpenRouterModel;
  isSelected: boolean;
  onSelect: (modelId: string) => void;
}

export function ModelCard({ model, isSelected, onSelect }: ModelCardProps): React.JSX.Element {
  const provider = extractProvider(model.id);
  const priceDisplay = formatPrice(model.pricing.prompt, model.pricing.completion);
  const contextDisplay = formatContextLength(model.context_length);

  return (
    <button
      onClick={() => onSelect(model.id)}
      className={cn(
        'w-full text-left p-4 rounded-lg border transition-all duration-200',
        'hover:border-primary/50 hover:bg-accent/50',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-card'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm text-foreground truncate">
              {model.name}
            </h3>
            {isSelected && (
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2">{provider}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">💰</span>{' '}
              <span>{priceDisplay}</span>
            </div>
            <div>
              <span className="font-medium">📏</span>{' '}
              <span>{contextDisplay}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

