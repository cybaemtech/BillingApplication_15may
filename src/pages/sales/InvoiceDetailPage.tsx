import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi, paymentsReceivedApi } from "@/lib/api";
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

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [amount, setAmount] = useState("");

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoicesApi.get(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => invoicesApi.updateStatus(id!, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoice", id] }); toast({ title: "Status updated" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: () => invoicesApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Invoice deleted" });
      navigate("/sales/invoices");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (payload: any) => paymentsReceivedApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["payments_received"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setPaymentOpen(false);
      setPaymentMode("cash");
      setAmount("");
      toast({ title: "Payment recorded" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const items = (invoice?.items || []).map((li: any) => {
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

  const outstandingAmount = Number(invoice?.balance_due || invoice?.balanceDue || 0);
  const normalizedStatus = invoice?.status === "partially_paid" ? "partial" : (invoice?.status || "draft");

  return (
    <DocumentDetailView
      title="Invoice"
      document={invoice}
      partyLabel="Customer"
      partyName={invoice?.customer_name || ""}
      partyGstin={invoice?.customer_gstin}
      partyAddress={invoice?.customer_address}
      items={items}
      subtotal={Number(invoice?.subtotal || 0)}
      taxAmount={Number(invoice?.tax_amount || invoice?.taxAmount || 0)}
      total={Number(invoice?.total || 0)}
      balanceDue={outstandingAmount}
      backPath="/sales/invoices"
      status={normalizedStatus}
      onStatusChange={(s) => updateStatusMutation.mutate(s)}
      statusOptions={["draft", "sent", "partial", "paid", "overdue", "cancelled"]}
      onDelete={() => deleteMutation.mutate()}
      onEdit={() => navigate(`/sales/invoices/${id}/edit`)}
      isLoading={isLoading}
      headerActions={
        <Dialog
          open={paymentOpen}
          onOpenChange={(open) => {
            setPaymentOpen(open);
            if (open) {
              setAmount(outstandingAmount > 0 ? String(outstandingAmount) : "");
              setPaymentMode("cash");
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
              <DialogTitle>Record Payment Received</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                recordPaymentMutation.mutate({
                  customer_id: invoice.customer_id,
                  invoice_id: invoice.id,
                  amount: Number(amount || 0),
                  date: new Date().toISOString().split("T")[0],
                  payment_mode: paymentMode,
                  reference_number: formData.get("reference_number") as string,
                  notes: formData.get("notes") as string,
                });
              }}
            >
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm space-y-1">
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Invoice</span><span className="font-medium">{invoice?.document_number}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Customer</span><span>{invoice?.customer_name || "-"}</span></div>
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
