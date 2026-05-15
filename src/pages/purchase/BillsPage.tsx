import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, DataToolbar } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, Eye } from "lucide-react";
import { CreateDialog } from "@/components/CreateDialog";
import { billsApi, vendorsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineItemsForm, emptyLineItem } from "@/components/LineItemsForm";
import type { LineItem } from "@/components/LineItemsForm";
import { AppPagination } from "@/components/AppPagination";
import { emptyPaginatedResponse } from "@/lib/pagination";

export default function BillsPage() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem()]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: response = emptyPaginatedResponse<any>(), isLoading } = useQuery({
    queryKey: ["bills", page],
    queryFn: () => billsApi.listPage(page),
  });
  const bills = response.data;
  const { data: vendors = [] } = useQuery({ queryKey: ["vendors"], queryFn: vendorsApi.list });

  const createMutation = useMutation({
    mutationFn: ({ bill, items }: any) => billsApi.create(bill, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setOpen(false); setLineItems([emptyLineItem()]); setSelectedVendor("");
      toast({ title: "Bill created successfully" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: billsApi.delete,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bills"] }); toast({ title: "Deleted" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = lineItems.filter(li => li.item_id);
    const subtotal = validItems.reduce((s, li) => s + li.amount, 0);
    const taxTotal = validItems.reduce((s, li) => s + li.tax_amount, 0);
    createMutation.mutate({
      bill: { vendor_id: selectedVendor, subtotal, tax_amount: taxTotal, total: subtotal + taxTotal, status: "sent" },
      items: validItems,
    });
  };

  const filtered = bills.filter((b: any) =>
    b.document_number?.toLowerCase().includes(search.toLowerCase()) ||
    b.vendor_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Bills" subtitle="Record purchase bills">
        <Button onClick={() => navigate("/purchase/bills/new")}>
          + New Bill
        </Button>
      </PageHeader>
      <DataToolbar searchPlaceholder="Search bills..." onSearch={setSearch} />

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No bills yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Bill #</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Vendor</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Total</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Balance</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b: any) => (
                  <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/purchase/bills/${b.id}`)}>
                    <td className="px-5 py-3 font-medium text-primary">{b.document_number}</td>
                    <td className="px-5 py-3 text-card-foreground">{b.vendor_name || "-"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{b.date}</td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">₹{Number(b.total).toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">₹{Number(b.balance_due).toLocaleString()}</td>
                    <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/purchase/bills/${b.id}`)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(b.id); }}>
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

