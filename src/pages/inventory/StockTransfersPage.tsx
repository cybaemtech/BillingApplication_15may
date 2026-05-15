import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { itemsApi, stockTransfersApi, warehousesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRightLeft, Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/StatusBadge";
import { AppPagination } from "@/components/AppPagination";
import { emptyPaginatedResponse } from "@/lib/pagination";
import { useNavigate } from "react-router-dom";

export default function StockTransfersPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ from_warehouse_id: "", to_warehouse_id: "", item_id: "", quantity: "", notes: "" });
  const [itemSearch, setItemSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: response = emptyPaginatedResponse<any>(), isLoading } = useQuery({
    queryKey: ["stock_transfers", page],
    queryFn: () => stockTransfersApi.listPage(page),
  });
  const transfers = response.data;

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => warehousesApi.list(),
  });
  const { data: items = [] } = useQuery({
    queryKey: ["items"],
    queryFn: () => itemsApi.list(),
  });
  const selectableItems = items.filter((item: any) => Number(item.current_stock || 0) > 0);
  const normalizedItemSearch = itemSearch.trim().toLowerCase();
  const filteredItems = selectableItems.filter((item: any) =>
    !normalizedItemSearch || (item?.name || "").toLowerCase().includes(normalizedItemSearch),
  );
  const addItem = () => navigate("/inventory/items?new=1");

  const createMut = useMutation({
    mutationFn: () => stockTransfersApi.create({
      document_number: `ST-${Date.now()}`,
      from_warehouse_id: form.from_warehouse_id || null,
      to_warehouse_id: form.to_warehouse_id || null,
      notes: form.notes,
    }, [{ item_id: form.item_id, quantity: Number(form.quantity || 0) }]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock_transfers"] });
      qc.invalidateQueries({ queryKey: ["stock_movements"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      setOpen(false);
      setForm({ from_warehouse_id: "", to_warehouse_id: "", item_id: "", quantity: "", notes: "" });
      toast({ title: "Transfer created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock Transfers</h1>
          <p className="text-sm text-muted-foreground mt-1">Move item quantities between warehouses and keep the movement visible in the stock ledger.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Transfer</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Stock Transfer</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={form.from_warehouse_id} onValueChange={(v) => setForm({ ...form, from_warehouse_id: v })}>
                <SelectTrigger><SelectValue placeholder="From Warehouse" /></SelectTrigger>
                <SelectContent>{warehouses.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.warehouse_name || w.warehouseName}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.to_warehouse_id} onValueChange={(v) => setForm({ ...form, to_warehouse_id: v })}>
                <SelectTrigger><SelectValue placeholder="To Warehouse" /></SelectTrigger>
                <SelectContent>{warehouses.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.warehouse_name || w.warehouseName}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.item_id} onValueChange={(v) => setForm({ ...form, item_id: v })}>
                <SelectTrigger><SelectValue placeholder="Item" /></SelectTrigger>
                <SelectContent>
                  <div className="sticky top-0 z-10 border-b border-border bg-popover p-2">
                    <div className="relative">
                      <Input
                        className="h-8 pr-8 text-xs"
                        placeholder="Search item"
                        value={itemSearch}
                        onChange={(event) => setItemSearch(event.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-6 w-6"
                        onClick={addItem}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-2 h-8 w-full justify-start text-xs"
                      onClick={addItem}
                    >
                      <Plus className="mr-2 h-3.5 w-3.5" />
                      Add Item
                    </Button>
                  </div>
                  {filteredItems.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">No items found</div>
                  )}
                  {filteredItems.map((item: any) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <Button onClick={() => createMut.mutate()} disabled={!form.from_warehouse_id || !form.to_warehouse_id || !form.item_id || Number(form.quantity || 0) <= 0} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Number</TableHead><TableHead>Route</TableHead><TableHead>Date</TableHead><TableHead>Items</TableHead><TableHead>Status</TableHead><TableHead>Notes</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow> :
            transfers.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No transfers</TableCell></TableRow> :
            transfers.map((t: any) => (
              <TableRow key={t.id} className="cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/inventory/stock-transfers/${t.id}`)}>
                <TableCell className="font-medium">{t.document_number || t.documentNumber}</TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    {t.from_warehouse_name || "Source"} <ArrowRightLeft className="w-3.5 h-3.5" /> {t.to_warehouse_name || "Destination"}
                  </span>
                </TableCell>
                <TableCell>{t.date}</TableCell>
                <TableCell>{Number(t.item_count || 0)}</TableCell>
                <TableCell><StatusBadge status={t.status} /></TableCell>
                <TableCell className="text-muted-foreground">{t.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AppPagination currentPage={response.pagination.page} totalPages={response.pagination.totalPages} totalRecords={response.pagination.total} onPageChange={setPage} />
    </div>
  );
}
