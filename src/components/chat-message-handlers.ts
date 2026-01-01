interface MessageHandlersParams {
  messageIndex: number;
  onEdit?: (messageIndex: number, newContent: string) => Promise<void>;
  onDelete?: (messageIndex: number) => Promise<void>;
  onRegenerate?: (messageIndex: number) => Promise<void>;
  onUndoEdit?: (messageIndex: number) => Promise<void>;
  onEditDialogClose?: () => void;
}

function createEditHandler(
  messageIndex: number,
  onEdit: MessageHandlersParams['onEdit'],
  onEditDialogClose: MessageHandlersParams['onEditDialogClose']
) {
  return async (newContent: string): Promise<void> => {
    if (onEdit) {
      try {
        await onEdit(messageIndex, newContent);
        onEditDialogClose?.();
      } catch (err) {
        console.error('Failed to edit message:', err);
        throw err;
      }
    }
  };
}

function createDeleteHandler(
  messageIndex: number,
  onDelete: MessageHandlersParams['onDelete']
) {
  return async (): Promise<void> => {
    if (onDelete) {
      try {
        await onDelete(messageIndex);
      } catch (err) {
        console.error('Failed to delete message:', err);
        throw err;
      }
    }
  };
}

function createRegenerateHandler(
  messageIndex: number,
  onRegenerate: MessageHandlersParams['onRegenerate']
) {
  return async (): Promise<void> => {
    if (onRegenerate) {
      try {
        await onRegenerate(messageIndex);
      } catch (err) {
        console.error('Failed to regenerate:', err);
        throw err;
      }
    }
  };
}

function createUndoHandler(
  messageIndex: number,
  onUndoEdit: MessageHandlersParams['onUndoEdit']
) {
  return async (): Promise<void> => {
    if (onUndoEdit) {
      try {
        await onUndoEdit(messageIndex);
      } catch (err) {
        console.error('Failed to undo edit:', err);
        throw err;
      }
    }
  };
}

export function createMessageHandlers({
  messageIndex,
  onEdit,
  onDelete,
  onRegenerate,
  onUndoEdit,
  onEditDialogClose,
}: MessageHandlersParams) {
  return {
    handleEditSave: createEditHandler(messageIndex, onEdit, onEditDialogClose),
    handleDeleteConfirm: createDeleteHandler(messageIndex, onDelete),
    handleRegenerateConfirm: createRegenerateHandler(messageIndex, onRegenerate),
    handleUndoEdit: createUndoHandler(messageIndex, onUndoEdit),
  };
}

