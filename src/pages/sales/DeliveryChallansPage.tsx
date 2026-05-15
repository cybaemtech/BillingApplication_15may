import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, DataToolbar } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreateDialog } from "@/components/CreateDialog";
import { deliveryChallansApi, customersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineItemsForm, emptyLineItem } from "@/components/LineItemsForm";
import type { LineItem } from "@/components/LineItemsForm";
import { AppPagination } from "@/components/AppPagination";
import { emptyPaginatedResponse } from "@/lib/pagination";
import { Plus } from "lucide-react";

export default function DeliveryChallansPage() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem()]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: response = emptyPaginatedResponse<any>(), isLoading } = useQuery({
    queryKey: ["delivery_challans", page],
    queryFn: () => deliveryChallansApi.listPage(page),
  });
  const challans = response.data;
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });
  const selectableCustomers = customers.filter((customer: any) => customer?.is_active !== false || customer?.id === selectedCustomer);
  const normalizedCustomerSearch = customerSearch.trim().toLowerCase();
  const filteredCustomers = selectableCustomers.filter((customer: any) =>
    !normalizedCustomerSearch || (customer?.name || "").toLowerCase().includes(normalizedCustomerSearch),
  );

  const createMutation = useMutation({
    mutationFn: ({ dc, items }: any) => deliveryChallansApi.create(dc, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery_challans"] });
      setOpen(false);
      setLineItems([emptyLineItem()]);
      setSelectedCustomer("");
      toast({ title: "Delivery challan created" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = lineItems.filter(li => li.item_id);
    createMutation.mutate({
      dc: {
        customer_id: selectedCustomer,
        date: new Date().toISOString().split("T")[0]
      },
      items: validItems,
    });
  };

  const filtered = challans.filter((d: any) =>
    d.document_number?.toLowerCase().includes(search.toLowerCase()) ||
    d.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Delivery Challans" subtitle="Manage delivery documents">
        <CreateDialog title="New Delivery Challan" buttonLabel="New Challan" open={open} onOpenChange={setOpen}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  <div className="sticky top-0 z-10 border-b border-border bg-popover p-2">
                    <div className="relative">
                      <Input
                        className="h-8 pr-8 text-xs"
                        placeholder="Search customer"
                        value={customerSearch}
                        onChange={(event) => setCustomerSearch(event.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-6 w-6"
                        onClick={() => navigate("/sales/customers?new=1")}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-2 h-8 w-full justify-start text-xs"
                      onClick={() => navigate("/sales/customers?new=1")}
                    >
                      <Plus className="mr-2 h-3.5 w-3.5" />
                      Add Customer
                    </Button>
                  </div>
                  {filteredCustomers.map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <LineItemsForm lineItems={lineItems} setLineItems={setLineItems} showTax={true} hideOutOfStockItems={true} />
            <Button type="submit" className="w-full" disabled={createMutation.isPending || !selectedCustomer}>
              {createMutation.isPending ? "Creating..." : "Create Delivery Challan"}
            </Button>
          </form>
        </CreateDialog>
      </PageHeader>
      <DataToolbar searchPlaceholder="Search delivery challans..." onSearch={setSearch} />

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No delivery challans yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Challan #</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d: any) => (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/sales/delivery-challans/${d.id}`)}>
                    <td className="px-5 py-3 font-medium text-primary">{d.document_number}</td>
                    <td className="px-5 py-3 text-card-foreground">{d.customer_name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{d.date}</td>
                    <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
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




