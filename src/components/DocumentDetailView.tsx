import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, Printer, Share2, Copy, Trash2, ArrowRightLeft, Mail, FileText, Pencil } from "lucide-react";
import { printDocument, shareWhatsApp, TEMPLATES, type PdfDocumentData } from "@/lib/pdf";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ReactNode } from "react";

function formatCurrency(amount: number) {
  return "₹" + amount.toLocaleString();
}

interface DocumentDetailViewProps {
  title: string;
  document: any;
  partyLabel: string;
  partyName: string;
  partyGstin?: string;
  partyAddress?: string;
  partyState?: string;
  items?: { name: string; description?: string; hsn?: string; quantity: number; rate: number; amount: number; taxAmount: number }[];
  subtotal: number;
  taxAmount: number;
  total: number;
  balanceDue?: number;
  backPath: string;
  status: string;
  onStatusChange?: (status: string) => void;
  statusOptions?: string[];
  onDelete?: () => void;
  onClone?: () => void;
  onEdit?: () => void;
  convertActions?: { label: string; onClick: () => void }[];
  isLoading?: boolean;
  onSendEmail?: () => void;
  hideItemDetailsInPrint?: boolean;
  headerActions?: ReactNode;
}

export function DocumentDetailView({
  title,
  document: doc,
  partyLabel,
  partyName,
  partyGstin,
  partyAddress,
  partyState,
  items,
  subtotal,
  taxAmount,
  total,
  balanceDue,
  backPath,
  status,
  onStatusChange,
  statusOptions,
  onDelete,
  onClone,
  onEdit,
  convertActions,
  isLoading,
  onSendEmail,
  hideItemDetailsInPrint,
  headerActions,
}: DocumentDetailViewProps) {
  const navigate = useNavigate();
  const hasItems = Array.isArray(items) && items.length > 0;

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground">Loading...</div>;
  }

  if (!doc) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground mb-4">Document not found</p>
        <Button variant="outline" onClick={() => navigate(backPath)}>Go Back</Button>
      </div>
    );
  }

  const pdfData: PdfDocumentData = {
    type: title,
    documentNumber: doc.document_number,
    date: doc.date,
    dueDate: doc.due_date,
    partyName,
    partyGstin,
    partyAddress,
    partyState,
    items: items || [],
    subtotal,
    taxAmount,
    total,
    balanceDue,
    notes: doc.notes,
    terms: doc.terms,
    status,
    hideItemDetails: hideItemDetailsInPrint,
  };

  const halfTax = taxAmount / 2;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(backPath)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-foreground">{doc.document_number}</h1>
          <StatusBadge status={status} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onEdit && (
            <Button size="sm" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          )}
          {onStatusChange && statusOptions && (
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>{statusOptions.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Printer className="w-3.5 h-3.5 mr-1" /> Print / PDF</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {TEMPLATES.map((t) => (
                <DropdownMenuItem key={t.id} onClick={() => printDocument(pdfData, t.id as any)}>
                  <FileText className="w-3.5 h-3.5 mr-2" />
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={() => shareWhatsApp({ documentNumber: doc.document_number, type: title, total, partyName })}>
            <Share2 className="w-3.5 h-3.5 mr-1" /> WhatsApp
          </Button>

          {onSendEmail && (
            <Button variant="outline" size="sm" onClick={onSendEmail}>
              <Mail className="w-3.5 h-3.5 mr-1" /> Email
            </Button>
          )}

          {onClone && (
            <Button variant="outline" size="sm" onClick={onClone}>
              <Copy className="w-3.5 h-3.5 mr-1" /> Clone
            </Button>
          )}
          {convertActions?.map((a) => (
            <Button key={a.label} variant="outline" size="sm" onClick={a.onClick}>
              <ArrowRightLeft className="w-3.5 h-3.5 mr-1" /> {a.label}
            </Button>
          ))}
          {headerActions}
          {onDelete && (
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { if (confirm("Delete this document?")) onDelete(); }}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-lg border border-border p-5">
            <h3 className="text-xs font-medium text-muted-foreground uppercase mb-2">{partyLabel}</h3>
            <p className="font-semibold text-card-foreground">{partyName}</p>
            {partyGstin && <p className="text-sm text-muted-foreground">GSTIN: {partyGstin}</p>}
            {partyAddress && <p className="text-sm text-muted-foreground">{partyAddress}</p>}
            {partyState && <p className="text-sm text-muted-foreground">{partyState}</p>}
          </div>

          {hasItems && (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">#</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Item</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground">Qty</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Rate</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Tax</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items!.map((item, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-card-foreground">{item.name}</p>
                        {item.description && item.description !== item.name && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                        {item.hsn && <p className="text-xs text-muted-foreground">HSN: {item.hsn}</p>}
                      </td>
                      <td className="px-5 py-3 text-center text-card-foreground">{item.quantity}</td>
                      <td className="px-5 py-3 text-right text-card-foreground">{formatCurrency(item.rate)}</td>
                      <td className="px-5 py-3 text-right text-muted-foreground">{formatCurrency(item.taxAmount)}</td>
                      <td className="px-5 py-3 text-right font-medium text-card-foreground">{formatCurrency(item.amount + item.taxAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-5 space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="text-card-foreground">{doc.date}</span></div>
              {doc.due_date && <div className="flex justify-between"><span className="text-muted-foreground">Due Date</span><span className="text-card-foreground">{doc.due_date}</span></div>}
            </div>
            <div className="border-t border-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-card-foreground">{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">CGST</span><span className="text-card-foreground">{formatCurrency(halfTax)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">SGST</span><span className="text-card-foreground">{formatCurrency(halfTax)}</span></div>
              <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                <span className="text-card-foreground">Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
              {balanceDue !== undefined && balanceDue > 0 && (
                <div className="flex justify-between text-destructive font-medium">
                  <span>Balance Due</span><span>{formatCurrency(balanceDue)}</span>
                </div>
              )}
            </div>
          </div>

          {(doc.notes || doc.terms) && (
            <div className="bg-card rounded-lg border border-border p-5 space-y-3">
              {doc.notes && (<div><h3 className="text-xs font-medium text-muted-foreground uppercase mb-1">Notes</h3><p className="text-sm text-card-foreground">{doc.notes}</p></div>)}
              {doc.terms && (<div><h3 className="text-xs font-medium text-muted-foreground uppercase mb-1">Terms</h3><p className="text-sm text-card-foreground">{doc.terms}</p></div>)}
            </div>
          )}

          {doc.reference_type && (
            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="text-xs font-medium text-muted-foreground uppercase mb-2">Reference</h3>
              <p className="text-sm text-card-foreground capitalize">{doc.reference_type.replace(/_/g, " ")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
