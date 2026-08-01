import { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-screen-2xl flex-col gap-6 p-4",
        className,
      )}
    >
      {children}
    </main>
  );
}
