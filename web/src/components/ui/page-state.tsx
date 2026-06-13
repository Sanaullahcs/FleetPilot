"use client";

import { Spinner, Button, EmptyState } from "@/components/ui/primitives";

interface PageStateProps {
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function PageState({
  isLoading,
  isError,
  errorMessage = "Something went wrong loading this page.",
  isEmpty,
  emptyMessage = "No records found.",
  onRetry,
  children,
}: PageStateProps) {
  if (isLoading) {
    return (
      <div className="fp-panel flex flex-col items-center justify-center py-16">
        <Spinner className="h-7 w-7" />
        <p className="mt-3 text-xs text-slate-500">Loading data…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="fp-panel flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-sm font-bold text-red-500">
          !
        </div>
        <p className="text-xs font-medium text-brand-secondary">{errorMessage}</p>
        {onRetry && (
          <Button variant="secondary" className="mt-4" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return <EmptyState message={emptyMessage} />;
  }

  return <>{children}</>;
}
