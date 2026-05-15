import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarClock, CircleAlert } from "lucide-react";
import { invoicesApi, billsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function diffDays(targetDate?: string) {
  if (!targetDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function reminderTone(days: number | null) {
  if (days === null) return "bg-slate-50 text-slate-700 border-slate-200";
  if (days < 0) return "bg-rose-50 text-rose-700 border-rose-200";
  if (days <= 3) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

export default function RemindersPage() {
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({ queryKey: ["invoices"], queryFn: invoicesApi.list });
  const { data: bills = [], isLoading: billsLoading } = useQuery({ queryKey: ["bills"], queryFn: billsApi.list });

  const invoiceReminders = useMemo(() => {
    return invoices
      .filter((invoice: any) => Number(invoice.balance_due || 0) > 0 && invoice.due_date)
      .map((invoice: any) => ({
        id: invoice.id,
        type: "Invoice",
        number: invoice.document_number,
        party: invoice.customer_name || "Customer",
        dueDate: invoice.due_date,
        amount: Number(invoice.balance_due || 0),
        days: diffDays(invoice.due_date),
      }))
      .sort((a: any, b: any) => (a.days ?? 999) - (b.days ?? 999));
  }, [invoices]);

  const billReminders = useMemo(() => {
    return bills
      .filter((bill: any) => Number(bill.balance_due || 0) > 0 && bill.due_date)
      .map((bill: any) => ({
        id: bill.id,
        type: "Bill",
        number: bill.document_number,
        party: bill.vendor_name || "Vendor",
        dueDate: bill.due_date,
        amount: Number(bill.balance_due || 0),
        days: diffDays(bill.due_date),
      }))
      .sort((a: any, b: any) => (a.days ?? 999) - (b.days ?? 999));
  }, [bills]);

  const overdueInvoices = invoiceReminders.filter((entry: any) => (entry.days ?? 0) < 0);
  const upcomingBills = billReminders.filter((entry: any) => (entry.days ?? 999) >= 0 && (entry.days ?? 999) <= 7);

  const isLoading = invoicesLoading || billsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reminders</h1>
        <p className="text-sm text-muted-foreground mt-1">Track overdue receivables and upcoming payables that need follow-up.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" /> Total Invoice Reminders</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{invoiceReminders.length}</p><p className="text-sm text-muted-foreground mt-1">Open customer invoices with due dates.</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CircleAlert className="w-4 h-4" /> Overdue Invoices</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{overdueInvoices.length}</p><p className="text-sm text-muted-foreground mt-1">Need immediate follow-up for collection.</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarClock className="w-4 h-4" /> Bills Due In 7 Days</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{upcomingBills.length}</p><p className="text-sm text-muted-foreground mt-1">Planned vendor payments due soon.</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Customer Payment Reminders</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden rounded-b-lg border-t border-border">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Invoice</TableHead><TableHead>Customer</TableHead><TableHead>Due Date</TableHead><TableHead>Pending</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow> :
                  invoiceReminders.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No invoice reminders.</TableCell></TableRow> :
                  invoiceReminders.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.number}</TableCell>
                      <TableCell>{entry.party}</TableCell>
                      <TableCell>{entry.dueDate}</TableCell>
                      <TableCell>{formatCurrency(entry.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={reminderTone(entry.days)}>
                          {entry.days! < 0 ? `${Math.abs(entry.days!)} days overdue` : entry.days === 0 ? "Due today" : `Due in ${entry.days} days`}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Vendor Payment Reminders</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden rounded-b-lg border-t border-border">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Bill</TableHead><TableHead>Vendor</TableHead><TableHead>Due Date</TableHead><TableHead>Pending</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow> :
                  billReminders.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No bill reminders.</TableCell></TableRow> :
                  billReminders.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.number}</TableCell>
                      <TableCell>{entry.party}</TableCell>
                      <TableCell>{entry.dueDate}</TableCell>
                      <TableCell>{formatCurrency(entry.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={reminderTone(entry.days)}>
                          {entry.days! < 0 ? `${Math.abs(entry.days!)} days overdue` : entry.days === 0 ? "Due today" : `Due in ${entry.days} days`}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
