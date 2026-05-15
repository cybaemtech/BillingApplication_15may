import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { warehousesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WarehouseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: warehouse, isLoading } = useQuery({
    queryKey: ["warehouse", id],
    queryFn: () => warehousesApi.get(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!warehouse) return <div className="p-8 text-muted-foreground">Warehouse not found</div>;

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate("/inventory/warehouses")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 p-6 text-white">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/70">Warehouse</p>
            <h1 className="mt-2 text-3xl font-semibold">{warehouse.warehouse_name}</h1>
            <p className="mt-2 text-sm text-emerald-100/80">{warehouse.address || "No address saved."}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 min-w-[260px]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-[0.18em] text-emerald-100/70">Transfers</p><p className="mt-2 text-2xl font-semibold">{Number(warehouse.transfer_count || 0)}</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-[0.18em] text-emerald-100/70">Adjustments</p><p className="mt-2 text-2xl font-semibold">{Number(warehouse.adjustment_count || 0)}</p></div>
          </div>
        </div>
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Warehouse Stock</CardTitle>
          <CardDescription>Current item quantities tracked for this warehouse.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500"><th className="px-4 py-3">Item</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Unit</th><th className="px-4 py-3 text-right">Quantity</th></tr></thead>
              <tbody>
                {(warehouse.stock_items || []).length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No warehouse stock entries yet.</td></tr> :
                  warehouse.stock_items.map((item: any) => (
                    <tr key={item.id} className="border-t border-slate-200">
                      <td className="px-4 py-3 font-medium text-slate-900">{item.item_name}</td>
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
