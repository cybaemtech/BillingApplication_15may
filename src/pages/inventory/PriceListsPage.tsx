import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { itemsApi, priceListsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AppPagination } from "@/components/AppPagination";
import { emptyPaginatedResponse } from "@/lib/pagination";
import { useNavigate } from "react-router-dom";

export default function PriceListsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", item_id: "", rate_or_percentage: "" });
  const [itemSearch, setItemSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: response = emptyPaginatedResponse<any>(), isLoading } = useQuery({
    queryKey: ["price_lists", page],
    queryFn: () => priceListsApi.listPage(page),
  });
  const lists = response.data;
  const { data: items = [] } = useQuery({ queryKey: ["items"], queryFn: itemsApi.list });
  const normalizedItemSearch = itemSearch.trim().toLowerCase();
  const filteredItems = items.filter((item: any) =>
    !normalizedItemSearch || (item?.name || "").toLowerCase().includes(normalizedItemSearch),
  );
  const addItem = () => navigate("/inventory/items?new=1");

  const createMut = useMutation({
    mutationFn: () => priceListsApi.create(
      { name: form.name, description: form.description },
      form.item_id ? [{ item_id: form.item_id, rate_or_percentage: Number(form.rate_or_percentage || 0) }] : [],
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["price_lists"] });
      setOpen(false);
      setForm({ name: "", description: "", item_id: "", rate_or_percentage: "" });
      toast({ title: "Price list created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => priceListsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["price_lists"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Price Lists</h1>
          <p className="text-sm text-muted-foreground mt-1">Use price lists to save alternate item prices for special customers, campaigns, or channels.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Price List</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Price List</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="Retail Festive Pricing" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="Optional description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Reference Item</Label>
                <Select value={form.item_id} onValueChange={(value) => setForm({ ...form, item_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Select item (optional)" /></SelectTrigger>
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
              <div className="space-y-2">
                <Label>Special Price</Label>
                <Input placeholder="0.00" type="number" value={form.rate_or_percentage} onChange={(e) => setForm({ ...form, rate_or_percentage: e.target.value })} />
              </div>
              <Button onClick={() => createMut.mutate()} disabled={!form.name} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead>Items</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow> :
            lists.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No price lists</TableCell></TableRow> :
            lists.map((l: any) => (
              <TableRow key={l.id} className="cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/inventory/price-lists/${l.id}`)}>
                <TableCell className="font-medium">{l.name}</TableCell>
                <TableCell className="text-muted-foreground">{l.description}</TableCell>
                <TableCell className="text-muted-foreground">{Number(l.item_count || 0)} items</TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); deleteMut.mutate(l.id); }}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AppPagination currentPage={response.pagination.page} totalPages={response.pagination.totalPages} totalRecords={response.pagination.total} onPageChange={setPage} />
    </div>
  );
}
