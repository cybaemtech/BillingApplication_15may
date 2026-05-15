import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { billsApi, recurringBillsApi, vendorsApi } from "@/lib/api";
import { useLocation, useNavigate } from "react-router-dom";
import { PageHeader, DataToolbar } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/StatusBadge";
import { AppPagination } from "@/components/AppPagination";
import { emptyPaginatedResponse } from "@/lib/pagination";

export default function RecurringBillsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ vendor_id: "", base_bill_id: "", frequency: "monthly", total: "" });
  const location = useLocation();

  const { data: response = emptyPaginatedResponse<any>(), isLoading, error } = useQuery({
    queryKey: ["recurring_bills", page],
    queryFn: () => recurringBillsApi.listPage(page),
  });
  const records = response.data;

  const { data: vendors = [] } = useQuery({ queryKey: ["vendors"], queryFn: vendorsApi.list });
  const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: billsApi.list });
  const selectableVendors = vendors.filter((vendor: any) => vendor?.is_active !== false || vendor?.id === form.vendor_id);
  const selectableBills = bills.filter((bill: any) => !form.vendor_id || bill.vendor_id === form.vendor_id);
  const selectedBaseBill = selectableBills.find((bill: any) => bill.id === form.base_bill_id);

  const createMut = useMutation({
    mutationFn: () => recurringBillsApi.create({
      vendor_id: form.vendor_id,
      base_bill_id: form.base_bill_id || null,
      frequency: form.frequency,
      start_date: new Date().toISOString().split("T")[0],
      next_bill_date: new Date().toISOString().split("T")[0],
      subtotal: Number(form.total) || 0,
      tax_amount: 0,
      total: Number(form.total) || 0,
      is_active: true,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring_bills"] });
      setOpen(false);
      setForm({ vendor_id: "", base_bill_id: "", frequency: "monthly", total: "" });
      toast({ title: "Recurring bill created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => recurringBillsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring_bills"] });
      toast({ title: "Recurring bill deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (location.pathname.endsWith("/new")) setOpen(true);
  }, [location.pathname]);

  const filtered = records.filter((r: any) =>
    (r.vendor_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.frequency || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Recurring Bills" subtitle="Automate repeating vendor bills">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Recurring</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Recurring Bill</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={form.vendor_id} onValueChange={(v) => setForm({ ...form, vendor_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select Vendor" /></SelectTrigger>
                <SelectContent>{selectableVendors.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select
                value={form.base_bill_id}
                onValueChange={(value) => {
                  const baseBill = selectableBills.find((bill: any) => bill.id === value);
                  setForm((current) => ({
                    ...current,
                    vendor_id: baseBill?.vendor_id || current.vendor_id,
                    base_bill_id: value,
                    total: baseBill ? String(Number(baseBill.total || 0)) : current.total,
                  }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select Base Bill (optional)" /></SelectTrigger>
                <SelectContent>
                  {selectableBills.map((bill: any) => (
                    <SelectItem key={bill.id} value={bill.id}>
                      {(bill.document_number || bill.id) + " - Rs" + Number(bill.total || 0).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Amount" type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
              {selectedBaseBill ? (
                <p className="text-xs text-muted-foreground">
                  Items in recurring detail will come from base bill `{selectedBaseBill.document_number}`.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Select a base bill if you want recurring items to show in the detail page.
                </p>
              )}
              <Button onClick={() => createMut.mutate()} disabled={!form.vendor_id || !form.total || createMut.isPending} className="w-full">
                {createMut.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>
      <DataToolbar searchPlaceholder="Search recurring bills..." onSearch={setSearch} />
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Vendor</TableHead><TableHead>Frequency</TableHead><TableHead>Next Date</TableHead>
            <TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow> :
            error ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-destructive">{(error as Error).message}</TableCell></TableRow> :
            filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground"><div className="flex flex-col items-center gap-2"><RefreshCw className="w-5 h-5 opacity-40" /><span>No recurring bills</span></div></TableCell></TableRow> :
            filtered.map((r: any) => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/purchase/recurring-bills/${r.id}`)}>
                <TableCell className="font-medium">{r.vendor_name || r.vendor_id}</TableCell>
                <TableCell className="capitalize">{r.frequency}</TableCell>
                <TableCell>{r.next_bill_date || r.nextBillDate}</TableCell>
                <TableCell>Rs{Number(r.total).toLocaleString()}</TableCell>
                <TableCell><StatusBadge status={r.status || (r.is_active ? "active" : "inactive")} /></TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); if (confirm("Delete this recurring bill?")) deleteMut.mutate(r.id); }}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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




