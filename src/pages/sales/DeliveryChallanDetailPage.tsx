import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deliveryChallansApi } from "@/lib/api";
import { DocumentDetailView } from "@/components/DocumentDetailView";
import { useToast } from "@/hooks/use-toast";

export default function DeliveryChallanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: challan, isLoading } = useQuery({
    queryKey: ["delivery_challan", id],
    queryFn: () => deliveryChallansApi.get(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => deliveryChallansApi.updateStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery_challan", id] });
      queryClient.invalidateQueries({ queryKey: ["delivery_challans"] });
      toast({ title: "Status updated" });
    },
  });

  const convertToInvoiceMutation = useMutation({
    mutationFn: () => deliveryChallansApi.convertToInvoice(id!),
    onSuccess: (invoice: any) => {
      toast({ title: "Invoice created from delivery challan" });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      if (invoice?.id) {
        navigate(`/sales/invoices/${invoice.id}`);
      }
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deliveryChallansApi.delete(id!),
    onSuccess: () => {
      toast({ title: "Delivery challan deleted" });
      navigate("/sales/delivery-challans");
    },
  });

  const items = useMemo(() => (challan?.items || []).map((li: any) => {
    const name = li.item_name || li.description || "";
    const description = li.description && li.description !== name ? li.description : undefined;
    return {
      name,
      description,
    hsn: li.hsn_code || "",
    quantity: Number(li.quantity || 0),
    rate: Number(li.rate || 0),
    amount: Number(li.amount || 0),
    taxAmount: Number(li.tax_amount || 0),
    };
  }), [challan]);

  const computedSubtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const computedTaxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
  const subtotal = Number(challan?.subtotal ?? computedSubtotal);
  const taxAmount = Number(challan?.tax_amount ?? computedTaxAmount);
  const total = Number(challan?.total ?? (subtotal + taxAmount));

  const convertActions = challan?.status !== "cancelled"
    ? [{ label: "-> Invoice", onClick: () => convertToInvoiceMutation.mutate() }]
    : [];

  return (
    <DocumentDetailView
      title="Delivery Challan"
      document={challan}
      partyLabel="Customer"
      partyName={challan?.customer_name || ""}
      partyGstin={challan?.customer_gstin}
      partyAddress={challan?.customer_address}
      partyState={challan?.customer_state}
      items={items}
      subtotal={subtotal}
      taxAmount={taxAmount}
      total={total}
      backPath="/sales/delivery-challans"
      status={challan?.status || "draft"}
      onStatusChange={(s) => updateStatusMutation.mutate(s)}
      statusOptions={["draft", "in_transit", "delivered", "cancelled"]}
      onDelete={() => deleteMutation.mutate()}
      onEdit={() => navigate(`/sales/delivery-challans/${id}/edit`)}
      convertActions={convertActions}
      isLoading={isLoading}
    />
  );
}
