import { PageHeader } from "@/components/PageHeader";
import { BarChart3, TrendingUp, FileText, PieChart, DollarSign, Calendar } from "lucide-react";

const reports = [
  { icon: TrendingUp, label: "Profit & Loss", desc: "Income and expense summary", path: "/accounting/pnl" },
  { icon: BarChart3, label: "Balance Sheet", desc: "Assets, liabilities & equity", path: "/accounting/balance-sheet" },
  { icon: DollarSign, label: "Cash Flow", desc: "Cash inflow and outflow", path: "/accounting/cash-flow" },
  { icon: FileText, label: "Trial Balance", desc: "Account-wise trial balance", path: "/accounting/trial-balance" },
  { icon: Calendar, label: "Day Book", desc: "Daily transaction summary", path: "/accounting/day-book" },
  { icon: PieChart, label: "GST Reports", desc: "GSTR-1, GSTR-3B, HSN summary", path: "/gst/settings" },
];

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" subtitle="Financial reports and analytics" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <a
              key={report.label}
              href={report.path}
              className="bg-card rounded-lg border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-accent group-hover:bg-primary/10 transition-colors">
                  <Icon className="w-5 h-5 text-accent-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground">{report.label}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{report.desc}</p>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
