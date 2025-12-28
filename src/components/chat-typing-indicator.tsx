'use client';

export function ChatTypingIndicator(): React.JSX.Element {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-muted text-foreground border border-border rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse delay-75" />
          <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse delay-150" />
        </div>
      </div>
    </div>
  );
}

