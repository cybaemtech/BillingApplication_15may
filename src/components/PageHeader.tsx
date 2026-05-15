import { ReactNode } from "react";
import { Plus, Search, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryActions?: { label: string; icon?: React.ElementType; onClick: () => void }[];
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, action, secondaryActions, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight font-display">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {secondaryActions?.map((sa) => {
          const Icon = sa.icon;
          return (
            <Button key={sa.label} variant="outline" size="sm" onClick={sa.onClick} className="h-8 text-xs">
              {Icon && <Icon className="w-3.5 h-3.5 mr-1.5" />}
              {sa.label}
            </Button>
          );
        })}
        {children}
        {action && (
          <Button onClick={action.onClick} size="sm" className="h-8 text-xs">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}

interface DataToolbarProps {
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  children?: ReactNode;
}

export function DataToolbar({ searchPlaceholder = "Search...", onSearch, children }: DataToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-3">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          className="pl-8 h-8 text-xs"
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>
      {children}
    </div>
  );
}
