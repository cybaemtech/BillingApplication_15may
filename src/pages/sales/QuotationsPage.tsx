import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, DataToolbar } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, ArrowRightLeft, Eye } from "lucide-react";
import { CreateDialog } from "@/components/CreateDialog";
import { quotationsApi, customersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineItemsForm, emptyLineItem } from "@/components/LineItemsForm";
import type { LineItem } from "@/components/LineItemsForm";
import { AppPagination } from "@/components/AppPagination";
import { emptyPaginatedResponse } from "@/lib/pagination";

export default function QuotationsPage() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem()]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: response = emptyPaginatedResponse<any>(), isLoading } = useQuery({
    queryKey: ["quotations", page],
    queryFn: () => quotationsApi.listPage(page),
  });
  const quotations = response.data;
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });

  const createMutation = useMutation({
    mutationFn: ({ quote, items }: any) => quotationsApi.create(quote, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      setOpen(false); setLineItems([emptyLineItem()]); setSelectedCustomer("");
      toast({ title: "Quotation created successfully" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: quotationsApi.delete,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["quotations"] }); toast({ title: "Quotation deleted" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const convertToSOMutation = useMutation({
    mutationFn: quotationsApi.convertToSalesOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["sales_orders"] });
      toast({ title: "Converted to Sales Order" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = lineItems.filter(li => li.item_id);
    const subtotal = validItems.reduce((s, li) => s + li.amount, 0);
    const taxTotal = validItems.reduce((s, li) => s + li.tax_amount, 0);
    createMutation.mutate({
      quote: { customer_id: selectedCustomer, subtotal, tax_amount: taxTotal, total: subtotal + taxTotal },
      items: validItems,
    });
  };

  const filtered = quotations.filter((q: any) =>
    q.document_number?.toLowerCase().includes(search.toLowerCase()) ||
    q.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Quotations" subtitle="Create and manage sales quotations">
        <Button onClick={() => navigate("/sales/quotations/new")}>
          + New Quotation
        </Button>
      </PageHeader>
      <DataToolbar searchPlaceholder="Search quotations..." onSearch={setSearch} />

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No quotations yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Quote #</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q: any) => (
                  <tr key={q.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/sales/quotations/${q.id}`)}>
                    <td className="px-5 py-3 font-medium text-primary">{q.document_number}</td>
                    <td className="px-5 py-3 text-card-foreground">{q.customer_name || "-"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{q.date}</td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">₹{Number(q.total).toLocaleString()}</td>
                    <td className="px-5 py-3"><StatusBadge status={q.status} /></td>
                    <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/sales/quotations/${q.id}`)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {q.status !== "converted" && q.status !== "cancelled" && (
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => convertToSOMutation.mutate(q.id)}>
                            → SO
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(q.id); }}>
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

