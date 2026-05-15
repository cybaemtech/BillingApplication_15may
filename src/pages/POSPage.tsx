import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Grid3X3, Barcode, ShoppingCart, Minus, Plus, Trash2, CreditCard, Banknote } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { itemsApi, posOrdersApi, posSessionsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  gst: number;
  hsn: string;
}

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({ queryKey: ["items"], queryFn: itemsApi.list });
  const { data: sessions = [] } = useQuery({ queryKey: ["pos_sessions"], queryFn: posSessionsApi.list });
  const activeSession = sessions.find((session: any) => session.status === "open");

  const filtered = products.filter((p: any) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.hsn_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === product.id);
      if (existing) {
        return prev.map((c) => (c.id === product.id ? { ...c, qty: c.qty + 1 } : c));
      }
      const taxRate = product.tax_rates?.rate || 18;
      return [...prev, { id: product.id, name: product.name, price: Number(product.selling_rate), qty: 1, gst: taxRate, hsn: product.hsn_code || "" }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c)));
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const gstTotal = cart.reduce((sum, c) => sum + (c.price * c.qty * c.gst) / 100, 0);
  const total = subtotal + gstTotal;

  const handleCheckout = async (mode: "cash" | "upi") => {
    if (cart.length === 0) return;
    setProcessing(true);
    try {
      const items = cart.map((c) => ({
        item_id: c.id,
        item_name: c.name,
        quantity: c.qty,
        rate: c.price,
        discount: 0,
        amount: c.price * c.qty,
        tax_amount: (c.price * c.qty * c.gst) / 100,
      }));

      await posOrdersApi.create({
        session_id: activeSession?.id || null,
        customer_id: null,
        subtotal,
        tax_amount: gstTotal,
        discount: 0,
        total,
        items,
        payments: [
          {
            payment_mode: mode,
            amount: total,
            reference_number: null,
          },
        ],
      });

      await queryClient.invalidateQueries({ queryKey: ["pos_orders"] });
      await queryClient.invalidateQueries({ queryKey: ["pos_sessions"] });
      await queryClient.invalidateQueries({ queryKey: ["items"] });

      const sessionSuffix = activeSession ? " in active session" : "";
      toast({ title: "Sale completed", description: `Rs ${total.toLocaleString()} via ${mode.toUpperCase()}${sessionSuffix}` });
      setCart([]);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-0 -m-4 lg:-m-6 min-h-[calc(100vh-3.5rem)]">
      <div className="flex-1 p-5 lg:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight font-display">Point of Sale</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Scan or search products to add to cart</p>
            {!activeSession && <p className="text-xs text-warning mt-1">No open POS session. Sales will be saved without session linkage.</p>}
          </div>
        </div>
        <div className="relative mb-4">
          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Scan barcode or search product..."
            className="pl-9 h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {products.length === 0 ? "No items in inventory. Add items first." : "No matching products."}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p: any) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="bg-card border border-border rounded-lg p-4 text-left hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-3">
                  <Grid3X3 className="w-5 h-5 text-accent-foreground" />
                </div>
                <p className="text-sm font-medium text-card-foreground truncate">{p.name}</p>
                <p className="text-lg font-bold text-primary mt-1">Rs {Number(p.selling_rate).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {p.hsn_code ? `HSN: ${p.hsn_code} · ` : ""}Stock: {p.current_stock}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full lg:w-96 bg-card border-l border-border flex flex-col">
        <div className="p-5 border-b border-border">
          <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Cart ({cart.length} items)
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Rs {item.price.toLocaleString()} x {item.qty}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                    <Plus className="w-3 h-3" />
                  </button>
                  <button onClick={() => removeItem(item.id)} className="w-6 h-6 rounded flex items-center justify-center text-destructive ml-1">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border p-5 space-y-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>Rs {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST</span>
              <span>Rs {gstTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-card-foreground pt-2 border-t border-border">
              <span>Total</span>
              <span>Rs {total.toLocaleString()}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-10" disabled={cart.length === 0 || processing} onClick={() => handleCheckout("cash")}>
              <Banknote className="w-4 h-4 mr-1.5" /> Cash
            </Button>
            <Button className="h-10" disabled={cart.length === 0 || processing} onClick={() => handleCheckout("upi")}>
              <CreditCard className="w-4 h-4 mr-1.5" /> UPI
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
