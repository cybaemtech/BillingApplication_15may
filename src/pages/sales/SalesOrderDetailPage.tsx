import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { salesOrdersApi } from "@/lib/api";
import { DocumentDetailView } from "@/components/DocumentDetailView";
import { useToast } from "@/hooks/use-toast";

export default function SalesOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["sales_order", id],
    queryFn: () => salesOrdersApi.get(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => salesOrdersApi.updateStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_order", id] });
      toast({ title: "Status updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => salesOrdersApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_orders"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Deleted" });
      navigate("/sales/orders");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const convertToInv = useMutation({
    mutationFn: () => salesOrdersApi.convertToInvoice(id!),
    onSuccess: (inv: any) => {
      toast({ title: "Converted to Invoice" });
      if (inv?.id) {
        navigate(`/sales/invoices/${inv.id}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["sales_order", id] });
      }
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const convertToDC = useMutation({
    mutationFn: () => salesOrdersApi.convertToDeliveryChallan(id!),
    onSuccess: (dc: any) => {
      toast({ title: "Delivery Challan created" });
      if (dc?.id) {
        navigate(`/sales/delivery-challans/${dc.id}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["sales_order", id] });
      }
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const items = (order?.items || []).map((li: any) => {
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

  const convertActions = order?.status !== "converted" && order?.status !== "cancelled" ? [
    { label: "-> Invoice", onClick: () => convertToInv.mutate() },
    { label: "-> Delivery Challan", onClick: () => convertToDC.mutate() },
  ] : [];

  return (
    <DocumentDetailView
      title="Sales Order"
      document={order}
      partyLabel="Customer"
      partyName={order?.customer_name || ""}
      partyGstin={order?.customer_gstin}
      partyAddress={order?.customer_address}
      items={items}
      subtotal={Number(order?.subtotal || 0)}
      taxAmount={Number(order?.tax_amount || order?.taxAmount || 0)}
      total={Number(order?.total || 0)}
      backPath="/sales/orders"
      status={order?.status || "confirmed"}
      onStatusChange={(s) => updateStatusMutation.mutate(s)}
      statusOptions={["confirmed", "converted", "closed", "cancelled"]}
      onDelete={() => deleteMutation.mutate()}
      onEdit={() => navigate(`/sales/orders/${id}/edit`)}
      convertActions={convertActions}
      isLoading={isLoading}
    />
  );
}
