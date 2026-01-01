'use client';

import { MessageEditDialog } from '@/components/message-edit-dialog';
import { MessageEditConfirmationDialog } from '@/components/message-edit-confirmation-dialog';
import { MessageDeleteConfirmationDialog } from '@/components/message-delete-confirmation-dialog';
import { MessageRegenerateConfirmationDialog } from '@/components/message-regenerate-confirmation-dialog';
import { MessageDiffDialog } from '@/components/message-diff-dialog';
import type { ChatMessage } from '@/ai/types/chat';

interface ChatMessageDialogsProps {
  message: ChatMessage;
  messageIndex: number;
  totalMessages: number;
  showEditDialog: boolean;
  showConfirmationDialog: boolean;
  showDeleteConfirmationDialog: boolean;
  showRegenerateConfirmationDialog: boolean;
  showDiffDialog: boolean;
  onEditDialogChange: (open: boolean) => void;
  onConfirmationDialogChange: (open: boolean) => void;
  onDeleteConfirmationDialogChange: (open: boolean) => void;
  onRegenerateConfirmationDialogChange: (open: boolean) => void;
  onDiffDialogChange: (open: boolean) => void;
  onConfirmationConfirm: () => void;
  onEditSave: (newContent: string) => Promise<void>;
  onDeleteConfirm: () => Promise<void>;
  onRegenerateConfirm: () => Promise<void>;
}

function calculateMessagesToDeleteCount(totalMessages: number, messageIndex: number): number {
  return Math.max(0, totalMessages - messageIndex - 1);
}

function renderConfirmationDialogs(
  props: ChatMessageDialogsProps,
  messagesToDeleteCount: number
): React.JSX.Element {
  return (
    <>
      <MessageEditConfirmationDialog
        open={props.showConfirmationDialog}
        onOpenChange={props.onConfirmationDialogChange}
        onConfirm={props.onConfirmationConfirm}
        messagesToDeleteCount={messagesToDeleteCount}
      />
      <MessageDeleteConfirmationDialog
        open={props.showDeleteConfirmationDialog}
        onOpenChange={props.onDeleteConfirmationDialogChange}
        onConfirm={props.onDeleteConfirm}
        messagesToDeleteCount={messagesToDeleteCount}
      />
      <MessageRegenerateConfirmationDialog
        open={props.showRegenerateConfirmationDialog}
        onOpenChange={props.onRegenerateConfirmationDialogChange}
        onConfirm={props.onRegenerateConfirm}
        messagesToDeleteCount={messagesToDeleteCount}
      />
    </>
  );
}

function renderEditAndDiffDialogs(props: ChatMessageDialogsProps): React.JSX.Element {
  return (
    <>
      <MessageEditDialog
        open={props.showEditDialog}
        onOpenChange={props.onEditDialogChange}
        initialContent={props.message.content}
        onSave={props.onEditSave}
      />
      {props.message.originalContent && (
        <MessageDiffDialog
          open={props.showDiffDialog}
          onOpenChange={props.onDiffDialogChange}
          originalContent={props.message.originalContent}
          editedContent={props.message.content}
        />
      )}
    </>
  );
}

export function ChatMessageDialogs(props: ChatMessageDialogsProps): React.JSX.Element {
  const messagesToDeleteCount = calculateMessagesToDeleteCount(props.totalMessages, props.messageIndex);

  return (
    <>
      {renderConfirmationDialogs(props, messagesToDeleteCount)}
      {renderEditAndDiffDialogs(props)}
    </>
  );
}

