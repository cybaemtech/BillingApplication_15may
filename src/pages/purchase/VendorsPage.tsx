import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, DataToolbar } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone, Pencil, Trash2 } from "lucide-react";
import { CreateDialog } from "@/components/CreateDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vendorsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
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

export default function VendorsPage() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [editingStatus, setEditingStatus] = useState("true");
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: response = emptyPaginatedResponse<any>(), isLoading } = useQuery({
    queryKey: ["vendors", page],
    queryFn: () => vendorsApi.listPage(page),
  });
  const vendors = response.data;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("new") === "1") {
      setOpen(true);
    }
  }, [location.search]);

  const createMutation = useMutation({
    mutationFn: vendorsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setOpen(false);
      toast({ title: "Vendor created successfully" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => vendorsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setEditingVendor(null);
      toast({ title: "Vendor updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: vendorsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast({ title: "Vendor deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      gstin: fd.get("gstin") as string,
      address: fd.get("address") as string,
      state: fd.get("state") as string,
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingVendor) return;
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingVendor.id,
      updates: {
        name: fd.get("name") as string,
        email: fd.get("email") as string,
        phone: fd.get("phone") as string,
        gstin: fd.get("gstin") as string,
        address: fd.get("address") as string,
        state: fd.get("state") as string,
        is_active: editingStatus === "true",
      },
    });
  };

  const filtered = vendors.filter((vendor: any) => vendor.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Vendors" subtitle="Manage vendor database">
        <CreateDialog title="New Vendor" buttonLabel="New Vendor" open={open} onOpenChange={setOpen}>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input name="name" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input name="phone" /></div>
            </div>
            <div className="space-y-2"><Label>GSTIN</Label><Input name="gstin" /></div>
            <div className="space-y-2"><Label>State</Label><Input name="state" /></div>
            <div className="space-y-2"><Label>Address</Label><Input name="address" /></div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Vendor"}
            </Button>
          </form>
        </CreateDialog>
      </PageHeader>
      <DataToolbar searchPlaceholder="Search vendors..." onSearch={setSearch} />

      <Dialog open={!!editingVendor} onOpenChange={(nextOpen) => { if (!nextOpen) setEditingVendor(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Vendor</DialogTitle></DialogHeader>
          {editingVendor && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Name *</Label><Input name="name" required defaultValue={editingVendor.name || ""} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" defaultValue={editingVendor.email || ""} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input name="phone" defaultValue={editingVendor.phone || ""} /></div>
              </div>
              <div className="space-y-2"><Label>GSTIN</Label><Input name="gstin" defaultValue={editingVendor.gstin || ""} /></div>
              <div className="space-y-2"><Label>State</Label><Input name="state" defaultValue={editingVendor.state || ""} /></div>
              <div className="space-y-2"><Label>Address</Label><Input name="address" defaultValue={editingVendor.address || ""} /></div>
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
                {updateMutation.isPending ? "Saving..." : "Update Vendor"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No vendors found. Create your first vendor.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Contact</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">GSTIN</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Outstanding</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((vendor: any) => (
                  <tr
                    key={vendor.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/purchase/vendors/${vendor.id}`)}
                    >
                    <td className="px-5 py-3"><p className="font-medium text-card-foreground">{vendor.name}</p></td>
                    <td className="px-5 py-3">
                      {vendor.email ? (
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {vendor.email}</p>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {vendor.phone ? (
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {vendor.phone}</p>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{vendor.gstin || "-"}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${vendor.is_active === false ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"}`}>{vendor.is_active === false ? "Inactive" : "Active"}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">{formatCurrency(Number(vendor.outstanding_balance || 0))}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(event) => {
                          event.stopPropagation();
                          setEditingVendor(vendor);
                          setEditingStatus(vendor.is_active === false ? "false" : "true");
                        }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(event) => {
                          event.stopPropagation();
                          if (confirm("Delete this vendor?")) deleteMutation.mutate(vendor.id);
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


