import { Button } from "./Button";
import { Card } from "./Card";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  /** If true, wraps the empty state in a Card */
  withCard?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  withCard = false,
}: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
          <Icon className="h-6 w-6 text-slate-500 dark:text-slate-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md">{description}</p>
      {action && (
        <div className="mt-6">
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );

  if (withCard) {
    return <Card padding="none">{content}</Card>;
  }

  return content;
}
