import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, DataToolbar } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreateDialog } from "@/components/CreateDialog";
import { paymentsMadeApi, vendorsApi, billsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppPagination } from "@/components/AppPagination";
import { emptyPaginatedResponse } from "@/lib/pagination";

const PAYMENT_MODE_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
];

export default function PaymentsMadePage() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedBill, setSelectedBill] = useState("");
  const [paymentMode, setPaymentMode] = useState("bank_transfer");
  const [amount, setAmount] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: response = emptyPaginatedResponse<any>(), isLoading } = useQuery({
    queryKey: ["payments_made", page],
    queryFn: () => paymentsMadeApi.listPage(page),
  });
  const payments = response.data;
  const { data: vendors = [] } = useQuery({ queryKey: ["vendors"], queryFn: vendorsApi.list });
  const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: billsApi.list });
  const selectableVendors = vendors.filter((vendor: any) => vendor?.is_active !== false || vendor?.id === selectedVendor);

  const unpaidBills = useMemo(
    () => bills.filter((bill: any) => bill.vendor_id === selectedVendor && Number(bill.balance_due) > 0),
    [bills, selectedVendor],
  );
  const selectedBillRecord = unpaidBills.find((bill: any) => bill.id === selectedBill);

  const createMutation = useMutation({
    mutationFn: paymentsMadeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments_made"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      setOpen(false);
      setSelectedVendor("");
      setSelectedBill("");
      setPaymentMode("bank_transfer");
      setAmount("");
      toast({ title: "Payment recorded" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      vendor_id: selectedVendor,
      bill_id: selectedBill || undefined,
      amount: Number(amount || 0),
      date: new Date().toISOString().split("T")[0],
      payment_mode: paymentMode,
      reference_number: fd.get("reference_number") as string,
      notes: fd.get("notes") as string,
    });
  };

  useEffect(() => {
    if (location.pathname.endsWith("/new")) setOpen(true);
  }, [location.pathname]);

  const filtered = payments.filter((p: any) =>
    p.payment_number?.toLowerCase().includes(search.toLowerCase()) ||
    p.vendor_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Payments Made" subtitle="Track vendor payments">
        <CreateDialog title="Record Payment" buttonLabel="New Payment" open={open} onOpenChange={setOpen}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Vendor *</Label>
              <Select
                value={selectedVendor}
                onValueChange={(value) => {
                  setSelectedVendor(value);
                  setSelectedBill("");
                  setAmount("");
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>{selectableVendors.map((v: any) => (<SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            {unpaidBills.length > 0 && (
              <div className="space-y-2">
                <Label>Against Bill</Label>
                <Select
                  value={selectedBill}
                  onValueChange={(value) => {
                    setSelectedBill(value);
                    const bill = unpaidBills.find((record: any) => record.id === value);
                    setAmount(bill ? String(Number(bill.balance_due || 0)) : "");
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select bill (optional)" /></SelectTrigger>
                  <SelectContent>
                    {unpaidBills.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>{b.document_number} - ₹{Number(b.balance_due).toLocaleString()} due</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedBillRecord && (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm space-y-1">
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Bill</span><span className="font-medium">{selectedBillRecord.document_number}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Bill Date</span><span>{selectedBillRecord.date || "-"}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Bill Total</span><span>₹{Number(selectedBillRecord.total || 0).toLocaleString()}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Remaining Amount</span><span className="font-semibold text-primary">₹{Number(selectedBillRecord.balance_due || 0).toLocaleString()}</span></div>
              </div>
            )}

            <div className="space-y-2"><Label>Amount *</Label><Input name="amount" type="number" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} /></div>
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
            <div className="space-y-2"><Label>Reference Number</Label><Input name="reference_number" /></div>
            <div className="space-y-2"><Label>Notes</Label><Input name="notes" /></div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending || !selectedVendor || Number(amount || 0) <= 0}>
              {createMutation.isPending ? "Recording..." : "Record Payment"}
            </Button>
          </form>
        </CreateDialog>
      </PageHeader>
      <DataToolbar searchPlaceholder="Search payments..." onSearch={setSearch} />

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No payments made yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Payment #</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Vendor</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Bill</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Mode</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/purchase/payments/${p.id}`)}>
                    <td className="px-5 py-3 font-medium text-primary">{p.payment_number}</td>
                    <td className="px-5 py-3 text-card-foreground">{p.vendor_name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{p.date}</td>
                    <td className="px-5 py-3 text-muted-foreground">{p.bill_number || "-"}</td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">₹{Number(p.amount).toLocaleString()}</td>
                    <td className="px-5 py-3 text-muted-foreground">{p.payment_mode || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <AppPagination
        currentPage={response.pagination.page}
        totalPages={response.pagination.totalPages}
        totalRecords={response.pagination.total}
        onPageChange={setPage}
      />
    </div>
  );
}




