import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Banknote, Receipt, TimerReset } from "lucide-react";
import { posSessionsApi } from "@/lib/api";
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

export default function POSSessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: session, isLoading } = useQuery({
    queryKey: ["pos_session", id],
    queryFn: () => posSessionsApi.get(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!session) return <div className="p-8 text-muted-foreground">POS session not found.</div>;

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate("/pos/sessions")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to POS Sessions
      </Button>

      <PageHeader title="POS Session" subtitle={session.owner_name ? `Opened by ${session.owner_name}` : "Session details"} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="text-sm text-muted-foreground mb-1">Opened At</div>
          <div className="font-semibold">{session.opened_at ? new Date(session.opened_at).toLocaleString() : "-"}</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="text-sm text-muted-foreground mb-1">Opening Balance</div>
          <div className="font-semibold">{formatCurrency(Number(session.opening_balance || 0))}</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="text-sm text-muted-foreground mb-1">Total Sales</div>
          <div className="font-semibold text-primary">{formatCurrency(Number(session.total_sales || 0))}</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="text-sm text-muted-foreground mb-1">Status</div>
          <StatusBadge status={session.status === "open" ? "confirmed" : "closed"} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground"><Banknote className="w-4 h-4" /> Cash</div>
          <div className="text-xl font-semibold">{formatCurrency(Number(session.total_cash || 0))}</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground"><Receipt className="w-4 h-4" /> UPI</div>
          <div className="text-xl font-semibold">{formatCurrency(Number(session.total_upi || 0))}</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground"><TimerReset className="w-4 h-4" /> Card</div>
          <div className="text-xl font-semibold">{formatCurrency(Number(session.total_card || 0))}</div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="font-semibold text-card-foreground">Orders In Session</div>
          <div className="text-sm text-muted-foreground">{Number(session.order_count || 0)} orders</div>
        </div>
        {session.orders?.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No POS orders found for this session.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Order #</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Customer</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {session.orders.map((order: any) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/pos/orders/${order.id}`)}>
                    <td className="px-5 py-3 font-medium text-primary">{order.order_number}</td>
                    <td className="px-5 py-3">{order.customer_name || "Walk-in"}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatCurrency(Number(order.total || 0))}</td>
                    <td className="px-5 py-3"><StatusBadge status={order.status === "completed" ? "paid" : order.status} /></td>
                    <td className="px-5 py-3 text-muted-foreground">{order.created_at ? new Date(order.created_at).toLocaleString() : "-"}</td>
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
