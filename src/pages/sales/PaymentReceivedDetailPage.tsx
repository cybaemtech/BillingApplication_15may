import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Printer, Trash2 } from "lucide-react";
import { paymentsReceivedApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { generatePdfHtml, printDocument, type PdfDocumentData } from "@/lib/pdf";

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString()}`;
}

export default function PaymentReceivedDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payment, isLoading } = useQuery({
    queryKey: ["payment_received", id],
    queryFn: () => paymentsReceivedApi.get(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => paymentsReceivedApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments_received"] });
      toast({ title: "Payment deleted" });
      navigate("/sales/payments");
    },
  });

  const invoiceItems = useMemo(() => (payment?.invoice?.items || []).map((item: any) => {
    const name = item.item_name || item.description || "";
    const description = item.description && item.description !== name ? item.description : undefined;
    return {
      name,
      description,
    hsn: item.hsn_code || "",
    quantity: Number(item.quantity || 0),
    rate: Number(item.rate || 0),
    amount: Number(item.amount || 0),
    taxAmount: Number(item.tax_amount || 0),
    };
  }), [payment]);

  const invoiceBalanceAfter = Number(payment?.invoice?.balance_due || 0);
  const paymentAmount = Number(payment?.amount || 0);
  const invoiceBalanceBefore = payment?.invoice ? invoiceBalanceAfter + paymentAmount : 0;
  const receiptData: PdfDocumentData = {
    type: "Payment Receipt",
    documentNumber: payment?.payment_number || "",
    date: payment?.date || "",
    partyName: payment?.customer_name || "",
    partyGstin: payment?.customer_gstin,
    partyAddress: payment?.customer_address,
    partyState: payment?.customer_state,
    items: invoiceItems.length > 0 ? invoiceItems : [{ name: payment?.invoice_number ? `Against ${payment.invoice_number}` : "Advance Payment", quantity: 1, rate: paymentAmount, amount: paymentAmount, taxAmount: 0 }],
    subtotal: paymentAmount,
    taxAmount: 0,
    total: paymentAmount,
    balanceDue: payment?.invoice ? invoiceBalanceAfter : undefined,
    notes: payment?.notes || payment?.reference_number || undefined,
    terms: payment?.invoice ? `Invoice ${payment.invoice.document_number}` : undefined,
    hideItemDetails: invoiceItems.length === 0,
  };

  const openPdfPreview = async () => {
    const html = await generatePdfHtml(receiptData, "modern");
    const preview = window.open("", "_blank");
    if (!preview) return;
    preview.document.write(html);
    preview.document.close();
  };

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!payment) return <div className="p-8 text-muted-foreground">Payment not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => navigate("/sales/payments")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={openPdfPreview}><FileText className="w-4 h-4 mr-2" /> PDF</Button>
          <Button variant="outline" onClick={() => printDocument(receiptData, "modern")}><Printer className="w-4 h-4 mr-2" /> Print Receipt</Button>
          <Button variant="destructive" onClick={() => { if (confirm("Delete this payment?")) deleteMutation.mutate(); }}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-sm text-muted-foreground">Payment Receipt</p>
              <h1 className="text-2xl font-semibold">{payment.payment_number}</h1>
            </div>
            <div className="text-right text-sm space-y-1">
              <p>Date: {payment.date}</p>
              <p>Mode: {payment.payment_mode || "-"}</p>
              {payment.reference_number && <p>Reference: {payment.reference_number}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-muted/40 p-4 space-y-1">
              <p className="text-muted-foreground">Received From</p>
              <p className="font-semibold text-base">{payment.customer_name || "-"}</p>
              {payment.customer_gstin && <p>GSTIN: {payment.customer_gstin}</p>}
              {payment.customer_address && <p>{payment.customer_address}</p>}
            </div>
            <div className="rounded-lg bg-primary/5 p-4 space-y-1">
              <p className="text-muted-foreground">Amount Received</p>
              <p className="text-2xl font-semibold text-primary">{formatCurrency(paymentAmount)}</p>
              {payment.notes && <p className="text-sm text-muted-foreground">{payment.notes}</p>}
            </div>
          </div>

          {payment.invoice && (
            <div className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Applied To Invoice</p>
                  <p className="font-semibold">{payment.invoice.document_number}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate(`/sales/invoices/${payment.invoice.id}`)}>Open Invoice</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-md bg-muted/30 p-3"><p className="text-muted-foreground">Invoice Total</p><p className="font-semibold">{formatCurrency(Number(payment.invoice.total || 0))}</p></div>
                <div className="rounded-md bg-muted/30 p-3"><p className="text-muted-foreground">Outstanding Before</p><p className="font-semibold">{formatCurrency(invoiceBalanceBefore)}</p></div>
                <div className="rounded-md bg-muted/30 p-3"><p className="text-muted-foreground">Outstanding After</p><p className="font-semibold text-primary">{formatCurrency(invoiceBalanceAfter)}</p></div>
              </div>
            </div>
          )}

          {invoiceItems.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Item</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">Qty</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Rate</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Tax</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item, index) => (
                    <tr key={`${item.name}-${index}`} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.name}</p>
                        {item.description && item.description !== item.name && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                        {item.hsn && <p className="text-xs text-muted-foreground">HSN: {item.hsn}</p>}
                      </td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.rate)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.taxAmount)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.amount + item.taxAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-5 space-y-3 text-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Payment Details</h2>
            <div className="flex justify-between"><span className="text-muted-foreground">Payment Number</span><span>{payment.payment_number}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{payment.customer_name || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Invoice</span><span>{payment.invoice_number || "Advance"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Payment Mode</span><span>{payment.payment_mode || "-"}</span></div>
            <div className="flex justify-between font-semibold border-t border-border pt-3"><span>Amount</span><span>{formatCurrency(paymentAmount)}</span></div>
          </div>

          {payment.invoice && (
            <div className="bg-card border border-border rounded-lg p-5 space-y-3 text-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Invoice Summary</h2>
              <div className="flex justify-between"><span className="text-muted-foreground">Invoice Date</span><span>{payment.invoice.date || "-"}</span></div>
              {payment.invoice.due_date && <div className="flex justify-between"><span className="text-muted-foreground">Due Date</span><span>{payment.invoice.due_date}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(Number(payment.invoice.subtotal || 0))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(Number(payment.invoice.tax_amount || 0))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Invoice Total</span><span>{formatCurrency(Number(payment.invoice.total || 0))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Remaining Amount</span><span className="font-semibold text-primary">{formatCurrency(invoiceBalanceAfter)}</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
