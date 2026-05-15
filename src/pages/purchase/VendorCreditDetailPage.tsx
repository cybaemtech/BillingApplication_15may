import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { vendorCreditsApi } from "@/lib/api";
import { DocumentDetailView } from "@/components/DocumentDetailView";
import { useToast } from "@/hooks/use-toast";

export default function VendorCreditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: vendorCredit, isLoading } = useQuery({
    queryKey: ["vendor_credit", id],
    queryFn: () => vendorCreditsApi.get(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => vendorCreditsApi.delete(id!),
    onSuccess: () => {
      toast({ title: "Vendor credit deleted" });
      navigate("/purchase/vendor-credits");
    },
  });

  const items = (vendorCredit?.items || []).map((li: any) => {
    const name = li.item_name || li.description || "";
    const description = li.description && li.description !== name ? li.description : undefined;
    return {
      name,
      description,
    hsn: li.hsn_code || "",
    quantity: Number(li.quantity),
    rate: Number(li.rate),
    amount: Number(li.amount),
    taxAmount: Number(li.tax_amount || li.taxAmount || 0),
    };
  });

  return (
    <DocumentDetailView
      title="Vendor Credit"
      document={vendorCredit}
      partyLabel="Vendor"
      partyName={vendorCredit?.vendor_name || ""}
      partyGstin={vendorCredit?.vendor_gstin}
      partyAddress={vendorCredit?.vendor_address}
      partyState={vendorCredit?.vendor_state}
      items={items}
      subtotal={Number(vendorCredit?.subtotal || 0)}
      taxAmount={Number(vendorCredit?.tax_amount || vendorCredit?.taxAmount || 0)}
      total={Number(vendorCredit?.total || 0)}
      backPath="/purchase/vendor-credits"
      status={vendorCredit?.status || "draft"}
      onDelete={() => deleteMutation.mutate()}
      onEdit={() => navigate(`/purchase/vendor-credits/${id}/edit`)}
      isLoading={isLoading}
    />
  );
}

