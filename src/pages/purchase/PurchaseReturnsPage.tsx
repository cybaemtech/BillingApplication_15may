import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseReturnsApi, vendorsApi } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/StatusBadge";
import { AppPagination } from "@/components/AppPagination";
import { emptyPaginatedResponse } from "@/lib/pagination";

export default function PurchaseReturnsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ vendor_id: "", total: "", reason: "" });

  const { data: response = emptyPaginatedResponse<any>(), isLoading, error } = useQuery({
    queryKey: ["purchase_returns", page],
    queryFn: () => purchaseReturnsApi.listPage(page),
  });
  const records = response.data;

  const { data: vendors = [] } = useQuery({ queryKey: ["vendors"], queryFn: vendorsApi.list });
  const selectableVendors = vendors.filter((vendor: any) => vendor?.is_active !== false || vendor?.id === form.vendor_id);

  useEffect(() => {
    if (location.pathname.endsWith("/new")) setOpen(true);
  }, [location.pathname]);

  const createMut = useMutation({
    mutationFn: () => purchaseReturnsApi.create({
      vendor_id: form.vendor_id,
      date: new Date().toISOString().split("T")[0],
      subtotal: Number(form.total) || 0,
      tax_amount: 0,
      total: Number(form.total) || 0,
      reason: form.reason,
      notes: "",
      status: "dispatched",
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase_returns"] });
      setOpen(false);
      setForm({ vendor_id: "", total: "", reason: "" });
      toast({ title: "Purchase return created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div>
      <PageHeader title="Purchase Returns" subtitle="Track stock returned to vendors">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Return</Button></DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>New Purchase Return</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Select value={form.vendor_id} onValueChange={(v) => setForm({ ...form, vendor_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select Vendor" /></SelectTrigger>
                <SelectContent>{selectableVendors.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
              </Select>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
              </div>
              <Input placeholder="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              <Button onClick={() => createMut.mutate()} disabled={!form.vendor_id || !form.total || createMut.isPending} className="w-full">
                {createMut.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Number</TableHead><TableHead>Vendor</TableHead><TableHead>Date</TableHead>
            <TableHead>Amount</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow> :
            error ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-destructive">{(error as Error).message}</TableCell></TableRow> :
            records.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No purchase returns</TableCell></TableRow> :
            records.map((r: any) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate("/purchase/returns/" + r.id)}>
                <TableCell className="font-medium">{r.document_number || r.id}</TableCell>
                <TableCell>{r.vendor_name || "-"}</TableCell>
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





