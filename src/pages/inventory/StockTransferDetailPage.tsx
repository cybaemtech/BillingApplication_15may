import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { stockTransfersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function StockTransferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: transfer, isLoading } = useQuery({
    queryKey: ["stock_transfer", id],
    queryFn: () => stockTransfersApi.get(id!),
    enabled: !!id,
  });
  if (isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!transfer) return <div className="p-8 text-muted-foreground">Stock transfer not found</div>;

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate("/inventory/stock-transfers")}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      <div className="rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 p-6 text-white">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">Stock Transfer</p>
        <h1 className="mt-2 text-3xl font-semibold">{transfer.document_number}</h1>
        <p className="mt-2 text-sm text-cyan-100/80">{transfer.from_warehouse_name || "Source"} to {transfer.to_warehouse_name || "Destination"}</p>
      </div>
      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader><CardTitle className="text-xl">Transfer Items</CardTitle><CardDescription>Items and quantities moved in this transfer.</CardDescription></CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500"><th className="px-4 py-3">Item</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Unit</th><th className="px-4 py-3 text-right">Quantity</th></tr></thead>
              <tbody>
                {(transfer.items || []).length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No transfer items found.</td></tr> :
                  transfer.items.map((item: any) => (
                    <tr key={item.id} className="border-t border-slate-200">
                      <td className="px-4 py-3 font-medium">{item.item_name}</td>
                      <td className="px-4 py-3 text-slate-600">{item.sku || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{item.unit || "-"}</td>
                      <td className="px-4 py-3 text-right font-medium">{Number(item.quantity || 0).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
