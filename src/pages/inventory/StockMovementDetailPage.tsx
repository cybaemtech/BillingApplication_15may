import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { stockMovementsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function StockMovementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: movement, isLoading } = useQuery({
    queryKey: ["stock_movement", id],
    queryFn: () => stockMovementsApi.get(id!),
    enabled: !!id,
  });
  if (isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!movement) return <div className="p-8 text-muted-foreground">Stock movement not found</div>;

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate("/inventory/stock-ledger")}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{movement.item_name || "Stock Movement"}</CardTitle>
          <CardDescription>Movement record linked to {movement.reference_type || "inventory transaction"}.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">SKU</p><p className="mt-2 font-medium">{movement.item_sku || "-"}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Type</p><p className="mt-2 font-medium">{movement.movement_type || "-"}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Quantity</p><p className="mt-2 font-medium">{Number(movement.quantity || 0).toLocaleString("en-IN")} {movement.item_unit || ""}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Cost Price</p><p className="mt-2 font-medium">{formatCurrency(Number(movement.effective_cost || movement.cost_price || 0))}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Reference Type</p><p className="mt-2 font-medium">{movement.reference_type || "-"}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Created At</p><p className="mt-2 font-medium">{movement.created_at ? new Date(movement.created_at).toLocaleString() : "-"}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
