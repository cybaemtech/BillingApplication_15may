import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { creditNotesApi } from "@/lib/api";
import { DocumentDetailView } from "@/components/DocumentDetailView";
import { useToast } from "@/hooks/use-toast";

export default function CreditNoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: creditNote, isLoading } = useQuery({
    queryKey: ["credit_note", id],
    queryFn: () => creditNotesApi.get(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => creditNotesApi.delete(id!),
    onSuccess: () => {
      toast({ title: "Credit note deleted" });
      navigate("/sales/credit-notes");
    },
  });

  const items = (creditNote?.items || []).map((li: any) => {
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
      title="Credit Note"
      document={creditNote}
      partyLabel="Customer"
      partyName={creditNote?.customer_name || ""}
      partyGstin={creditNote?.customer_gstin}
      partyAddress={creditNote?.customer_address}
      partyState={creditNote?.customer_state}
      items={items}
      subtotal={Number(creditNote?.subtotal || 0)}
      taxAmount={Number(creditNote?.tax_amount || creditNote?.taxAmount || 0)}
      total={Number(creditNote?.total || 0)}
      backPath="/sales/credit-notes"
      status={creditNote?.status || "draft"}
      onDelete={() => deleteMutation.mutate()}
      onEdit={() => navigate(`/sales/credit-notes/${id}/edit`)}
      isLoading={isLoading}
    />
  );
}
