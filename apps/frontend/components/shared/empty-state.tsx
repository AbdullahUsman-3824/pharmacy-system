import { ReactNode } from "react";
import Card from "../ui/card";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  return (
    <Card variant="default" className="text-center py-12">
      {icon && <div className="flex justify-center mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-[var(--color-text)]">
        {title}
      </h3>
      {description && (
        <p className="mt-2 text-[var(--color-text-muted)] max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </Card>
  );
};

export default EmptyState;
