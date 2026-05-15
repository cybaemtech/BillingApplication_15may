import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, DataToolbar } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreateDialog } from "@/components/CreateDialog";
import { paymentsReceivedApi, customersApi, invoicesApi } from "@/lib/api";
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

export default function PaymentsReceivedPage() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [amount, setAmount] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: response = emptyPaginatedResponse<any>(), isLoading } = useQuery({
    queryKey: ["payments_received", page],
    queryFn: () => paymentsReceivedApi.listPage(page),
  });
  const payments = response.data;
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: invoicesApi.list });
  const selectableCustomers = customers.filter((customer: any) => customer?.is_active !== false || customer?.id === selectedCustomer);

  const unpaidInvoices = useMemo(
    () => invoices.filter((inv: any) => inv.customer_id === selectedCustomer && Number(inv.balance_due) > 0),
    [invoices, selectedCustomer],
  );
  const selectedInvoiceRecord = unpaidInvoices.find((inv: any) => inv.id === selectedInvoice);

  const createMutation = useMutation({
    mutationFn: paymentsReceivedApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments_received"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setOpen(false);
      setSelectedCustomer("");
      setSelectedInvoice("");
      setPaymentMode("cash");
      setAmount("");
      toast({ title: "Payment recorded" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      customer_id: selectedCustomer,
      invoice_id: selectedInvoice || undefined,
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
    p.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Payments Received" subtitle="Record customer payments">
        <CreateDialog title="Record Payment" buttonLabel="New Payment" open={open} onOpenChange={setOpen}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select
                value={selectedCustomer}
                onValueChange={(value) => {
                  setSelectedCustomer(value);
                  setSelectedInvoice("");
                  setAmount("");
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>{selectableCustomers.map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>

            {unpaidInvoices.length > 0 && (
              <div className="space-y-2">
                <Label>Against Invoice</Label>
                <Select
                  value={selectedInvoice}
                  onValueChange={(value) => {
                    setSelectedInvoice(value);
                    const invoice = unpaidInvoices.find((inv: any) => inv.id === value);
                    setAmount(invoice ? String(Number(invoice.balance_due || 0)) : "");
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select invoice (optional)" /></SelectTrigger>
                  <SelectContent>
                    {unpaidInvoices.map((inv: any) => (
                      <SelectItem key={inv.id} value={inv.id}>{inv.document_number} - ₹{Number(inv.balance_due).toLocaleString()} due</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedInvoiceRecord && (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm space-y-1">
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Invoice</span><span className="font-medium">{selectedInvoiceRecord.document_number}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Invoice Date</span><span>{selectedInvoiceRecord.date || "-"}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Invoice Total</span><span>₹{Number(selectedInvoiceRecord.total || 0).toLocaleString()}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Remaining Amount</span><span className="font-semibold text-primary">₹{Number(selectedInvoiceRecord.balance_due || 0).toLocaleString()}</span></div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input name="amount" type="number" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} />
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
            <div className="space-y-2"><Label>Reference Number</Label><Input name="reference_number" /></div>
            <div className="space-y-2"><Label>Notes</Label><Input name="notes" /></div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending || !selectedCustomer || Number(amount || 0) <= 0}>
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
          <div className="p-12 text-center text-muted-foreground">No payments received yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Payment #</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Invoice</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Mode</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/sales/payments/${p.id}`)}>
                    <td className="px-5 py-3 font-medium text-primary">{p.payment_number}</td>
                    <td className="px-5 py-3 text-card-foreground">{p.customer_name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{p.date}</td>
                    <td className="px-5 py-3 text-muted-foreground">{p.invoice_number || "-"}</td>
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



