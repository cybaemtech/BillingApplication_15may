const fs = require('fs');

const replacement = `          <div className="grid grid-cols-2 gap-3">
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

          {docType !== "purchase_order" && docType !== "bill" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Terms & Conditions</Label>
              <Textarea className="text-sm resize-none" rows={2} value={terms} onChange={e => setTerms(e.target.value)} placeholder="Terms..." />
            </div>
          )}

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
`;

let content = fs.readFileSync('src/components/DocumentEditorPage.tsx', 'utf8');

// Find where <div className="grid grid-cols-2 gap-3"> starts
const startIdx = content.indexOf('          <div className="grid grid-cols-2 gap-3">');

// Find where {/* CENTER */} starts
const endIdx = content.indexOf('        {/* CENTER */}');

if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + replacement + '\n' + content.substring(endIdx);
    fs.writeFileSync('src/components/DocumentEditorPage.tsx', content);
    console.log("File fixed successfully!");
} else {
    console.log("Failed to find start or end index.");
}
