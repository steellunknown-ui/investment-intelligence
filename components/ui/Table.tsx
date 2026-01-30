import { ReactNode } from "react";
import { clsx } from "clsx";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  loading?: boolean;
  emptyState?: ReactNode;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyState,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-neutral-100 rounded mb-2" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-neutral-50 rounded mb-1" />
        ))}
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200">
            {columns.map((column) => (
              <th
                key={column.key}
                className={clsx(
                  "px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider",
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className="hover:bg-neutral-50 transition-colors"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={clsx(
                    "px-4 py-4 text-sm text-neutral-900",
                    column.className
                  )}
                >
                  {column.render
                    ? column.render(item)
                    : (item as any)[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
