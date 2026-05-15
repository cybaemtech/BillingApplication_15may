import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { purchaseReturnsApi } from "@/lib/api";
import { DocumentDetailView } from "@/components/DocumentDetailView";
import { useToast } from "@/hooks/use-toast";

export default function PurchaseReturnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: purchaseReturn, isLoading } = useQuery({
    queryKey: ["purchase_return", id],
    queryFn: () => purchaseReturnsApi.get(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => purchaseReturnsApi.delete(id!),
    onSuccess: () => {
      toast({ title: "Purchase return deleted" });
      navigate("/purchase/returns");
    },
  });

  const items = useMemo(() => (purchaseReturn?.items || []).map((item: any) => {
    const name = item.item_name || item.description || "";
    const description = item.description && item.description !== name ? item.description : undefined;
    return {
      name,
      description,
    hsn: item.hsn_code || "",
    quantity: Number(item.quantity || 0),
    rate: Number(item.rate || 0),
    amount: Number(item.total || 0) - Number(item.tax_amount || 0),
    taxAmount: Number(item.tax_amount || 0),
    };
  }), [purchaseReturn]);

  return (
    <DocumentDetailView
      title="Purchase Return"
      document={purchaseReturn}
      partyLabel="Vendor"
      partyName={purchaseReturn?.vendor_name || ""}
      partyGstin={purchaseReturn?.vendor_gstin}
      partyAddress={purchaseReturn?.vendor_address}
      partyState={purchaseReturn?.vendor_state}
      items={items}
      subtotal={Number(purchaseReturn?.subtotal || 0)}
      taxAmount={Number(purchaseReturn?.tax_amount || 0)}
      total={Number(purchaseReturn?.total || 0)}
      backPath="/purchase/returns"
      status={purchaseReturn?.status || "dispatched"}
      onDelete={() => deleteMutation.mutate()}
      isLoading={isLoading}
      hideItemDetailsInPrint
    />
  );
}
