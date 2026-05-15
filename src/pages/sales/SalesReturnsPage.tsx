import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { salesReturnsApi, customersApi } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/StatusBadge";
import { AppPagination } from "@/components/AppPagination";
import { emptyPaginatedResponse } from "@/lib/pagination";

export default function SalesReturnsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ customer_id: "", total: "", reason: "" });

  const { data: response = emptyPaginatedResponse<any>(), isLoading, error } = useQuery({
    queryKey: ["sales_returns", page],
    queryFn: () => salesReturnsApi.listPage(page),
  });
  const records = response.data;

  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });
  const selectableCustomers = customers.filter((customer: any) => customer?.is_active !== false || customer?.id === form.customer_id);

  const createMut = useMutation({
    mutationFn: () => salesReturnsApi.create({
      customer_id: form.customer_id,
      date: new Date().toISOString().split("T")[0],
      subtotal: Number(form.total) || 0,
      tax_amount: 0,
      total: Number(form.total) || 0,
      reason: form.reason,
      notes: "",
      status: "received",
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales_returns"] });
      setOpen(false);
      setForm({ customer_id: "", total: "", reason: "" });
      toast({ title: "Sales return created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div>
      <PageHeader title="Sales Returns" subtitle="Track goods returned by customers">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Return</Button></DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>New Sales Return</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger>
                <SelectContent>{selectableCustomers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
              </div>
              <Input placeholder="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              <Button onClick={() => createMut.mutate()} disabled={!form.customer_id || !form.total || createMut.isPending} className="w-full">
                {createMut.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Number</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead>
            <TableHead>Amount</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow> :
            error ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-destructive">{(error as Error).message}</TableCell></TableRow> :
            records.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No sales returns</TableCell></TableRow> :
            records.map((r: any) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate("/sales/returns/" + r.id)}>
                <TableCell className="font-medium">{r.document_number || r.id}</TableCell>
                <TableCell>{r.customer_name || "-"}</TableCell>
                <TableCell>{r.date}</TableCell>
                <TableCell>Rs{Number(r.total).toLocaleString()}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
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



