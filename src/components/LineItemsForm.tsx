import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { itemsApi, taxRatesApi } from "@/lib/api";

export interface LineItem {
  item_id: string;
  quantity: number;
  rate: number;
  tax_rate_id: string;
  tax_rate: number;
  tax_amount: number;
  amount: number;
  description: string;
}

interface LineItemsFormProps {
  lineItems: LineItem[];
  setLineItems: React.Dispatch<React.SetStateAction<LineItem[]>>;
  rateField?: "selling_rate" | "purchase_rate";
  showTax?: boolean;
  isInterState?: boolean;
  hideOutOfStockItems?: boolean;
}

export const emptyLineItem = (): LineItem => ({
  item_id: "",
  quantity: 1,
  rate: 0,
  tax_rate_id: "",
  tax_rate: 0,
  tax_amount: 0,
  amount: 0,
  description: "",
});

export function LineItemsForm({
  lineItems,
  setLineItems,
  rateField = "selling_rate",
  showTax = true,
  isInterState = false,
  hideOutOfStockItems = false,
}: LineItemsFormProps) {
  const navigate = useNavigate();
  const { data: items = [] } = useQuery({ queryKey: ["items"], queryFn: itemsApi.list });
  const { data: taxRates = [] } = useQuery({ queryKey: ["tax_rates"], queryFn: taxRatesApi.list });
  const [itemSearch, setItemSearch] = useState("");

  const activeTaxRates = (taxRates as any[]).filter((t: any) => t.is_active !== false);
  const defaultTaxRate = activeTaxRates.find((t: any) => t.is_default);
  const selectedItemIds = new Set(lineItems.map((item) => item.item_id).filter(Boolean));
  const selectableItems = (items as any[]).filter(
    (item: any) =>
      (item.is_active !== false || selectedItemIds.has(item.id)) &&
      (!hideOutOfStockItems || Number(item.current_stock || 0) > 0 || selectedItemIds.has(item.id)),
  );
  const normalizedItemSearch = itemSearch.trim().toLowerCase();
  const filteredItems = selectableItems.filter(
    (item: any) =>
      !normalizedItemSearch ||
      selectedItemIds.has(item.id) ||
      (item?.name || "").toLowerCase().includes(normalizedItemSearch),
  );
  const addItem = () => {
    navigate("/inventory/items?new=1");
  };

  const calcTax = (amount: number, rate: number) => (amount * rate) / 100;

  const updateLineItem = (index: number, field: string, value: any) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      if (field === "item_id") {
        const item = items.find((i: any) => i.id === value);
        if (item) {
          updated[index].rate = Number(item[rateField]);
          updated[index].description = item.name;
          updated[index].amount = updated[index].quantity * Number(item[rateField]);
          const itemTaxRate = item.tax_rate_id
            ? activeTaxRates.find((t: any) => t.id === item.tax_rate_id)
            : defaultTaxRate;
          if (itemTaxRate) {
            updated[index].tax_rate_id = itemTaxRate.id;
            updated[index].tax_rate = Number(itemTaxRate.rate);
          }
          updated[index].tax_amount = showTax ? calcTax(updated[index].amount, updated[index].tax_rate) : 0;
        }
      }

      if (field === "tax_rate_id") {
        const selectedTax = activeTaxRates.find((t: any) => t.id === value);
        if (selectedTax) {
          updated[index].tax_rate = Number(selectedTax.rate);
          updated[index].tax_amount = showTax ? calcTax(updated[index].amount, Number(selectedTax.rate)) : 0;
        }
      }

      if (field === "quantity" || field === "rate") {
        updated[index].amount = updated[index].quantity * updated[index].rate;
        updated[index].tax_amount = showTax ? calcTax(updated[index].amount, updated[index].tax_rate) : 0;
      }

      return updated;
    });
  };

  const subtotal = lineItems.reduce((s, li) => s + li.amount, 0);
  const taxTotal = lineItems.reduce((s, li) => s + li.tax_amount, 0);
  const cgstTotal = isInterState ? 0 : taxTotal / 2;
  const sgstTotal = isInterState ? 0 : taxTotal / 2;
  const igstTotal = isInterState ? taxTotal : 0;

  return (
    <div className="space-y-3">
      <Label>Line Items</Label>

      <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
        <div className="col-span-4">Item</div>
        <div className="col-span-1">Qty</div>
        <div className="col-span-2">Rate</div>
        <div className="col-span-2">GST</div>
        <div className="col-span-2 text-right">Amount</div>
        <div className="col-span-1"></div>
      </div>

      {lineItems.map((li, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-4">
            <Select value={li.item_id} onValueChange={(v) => updateLineItem(i, "item_id", v)}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select item" /></SelectTrigger>
              <SelectContent>
                <div className="sticky top-0 z-10 border-b border-border bg-popover p-2">
                  <div className="relative">
                    <Input
                      className="h-8 pr-8 text-xs"
                      placeholder="Search item"
                      value={itemSearch}
                      onChange={(event) => setItemSearch(event.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-6 w-6"
                      onClick={addItem}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-2 h-8 w-full justify-start text-xs"
                    onClick={addItem}
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Add Item
                  </Button>
                </div>
                {filteredItems.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No items found</div>
                )}
                {filteredItems.map((item: any) => (
                  <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1">
            <Input className="h-9 text-xs" type="number" value={li.quantity} onChange={(e) => updateLineItem(i, "quantity", Number(e.target.value))} min={1} />
          </div>
          <div className="col-span-2">
            <Input className="h-9 text-xs" type="number" value={li.rate} onChange={(e) => updateLineItem(i, "rate", Number(e.target.value))} step="0.01" />
          </div>
          <div className="col-span-2">
            <Select value={li.tax_rate_id} onValueChange={(v) => updateLineItem(i, "tax_rate_id", v)}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Tax" /></SelectTrigger>
              <SelectContent>
                {activeTaxRates.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 text-right">
            <p className="text-sm font-medium text-card-foreground">Rs{(li.amount + li.tax_amount).toLocaleString()}</p>
            {li.tax_amount > 0 && (
              <p className="text-[10px] text-muted-foreground">Tax: Rs{li.tax_amount.toLocaleString()}</p>
            )}
          </div>
          <div className="col-span-1 text-center">
            {lineItems.length > 1 && (
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setLineItems((prev) => prev.filter((_, idx) => idx !== i))}>
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={() => setLineItems((prev) => [...prev, emptyLineItem()])}>
        <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
      </Button>

      <div className="border-t border-border pt-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>Rs{subtotal.toLocaleString()}</span>
        </div>
        {showTax && taxTotal > 0 && (
          <>
            {isInterState ? (
              <div className="flex justify-between text-muted-foreground">
                <span>IGST</span>
                <span>Rs{igstTotal.toLocaleString()}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>CGST</span>
                  <span>Rs{cgstTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>SGST</span>
                  <span>Rs{sgstTotal.toLocaleString()}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-muted-foreground font-medium">
              <span>Total GST</span>
              <span>Rs{taxTotal.toLocaleString()}</span>
            </div>
          </>
        )}
        <div className="flex justify-between font-bold text-card-foreground pt-1 border-t border-border">
          <span>Grand Total</span>
          <span>Rs{(subtotal + taxTotal).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
