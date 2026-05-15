import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, DataToolbar } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, Eye, ArrowRightLeft } from "lucide-react";
import { CreateDialog } from "@/components/CreateDialog";
import { purchaseOrdersApi, vendorsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineItemsForm, emptyLineItem } from "@/components/LineItemsForm";
import type { LineItem } from "@/components/LineItemsForm";
import { AppPagination } from "@/components/AppPagination";
import { emptyPaginatedResponse } from "@/lib/pagination";

export default function PurchaseOrdersPage() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem()]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: response = emptyPaginatedResponse<any>(), isLoading } = useQuery({
    queryKey: ["purchase_orders", page],
    queryFn: () => purchaseOrdersApi.listPage(page),
  });
  const orders = response.data;
  const { data: vendors = [] } = useQuery({ queryKey: ["vendors"], queryFn: vendorsApi.list });

  const createMutation = useMutation({
    mutationFn: ({ po, items }: any) => purchaseOrdersApi.create(po, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      setOpen(false); setLineItems([emptyLineItem()]); setSelectedVendor("");
      toast({ title: "Purchase order created" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: purchaseOrdersApi.delete,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["purchase_orders"] }); toast({ title: "Deleted" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const convertToBillMutation = useMutation({
    mutationFn: purchaseOrdersApi.convertToBill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast({ title: "Converted to Bill" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = lineItems.filter(li => li.item_id);
    const subtotal = validItems.reduce((s, li) => s + li.amount, 0);
    const taxTotal = validItems.reduce((s, li) => s + li.tax_amount, 0);
    createMutation.mutate({
      po: { vendor_id: selectedVendor, subtotal, tax_amount: taxTotal, total: subtotal + taxTotal },
      items: validItems,
    });
  };

  const filtered = orders.filter((o: any) =>
    o.document_number?.toLowerCase().includes(search.toLowerCase()) ||
    o.vendor_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Purchase Orders" subtitle="Create and track purchase orders">
        <Button onClick={() => navigate("/purchase/orders/new")}>
          + New PO
        </Button>
      </PageHeader>
      <DataToolbar searchPlaceholder="Search purchase orders..." onSearch={setSearch} />

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No purchase orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">PO #</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Vendor</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o: any) => (
                  <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/purchase/orders/${o.id}`)}>
                    <td className="px-5 py-3 font-medium text-primary">{o.document_number}</td>
                    <td className="px-5 py-3 text-card-foreground">{o.vendor_name || "-"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{o.date}</td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">₹{Number(o.total).toLocaleString()}</td>
                    <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/purchase/orders/${o.id}`)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {o.status !== "converted" && o.status !== "cancelled" && (
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => convertToBillMutation.mutate(o.id)}>→ Bill</Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(o.id); }}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <AppPagination
        currentPage={response.pagination.page}
        totalPages={response.pagination.totalPages}
        totalRecords={response.pagination.total}
        onPageChange={setPage}
      />
    </div>
  );
}

