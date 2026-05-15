import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { invoicesApi } from "@/lib/api";
import { useState } from "react";
import { AppPagination } from "@/components/AppPagination";
import { paginateArray } from "@/lib/pagination";

export default function EInvoicePage() {
  const { data: invoices = [], isLoading } = useQuery({ queryKey: ["invoices"], queryFn: invoicesApi.list });
  const [page, setPage] = useState(1);
  const paginatedInvoices = paginateArray(invoices, page);

  return (
    <div>
      <PageHeader title="E-Invoice" subtitle="Generate IRN for GST-compliant invoices" />
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? <div className="p-12 text-center text-muted-foreground">Loading...</div> : invoices.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No invoices available. Create invoices first.</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Invoice #</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Customer</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Date</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Total</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">IRN</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
            </tr></thead>
            <tbody>{paginatedInvoices.data.map((inv: any) => (
              <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-5 py-3 font-medium text-primary">{inv.document_number}</td>
                <td className="px-5 py-3 text-card-foreground">{inv.customer_name || "-"}</td>
                <td className="px-5 py-3 text-muted-foreground">{inv.date}</td>
                <td className="px-5 py-3 text-right font-medium text-card-foreground">₹{Number(inv.total).toLocaleString()}</td>
                <td className="px-5 py-3 text-muted-foreground text-xs">{inv.irn || "Not generated"}</td>
                <td className="px-5 py-3"><StatusBadge status={inv.irn ? "confirmed" : "draft"} /></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      <AppPagination currentPage={paginatedInvoices.pagination.page} totalPages={paginatedInvoices.pagination.totalPages} totalRecords={paginatedInvoices.pagination.total} onPageChange={setPage} />
    </div>
  );
}

