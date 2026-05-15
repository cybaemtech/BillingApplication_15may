import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse, BookOpen, Receipt,
  Monitor, Settings, ChevronDown, ChevronRight, BarChart3,
  CreditCard, Zap, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAccessContext } from "@/hooks/useAccessContext";
import { getFeatureKeyForPath } from "@/lib/access-control";

interface NavChild {
  label: string;
  path: string;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  path?: string;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  {
    label: "Sales", icon: ShoppingCart,
    children: [
      { label: "Customers", path: "/sales/customers" },
      { label: "Quotations", path: "/sales/quotations" },
      { label: "Sales Orders", path: "/sales/orders" },
      { label: "Delivery Challans", path: "/sales/delivery-challans" },
      { label: "Invoices", path: "/sales/invoices" },
      { label: "Recurring Invoices", path: "/sales/recurring-invoices" },
      { label: "Payments Received", path: "/sales/payments" },
      { label: "Credit Notes", path: "/sales/credit-notes" },
      { label: "Sales Returns", path: "/sales/returns" },
    ],
  },
  {
    label: "Purchase", icon: Package,
    children: [
      { label: "Vendors", path: "/purchase/vendors" },
      { label: "Purchase Orders", path: "/purchase/orders" },
      { label: "Bills", path: "/purchase/bills" },
      { label: "Recurring Bills", path: "/purchase/recurring-bills" },
      { label: "Payments Made", path: "/purchase/payments" },
      { label: "Vendor Credits", path: "/purchase/vendor-credits" },
      { label: "Purchase Returns", path: "/purchase/returns" },
    ],
  },
  {
    label: "Inventory", icon: Warehouse,
    children: [
      { label: "Items", path: "/inventory/items" },
      { label: "Categories", path: "/inventory/categories" },
      { label: "Price Lists", path: "/inventory/price-lists" },
      { label: "Warehouses", path: "/inventory/warehouses" },
      { label: "Stock Transfers", path: "/inventory/stock-transfers" },
      { label: "Adjustments", path: "/inventory/adjustments" },
      { label: "Stock Ledger", path: "/inventory/stock-ledger" },
    ],
  },
  { label: "Expenses", icon: CreditCard, path: "/expenses" },
  {
    label: "Accounting", icon: BookOpen,
    children: [
      { label: "Chart of Accounts", path: "/accounting/chart" },
      { label: "Journal Entries", path: "/accounting/journals" },
      { label: "Ledger", path: "/accounting/ledger" },
      { label: "Trial Balance", path: "/accounting/trial-balance" },
      { label: "Profit & Loss", path: "/accounting/pnl" },
      { label: "Balance Sheet", path: "/accounting/balance-sheet" },
      { label: "Cash Flow", path: "/accounting/cash-flow" },
      { label: "Day Book", path: "/accounting/day-book" },
    ],
  },
  {
    label: "GST & Compliance", icon: Receipt,
    children: [
      { label: "GST Settings", path: "/gst/settings" },
      { label: "GSTR-1", path: "/gst/gstr1" },
      { label: "GSTR-3B", path: "/gst/gstr3b" },
      { label: "HSN Summary", path: "/gst/hsn" },
      { label: "E-Invoice", path: "/gst/einvoice" },
      { label: "E-Way Bill", path: "/gst/eway" },
    ],
  },
  {
    label: "POS", icon: Monitor,
    children: [
      { label: "New Sale", path: "/pos" },
      { label: "Sessions", path: "/pos/sessions" },
      { label: "Orders", path: "/pos/orders" },
    ],
  },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  {
    label: "Automation", icon: Zap,
    children: [
      { label: "Workflows", path: "/automation/workflows" },
      { label: "Reminders", path: "/automation/reminders" },
    ],
  },
  { label: "Settings", icon: Settings, path: "/settings" },
];

interface AppSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function AppSidebar({ collapsed, mobileOpen, onCloseMobile }: AppSidebarProps) {
  const location = useLocation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [menuSearch, setMenuSearch] = useState("");
  const { data: accessContext } = useAccessContext();

