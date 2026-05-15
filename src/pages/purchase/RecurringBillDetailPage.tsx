import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Clock3, FileText, Mail, MapPin, Phone, Repeat2 } from "lucide-react";
import { recurringBillsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function getStatusTone(status?: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (normalized === "inactive") return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export default function RecurringBillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: recurringBill, isLoading } = useQuery({
    queryKey: ["recurring_bill", id],
    queryFn: () => recurringBillsApi.get(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!recurringBill) return <div className="p-8 text-muted-foreground">Recurring bill not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => navigate("/purchase/recurring-bills")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        {recurringBill.base_bill_id ? (
          <Button variant="outline" onClick={() => navigate(`/purchase/bills/${recurringBill.base_bill_id}`)}>
            <FileText className="w-4 h-4 mr-2" /> Open Base Bill
          </Button>
        ) : null}
      </div>

      <div className="rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-sky-950 to-cyan-950 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <Badge className="bg-white/10 text-white hover:bg-white/10 border-white/10">Recurring Bill</Badge>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{recurringBill.vendor_name || "Vendor"}</h1>
              <p className="mt-2 max-w-2xl text-sm text-sky-100/80">
                Recurring purchase schedule, billing amount, and the latest bill references for this vendor.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-sky-50">
              {recurringBill.vendor_email && <span className="inline-flex items-center gap-2"><Mail className="w-4 h-4" /> {recurringBill.vendor_email}</span>}
              {recurringBill.vendor_phone && <span className="inline-flex items-center gap-2"><Phone className="w-4 h-4" /> {recurringBill.vendor_phone}</span>}
              {recurringBill.vendor_address && <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" /> {recurringBill.vendor_address}</span>}
            </div>
          </div>
          <div className="grid min-w-[280px] grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-sky-100/70">Recurring Amount</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(Number(recurringBill.total || 0))}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-sky-100/70">Frequency</p>
              <p className="mt-2 text-2xl font-semibold capitalize">{recurringBill.frequency || "-"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-sky-100/70">Next Bill Date</p>
              <p className="mt-2 text-2xl font-semibold">{recurringBill.next_bill_date || "-"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-sky-100/70">Status</p>
              <p className="mt-2"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusTone(recurringBill.status)}`}>{recurringBill.status}</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Schedule Info</CardTitle>
            <CardDescription>Frequency and source bill information for this recurring entry.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Frequency</p>
              <p className="mt-2 font-medium capitalize text-slate-900">{recurringBill.frequency || "-"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Start Date</p>
              <p className="mt-2 font-medium text-slate-900">{recurringBill.start_date || "-"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">End Date</p>
              <p className="mt-2 font-medium text-slate-900">{recurringBill.end_date || "-"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Next Bill Date</p>
              <p className="mt-2 font-medium text-slate-900">{recurringBill.next_bill_date || "-"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Base Bill</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium text-slate-900">{recurringBill.base_bill_number || "No base bill linked"}</p>
                {recurringBill.base_bill_id ? (
                  <Button variant="outline" size="sm" onClick={() => navigate(`/purchase/bills/${recurringBill.base_bill_id}`)}>
                    <FileText className="w-4 h-4 mr-2" /> Open Bill
                  </Button>
                ) : null}
              </div>
              {recurringBill.base_bill_date ? <p className="mt-1 text-sm text-slate-500">Base bill date: {recurringBill.base_bill_date}</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Amount Summary</CardTitle>
            <CardDescription>Recurring bill value and tax split for this schedule.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Subtotal</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(Number(recurringBill.subtotal || 0))}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tax Amount</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(Number(recurringBill.tax_amount || 0))}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(Number(recurringBill.total || 0))}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Recurring Items</CardTitle>
          <CardDescription>Items saved with this recurring bill template.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">HSN</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Rate</th>
                  <th className="px-4 py-3 text-right">Tax</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(recurringBill.items || []).length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No recurring items saved for this bill.</td></tr>
                ) : (
                  recurringBill.items.map((item: any) => {
                    const quantity = Number(item.quantity || 0);
                    const rate = Number(item.rate || 0);
                    const lineTotal = Number(item.total || item.amount || (quantity * rate) || 0);

                    return (
                      <tr key={item.id} className="border-t border-slate-200">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{item.item_name || item.description || "-"}</p>
                          {item.description && item.item_name !== item.description ? <p className="text-xs text-slate-500">{item.description}</p> : null}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.hsn_code || "-"}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{quantity.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(rate)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{item.tax_rate ? `${Number(item.tax_rate)}%` : "-"}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(lineTotal)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Recent Vendor Bills</CardTitle>
          <CardDescription>Latest bills for this vendor for quick reference.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Open</th>
                </tr>
              </thead>
              <tbody>
                {(recurringBill.recentBills || []).length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No bills found for this vendor.</td></tr>
                ) : (
                  recurringBill.recentBills.map((bill: any) => (
                    <tr key={bill.id} className="border-t border-slate-200">
                      <td className="px-4 py-3 font-medium text-slate-900">{bill.document_number}</td>
                      <td className="px-4 py-3 text-slate-600">{bill.date || "-"}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(Number(bill.total || 0))}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(Number(bill.balance_due || 0))}</td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusTone(bill.status)}`}>{bill.status || "-"}</span></td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/purchase/bills/${bill.id}`)}>
                          Open
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-3 p-5">
            <Repeat2 className="h-8 w-8 text-sky-600" />
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Frequency</p>
              <p className="text-base font-semibold text-slate-900 capitalize">{recurringBill.frequency || "-"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-3 p-5">
            <CalendarDays className="h-8 w-8 text-sky-600" />
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Start</p>
              <p className="text-base font-semibold text-slate-900">{recurringBill.start_date || "-"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-3 p-5">
            <Clock3 className="h-8 w-8 text-sky-600" />
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Next Run</p>
              <p className="text-base font-semibold text-slate-900">{recurringBill.next_bill_date || "-"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
