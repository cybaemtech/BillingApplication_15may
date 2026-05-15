import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { salesReturnsApi } from "@/lib/api";
import { DocumentDetailView } from "@/components/DocumentDetailView";
import { useToast } from "@/hooks/use-toast";

export default function SalesReturnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: salesReturn, isLoading } = useQuery({
    queryKey: ["sales_return", id],
    queryFn: () => salesReturnsApi.get(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => salesReturnsApi.delete(id!),
    onSuccess: () => {
      toast({ title: "Sales return deleted" });
      navigate("/sales/returns");
    },
  });

  const items = useMemo(() => (salesReturn?.items || []).map((item: any) => {
    const name = item.item_name || item.description || "";
    const description = item.description && item.description !== name ? item.description : undefined;
    return {
      name,
      description,
    hsn: item.hsn_code || "",
    quantity: Number(item.quantity || 0),
    rate: Number(item.rate || 0),
    amount: Math.max(0, Number(item.total || item.amount || 0) - Number(item.tax_amount || 0)),
    taxAmount: Number(item.tax_amount || 0),
    };
  }), [salesReturn]);

  return (
    <DocumentDetailView
      title="Sales Return"
      document={salesReturn}
      partyLabel="Customer"
      partyName={salesReturn?.customer_name || ""}
      partyGstin={salesReturn?.customer_gstin}
      partyAddress={salesReturn?.customer_address}
      partyState={salesReturn?.customer_state}
      items={items}
      subtotal={Number(salesReturn?.subtotal || 0)}
      taxAmount={Number(salesReturn?.tax_amount || 0)}
      total={Number(salesReturn?.total || 0)}
      backPath="/sales/returns"
      status={salesReturn?.status || "received"}
      onDelete={() => deleteMutation.mutate()}
      isLoading={isLoading}
      hideItemDetailsInPrint
    />
  );
}

