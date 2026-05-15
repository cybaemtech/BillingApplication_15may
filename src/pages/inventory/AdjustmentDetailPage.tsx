import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { inventoryAdjustmentsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdjustmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: adjustment, isLoading } = useQuery({
    queryKey: ["inventory_adjustment", id],
    queryFn: () => inventoryAdjustmentsApi.get(id!),
    enabled: !!id,
  });
  if (isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!adjustment) return <div className="p-8 text-muted-foreground">Adjustment not found</div>;

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate("/inventory/adjustments")}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      <div className="rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-rose-950 to-orange-950 p-6 text-white">
        <p className="text-xs uppercase tracking-[0.18em] text-rose-100/70">Inventory Adjustment</p>
        <h1 className="mt-2 text-3xl font-semibold">{adjustment.document_number}</h1>
        <p className="mt-2 text-sm text-rose-100/80">{adjustment.reason || "Stock correction"} • {adjustment.warehouse_name || "No warehouse"}</p>
      </div>
      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader><CardTitle className="text-xl">Adjusted Items</CardTitle><CardDescription>Before and after quantities for this adjustment.</CardDescription></CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500"><th className="px-4 py-3">Item</th><th className="px-4 py-3 text-right">On Hand</th><th className="px-4 py-3 text-right">Adjusted</th><th className="px-4 py-3 text-right">Difference</th></tr></thead>
              <tbody>
                {(adjustment.items || []).length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No adjustment items found.</td></tr> :
                  adjustment.items.map((item: any) => (
                    <tr key={item.id} className="border-t border-slate-200">
                      <td className="px-4 py-3 font-medium">{item.item_name}</td>
                      <td className="px-4 py-3 text-right">{Number(item.quantity_on_hand || 0).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right">{Number(item.adjusted_quantity || 0).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right font-medium">{Number(item.difference || 0).toLocaleString("en-IN")}</td>
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
