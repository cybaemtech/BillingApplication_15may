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
import { customersApi } from "@/lib/api";
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

export default function CustomersPage() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [editingStatus, setEditingStatus] = useState("true");
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: response = emptyPaginatedResponse<any>(), isLoading } = useQuery({
    queryKey: ["customers", page],
    queryFn: () => customersApi.listPage(page),
  });
  const customers = response.data;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("new") === "1") {
      setOpen(true);
    }
  }, [location.search]);

  const createMutation = useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setOpen(false);
      toast({ title: "Customer created successfully" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => customersApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setEditingCustomer(null);
      toast({ title: "Customer updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: customersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Customer deleted" });
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
      billing_address: fd.get("billing_address") as string,
      state: fd.get("state") as string,
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCustomer) return;
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingCustomer.id,
      updates: {
        name: fd.get("name") as string,
        email: fd.get("email") as string,
        phone: fd.get("phone") as string,
        gstin: fd.get("gstin") as string,
        billing_address: fd.get("billing_address") as string,
        state: fd.get("state") as string,
        is_active: editingStatus === "true",
      },
    });
  };

  const filtered = customers.filter((customer: any) => customer.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Customers" subtitle="Manage your customer database">
        <CreateDialog title="New Customer" buttonLabel="New Customer" open={open} onOpenChange={setOpen}>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input name="name" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input name="phone" /></div>
            </div>
            <div className="space-y-2"><Label>GSTIN</Label><Input name="gstin" /></div>
            <div className="space-y-2"><Label>State</Label><Input name="state" /></div>
            <div className="space-y-2"><Label>Billing Address</Label><Input name="billing_address" /></div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Customer"}
            </Button>
          </form>
        </CreateDialog>
      </PageHeader>
      <DataToolbar searchPlaceholder="Search customers..." onSearch={setSearch} />

      <Dialog open={!!editingCustomer} onOpenChange={(nextOpen) => { if (!nextOpen) setEditingCustomer(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
          {editingCustomer && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Name *</Label><Input name="name" required defaultValue={editingCustomer.name || ""} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" defaultValue={editingCustomer.email || ""} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input name="phone" defaultValue={editingCustomer.phone || ""} /></div>
              </div>
              <div className="space-y-2"><Label>GSTIN</Label><Input name="gstin" defaultValue={editingCustomer.gstin || ""} /></div>
              <div className="space-y-2"><Label>State</Label><Input name="state" defaultValue={editingCustomer.state || ""} /></div>
              <div className="space-y-2"><Label>Billing Address</Label><Input name="billing_address" defaultValue={editingCustomer.billing_address || ""} /></div>
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
                {updateMutation.isPending ? "Saving..." : "Update Customer"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No customers found. Create your first customer.</div>
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
                {filtered.map((customer: any) => (
                  <tr
                    key={customer.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/sales/customers/${customer.id}`)}
                    >
                    <td className="px-5 py-3"><p className="font-medium text-card-foreground">{customer.name}</p></td>
                    <td className="px-5 py-3">
                      {customer.email ? (
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email}</p>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {customer.phone ? (
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</p>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{customer.gstin || "-"}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${customer.is_active === false ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"}`}>{customer.is_active === false ? "Inactive" : "Active"}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">{formatCurrency(Number(customer.outstanding_balance || 0))}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(event) => {
                          event.stopPropagation();
                          setEditingCustomer(customer);
                          setEditingStatus(customer.is_active === false ? "false" : "true");
                        }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(event) => {
                          event.stopPropagation();
                          if (confirm("Delete this customer?")) deleteMutation.mutate(customer.id);
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


