import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-info/10 text-info",
  confirmed: "bg-primary/10 text-primary",
  converted: "bg-accent text-accent-foreground",
  approved: "bg-success/10 text-success",
  accepted: "bg-success/10 text-success",
  paid: "bg-success/10 text-success",
  partial: "bg-warning/10 text-warning",
  "partially paid": "bg-warning/10 text-warning",
  overdue: "bg-destructive/10 text-destructive",
  cancelled: "bg-destructive/10 text-destructive",
  declined: "bg-destructive/10 text-destructive",
  expired: "bg-muted text-muted-foreground",
  pending: "bg-warning/10 text-warning",
  delivered: "bg-success/10 text-success",
  received: "bg-success/10 text-success",
  open: "bg-info/10 text-info",
  closed: "bg-muted text-muted-foreground",
  active: "bg-success/10 text-success",
  inactive: "bg-muted text-muted-foreground",
  sales: "bg-success/10 text-success",
  purchase: "bg-warning/10 text-warning",
  payment: "bg-info/10 text-info",
  receipt: "bg-primary/10 text-primary",
  expense: "bg-destructive/10 text-destructive",
  adjustment: "bg-muted text-muted-foreground",
  manual: "bg-accent text-accent-foreground",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status?.toLowerCase()] || statusStyles.draft;
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize tracking-wide",
      style
    )}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full mr-1.5",
        style.includes("success") ? "bg-success" :
        style.includes("destructive") ? "bg-destructive" :
        style.includes("warning") ? "bg-warning" :
        style.includes("info") ? "bg-info" :
        style.includes("primary") ? "bg-primary" :
        "bg-muted-foreground"
      )} />
      {status?.replace(/_/g, " ") || "draft"}
    </span>
  );
}
