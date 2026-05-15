import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package2, ShoppingCart, Truck } from "lucide-react";
import { itemsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString("en-IN");
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: item, isLoading } = useQuery({
    queryKey: ["item", id],
    queryFn: () => itemsApi.get(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!item) return <div className="p-8 text-muted-foreground">Item not found</div>;

  const stockValue = Number(item.current_stock || 0) * Number(item.selling_rate || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => navigate("/inventory/items")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      <div className="rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <Badge className="bg-white/10 text-white hover:bg-white/10 border-white/10">Item Profile</Badge>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{item.name}</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Item-level stock, pricing, purchase flow, and sales movement in a single detail view.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-200">
              <span className="inline-flex items-center gap-2"><Package2 className="w-4 h-4" /> SKU: {item.sku || "-"}</span>
              <span className="inline-flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Category: {item.category || "-"}</span>
              <span className="inline-flex items-center gap-2"><Truck className="w-4 h-4" /> Unit: {item.unit || "-"}</span>
            </div>
          </div>
          <div className="grid min-w-[280px] grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Current Stock</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(Number(item.current_stock || 0))}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Stock Value</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(stockValue)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Sold Qty</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(Number(item.sold_quantity || 0))}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Purchased Qty</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(Number(item.purchased_quantity || 0))}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Item Details</CardTitle>
            <CardDescription>Master data, pricing, and replenishment settings.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">HSN Code</p>
              <p className="mt-2 font-medium text-slate-900">{item.hsn_code || "-"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tax Rate</p>
              <p className="mt-2 font-medium text-slate-900">{item.tax_rate_name ? `${item.tax_rate_name} (${item.tax_rate_value}%)` : "-"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Purchase Rate</p>
              <p className="mt-2 font-medium text-slate-900">{formatCurrency(Number(item.purchase_rate || 0))}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selling Rate</p>
              <p className="mt-2 font-medium text-slate-900">{formatCurrency(Number(item.selling_rate || 0))}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Opening Stock</p>
              <p className="mt-2 font-medium text-slate-900">{formatNumber(Number(item.opening_stock || 0))}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Reorder Level</p>
              <p className="mt-2 font-medium text-slate-900">{formatNumber(Number(item.reorder_level || 0))}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Commercial Summary</CardTitle>
            <CardDescription>Aggregated buy/sell performance for this item.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sales Value</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(Number(item.sales_value || 0))}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Purchase Value</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(Number(item.purchase_value || 0))}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{item.is_active ? "Active" : "Inactive"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Stock Health</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {Number(item.current_stock || 0) <= Number(item.reorder_level || 0) ? "Reorder Soon" : "In Stock"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Movement History</CardTitle>
          <CardDescription>Stock movement plus latest sales and purchase transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="stock" className="space-y-4">
            <TabsList className="h-auto flex-wrap justify-start gap-1 rounded-2xl bg-slate-100 p-1">
              <TabsTrigger value="stock" className="rounded-xl">Stock</TabsTrigger>
              <TabsTrigger value="sales" className="rounded-xl">Sales</TabsTrigger>
              <TabsTrigger value="purchases" className="rounded-xl">Purchases</TabsTrigger>
            </TabsList>

            <TabsContent value="stock">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 text-right">Quantity</th>
                      <th className="px-4 py-3">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(item.stock_movements || []).length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No stock movements found.</td></tr>
                    ) : (
                      item.stock_movements.map((movement: any) => (
                        <tr key={movement.id} className="border-t border-slate-200">
                          <td className="px-4 py-3">{movement.created_at || movement.date || "-"}</td>
                          <td className="px-4 py-3">{movement.movement_type || movement.type || "-"}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatNumber(Number(movement.quantity || 0))}</td>
                          <td className="px-4 py-3">{movement.reference_type || movement.notes || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="sales">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                      <th className="px-4 py-3">Invoice</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Rate</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(item.sales_history || []).length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No sales history found.</td></tr>
                    ) : (
                      item.sales_history.map((entry: any) => (
                        <tr key={`${entry.document_id}-${entry.date}`} className="border-t border-slate-200">
                          <td className="px-4 py-3 font-medium text-slate-900">{entry.document_number}</td>
                          <td className="px-4 py-3">{entry.customer_name || "-"}</td>
                          <td className="px-4 py-3 text-right">{formatNumber(Number(entry.quantity || 0))}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(Number(entry.rate || 0))}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(entry.line_total || 0))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="purchases">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                      <th className="px-4 py-3">Bill</th>
                      <th className="px-4 py-3">Vendor</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Rate</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(item.purchase_history || []).length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No purchase history found.</td></tr>
                    ) : (
                      item.purchase_history.map((entry: any) => (
                        <tr key={`${entry.document_id}-${entry.date}`} className="border-t border-slate-200">
                          <td className="px-4 py-3 font-medium text-slate-900">{entry.document_number}</td>
                          <td className="px-4 py-3">{entry.vendor_name || "-"}</td>
                          <td className="px-4 py-3 text-right">{formatNumber(Number(entry.quantity || 0))}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(Number(entry.rate || 0))}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(entry.line_total || 0))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
