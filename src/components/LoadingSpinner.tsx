import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "Searching for answers..." }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}