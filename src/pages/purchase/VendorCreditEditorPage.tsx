import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineItemsForm, emptyLineItem } from "@/components/LineItemsForm";
import type { LineItem } from "@/components/LineItemsForm";
import { taxRatesApi, vendorCreditsApi, vendorsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function VendorCreditEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [vendorId, setVendorId] = useState("");
  const [docDate, setDocDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem()]);
  const [loaded, setLoaded] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");

  const { data: vendors = [] } = useQuery({ queryKey: ["vendors"], queryFn: vendorsApi.list });
  const { data: taxRates = [] } = useQuery({ queryKey: ["tax_rates"], queryFn: taxRatesApi.list });
  const { data: existingDoc } = useQuery({
    queryKey: ["vendor_credit", id],
    queryFn: () => vendorCreditsApi.get(id!),
    enabled: !!id,
  });

  useEffect(() => {
    setLoaded(false);
  }, [id]);

  useEffect(() => {
    if (!existingDoc || loaded) return;

    const taxRateList = Array.isArray(taxRates) ? (taxRates as any[]) : [];

    setVendorId(existingDoc.vendor_id || "");
    setDocDate(existingDoc.date || new Date().toISOString().split("T")[0]);
    setReason(existingDoc.reason || "");

    const mappedItems = (existingDoc.items || []).map((item: any) => {
      const matchedTaxRate = item.tax_rate_id
        ? taxRateList.find((rate: any) => rate.id === item.tax_rate_id)
        : undefined;

      return {
        item_id: item.item_id || "",
        quantity: Number(item.quantity || 1),
        rate: Number(item.rate || 0),
        tax_rate_id: item.tax_rate_id || "",
        tax_rate: Number((item.tax_rate ?? matchedTaxRate?.rate) || 0),
        tax_amount: Number(item.tax_amount || 0),
        amount: Number(item.amount || 0),
        description: item.item_name || item.description || "",
      } satisfies LineItem;
    }) as LineItem[];

    setLineItems(mappedItems.length > 0 ? mappedItems : [emptyLineItem()]);
    setLoaded(true);
  }, [existingDoc, loaded, taxRates]);

  const validItems = lineItems.filter((lineItem) => lineItem.item_id);
  const selectableVendors = vendors.filter(
    (vendor: any) => vendor?.is_active !== false || vendor?.id === vendorId,
  );
  const normalizedVendorSearch = vendorSearch.trim().toLowerCase();
  const filteredVendors = selectableVendors.filter((vendor: any) =>
    !normalizedVendorSearch || (vendor?.name || "").toLowerCase().includes(normalizedVendorSearch),
  );
  const subtotal = validItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const taxAmount = validItems.reduce((sum, item) => sum + Number(item.tax_amount || 0), 0);
  const total = subtotal + taxAmount;

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        vendor_id: vendorId,
        date: docDate,
        reason,
        status: existingDoc?.status || "draft",
        subtotal,
        tax_amount: taxAmount,
        total,
        items: validItems,
      };

      return vendorCreditsApi.update(id!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor_credits"] });
      queryClient.invalidateQueries({ queryKey: ["vendor_credit", id] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast({ title: "Vendor credit updated" });
      navigate(`/purchase/vendor-credits/${id}`);
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/purchase/vendor-credits/${id}`)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !vendorId || validItems.length === 0}>
          <Save className="w-4 h-4 mr-1" /> {saveMutation.isPending ? "Saving..." : "Update Vendor Credit"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div>
            <h1 className="text-lg font-semibold">Edit Vendor Credit</h1>
            <p className="text-sm text-muted-foreground">Manage vendor credit details and line items.</p>
          </div>

          <div className="space-y-2">
            <Label>Vendor *</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
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
                {filteredVendors.map((vendor: any) => (
                  <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={docDate} onChange={(event) => setDocDate(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason" />
          </div>

          <div className="border-t border-border pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>Rs{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>Rs{taxAmount.toLocaleString()}</span></div>
            <div className="flex justify-between font-semibold border-t border-border pt-2"><span>Total</span><span>Rs{total.toLocaleString()}</span></div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <LineItemsForm lineItems={lineItems} setLineItems={setLineItems} rateField="purchase_rate" showTax={true} />
        </div>
      </div>
    </div>
  );
}
