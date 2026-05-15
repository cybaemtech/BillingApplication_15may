import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineItemsForm, emptyLineItem } from "@/components/LineItemsForm";
import type { LineItem } from "@/components/LineItemsForm";
import { customersApi, creditNotesApi, deliveryChallansApi, salesReturnsApi, taxRatesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface SpecialConfig {
  title: string;
  listPath: string;
  detailPath: (id: string) => string;
  queryKey: string;
  create: (doc: any, items: any[]) => Promise<any>;
  update: (id: string, payload: any) => Promise<any>;
  get: (id: string) => Promise<any>;
}

const CONFIGS: Record<"delivery_challan" | "credit_note" | "sales_return", SpecialConfig> = {
  delivery_challan: {
    title: "Delivery Challan",
    listPath: "/sales/delivery-challans",
    detailPath: (id) => `/sales/delivery-challans/${id}`,
    queryKey: "delivery_challans",
    create: (doc, items) => deliveryChallansApi.create(doc, items),
    update: (id, payload) => deliveryChallansApi.update(id, payload),
    get: (id) => deliveryChallansApi.get(id),
  },
  credit_note: {
    title: "Credit Note",
    listPath: "/sales/credit-notes",
    detailPath: (id) => `/sales/credit-notes/${id}`,
    queryKey: "credit_notes",
    create: (doc, items) => creditNotesApi.create(doc, items),
    update: (id, payload) => creditNotesApi.update(id, payload),
    get: (id) => creditNotesApi.get(id),
  },
  sales_return: {
    title: "Sales Return",
    listPath: "/sales/returns",
    detailPath: (id) => `/sales/returns/${id}`,
    queryKey: "sales_returns",
    create: (doc, items) => salesReturnsApi.create({ ...doc, items }),
    update: (id, payload) => salesReturnsApi.update(id, payload),
    get: (id) => salesReturnsApi.get(id),
  },
};

interface SpecialDocumentEditorPageProps {
  docType: keyof typeof CONFIGS;
}

export default function SpecialDocumentEditorPage({ docType }: SpecialDocumentEditorPageProps) {
  const config = CONFIGS[docType];
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [customerId, setCustomerId] = useState("");
  const [docDate, setDocDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem()]);
  const [loaded, setLoaded] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });
  const { data: taxRates = [] } = useQuery({ queryKey: ["tax_rates"], queryFn: taxRatesApi.list });
  const { data: existingDoc } = useQuery({
    queryKey: [docType, id],
    queryFn: () => config.get(id!),
    enabled: isEditMode && !!id,
  });

  useEffect(() => {
    setLoaded(false);
  }, [docType, id]);

  useEffect(() => {
    if (!existingDoc || loaded) return;

    const taxRateList = Array.isArray(taxRates) ? (taxRates as any[]) : [];

    setCustomerId(existingDoc.customer_id || "");
    setDocDate(existingDoc.date || new Date().toISOString().split("T")[0]);
    setReason(existingDoc.reason || "");
    setNotes(existingDoc.notes || "");
    const mappedItems = (existingDoc.items || []).map((item: any) => {
      const matchedTaxRate = item.tax_rate_id
        ? taxRateList.find((rate: any) => rate.id === item.tax_rate_id)
        : undefined;
      const amount = Number(item.amount ?? item.total ?? 0);
      const taxAmount = Number(item.tax_amount || 0);

      return {
        item_id: item.item_id || "",
        quantity: Number(item.quantity || 1),
        rate: Number(item.rate || 0),
        tax_rate_id: item.tax_rate_id || "",
        tax_rate: Number((item.tax_rate ?? matchedTaxRate?.rate) || 0),
        tax_amount: taxAmount,
        amount: docType === "sales_return" && amount > 0 && taxAmount > 0 ? Math.max(0, amount - taxAmount) : amount,
        description: item.item_name || item.description || "",
      } satisfies LineItem;
    }) as LineItem[];

    setLineItems(mappedItems.length > 0 ? mappedItems : [emptyLineItem()]);
    setLoaded(true);
  }, [docType, existingDoc, loaded, taxRates]);

  const validItems = lineItems.filter((lineItem) => lineItem.item_id);
  const selectableCustomers = customers.filter(
    (customer: any) => customer?.is_active !== false || customer?.id === customerId,
  );
  const normalizedCustomerSearch = customerSearch.trim().toLowerCase();
  const filteredCustomers = selectableCustomers.filter((customer: any) =>
    !normalizedCustomerSearch || (customer?.name || "").toLowerCase().includes(normalizedCustomerSearch),
  );
  const subtotal = validItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const taxAmount = validItems.reduce((sum, item) => sum + Number(item.tax_amount || 0), 0);
  const total = subtotal + taxAmount;
  const addCustomer = () => {
    navigate("/sales/customers?new=1");
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payloadItems = validItems.map((item) => ({
        ...item,
        total: Number(item.amount || 0) + Number(item.tax_amount || 0),
      }));

      const payload: any = {
        customer_id: customerId,
        date: docDate,
        subtotal,
        tax_amount: taxAmount,
        total,
        items: payloadItems,
      };

      if (docType !== "delivery_challan") {
        payload.reason = reason;
      }

      if (docType === "delivery_challan" || docType === "sales_return") {
        payload.notes = notes;
      }

      if (docType === "sales_return") {
        payload.status = existingDoc?.status || "received";
      }

      if (docType === "credit_note") {
        payload.status = existingDoc?.status || "draft";
      }

      return isEditMode ? config.update(id!, payload) : config.create(payload, payloadItems);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
      if (isEditMode) {
        queryClient.invalidateQueries({ queryKey: [docType, id] });
      }
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast({ title: `${config.title} ${isEditMode ? "updated" : "created"}` });
      navigate(config.detailPath(isEditMode ? id! : data.id));
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(isEditMode ? config.detailPath(id!) : config.listPath)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !customerId || validItems.length === 0}>
          <Save className="w-4 h-4 mr-1" /> {saveMutation.isPending ? "Saving..." : isEditMode ? `Update ${config.title}` : `Create ${config.title}`}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div>
            <h1 className="text-lg font-semibold">{isEditMode ? `Edit ${config.title}` : `New ${config.title}`}</h1>
            <p className="text-sm text-muted-foreground">Manage document details and line items.</p>
          </div>

          <div className="space-y-2">
            <Label>Customer *</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
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
                      onClick={addCustomer}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-2 h-8 w-full justify-start text-xs"
                    onClick={addCustomer}
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Add Customer
                  </Button>
                </div>
                {filteredCustomers.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={docDate} onChange={(event) => setDocDate(event.target.value)} />
          </div>

          {docType !== "delivery_challan" && (
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason" />
            </div>
          )}

          {(docType === "delivery_challan" || docType === "sales_return") && (
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Notes" />
            </div>
          )}

          <div className="border-t border-border pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>Rs{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>Rs{taxAmount.toLocaleString()}</span></div>
            <div className="flex justify-between font-semibold border-t border-border pt-2"><span>Total</span><span>Rs{total.toLocaleString()}</span></div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <LineItemsForm lineItems={lineItems} setLineItems={setLineItems} showTax={true} />
        </div>
      </div>
    </div>
  );
}









