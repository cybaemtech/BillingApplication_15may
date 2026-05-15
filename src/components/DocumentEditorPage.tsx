import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineItemsForm, emptyLineItem } from "@/components/LineItemsForm";
import type { LineItem } from "@/components/LineItemsForm";
import { generatePdfHtml, printDocument, shareWhatsApp, TEMPLATES, type PdfDocumentData } from "@/lib/pdf";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Printer, FileText, Send, MessageCircle, Eye, EyeOff, Pencil, Plus } from "lucide-react";

interface DocumentEditorConfig {
  type: "invoice" | "quotation" | "sales_order" | "purchase_order" | "bill";
  title: string;
  partyLabel: string;
  partyType: "customer" | "vendor";
  rateField: "selling_rate" | "purchase_rate";
  listPath: string;
  detailPath: (id: string) => string;
  defaultStatus: string;
  editStatus?: string;
}

const CONFIGS: Record<string, DocumentEditorConfig> = {
  invoice: {
    type: "invoice", title: "Invoice", partyLabel: "Customer", partyType: "customer",
    rateField: "selling_rate", listPath: "/sales/invoices",
    detailPath: (id) => `/sales/invoices/${id}`, defaultStatus: "sent",
  },
  quotation: {
    type: "quotation", title: "Quotation", partyLabel: "Customer", partyType: "customer",
    rateField: "selling_rate", listPath: "/sales/quotations",
    detailPath: (id) => `/sales/quotations/${id}`, defaultStatus: "draft",
  },
  sales_order: {
    type: "sales_order", title: "Sales Order", partyLabel: "Customer", partyType: "customer",
    rateField: "selling_rate", listPath: "/sales/orders",
    detailPath: (id) => `/sales/orders/${id}`, defaultStatus: "confirmed",
  },
  purchase_order: {
    type: "purchase_order", title: "Purchase Order", partyLabel: "Vendor", partyType: "vendor",
    rateField: "purchase_rate", listPath: "/purchase/orders",
    detailPath: (id) => `/purchase/orders/${id}`, defaultStatus: "draft",
  },
  bill: {
    type: "bill", title: "Bill", partyLabel: "Vendor", partyType: "vendor",
    rateField: "purchase_rate", listPath: "/purchase/bills",
    detailPath: (id) => `/purchase/bills/${id}`, defaultStatus: "sent",
  },
};

interface DocumentEditorPageProps {
  docType: keyof typeof CONFIGS;
}

