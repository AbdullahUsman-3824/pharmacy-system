import { Loader2 } from "lucide-react";
import Card from "../ui/card";

interface LoadingStateProps {
  message?: string; // optional – if not provided, no text shows
  size?: "sm" | "md" | "lg"; // controls spinner size
  fullPage?: boolean; // if true, renders a full‑screen overlay
}

const LoadingState = ({
  message,
  size = "md",
  fullPage = false,
}: LoadingStateProps) => {
  // Map size to Tailwind classes for the Lucide icon
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader2
        className={`${sizeClasses[size]} animate-spin text-[var(--color-primary)]`}
        aria-label="Loading"
        role="status"
      />
      {message && (
        <p className="text-[var(--color-text-muted)] font-medium">{message}</p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return (
    <Card variant="bordered" className="flex items-center justify-center py-12">
      {content}
    </Card>
  );
};

export default LoadingState;
