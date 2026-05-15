import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, FileText, Mail, MapPin, Phone, Printer, ReceiptText } from "lucide-react";
import { customersApi } from "@/lib/api";
import { previewPartyStatement, printPartyStatement, type PartyStatementData } from "@/lib/party-statement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString("en-IN");
}

function getStatusTone(status?: string) {
  const normalized = String(status || "").toLowerCase();
  if (["paid", "completed", "approved", "received"].includes(normalized)) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (["draft", "pending"].includes(normalized)) return "bg-amber-50 text-amber-700 border-amber-200";
  if (["cancelled", "void"].includes(normalized)) return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function sortByDateAsc<T extends { date?: string }>(rows: T[]) {
  return [...rows].sort((a, b) => new Date(a.date || "1970-01-01").getTime() - new Date(b.date || "1970-01-01").getTime());
}

function getDocPath(type: string, id: string) {
  switch (type) {
    case "Quotation": return `/sales/quotations/${id}`;
    case "Sales Order": return `/sales/orders/${id}`;
    case "Delivery Challan": return `/sales/delivery-challans/${id}`;
    case "Invoice": return `/sales/invoices/${id}`;
    case "Payment": return `/sales/payments/${id}`;
    case "Credit Note": return `/sales/credit-notes/${id}`;
    case "Sales Return": return `/sales/returns/${id}`;
    default: return "";
  }
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customersApi.get(id!),
    enabled: !!id,
  });

  const statementRows = useMemo(() => {
    if (!customer?.history) return [];

    const ledgerEntries = [
      ...(customer.history.invoices || []).map((entry: any) => ({
        date: entry.date,
        type: "Invoice",
        reference: entry.document_number,
        details: entry.status || "",
        debit: Number(entry.total || 0),
        credit: 0,
        id: entry.id,
      })),
      ...(customer.history.payments || []).map((entry: any) => ({
        date: entry.date,
        type: "Payment",
        reference: entry.payment_number,
        details: entry.invoice_number ? `Against ${entry.invoice_number}` : (entry.payment_mode || ""),
        debit: 0,
        credit: Number(entry.amount || 0),
        id: entry.id,
      })),
      ...(customer.history.creditNotes || []).map((entry: any) => ({
        date: entry.date,
        type: "Credit Note",
        reference: entry.document_number,
        details: entry.status || "",
        debit: 0,
        credit: Number(entry.total || 0),
        id: entry.id,
      })),
      ...(customer.history.salesReturns || []).map((entry: any) => ({
        date: entry.date,
        type: "Sales Return",
        reference: entry.document_number,
        details: entry.status || "",
        debit: 0,
        credit: Number(entry.total || 0),
        id: entry.id,
      })),
    ];

    let runningBalance = 0;
    return sortByDateAsc(ledgerEntries).map((entry) => {
      runningBalance += Number(entry.debit || 0) - Number(entry.credit || 0);
      return { ...entry, balance: runningBalance };
    });
  }, [customer]);

  const statementData: PartyStatementData = useMemo(() => ({
    title: "Customer Statement",
    statementNumber: customer ? `CUS-${customer.id?.slice?.(0, 8) || "STATEMENT"}` : "Customer Statement",
    asOfDate: new Date().toISOString().split("T")[0],
    partyLabel: "Customer",
    partyName: customer?.name || "",
    partyGstin: customer?.gstin || undefined,
    partyAddress: customer?.billing_address || undefined,
    partyState: customer?.state || undefined,
    summaries: [
      { label: "Outstanding", value: formatCurrency(Number(customer?.outstanding_balance || 0)) },
      { label: "Total Sales", value: formatCurrency(Number(customer?.total_sales || 0)) },
      { label: "Payments Received", value: formatCurrency(Number(customer?.total_received || 0)) },
      { label: "Credits + Returns", value: formatCurrency(Number(customer?.total_credits || 0) + Number(customer?.total_returns || 0)) },
    ],
    rows: statementRows,
  }), [customer, statementRows]);

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!customer) return <div className="p-8 text-muted-foreground">Customer not found</div>;

  const historyGroups = [
    { key: "quotations", label: "Quotations", type: "Quotation", rows: customer.history?.quotations || [] },
    { key: "salesOrders", label: "Sales Orders", type: "Sales Order", rows: customer.history?.salesOrders || [] },
    { key: "deliveryChallans", label: "Delivery Challans", type: "Delivery Challan", rows: customer.history?.deliveryChallans || [] },
    { key: "invoices", label: "Invoices", type: "Invoice", rows: customer.history?.invoices || [] },
    { key: "payments", label: "Payments", type: "Payment", rows: customer.history?.payments || [] },
    { key: "creditNotes", label: "Credit Notes", type: "Credit Note", rows: customer.history?.creditNotes || [] },
    { key: "salesReturns", label: "Sales Returns", type: "Sales Return", rows: customer.history?.salesReturns || [] },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => navigate("/sales/customers")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => previewPartyStatement(statementData)}>
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button variant="outline" onClick={() => printPartyStatement(statementData)}>
            <Printer className="w-4 h-4 mr-2" /> Print Statement
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <Badge className="bg-white/10 text-white hover:bg-white/10 border-white/10">Customer Overview</Badge>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{customer.name}</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Complete customer profile, sales history, ledger movement, and account statement in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-200">
              {customer.email && <span className="inline-flex items-center gap-2"><Mail className="w-4 h-4" /> {customer.email}</span>}
              {customer.phone && <span className="inline-flex items-center gap-2"><Phone className="w-4 h-4" /> {customer.phone}</span>}
              {customer.billing_address && <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" /> {customer.billing_address}</span>}
            </div>
          </div>
          <div className="grid min-w-[280px] grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Outstanding</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(Number(customer.outstanding_balance || 0))}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Total Sales</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(Number(customer.total_sales || 0))}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Invoices</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(Number(customer.invoice_count || 0))}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Payments Received</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(Number(customer.total_received || 0))}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Personal Info</CardTitle>
            <CardDescription>Primary customer profile and account-level metadata.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">GSTIN</p>
              <p className="mt-2 font-medium text-slate-900">{customer.gstin || "-"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">State</p>
              <p className="mt-2 font-medium text-slate-900">{customer.state || "-"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Credit Limit</p>
              <p className="mt-2 font-medium text-slate-900">{formatCurrency(Number(customer.credit_limit || 0))}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
              <p className="mt-2 font-medium text-slate-900">{customer.is_active ? "Active" : "Inactive"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Billing Address</p>
              <p className="mt-2 font-medium text-slate-900">{customer.billing_address || "-"}</p>
            </div>
            {customer.shipping_address && (
              <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Shipping Address</p>
                <p className="mt-2 font-medium text-slate-900">{customer.shipping_address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Sales To Date</CardTitle>
            <CardDescription>Top billed items and cumulative sales exposure for this customer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sales Orders</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(Number(customer.sales_order_count || 0))}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Delivery Challans</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(Number(customer.delivery_challan_count || 0))}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Credits + Returns</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(Number(customer.total_credits || 0) + Number(customer.total_returns || 0))}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3 text-right">Qty Sold</th>
                    <th className="px-4 py-3 text-right">Sales Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(customer.itemSales || []).length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No item sales yet.</td></tr>
                  ) : (
                    customer.itemSales.map((item: any) => (
                      <tr key={`${item.item_id}-${item.item_name}`} className="border-t border-slate-200">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{item.item_name}</p>
                          {item.hsn_code && <p className="text-xs text-slate-500">HSN: {item.hsn_code}</p>}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{formatNumber(Number(item.total_quantity || 0))}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(Number(item.total_value || 0))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">History</CardTitle>
          <CardDescription>Document flow, payments, and running statement for this customer.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="statement" className="space-y-4">
            <TabsList className="h-auto flex-wrap justify-start gap-1 rounded-2xl bg-slate-100 p-1">
              <TabsTrigger value="statement" className="rounded-xl">Statement</TabsTrigger>
              {historyGroups.map((group) => (
                <TabsTrigger key={group.key} value={group.key} className="rounded-xl">{group.label}</TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="statement">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3 text-right">Debit</th>
                      <th className="px-4 py-3 text-right">Credit</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statementRows.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No statement activity available.</td></tr>
                    ) : (
                      statementRows.map((row, index) => (
                        <tr key={`${row.type}-${row.reference}-${index}`} className="border-t border-slate-200">
                          <td className="px-4 py-3">{row.date || "-"}</td>
                          <td className="px-4 py-3">{row.type}</td>
                          <td className="px-4 py-3">{row.reference}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(Number(row.debit || 0))}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(Number(row.credit || 0))}</td>
                          <td className="px-4 py-3 text-right font-semibold text-blue-700">{formatCurrency(Number(row.balance || 0))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {historyGroups.map((group) => (
              <TabsContent key={group.key} value={group.key}>
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Open</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No {group.label.toLowerCase()} found.</td></tr>
                      ) : (
                        group.rows.map((row: any) => {
                          const docPath = getDocPath(group.type, row.id);
                          const amount = row.amount ?? row.total ?? row.balance_due ?? 0;
                          const status = row.status || row.payment_mode || (row.invoice_number ? `Against ${row.invoice_number}` : "-");
                          return (
                            <tr key={row.id} className="border-t border-slate-200">
                              <td className="px-4 py-3 font-medium text-slate-900">{row.document_number || row.payment_number}</td>
                              <td className="px-4 py-3 text-slate-600">{row.date || "-"}</td>
                              <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(Number(amount || 0))}</td>
                              <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusTone(status)}`}>{status}</span></td>
                              <td className="px-4 py-3 text-right">
                                {docPath ? (
                                  <Button variant="ghost" size="sm" onClick={() => navigate(docPath)}>
                                    <Eye className="w-4 h-4 mr-2" /> View
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
