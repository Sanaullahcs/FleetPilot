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
      <div className="fp-card flex flex-col items-center justify-center py-20">
        <Spinner className="h-8 w-8" />
        <p className="mt-3 text-sm text-slate-500">Loading data…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="fp-card flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
          !
        </div>
        <p className="text-sm font-medium text-brand-secondary">{errorMessage}</p>
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
