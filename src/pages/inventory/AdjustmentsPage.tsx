import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryAdjustmentsApi, itemsApi, warehousesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/StatusBadge";
import { AppPagination } from "@/components/AppPagination";
import { emptyPaginatedResponse } from "@/lib/pagination";
import { useNavigate } from "react-router-dom";

export default function AdjustmentsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [itemId, setItemId] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [adjustedQuantity, setAdjustedQuantity] = useState("");
  const [page, setPage] = useState(1);

  const { data: response = emptyPaginatedResponse<any>(), isLoading } = useQuery({
    queryKey: ["inventory_adjustments", page],
    queryFn: () => inventoryAdjustmentsApi.listPage(page),
  });
  const adjustments = response.data;
  const { data: warehouses = [] } = useQuery({ queryKey: ["warehouses"], queryFn: warehousesApi.list });
  const { data: items = [] } = useQuery({ queryKey: ["items"], queryFn: itemsApi.list });
  const selectedItem = items.find((item: any) => item.id === itemId);
  const normalizedItemSearch = itemSearch.trim().toLowerCase();
  const filteredItems = items.filter((item: any) =>
    !normalizedItemSearch || (item?.name || "").toLowerCase().includes(normalizedItemSearch),
  );
  const addItem = () => navigate("/inventory/items?new=1");

  const createMut = useMutation({
    mutationFn: () => inventoryAdjustmentsApi.create(
      { document_number: `ADJ-${Date.now()}`, reason, warehouse_id: warehouseId },
      [{
        item_id: itemId,
        quantity_on_hand: Number(selectedItem?.current_stock || 0),
        adjusted_quantity: Number(adjustedQuantity || 0),
        cost_price: Number(selectedItem?.purchase_rate || 0),
      }],
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory_adjustments"] });
      qc.invalidateQueries({ queryKey: ["stock_movements"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      setOpen(false);
      setReason("");
      setWarehouseId("");
      setItemId("");
      setAdjustedQuantity("");
      toast({ title: "Adjustment created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory Adjustments</h1>
          <p className="text-sm text-muted-foreground mt-1">Use adjustments to correct stock mismatches after physical counting or damage/loss checks.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Adjustment</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Adjustment</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Warehouse</Label>
                <Select value={warehouseId} onValueChange={setWarehouseId}>
                  <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                  <SelectContent>{warehouses.map((warehouse: any) => <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.warehouse_name || warehouse.warehouseName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Item</Label>
                <Select value={itemId} onValueChange={setItemId}>
                  <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
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
              </div>
              {selectedItem ? <p className="text-xs text-muted-foreground">Current stock: {Number(selectedItem.current_stock || 0).toLocaleString("en-IN")}</p> : null}
              <Input placeholder="Adjusted Quantity" type="number" value={adjustedQuantity} onChange={(e) => setAdjustedQuantity(e.target.value)} />
              <Input placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
              <Button onClick={() => createMut.mutate()} disabled={!reason || !warehouseId || !itemId || adjustedQuantity === ""} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Number</TableHead><TableHead>Date</TableHead><TableHead>Warehouse</TableHead><TableHead>Items</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow> :
            adjustments.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No adjustments</TableCell></TableRow> :
            adjustments.map((a: any) => (
              <TableRow key={a.id} className="cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/inventory/adjustments/${a.id}`)}>
                <TableCell className="font-medium">{a.document_number || a.documentNumber}</TableCell>
                <TableCell>{a.date}</TableCell>
                <TableCell>{a.warehouse_name || "-"}</TableCell>
                <TableCell>{Number(a.item_count || 0)}</TableCell>
                <TableCell className="text-muted-foreground">{a.reason}</TableCell>
                <TableCell><StatusBadge status={a.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AppPagination currentPage={response.pagination.page} totalPages={response.pagination.totalPages} totalRecords={response.pagination.total} onPageChange={setPage} />
    </div>
  );
}
