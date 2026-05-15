import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { billsApi, paymentsMadeApi } from "@/lib/api";
import { DocumentDetailView } from "@/components/DocumentDetailView";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IndianRupee } from "lucide-react";

const PAYMENT_MODE_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
];

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState("bank_transfer");
  const [amount, setAmount] = useState("");

  const { data: bill, isLoading } = useQuery({
    queryKey: ["bill", id],
    queryFn: () => billsApi.get(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => billsApi.updateStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bill", id] });
      toast({ title: "Status updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => billsApi.delete(id!),
    onSuccess: () => {
      toast({ title: "Bill deleted" });
      navigate("/purchase/bills");
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (payload: any) => paymentsMadeApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bill", id] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["payments_made"] });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setPaymentOpen(false);
      setPaymentMode("bank_transfer");
      setAmount("");
      toast({ title: "Payment recorded" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const items = (bill?.items || []).map((li: any) => {
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

  const outstandingAmount = Number(bill?.balance_due || bill?.balanceDue || 0);
  const normalizedStatus = bill?.status === "partially_paid" ? "partial" : (bill?.status || "draft");

  return (
    <DocumentDetailView
      title="Bill"
      document={bill}
      partyLabel="Vendor"
      partyName={bill?.vendor_name || ""}
      partyGstin={bill?.vendor_gstin}
      partyAddress={bill?.vendor_address}
      partyState={bill?.vendor_state}
      items={items}
      subtotal={Number(bill?.subtotal || 0)}
      taxAmount={Number(bill?.tax_amount || bill?.taxAmount || 0)}
      total={Number(bill?.total || 0)}
      balanceDue={outstandingAmount}
      backPath="/purchase/bills"
      status={normalizedStatus}
      onStatusChange={(s) => updateStatusMutation.mutate(s)}
      statusOptions={["draft", "sent", "partial", "paid", "overdue", "cancelled"]}
      onDelete={() => deleteMutation.mutate()}
      onEdit={() => navigate(`/purchase/bills/${id}/edit`)}
      isLoading={isLoading}
      headerActions={
        <Dialog
          open={paymentOpen}
          onOpenChange={(open) => {
            setPaymentOpen(open);
            if (open) {
              setAmount(outstandingAmount > 0 ? String(outstandingAmount) : "");
              setPaymentMode("bank_transfer");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" disabled={outstandingAmount <= 0}>
              <IndianRupee className="w-3.5 h-3.5 mr-1" /> Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Record Payment Made</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                recordPaymentMutation.mutate({
                  vendor_id: bill.vendor_id,
                  bill_id: bill.id,
                  amount: Number(amount || 0),
                  date: new Date().toISOString().split("T")[0],
                  payment_mode: paymentMode,
                  reference_number: formData.get("reference_number") as string,
                  notes: formData.get("notes") as string,
                });
              }}
            >
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm space-y-1">
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Bill</span><span className="font-medium">{bill?.document_number}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Vendor</span><span>{bill?.vendor_name || "-"}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Outstanding</span><span className="font-semibold text-primary">Rs{outstandingAmount.toLocaleString()}</span></div>
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  max={outstandingAmount > 0 ? String(outstandingAmount) : undefined}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger><SelectValue placeholder="Select payment mode" /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODE_OPTIONS.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference Number</Label>
                <Input name="reference_number" />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input name="notes" />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={recordPaymentMutation.isPending || Number(amount || 0) <= 0 || Number(amount || 0) > outstandingAmount}
              >
                {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    />
  );
}
