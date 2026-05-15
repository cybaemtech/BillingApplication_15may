import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quotationsApi } from "@/lib/api";
import { DocumentDetailView } from "@/components/DocumentDetailView";
import { useToast } from "@/hooks/use-toast";

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quote, isLoading } = useQuery({
    queryKey: ["quotation", id],
    queryFn: () => quotationsApi.get(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => quotationsApi.updateStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation", id] });
      toast({ title: "Status updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => quotationsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["sales_orders"] });
      toast({ title: "Quotation deleted" });
      navigate("/sales/quotations");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const convertToSO = useMutation({
    mutationFn: () => quotationsApi.convertToSalesOrder(id!),
    onSuccess: (so: any) => {
      toast({ title: "Converted to Sales Order" });
      if (so?.id) {
        navigate(`/sales/orders/${so.id}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["quotation", id] });
      }
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const convertToInv = useMutation({
    mutationFn: () => quotationsApi.convertToInvoice(id!),
    onSuccess: (inv: any) => {
      toast({ title: "Converted to Invoice" });
      if (inv?.id) {
        navigate(`/sales/invoices/${inv.id}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["quotation", id] });
      }
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const items = (quote?.items || []).map((li: any) => {
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

  const convertActions = quote?.status !== "converted" && quote?.status !== "cancelled" ? [
    { label: "-> Sales Order", onClick: () => convertToSO.mutate() },
    { label: "-> Invoice", onClick: () => convertToInv.mutate() },
  ] : [];

  return (
    <DocumentDetailView
      title="Quotation"
      document={quote}
      partyLabel="Customer"
      partyName={quote?.customer_name || ""}
      partyGstin={quote?.customer_gstin}
      partyAddress={quote?.customer_address}
      items={items}
      subtotal={Number(quote?.subtotal || 0)}
      taxAmount={Number(quote?.tax_amount || quote?.taxAmount || 0)}
      total={Number(quote?.total || 0)}
      backPath="/sales/quotations"
      status={quote?.status || "draft"}
      onStatusChange={(s) => updateStatusMutation.mutate(s)}
      statusOptions={["draft", "sent", "confirmed", "cancelled"]}
      onDelete={() => deleteMutation.mutate()}
      onEdit={() => navigate(`/sales/quotations/${id}/edit`)}
      convertActions={convertActions}
      isLoading={isLoading}
    />
  );
}
