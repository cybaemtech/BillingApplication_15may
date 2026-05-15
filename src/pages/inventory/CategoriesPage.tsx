import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { itemCategoriesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AppPagination } from "@/components/AppPagination";
import { emptyPaginatedResponse } from "@/lib/pagination";

export default function CategoriesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [page, setPage] = useState(1);

  const { data: response = emptyPaginatedResponse<any>(), isLoading } = useQuery({
    queryKey: ["item_categories", page],
    queryFn: () => itemCategoriesApi.listPage(page),
  });
  const categories = response.data;

  const createMut = useMutation({
    mutationFn: () => itemCategoriesApi.create({ name, description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["item_categories"] });
      setOpen(false);
      setName("");
      setDescription("");
      toast({ title: "Category created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => itemCategoriesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["item_categories"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Item Categories</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Category</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Category Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Textarea
                placeholder="Description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Button onClick={() => createMut.mutate()} disabled={!name} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow> :
            categories.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No categories</TableCell></TableRow> :
            categories.map((c: any) => (
              <TableRow key={c.id} className="cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/inventory/categories/${c.id}`)}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.description || "-"}</TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); deleteMut.mutate(c.id); }}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
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