export default function DocumentEditorPage({ docType }: DocumentEditorPageProps) {
  const config = CONFIGS[docType];
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Lazy-load APIs
  const [apis, setApis] = useState<any>(null);
  useEffect(() => {
    import("@/lib/api").then(mod => setApis(mod));
  }, []);

  const [partyId, setPartyId] = useState("");
  const [docDate, setDocDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem()]);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [isInterState, setIsInterState] = useState(false);
  const [docNumber, setDocNumber] = useState(`${config.title.toUpperCase()}-DRAFT`);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");

  useEffect(() => {
    setInitialLoaded(false);
  }, [docType, id]);

  // Queries
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"], queryFn: () => apis?.customersApi.list(),
    enabled: config.partyType === "customer" && !!apis,
  });
  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors"], queryFn: () => apis?.vendorsApi.list(),
    enabled: config.partyType === "vendor" && !!apis,
  });
  const { data: company } = useQuery({ queryKey: ["company"], queryFn: () => apis?.companyApi.get(), enabled: !!apis });
  const { data: gstSettings } = useQuery({ queryKey: ["gst_settings"], queryFn: () => apis?.gstSettingsApi.get(), enabled: !!apis });
  const { data: taxRates = [] } = useQuery({ queryKey: ["tax_rates"], queryFn: () => apis?.taxRatesApi.list(), enabled: !!apis });

  const parties = (config.partyType === "customer" ? customers : vendors).filter(
    (party: any) => party?.is_active !== false || party?.id === partyId,
  );
  const partySearch = config.partyType === "customer" ? customerSearch : vendorSearch;
  const normalizedPartySearch = partySearch.trim().toLowerCase();
  const filteredParties = parties.filter((party: any) =>
    !normalizedPartySearch || (party?.name || "").toLowerCase().includes(normalizedPartySearch),
  );
  const addParty = () => {
    navigate(config.partyType === "customer" ? "/sales/customers?new=1" : "/purchase/vendors?new=1");
  };
  const selectedParty = parties.find((p: any) => p.id === partyId);

  // Load existing document
  const getDocApi = () => {
    if (!apis) return null;
    switch (docType) {
      case "invoice": return apis.invoicesApi;
      case "quotation": return apis.quotationsApi;
      case "sales_order": return apis.salesOrdersApi;
      case "purchase_order": return apis.purchaseOrdersApi;
      case "bill": return apis.billsApi;
    }
  };

  const getItemsKey = () => {
    switch (docType) {
      case "invoice": return "invoice_items";
      case "quotation": return "quotation_items";
      case "sales_order": return "sales_order_items";
      case "purchase_order": return "purchase_order_items";
      case "bill": return "bill_items";
    }
  };

  const getPartyIdKey = () => config.partyType === "customer" ? "customer_id" : "vendor_id";

  const { data: existingDoc } = useQuery({
    queryKey: [docType, id],
    queryFn: () => getDocApi()?.get(id!),
    enabled: isEditMode && !!apis,
  });

  // Populate form for edit mode
  useEffect(() => {
    if (!existingDoc || initialLoaded) return;

    setPartyId(existingDoc[getPartyIdKey()] || "");
    setDocDate(existingDoc.date || new Date().toISOString().split("T")[0]);
    setDueDate(existingDoc.due_date || "");
    setNotes(existingDoc.notes || "");
    setTerms(existingDoc.terms || "");
    setDocNumber(existingDoc.document_number || `${config.title.toUpperCase()}-DRAFT`);

    const taxRateList = Array.isArray(taxRates) ? (taxRates as any[]) : [];
    const itemsKey = getItemsKey();
    const sourceItems = existingDoc.items || existingDoc[itemsKey] || [];
    const existingItems: LineItem[] = sourceItems.map((li: any) => {
      const matchedTaxRate = li.tax_rate_id
        ? taxRateList.find((t: any) => t.id === li.tax_rate_id)
        : undefined;

      return {
        item_id: li.item_id || "",
        quantity: Number(li.quantity || 0),
        rate: Number(li.rate || 0),
        tax_rate_id: li.tax_rate_id || "",
        tax_rate: Number(matchedTaxRate?.rate || 0),
        tax_amount: Number(li.tax_amount || 0),
        amount: Number(li.amount || 0),
        description: li.item_name || li.items?.name || li.description || "",
      };
    });

    setLineItems(existingItems.length > 0 ? existingItems : [emptyLineItem()]);
    setInitialLoaded(true);
  }, [config.title, existingDoc, initialLoaded, taxRates]);

  // Inter-state detection
  useEffect(() => {
    if (selectedParty?.state && (company?.state || gstSettings?.state)) {
      const companyState = company?.state || gstSettings?.state || "";
      setIsInterState(selectedParty.state.toLowerCase() !== companyState.toLowerCase());
    } else {
      setIsInterState(false);
    }
  }, [partyId, selectedParty, company, gstSettings]);

  const validItems = lineItems.filter(li => li.item_id);
  const subtotal = validItems.reduce((s, li) => s + li.amount, 0);
  const taxTotal = validItems.reduce((s, li) => s + li.tax_amount, 0);
  const grandTotal = subtotal + taxTotal;

  const pdfData: PdfDocumentData = useMemo(() => ({
    type: config.title,
    documentNumber: docNumber,
    date: docDate,
    dueDate: dueDate || undefined,
    partyName: selectedParty?.name || "—",
    partyGstin: selectedParty?.gstin,
    partyAddress: selectedParty?.billing_address || selectedParty?.address,
    partyState: selectedParty?.state,
    items: validItems.map(li => ({
      name: li.description || "Item",
      description: li.description || undefined,
      hsn: "",
      quantity: li.quantity, rate: li.rate, amount: li.amount, taxAmount: li.tax_amount,
    })),
    subtotal, taxAmount: taxTotal, total: grandTotal, notes, terms,
  }), [docNumber, docDate, dueDate, selectedParty, validItems, subtotal, taxTotal, grandTotal, notes, terms]);

  useEffect(() => {
    if (!showPreview) return;
    const timer = setTimeout(async () => {
      try {
        const html = await generatePdfHtml(pdfData, selectedTemplate as any);
        setPreviewHtml(html);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [pdfData, selectedTemplate, showPreview]);

  // Create
  const createMutation = useMutation({
    mutationFn: ({ doc, items }: any) => {
      const api = getDocApi();
      return api.create(doc, items);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [docType + "s"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast({ title: `${config.title} created successfully` });
      navigate(config.detailPath(data.id));
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: ({ doc, items }: any) => {
      const api = getDocApi();
      if (api.updateWithItems) {
        return api.updateWithItems(id!, doc, items);
      }
      return api.update(id!, doc);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [docType, id] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast({ title: `${config.title} updated successfully` });
      navigate(config.detailPath(id!));
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = (status: string) => {
    if (!partyId) {
      toast({ title: `Please select a ${config.partyLabel.toLowerCase()}`, variant: "destructive" });
      return;
    }
    if (validItems.length === 0) {
      toast({ title: "Please add at least one item", variant: "destructive" });
      return;
    }

    const docData: any = {
      [getPartyIdKey()]: partyId,
      date: docDate,
      status,
      subtotal,
      tax_amount: taxTotal,
      total: grandTotal,
      notes, terms,
    };

    if (docType === "invoice" || docType === "bill") {
      docData.due_date = dueDate;
      docData.balance_due = grandTotal;
    }

    if (isEditMode) {
      updateMutation.mutate({ doc: docData, items: validItems });
    } else {
      createMutation.mutate({ doc: docData, items: validItems });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(isEditMode ? config.detailPath(id!) : config.listPath)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-lg font-bold font-display text-foreground">
            {isEditMode ? (
              <span className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-primary" /> Edit {docNumber}
              </span>
            ) : `Create ${config.title}`}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {showPreview ? "Hide Preview" : "Preview"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleSave("draft")} disabled={isSaving}>
            <Save className="w-4 h-4 mr-1" /> Save Draft
          </Button>
          <Button size="sm" onClick={() => handleSave(isEditMode ? (existingDoc?.status || config.defaultStatus) : config.defaultStatus)} disabled={isSaving}>
            <Send className="w-4 h-4 mr-1" /> {isSaving ? "Saving..." : isEditMode ? `Update ${config.title}` : `Save ${config.title}`}
          </Button>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className={`flex-1 grid ${showPreview ? "grid-cols-1 lg:grid-cols-[320px_1fr_380px]" : "grid-cols-1 lg:grid-cols-[320px_1fr]"} gap-0 overflow-hidden`}>
        {/* LEFT */}
        <div className="bg-card border-r border-border overflow-y-auto p-5 space-y-5">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{config.title} Details</h2>

          {isEditMode && (
            <div className="bg-primary/10 rounded-lg p-3 text-xs text-primary font-medium">
              Editing: {docNumber}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{config.partyLabel} *</Label>
            <Select value={partyId} onValueChange={setPartyId}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={`Select ${config.partyLabel.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                <div className="sticky top-0 z-10 border-b border-border bg-popover p-2">
                  <div className="relative">
                    <Input
                      className="h-8 pr-8 text-xs"
                      placeholder={`Search ${config.partyLabel.toLowerCase()}`}
                      value={partySearch}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (config.partyType === "customer") {
                          setCustomerSearch(value);
                        } else {
                          setVendorSearch(value);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-6 w-6"
                      onClick={addParty}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-2 h-8 w-full justify-start text-xs"
                    onClick={addParty}
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Add {config.partyLabel}
                  </Button>
                </div>
                {filteredParties.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedParty && (
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-0.5">
              {(selectedParty.billing_address || selectedParty.address) && <p>{selectedParty.billing_address || selectedParty.address}</p>}
              {selectedParty.gstin && <p>GSTIN: {selectedParty.gstin}</p>}
              {selectedParty.state && <p>State: {selectedParty.state}</p>}
              {isInterState && <p className="text-primary font-medium mt-1">↔ Inter-state (IGST)</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input type="date" className="h-9 text-sm" value={docDate} onChange={e => setDocDate(e.target.value)} />
            </div>
            {(docType === "invoice" || docType === "bill") && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Due Date</Label>
                <Input type="date" className="h-9 text-sm" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notes</Label>
            <Textarea className="text-sm resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes..." />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Terms & Conditions</Label>
            <Textarea className="text-sm resize-none" rows={2} value={terms} onChange={e => setTerms(e.target.value)} placeholder="Terms..." />
          </div>

          {/* Summary */}
          <div className="border-t border-border pt-4 space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
              {taxTotal > 0 && (
                isInterState ? (
                  <div className="flex justify-between text-muted-foreground"><span>IGST</span><span>₹{taxTotal.toLocaleString()}</span></div>
                ) : (
                  <>
                    <div className="flex justify-between text-muted-foreground"><span>CGST</span><span>₹{(taxTotal / 2).toLocaleString()}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>SGST</span><span>₹{(taxTotal / 2).toLocaleString()}</span></div>
                  </>
                )
              )}
              <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border">
                <span>Grand Total</span><span className="text-primary">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER */}
        <div className="overflow-y-auto p-5 bg-background">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Line Items</h2>
            <span className="text-xs text-muted-foreground">{validItems.length} item(s)</span>
          </div>
          <LineItemsForm
            lineItems={lineItems}
            setLineItems={setLineItems}
            rateField={config.rateField}
            showTax={true}
            isInterState={isInterState}
            hideOutOfStockItems={config.partyType === "customer"}
          />
        </div>

        {/* RIGHT */}
        {showPreview && (
          <div className="bg-muted/30 border-l border-border overflow-y-auto p-4 hidden lg:flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Live Preview</h2>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="h-7 text-xs w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>{TEMPLATES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex gap-1 mb-3">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => printDocument(pdfData, selectedTemplate as any)}>
                <Printer className="w-3 h-3 mr-1" /> Print
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { const w = window.open("", "_blank"); if (w) { w.document.write(previewHtml); w.document.close(); } }}>
                <FileText className="w-3 h-3 mr-1" /> PDF
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => shareWhatsApp({ documentNumber: docNumber, type: config.title, total: grandTotal, partyName: selectedParty?.name || "" })}>
                <MessageCircle className="w-3 h-3 mr-1" /> WhatsApp
              </Button>
            </div>
            <div className="flex-1 bg-card rounded-lg border border-border shadow-sm overflow-hidden">
              <iframe
                srcDoc={previewHtml || "<html><body style='display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#94a3b8'><p>Add items to see preview</p></body></html>"}
                className="w-full h-full min-h-[600px]" title="Preview"
                style={{ transform: "scale(0.75)", transformOrigin: "top left", width: "133%", height: "133%" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}








