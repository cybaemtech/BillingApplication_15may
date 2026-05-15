import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseOrdersApi } from "@/lib/api";
import { DocumentDetailView } from "@/components/DocumentDetailView";
import { useToast } from "@/hooks/use-toast";

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: po, isLoading } = useQuery({
    queryKey: ["purchase_order", id],
    queryFn: () => purchaseOrdersApi.get(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => purchaseOrdersApi.updateStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_order", id] });
      toast({ title: "Status updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => purchaseOrdersApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast({ title: "Deleted" });
      navigate("/purchase/orders");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const convertToBill = useMutation({
    mutationFn: () => purchaseOrdersApi.convertToBill(id!),
    onSuccess: (bill: any) => {
      toast({ title: "Converted to Bill" });
      if (bill?.id) {
        navigate(`/purchase/bills/${bill.id}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["purchase_order", id] });
      }
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const items = (po?.items || []).map((li: any) => {
    const name = li.item_name || li.description || "";
    const description = li.description && li.description !== name ? li.description : undefined;
    return {
      name,
      description,
    hsn: li.hsn_code || "",
    quantity: Number(li.quantity),
    rate: Number(li.rate),
    amount: Number(li.amount),
    taxAmount: Number(li.tax_amount || li.taxAmount),
    };
  });

  const convertActions = po?.status !== "converted" && po?.status !== "cancelled"
    ? [{ label: "-> Bill", onClick: () => convertToBill.mutate() }]
    : [];

  return (
    <DocumentDetailView
      title="Purchase Order"
      document={po}
      partyLabel="Vendor"
      partyName={po?.vendor_name || ""}
      partyGstin={po?.vendor_gstin}
      partyAddress={po?.vendor_address}
      partyState={po?.vendor_state}
      items={items}
      subtotal={Number(po?.subtotal || 0)}
      taxAmount={Number(po?.tax_amount || po?.taxAmount || 0)}
      total={Number(po?.total || 0)}
      backPath="/purchase/orders"
      status={po?.status || "draft"}
      onStatusChange={(s) => updateStatusMutation.mutate(s)}
      statusOptions={["draft", "sent", "confirmed", "converted", "closed", "cancelled"]}
      onDelete={() => deleteMutation.mutate()}
      onEdit={() => navigate(`/purchase/orders/${id}/edit`)}
      convertActions={convertActions}
      isLoading={isLoading}
    />
  );
}
