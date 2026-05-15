import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { stockMovementsApi } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { useState } from "react";
import { AppPagination } from "@/components/AppPagination";
import { emptyPaginatedResponse } from "@/lib/pagination";
import { useNavigate } from "react-router-dom";

export default function StockLedgerPage() {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { data: response = emptyPaginatedResponse<any>(), isLoading } = useQuery({
    queryKey: ["stock_movements", page],
    queryFn: () => stockMovementsApi.listPage(page),
  });
  const movements = response.data;

  return (
    <div>
      <PageHeader title="Stock Ledger" subtitle="Track stock movements across all transactions" />

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : movements.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No stock movements yet. Create invoices, bills, adjustments, or transfers to see stock changes.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Item</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Quantity</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Cost Price</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Reference</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m: any) => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/inventory/stock-ledger/${m.id}`)}>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 font-medium text-card-foreground">{m.item_name || "-"}</td>
                    <td className="px-5 py-3"><StatusBadge status={m.movement_type} /></td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">{Number(m.quantity)}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">Rs {Number(m.effective_cost || m.cost_price || 0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{m.reference_type || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <AppPagination currentPage={response.pagination.page} totalPages={response.pagination.totalPages} totalRecords={response.pagination.total} onPageChange={setPage} />
    </div>
  );
}


