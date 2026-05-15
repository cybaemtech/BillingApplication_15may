import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, Receipt, UserRound } from "lucide-react";
import { posOrdersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function POSOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ["pos_order", id],
    queryFn: () => posOrdersApi.get(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!order) return <div className="p-8 text-muted-foreground">POS order not found.</div>;

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate("/pos/orders")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to POS Orders
      </Button>

      <PageHeader title={order.order_number || "POS Order"} subtitle="Point-of-sale order details" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground"><Receipt className="w-4 h-4" /> Summary</div>
          <div className="flex justify-between"><span className="text-muted-foreground">Order Number</span><span className="font-medium">{order.order_number}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{new Date(order.created_at).toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span><StatusBadge status={order.status === "completed" ? "paid" : order.status} /></span></div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground"><UserRound className="w-4 h-4" /> Party</div>
          <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span className="font-medium">{order.customer_name || "Walk-in"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Session</span><span>{order.session_id ? "Linked" : "No session"}</span></div>
          {order.session_opened_at && <div className="flex justify-between"><span className="text-muted-foreground">Session Opened</span><span>{new Date(order.session_opened_at).toLocaleString()}</span></div>}
        </div>

        <div className="bg-card rounded-lg border border-border p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground"><CreditCard className="w-4 h-4" /> Totals</div>
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(Number(order.subtotal || 0))}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(Number(order.tax_amount || 0))}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>{formatCurrency(Number(order.discount || 0))}</span></div>
          <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Total</span><span className="text-primary">{formatCurrency(Number(order.total || 0))}</span></div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border font-semibold text-card-foreground">Items</div>
        {order.items?.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No items found for this order.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Item</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">SKU</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Qty</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Rate</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Tax</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item: any) => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-3 font-medium text-card-foreground">{item.item_name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{item.sku || "-"}</td>
                    <td className="px-5 py-3 text-right">{Number(item.quantity || 0)}</td>
                    <td className="px-5 py-3 text-right">{formatCurrency(Number(item.rate || 0))}</td>
                    <td className="px-5 py-3 text-right">{formatCurrency(Number(item.tax_amount || 0))}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatCurrency(Number(item.amount || 0) + Number(item.tax_amount || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border font-semibold text-card-foreground">Payments</div>
        {order.payments?.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No payment records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Mode</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Reference</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {order.payments.map((payment: any) => (
                  <tr key={payment.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-3 capitalize">{String(payment.payment_mode || "-").replace(/_/g, " ")}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatCurrency(Number(payment.amount || 0))}</td>
                    <td className="px-5 py-3 text-muted-foreground">{payment.reference_number || "-"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{payment.created_at ? new Date(payment.created_at).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
