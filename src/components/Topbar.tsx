import { Bell, Search, Menu, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
  onToggleSidebar: () => void;
}

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/sales/customers": "Customers",
  "/sales/quotations": "Quotations",
  "/sales/orders": "Sales Orders",
  "/sales/delivery-challans": "Delivery Challans",
  "/sales/invoices": "Invoices",
  "/sales/recurring-invoices": "Recurring Invoices",
  "/sales/payments": "Payments Received",
  "/sales/credit-notes": "Credit Notes",
  "/sales/returns": "Sales Returns",
  "/purchase/vendors": "Vendors",
  "/purchase/orders": "Purchase Orders",
  "/purchase/bills": "Bills",
  "/purchase/recurring-bills": "Recurring Bills",
  "/purchase/payments": "Payments Made",
  "/purchase/vendor-credits": "Vendor Credits",
  "/purchase/returns": "Purchase Returns",
  "/inventory/items": "Items",
  "/inventory/categories": "Categories",
  "/inventory/price-lists": "Price Lists",
  "/inventory/warehouses": "Warehouses",
  "/inventory/stock-transfers": "Stock Transfers",
  "/inventory/adjustments": "Adjustments",
  "/inventory/stock-ledger": "Stock Ledger",
  "/expenses": "Expenses",
  "/accounting/chart": "Chart of Accounts",
  "/accounting/journals": "Journal Entries",
  "/accounting/ledger": "Ledger",
  "/accounting/trial-balance": "Trial Balance",
  "/accounting/pnl": "Profit & Loss",
  "/accounting/balance-sheet": "Balance Sheet",
  "/accounting/cash-flow": "Cash Flow",
  "/accounting/day-book": "Day Book",
  "/gst/settings": "GST Settings",
  "/gst/gstr1": "GSTR-1",
  "/gst/gstr3b": "GSTR-3B",
  "/gst/hsn": "HSN Summary",
  "/gst/einvoice": "E-Invoice",
  "/gst/eway": "E-Way Bill",
  "/pos": "POS",
  "/pos/sessions": "POS Sessions",
  "/pos/orders": "POS Orders",
  "/reports": "Reports",
  "/automation/workflows": "Workflows",
  "/automation/reminders": "Reminders",
  "/settings": "Settings",
};

function getBreadcrumb(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return [{ label: "Dashboard" }];

  const crumbs: { label: string }[] = [];
  // Module
  if (parts[0]) {
    crumbs.push({ label: parts[0].charAt(0).toUpperCase() + parts[0].slice(1) });
  }
  // Page
  const label = routeLabels[pathname];
  if (label && crumbs[0]?.label !== label) {
    crumbs.push({ label });
  }
  return crumbs;
}

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const { user, userRole, signOut } = useAuth();
  const location = useLocation();
  const breadcrumbs = getBreadcrumb(location.pathname);

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onToggleSidebar}
        >
          <Menu className="h-4 w-4" />
        </Button>

        <nav className="hidden sm:flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              <span className={i === breadcrumbs.length - 1 ? "font-medium text-foreground" : "text-muted-foreground"}>
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:block relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Quick search… (⌘K)"
            className="pl-8 h-8 w-56 text-xs bg-muted/50 border-transparent focus:border-border focus:bg-card"
          />
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center">3</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 h-8 px-2 rounded-md hover:bg-muted transition-colors">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-medium text-foreground leading-none">{userRole || "User"}</p>
                <p className="text-[10px] text-muted-foreground leading-tight truncate max-w-[120px]">{user?.email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="text-xs">Profile</DropdownMenuItem>
            <DropdownMenuItem className="text-xs">Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs text-destructive" onClick={() => signOut()}>
              <LogOut className="h-3.5 w-3.5 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
