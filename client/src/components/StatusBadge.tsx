import { cn } from "@/lib/utils";

type Status = "PENDING" | "PRINTING" | "COMPLETED";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    PRINTING: "bg-blue-100 text-blue-800 border-blue-200 animate-pulse",
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
  };

  const labels = {
    PENDING: "Pending",
    PRINTING: "Printing",
    COMPLETED: "Completed",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[status],
        className
      )}
    >
      {labels[status]}
    </span>
  );
}