  const toggleSection = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path?: string) => path === location.pathname;
  const isChildActive = (children?: NavChild[]) =>
    children?.some((c) => location.pathname.startsWith(c.path));

  const canAccessPath = (path?: string) => {
    if (!path) return true;
    if (!accessContext) return true;
    if (accessContext.is_super_admin) return true;

    const featureKey = getFeatureKeyForPath(path);
    if (!featureKey) return true;
    return accessContext.effective_features.includes(featureKey);
  };

  const accessFilteredItems = navItems
    .map((item) => {
      if (item.children) {
        const visibleChildren = item.children.filter((child) => canAccessPath(child.path));
        return visibleChildren.length > 0 ? { ...item, children: visibleChildren } : null;
      }

      return canAccessPath(item.path) ? item : null;
    })
    .filter(Boolean) as NavItem[];

  // Auto-expand active section
  useEffect(() => {
    accessFilteredItems.forEach((item) => {
      if (item.children && isChildActive(item.children)) {
        setExpanded((prev) => ({ ...prev, [item.label]: true }));
      }
    });
  }, [location.pathname, accessFilteredItems]);

  // Filter menu items by search
  const filteredItems = menuSearch
    ? accessFilteredItems.filter((item) => {
        if (item.label.toLowerCase().includes(menuSearch.toLowerCase())) return true;
        if (item.children?.some(c => c.label.toLowerCase().includes(menuSearch.toLowerCase()))) return true;
        return false;
      })
    : accessFilteredItems;

  const sidebarWidth = collapsed ? "w-16" : "w-60";

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-foreground/20 z-40" onClick={onCloseMobile} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-sidebar transition-all duration-200 flex flex-col",
          sidebarWidth,
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0 !w-60" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3 border-b border-sidebar-border h-14 shrink-0",
          collapsed ? "justify-center px-2" : "px-5"
        )}>
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="animate-slide-in-left">
              <h1 className="text-sm font-bold text-sidebar-accent-foreground tracking-tight font-display">BillFlow</h1>
              <p className="text-[10px] text-sidebar-muted">Accounting Suite</p>
            </div>
          )}
        </div>

        {/* Menu Search */}
        {(!collapsed || mobileOpen) && (
          <div className="px-3 pt-3 pb-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sidebar-muted" />
              <Input
                placeholder="Search menu…"
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-sidebar-accent border-sidebar-border text-sidebar-accent-foreground placeholder:text-sidebar-muted"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = !!item.children;
            const isOpen = expanded[item.label] || (menuSearch && isChildActive(item.children));
            const active = isActive(item.path);

            // Filter children by search
            const visibleChildren = menuSearch
              ? item.children?.filter(c => c.label.toLowerCase().includes(menuSearch.toLowerCase()))
              : item.children;

            if (hasChildren) {
              return (
                <div key={item.label} className="mb-0.5">
                  <button
                    onClick={() => toggleSection(item.label)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-md text-[13px] transition-colors",
                      collapsed && !mobileOpen ? "justify-center px-0 py-2.5" : "px-3 py-2",
                      isChildActive(item.children)
                        ? "text-sidebar-accent-foreground bg-sidebar-accent"
                        : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {(!collapsed || mobileOpen) && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </>
                    )}
                  </button>
                  {isOpen && (!collapsed || mobileOpen) && (
                    <div className="ml-4 mt-0.5 pl-3 border-l border-sidebar-border space-y-0.5 animate-fade-in">
                      {(visibleChildren || []).map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={onCloseMobile}
                          className={cn(
                            "block px-3 py-1.5 rounded-md text-[12px] transition-colors",
                            location.pathname === child.path
                              ? "text-sidebar-primary bg-sidebar-accent font-medium"
                              : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.path!}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-3 rounded-md text-[13px] mb-0.5 transition-colors",
                  collapsed && !mobileOpen ? "justify-center px-0 py-2.5" : "px-3 py-2",
                  active
                    ? "text-sidebar-primary bg-sidebar-accent font-medium"
                    : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {(!collapsed || mobileOpen) && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
