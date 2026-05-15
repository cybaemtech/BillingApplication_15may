import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, DataToolbar } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { CreateDialog } from "@/components/CreateDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { itemCategoriesApi, itemsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppPagination } from "@/components/AppPagination";
import { emptyPaginatedResponse } from "@/lib/pagination";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function ItemsPage() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState("");
  const [editingCategorySearch, setEditingCategorySearch] = useState("");
  const [editingStatus, setEditingStatus] = useState("true");
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: response = emptyPaginatedResponse<any>(), isLoading } = useQuery({
    queryKey: ["items", page],
    queryFn: () => itemsApi.listPage(page),
  });
  const items = response.data;
  const { data: categories = [] } = useQuery({ queryKey: ["item_categories"], queryFn: itemCategoriesApi.list });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("new") === "1") {
      setOpen(true);
    }
  }, [location.search]);

  const createMutation = useMutation({
    mutationFn: itemsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setOpen(false);
      setSelectedCategory("");
      toast({ title: "Item created successfully" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => itemsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setEditingItem(null);
      setEditingCategory("");
      setEditingStatus("true");
      toast({ title: "Item updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: itemsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast({ title: "Item deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const createCategoryMutation = useMutation({
    mutationFn: itemCategoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item_categories"] });
      toast({ title: "Category added" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const addCategory = (rawValue: string, onSelect: (value: string) => void, onClearSearch: () => void) => {
    const name = rawValue.trim();
    if (!name) {
      toast({ title: "Enter a category name", variant: "destructive" });
      return;
    }

    const existing = categories.find((category: any) => category.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      onSelect(existing.name);
      onClearSearch();
      return;
    }

    createCategoryMutation.mutate(
      { name, description: "" },
      {
        onSuccess: () => {
          onSelect(name);
          onClearSearch();
        },
      },
    );
  };

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      name: fd.get("name") as string,
      sku: fd.get("sku") as string,
      hsn_code: fd.get("hsn_code") as string,
      category: selectedCategory || undefined,
      unit: (fd.get("unit") as string) || "pcs",
      purchase_rate: Number(fd.get("purchase_rate")) || 0,
      selling_rate: Number(fd.get("selling_rate")) || 0,
      opening_stock: Number(fd.get("opening_stock")) || 0,
      reorder_level: Number(fd.get("reorder_level")) || 10,
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingItem.id,
      updates: {
        name: fd.get("name") as string,
        sku: fd.get("sku") as string,
        hsn_code: fd.get("hsn_code") as string,
        category: editingCategory || null,
        unit: (fd.get("unit") as string) || "pcs",
        purchase_rate: Number(fd.get("purchase_rate")) || 0,
        selling_rate: Number(fd.get("selling_rate")) || 0,
        current_stock: Number(fd.get("current_stock")) || 0,
        reorder_level: Number(fd.get("reorder_level")) || 0,
        is_active: editingStatus === "true",
      },
    });
  };

  const filtered = items.filter((item: any) => item.name.toLowerCase().includes(search.toLowerCase()));
  const normalizedCategorySearch = categorySearch.trim().toLowerCase();
  const filteredCategories = categories.filter((category: any) =>
    !normalizedCategorySearch || category.name.toLowerCase().includes(normalizedCategorySearch),
  );
  const normalizedEditingCategorySearch = editingCategorySearch.trim().toLowerCase();
  const filteredEditingCategories = categories.filter((category: any) =>
    !normalizedEditingCategorySearch || category.name.toLowerCase().includes(normalizedEditingCategorySearch),
  );

  return (
    <div>
      <PageHeader title="Items" subtitle="Manage inventory items and stock">
        <CreateDialog
          title="New Item"
          buttonLabel="New Item"
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (!nextOpen) setSelectedCategory("");
          }}
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Item Name *</Label><Input name="name" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>SKU</Label><Input name="sku" /></div>
              <div className="space-y-2"><Label>HSN Code</Label><Input name="hsn_code" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <div className="sticky top-0 z-10 border-b border-border bg-popover p-2">
                      <div className="relative">
                        <Input
                          className="h-8 pr-8 text-xs"
                          placeholder="Search category"
                          value={categorySearch}
                          onChange={(event) => setCategorySearch(event.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 h-6 w-6"
                          onClick={() => addCategory(categorySearch, setSelectedCategory, () => setCategorySearch(""))}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        className="mt-2 h-8 w-full justify-start text-xs"
                        onClick={() => addCategory(categorySearch, setSelectedCategory, () => setCategorySearch(""))}
                      >
                        <Plus className="mr-2 h-3.5 w-3.5" />
                        Add Category
                      </Button>
                    </div>
                    {filteredCategories.length === 0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">No categories found</div>
                    )}
                    {filteredCategories.map((category: any) => (
                      <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Unit</Label><Input name="unit" placeholder="pcs" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Purchase Rate</Label><Input name="purchase_rate" type="number" step="0.01" /></div>
              <div className="space-y-2"><Label>Selling Rate</Label><Input name="selling_rate" type="number" step="0.01" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Opening Stock</Label><Input name="opening_stock" type="number" /></div>
              <div className="space-y-2"><Label>Reorder Level</Label><Input name="reorder_level" type="number" defaultValue="10" /></div>
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Item"}
            </Button>
          </form>
        </CreateDialog>
      </PageHeader>
      <DataToolbar searchPlaceholder="Search items..." onSearch={setSearch} />

      <Dialog
        open={!!editingItem}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingItem(null);
            setEditingCategory("");
            setEditingStatus("true");
          }
        }}
      >
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Item</DialogTitle></DialogHeader>
          {editingItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Item Name *</Label><Input name="name" required defaultValue={editingItem.name || ""} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>SKU</Label><Input name="sku" defaultValue={editingItem.sku || ""} /></div>
                <div className="space-y-2"><Label>HSN Code</Label><Input name="hsn_code" defaultValue={editingItem.hsn_code || ""} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={editingCategory} onValueChange={setEditingCategory}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <div className="sticky top-0 z-10 border-b border-border bg-popover p-2">
                        <div className="relative">
                          <Input
                            className="h-8 pr-8 text-xs"
                            placeholder="Search category"
                            value={editingCategorySearch}
                            onChange={(event) => setEditingCategorySearch(event.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 h-6 w-6"
                            onClick={() => addCategory(editingCategorySearch, setEditingCategory, () => setEditingCategorySearch(""))}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          className="mt-2 h-8 w-full justify-start text-xs"
                          onClick={() => addCategory(editingCategorySearch, setEditingCategory, () => setEditingCategorySearch(""))}
                        >
                          <Plus className="mr-2 h-3.5 w-3.5" />
                          Add Category
                        </Button>
                      </div>
                      {filteredEditingCategories.length === 0 && (
                        <div className="px-3 py-2 text-xs text-muted-foreground">No categories found</div>
                      )}
                      {filteredEditingCategories.map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Unit</Label><Input name="unit" defaultValue={editingItem.unit || "pcs"} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Purchase Rate</Label><Input name="purchase_rate" type="number" step="0.01" defaultValue={editingItem.purchase_rate ?? 0} /></div>
                <div className="space-y-2"><Label>Selling Rate</Label><Input name="selling_rate" type="number" step="0.01" defaultValue={editingItem.selling_rate ?? 0} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Current Stock</Label><Input name="current_stock" type="number" defaultValue={editingItem.current_stock ?? 0} /></div>
                <div className="space-y-2"><Label>Reorder Level</Label><Input name="reorder_level" type="number" defaultValue={editingItem.reorder_level ?? 0} /></div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editingStatus} onValueChange={setEditingStatus}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Update Item"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No items found. Create your first item.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Item Name</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">SKU</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">HSN</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Category</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Stock</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Rate</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item: any) => (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/inventory/items/${item.id}`)}
                  >
                    <td className="px-5 py-3 font-medium text-card-foreground">{item.name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{item.sku || "-"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{item.hsn_code || "-"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{item.category || "-"}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-medium ${Number(item.current_stock) <= Number(item.reorder_level) ? "text-destructive" : "text-card-foreground"}`}>
                        {Number(item.current_stock)} {item.unit}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-card-foreground">{formatCurrency(Number(item.selling_rate || 0))}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${item.is_active === false ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"}`}>{item.is_active === false ? "Inactive" : "Active"}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(event) => {
                            event.stopPropagation();
                            setEditingItem(item);
                            setEditingCategory(item.category || "");
                            setEditingStatus(item.is_active === false ? "false" : "true");
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(event) => {
                          event.stopPropagation();
                          if (confirm("Delete this item?")) deleteMutation.mutate(item.id);
                        }}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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











