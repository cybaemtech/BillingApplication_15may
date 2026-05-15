import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { invoicesApi, billsApi } from "@/lib/api";

export default function GSTR3BPage() {
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: invoicesApi.list });
  const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: billsApi.list });

  const outputTax = invoices.reduce((s: number, i: any) => s + Number(i.tax_amount), 0);
  const inputTax = bills.reduce((s: number, b: any) => s + Number(b.tax_amount), 0);
  const netPayable = outputTax - inputTax;

  const rows = [
    { label: "Output Tax (Sales)", value: outputTax },
    { label: "Input Tax Credit (Purchases)", value: inputTax },
    { label: "Net GST Payable", value: netPayable, highlight: true },
  ];

  return (
    <div>
      <PageHeader title="GSTR-3B" subtitle="Monthly return summary" />
      <div className="bg-card rounded-lg border border-border max-w-2xl">
        <div className="divide-y divide-border">
          {rows.map((r) => (
            <div key={r.label} className={`flex justify-between px-5 py-4 ${r.highlight ? "bg-primary/5" : ""}`}>
              <span className={`text-sm ${r.highlight ? "font-bold text-card-foreground" : "text-muted-foreground"}`}>{r.label}</span>
              <span className={`text-sm font-medium ${r.highlight ? "text-primary font-bold text-lg" : "text-card-foreground"}`}>₹{Math.abs(r.value).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
