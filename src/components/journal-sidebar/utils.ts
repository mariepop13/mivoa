export function getEntryItemClassName(
  selectedEntryId: string | null,
  entryId: string,
  isSelectionMode: boolean | undefined,
  isSelected: boolean
): string {
  if (selectedEntryId === entryId && !isSelectionMode) {
    return 'bg-primary/10 text-primary border border-primary/20';
  }
  if (isSelected && isSelectionMode) {
    return 'bg-primary/5 border-primary/10';
  }
  return 'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground border border-transparent';
}

export function handleEntryClick(
  isSelectionMode: boolean,
  isDraft: boolean,
  entryId: string,
  onEntrySelect: (entryId: string) => void,
  onToggleSelection?: (draftId: string) => void
): void {
  if (!isSelectionMode) {
    onEntrySelect(entryId);
    return;
  }
  if (isDraft) {
    onToggleSelection?.(entryId);
  }
}

