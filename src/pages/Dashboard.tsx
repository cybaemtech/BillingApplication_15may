import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Warehouse,
  Receipt,
  AlertTriangle,
  FileText,
  DollarSign,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { StatusBadge } from "@/components/StatusBadge";
import { AppPagination } from "@/components/AppPagination";
import { dashboardApi } from "@/lib/api";
import { emptyPaginatedResponse } from "@/lib/pagination";

const chartData = [
  { month: "Jan", sales: 4200, expenses: 2400 },
  { month: "Feb", sales: 3800, expenses: 2100 },
  { month: "Mar", sales: 5100, expenses: 2800 },
  { month: "Apr", sales: 4600, expenses: 2200 },
  { month: "May", sales: 5800, expenses: 3100 },
  { month: "Jun", sales: 6200, expenses: 2900 },
];

const primaryColor = "hsl(221, 83%, 53%)";
const destructiveColor = "hsl(0, 72%, 51%)";
const borderColor = "hsl(214, 32%, 91%)";
const mutedFg = "hsl(215, 16%, 47%)";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function Dashboard() {
  const [recentInvoicesPage, setRecentInvoicesPage] = useState(1);
  const [lowStockPage, setLowStockPage] = useState(1);

  const { data: stats } = useQuery({ queryKey: ["dashboard_stats"], queryFn: dashboardApi.getStats });
  const { data: recentInvoicesResponse = emptyPaginatedResponse<any>() } = useQuery({
    queryKey: ["dashboard_recent", recentInvoicesPage],
    queryFn: () => dashboardApi.getRecentInvoices(recentInvoicesPage),
  });
  const { data: lowStockResponse = emptyPaginatedResponse<any>() } = useQuery({
    queryKey: ["dashboard_lowstock", lowStockPage],
    queryFn: () => dashboardApi.getLowStockItems(lowStockPage),
  });

  const recentInvoices = recentInvoicesResponse.data;
  const lowStock = lowStockResponse.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight font-display">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Financial overview for your business</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={formatCurrency(stats?.totalSales || 0)} change="+12% from last month" changeType="positive" icon={TrendingUp} />
        <StatCard title="Receivables" value={formatCurrency(stats?.totalReceivables || 0)} change={`${stats?.invoiceCount || 0} open invoices`} changeType="neutral" icon={ArrowUpRight} iconColor="bg-warning/10" />
        <StatCard title="Payables" value={formatCurrency(stats?.totalPayables || 0)} icon={ArrowDownRight} iconColor="bg-destructive/10" />
        <StatCard title="Net Profit" value={formatCurrency((stats?.totalSales || 0) - (stats?.totalPurchase || 0))} change="This month" changeType="neutral" icon={DollarSign} iconColor="bg-success/10" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Purchase" value={formatCurrency(stats?.totalPurchase || 0)} icon={ShoppingCart} />
        <StatCard title="Stock Value" value={formatCurrency(stats?.stockValue || 0)} icon={Warehouse} />
        <StatCard title="GST Payable" value={formatCurrency(stats?.gstPayable || 0)} icon={Receipt} />
        <StatCard title="Low Stock" value={`${stats?.lowStockCount || 0} Items`} changeType={stats?.lowStockCount ? "negative" : "neutral"} change={stats?.lowStockCount ? "Action needed" : "All good"} icon={AlertTriangle} iconColor="bg-warning/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Revenue Trend</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primaryColor} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke={mutedFg} />
                <YAxis tick={{ fontSize: 11 }} stroke={mutedFg} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${borderColor}` }} />
                <Area type="monotone" dataKey="sales" stroke={primaryColor} fill="url(#salesGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Sales vs Expenses</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke={mutedFg} />
                <YAxis tick={{ fontSize: 11 }} stroke={mutedFg} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${borderColor}` }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="sales" name="Sales" fill={primaryColor} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill={destructiveColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-card-foreground">Recent Invoices</h3>
            <a href="/sales/invoices" className="text-xs text-primary font-medium hover:underline">View all →</a>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No invoices yet</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Invoice</th>
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                      <th className="text-right px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((inv: any) => (
                      <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-primary/[0.02] transition-colors cursor-pointer">
                        <td className="px-5 py-2.5 font-medium text-primary">{inv.document_number}</td>
                        <td className="px-5 py-2.5 text-card-foreground">{inv.customers?.name}</td>
                        <td className="px-5 py-2.5 text-right font-semibold text-card-foreground">{formatCurrency(Number(inv.total || 0))}</td>
                        <td className="px-5 py-2.5"><StatusBadge status={inv.status} /></td>
                        <td className="px-5 py-2.5 text-muted-foreground">{inv.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <AppPagination
                currentPage={recentInvoicesResponse.pagination.page}
                totalPages={recentInvoicesResponse.pagination.totalPages}
                totalRecords={recentInvoicesResponse.pagination.total}
                start={recentInvoicesResponse.pagination.start}
                end={recentInvoicesResponse.pagination.end}
                onPageChange={setRecentInvoicesPage}
              />
            </>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border">
          <div className="px-5 py-3.5 border-b border-border">
            <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Low Stock Alerts
            </h3>
          </div>
          {lowStock.length === 0 ? (
            <div className="p-12 text-center">
              <Warehouse className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No low stock items</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {lowStock.map((item: any) => {
                  const reorderLevel = Number(item.reorder_level || 0);
                  const currentStock = Number(item.current_stock || 0);
                  const width = reorderLevel > 0 ? Math.min(100, (currentStock / reorderLevel) * 100) : 0;

                  return (
                    <div key={item.id} className="px-5 py-3 hover:bg-muted/30 transition-colors">
                      <p className="text-sm font-medium text-card-foreground">{item.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">{currentStock} {item.unit} left</p>
                        <span className="text-xs text-destructive font-medium">Min: {reorderLevel}</span>
                      </div>
                      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-destructive rounded-full transition-all" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <AppPagination
                currentPage={lowStockResponse.pagination.page}
                totalPages={lowStockResponse.pagination.totalPages}
                totalRecords={lowStockResponse.pagination.total}
                pageSize={5}
                start={lowStockResponse.pagination.start}
                end={lowStockResponse.pagination.end}
                onPageChange={setLowStockPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
