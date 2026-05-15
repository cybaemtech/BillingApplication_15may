import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Tag } from "lucide-react";
import { priceListsApi } from "@/lib/api";
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

export default function PriceListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: priceList, isLoading } = useQuery({
    queryKey: ["price_list", id],
    queryFn: () => priceListsApi.get(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!priceList) return <div className="p-8 text-muted-foreground">Price list not found</div>;

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate("/inventory/price-lists")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-amber-950 to-orange-950 p-6 text-white">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-amber-100/70">Price List</p>
            <h1 className="mt-2 text-3xl font-semibold">{priceList.name}</h1>
            <p className="mt-2 text-sm text-amber-100/80">{priceList.description || "Alternate pricing setup for selected items."}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 min-w-[180px]">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-100/70">Items</p>
            <p className="mt-2 text-2xl font-semibold">{Number(priceList.items?.length || 0).toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Item Pricing</CardTitle>
          <CardDescription>Items covered by this price list and their saved special prices.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3 text-right">Default Price</th>
                  <th className="px-4 py-3 text-right">Special Price</th>
                  <th className="px-4 py-3 text-right">Current Stock</th>
                </tr>
              </thead>
              <tbody>
                {(priceList.items || []).length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No item prices saved in this list.</td></tr>
                ) : (
                  priceList.items.map((item: any) => (
                    <tr key={item.id} className="border-t border-slate-200">
                      <td className="px-4 py-3 font-medium text-slate-900">{item.item_name || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{item.sku || "-"}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(Number(item.selling_rate || 0))}</td>
                      <td className="px-4 py-3 text-right font-medium text-amber-700">{formatCurrency(Number(item.rate || 0))}</td>
                      <td className="px-4 py-3 text-right">{Number(item.current_stock || 0).toLocaleString("en-IN")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
