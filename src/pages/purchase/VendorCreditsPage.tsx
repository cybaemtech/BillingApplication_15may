import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, DataToolbar } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CreateDialog } from "@/components/CreateDialog";
import { vendorCreditsApi, vendorsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineItemsForm, emptyLineItem } from "@/components/LineItemsForm";
import type { LineItem } from "@/components/LineItemsForm";
import { AppPagination } from "@/components/AppPagination";
import { emptyPaginatedResponse } from "@/lib/pagination";
import { Plus } from "lucide-react";

export default function VendorCreditsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem()]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: response = emptyPaginatedResponse<any>(), isLoading, error } = useQuery({
    queryKey: ["vendor_credits", page],
    queryFn: () => vendorCreditsApi.listPage(page),
  });
  const credits = response.data;
  const { data: vendors = [] } = useQuery({ queryKey: ["vendors"], queryFn: vendorsApi.list });
  const selectableVendors = vendors.filter((vendor: any) => vendor?.is_active !== false || vendor?.id === selectedVendor);
  const normalizedVendorSearch = vendorSearch.trim().toLowerCase();
  const filteredVendors = selectableVendors.filter((vendor: any) =>
    !normalizedVendorSearch || (vendor?.name || "").toLowerCase().includes(normalizedVendorSearch),
  );

  const createMutation = useMutation({
    mutationFn: ({ vc, items }: any) => vendorCreditsApi.create(vc, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor_credits"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setOpen(false);
      setLineItems([emptyLineItem()]);
      setSelectedVendor("");
      toast({ title: "Vendor credit created" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const validItems = lineItems.filter((li) => li.item_id);
    const subtotal = validItems.reduce((s, li) => s + li.amount, 0);
    const taxTotal = validItems.reduce((s, li) => s + li.tax_amount, 0);
    createMutation.mutate({
      vc: {
        vendor_id: selectedVendor,
        date: new Date().toISOString().split("T")[0],
        reason: fd.get("reason") as string,
        subtotal,
        tax_amount: taxTotal,
        total: subtotal + taxTotal,
      },
      items: validItems,
    });
  };

  useEffect(() => {
    if (location.pathname.endsWith("/new")) setOpen(true);
  }, [location.pathname]);

  const filtered = credits.filter((vc: any) =>
    vc.document_number?.toLowerCase().includes(search.toLowerCase()) ||
    vc.vendor_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Vendor Credits" subtitle="Manage vendor credit notes">
        <CreateDialog title="New Vendor Credit" buttonLabel="New Vendor Credit" open={open} onOpenChange={setOpen}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Vendor *</Label>
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>
                  <div className="sticky top-0 z-10 border-b border-border bg-popover p-2">
                    <div className="relative">
                      <Input
                        className="h-8 pr-8 text-xs"
                        placeholder="Search vendor"
                        value={vendorSearch}
                        onChange={(event) => setVendorSearch(event.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-6 w-6"
                        onClick={() => navigate("/purchase/vendors?new=1")}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-2 h-8 w-full justify-start text-xs"
                      onClick={() => navigate("/purchase/vendors?new=1")}
                    >
                      <Plus className="mr-2 h-3.5 w-3.5" />
                      Add Vendor
                    </Button>
                  </div>
                  {filteredVendors.map((v: any) => (<SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Reason</Label><Input name="reason" /></div>
            <LineItemsForm lineItems={lineItems} setLineItems={setLineItems} rateField="purchase_rate" />
            <Button type="submit" className="w-full" disabled={createMutation.isPending || !selectedVendor}>
              {createMutation.isPending ? "Creating..." : "Create Vendor Credit"}
            </Button>
          </form>
        </CreateDialog>
      </PageHeader>
      <DataToolbar searchPlaceholder="Search vendor credits..." onSearch={setSearch} />

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="p-12 text-center text-destructive">{(error as Error).message}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No vendor credits yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Credit #</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Vendor</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((vc: any) => (
                  <tr
                    key={vc.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/purchase/vendor-credits/${vc.id}`)}
                  >
                    <td className="px-5 py-3 font-medium text-primary">{vc.document_number}</td>
                    <td className="px-5 py-3 text-card-foreground">{vc.vendor_name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{vc.date}</td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">Rs{Number(vc.total).toLocaleString()}</td>
                    <td className="px-5 py-3"><StatusBadge status={vc.status} /></td>
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




