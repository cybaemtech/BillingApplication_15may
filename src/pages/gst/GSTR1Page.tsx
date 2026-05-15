import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { invoicesApi } from "@/lib/api";
import { useState } from "react";
import { AppPagination } from "@/components/AppPagination";
import { paginateArray } from "@/lib/pagination";

export default function GSTR1Page() {
  const { data: invoices = [], isLoading } = useQuery({ queryKey: ["invoices"], queryFn: invoicesApi.list });
  const [page, setPage] = useState(1);
  const paginatedInvoices = paginateArray(invoices, page);
  const totalTaxable = invoices.reduce((s: number, i: any) => s + Number(i.subtotal), 0);
  const totalTax = invoices.reduce((s: number, i: any) => s + Number(i.tax_amount), 0);

  return (
    <div>
      <PageHeader title="GSTR-1" subtitle="Outward supply details" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg border border-border p-5">
          <p className="text-xs text-muted-foreground">Total Invoices</p>
          <p className="text-2xl font-bold text-card-foreground mt-1">{invoices.length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-5">
          <p className="text-xs text-muted-foreground">Taxable Value</p>
          <p className="text-2xl font-bold text-card-foreground mt-1">₹{totalTaxable.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-5">
          <p className="text-xs text-muted-foreground">Total Tax</p>
          <p className="text-2xl font-bold text-primary mt-1">₹{totalTax.toLocaleString()}</p>
        </div>
      </div>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? <div className="p-12 text-center text-muted-foreground">Loading...</div> : invoices.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No invoices for GSTR-1.</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Invoice #</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Customer</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Date</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Taxable</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Tax</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Total</th>
            </tr></thead>
            <tbody>
              {paginatedInvoices.data.map((inv: any) => (
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium text-primary">{inv.document_number}</td>
                  <td className="px-5 py-3 text-card-foreground">{inv.customer_name || "-"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{inv.date}</td>
                  <td className="px-5 py-3 text-right text-card-foreground">₹{Number(inv.subtotal).toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-card-foreground">₹{Number(inv.tax_amount).toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-medium text-card-foreground">₹{Number(inv.total).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <AppPagination currentPage={paginatedInvoices.pagination.page} totalPages={paginatedInvoices.pagination.totalPages} totalRecords={paginatedInvoices.pagination.total} onPageChange={setPage} />
    </div>
  );
}

