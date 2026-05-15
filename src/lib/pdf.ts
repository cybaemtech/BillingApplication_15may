// PDF Generation with 5 selectable templates
import { gstSettingsApi, companyApi, invoiceSettingsApi } from "./api";

export interface PdfDocumentData {
  type: string;
  documentNumber: string;
  date: string;
  dueDate?: string;
  partyName: string;
  partyGstin?: string;
  partyAddress?: string;
  partyState?: string;
  items: { name: string; description?: string; hsn?: string; quantity: number; rate: number; amount: number; taxAmount: number }[];
  subtotal: number;
  taxAmount: number;
  total: number;
  balanceDue?: number;
  notes?: string;
  terms?: string;
  status?: string;
  hideItemDetails?: boolean;
}

type TemplateId = "modern" | "corporate" | "minimal" | "gst_detailed" | "compact";

export const TEMPLATES: { id: TemplateId; name: string; description: string }[] = [
  { id: "modern", name: "Modern Clean", description: "Clean layout with blue accent and professional styling" },
  { id: "corporate", name: "Corporate Style", description: "Bold header bar with structured blocks" },
  { id: "minimal", name: "Minimal Layout", description: "Black & white, clean typography" },
  { id: "gst_detailed", name: "GST Detailed", description: "Full CGST/SGST/IGST breakdown with HSN" },
  { id: "compact", name: "Compact Business", description: "Space-efficient for retail and POS" },
];

async function getCompanyInfo() {
  let company: any = {};
  let gst: any = {};
  let settings: any = {};
  try { [company, gst, settings] = await Promise.all([companyApi.get(), gstSettingsApi.get(), invoiceSettingsApi.get()]); } catch {}
  return {
    name: company?.company_name || gst?.legal_name || gst?.trade_name || "Your Company",
    gstin: company?.gstin || gst?.gstin || "",
    address: company?.address || "",
    state: company?.state || gst?.state || "",
    phone: company?.phone || "",
    email: company?.email || "",
    logoUrl: company?.logo_url || "",
    templateId: (settings?.template_id || "modern") as TemplateId,
    accentColor: settings?.accent_color || "#2563eb",
    footerText: settings?.footer_text || "Thank you for your business!",
  };
}

function getStandardHeaders(doc: PdfDocumentData) {
  return [
    { key: "index", label: "#", style: "width:40px;text-align:center" },
    ...(!doc.hideItemDetails ? [{ key: "item", label: "Item & HSN", style: "" }] : []),
    { key: "qty", label: "Qty", style: "width:60px;text-align:center" },
    { key: "rate", label: "Rate", style: "width:100px;text-align:right" },
    { key: "tax", label: "Tax", style: "width:80px;text-align:right" },
    { key: "amount", label: "Amount", style: "width:100px;text-align:right" },
  ];
}

function getGstHeaders(doc: PdfDocumentData) {
  return [
    { key: "index", label: "#" },
    ...(!doc.hideItemDetails ? [{ key: "item", label: "Item" }, { key: "hsn", label: "HSN" }] : []),
    { key: "qty", label: "Qty" },
    { key: "rate", label: "Rate" },
    { key: "taxable", label: "Taxable Amt" },
    { key: "cgst", label: "CGST" },
    { key: "sgst", label: "SGST" },
    { key: "total", label: "Total" },
  ];
}

function buildStandardRows(doc: PdfDocumentData) {
  return doc.items.map((item, i) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">${i + 1}</td>
      ${!doc.hideItemDetails ? `<td style="padding:8px;border-bottom:1px solid #e5e7eb">${item.name}${item.description && item.description !== item.name ? `<br><small style="color:#6b7280">${item.description}</small>` : ""}${item.hsn ? `<br><small style="color:#6b7280">HSN: ${item.hsn}</small>` : ""}</td>` : ""}
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">₹${item.rate.toLocaleString()}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">₹${item.taxAmount.toLocaleString()}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">₹${(item.amount + item.taxAmount).toLocaleString()}</td>
    </tr>`).join("");
}

function buildGstRows(doc: PdfDocumentData) {
  return doc.items.map((item, i) => {
    const cgst = item.taxAmount / 2;
    const sgst = item.taxAmount / 2;
    return `
      <tr>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${i + 1}</td>
        ${!doc.hideItemDetails ? `<td style="padding:6px 8px;border:1px solid #ddd">${item.name}${item.description && item.description !== item.name ? `<br><small style="color:#6b7280">${item.description}</small>` : ""}</td>` : ""}
        ${!doc.hideItemDetails ? `<td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${item.hsn || "-"}</td>` : ""}
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${item.quantity}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">₹${item.rate.toLocaleString()}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">₹${item.amount.toLocaleString()}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">₹${cgst.toLocaleString()}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">₹${sgst.toLocaleString()}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:right;font-weight:600">₹${(item.amount + item.taxAmount).toLocaleString()}</td>
      </tr>`;
  }).join("");
}

function buildCompactRows(doc: PdfDocumentData) {
  return doc.items.map((item) => `
    <tr>
      ${!doc.hideItemDetails ? `<td style="padding:4px 6px;border-bottom:1px solid #eee">${item.name}${item.description && item.description !== item.name ? `<br><small style="color:#6b7280">${item.description}</small>` : ""}</td>` : ""}
      <td style="padding:4px 6px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
      <td style="padding:4px 6px;border-bottom:1px solid #eee;text-align:right">₹${item.rate.toLocaleString()}</td>
      <td style="padding:4px 6px;border-bottom:1px solid #eee;text-align:right">₹${(item.amount + item.taxAmount).toLocaleString()}</td>
    </tr>`).join("");
}

function buildHeaderRow(headers: { label: string; style?: string }[], style: string) {
  return headers.map((header) => `<th style="${header.style || ""}${header.style ? ";" : ""}${style}">${header.label}</th>`).join("");
}

function modernTemplate(doc: PdfDocumentData, co: any): string {
  const rows = buildStandardRows(doc);
  const headers = getStandardHeaders(doc);
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;font-size:13px}
.page{width:210mm;min-height:297mm;padding:20mm;margin:0 auto;background:#fff}
@media print{.page{padding:15mm;margin:0}@page{size:A4;margin:0}}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid ${co.accentColor}}
.company h1{font-size:22px;color:${co.accentColor};margin-bottom:4px}
.company p{color:#6b7280;font-size:12px;line-height:1.5}
.doc-info{text-align:right}
.doc-info h2{font-size:18px;color:#1f2937;text-transform:uppercase;margin-bottom:8px}
.doc-info .number{font-size:14px;font-weight:700;color:${co.accentColor}}
.doc-info .detail{color:#6b7280;font-size:12px;line-height:1.8}
.parties{display:flex;gap:40px;margin-bottom:24px}
.party h3{font-size:11px;text-transform:uppercase;color:#6b7280;margin-bottom:6px;letter-spacing:0.5px}
.party p{font-size:13px;line-height:1.6}
table{width:100%;border-collapse:collapse;margin-bottom:24px}
thead th{background:#f3f4f6;padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb}
.totals{display:flex;justify-content:flex-end;margin-bottom:32px}
.totals-table{width:280px}
.totals-table .row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px}
.totals-table .total-row{border-top:2px solid #1f2937;padding-top:10px;margin-top:6px;font-size:16px;font-weight:700;color:${co.accentColor}}
.footer{margin-top:40px;display:flex;justify-content:space-between;align-items:flex-end}
.signature .line{width:200px;border-top:1px solid #1f2937;margin-top:60px;padding-top:6px;font-size:12px;color:#6b7280;text-align:center}
.notes{max-width:300px;font-size:11px;color:#6b7280;line-height:1.5}
.notes strong{color:#1f2937;font-size:12px}
.footer-msg{text-align:center;margin-top:30px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af}
</style></head><body><div class="page">
<div class="header">
  <div class="company">
    ${co.logoUrl ? `<img src="${co.logoUrl}" style="max-height:50px;margin-bottom:8px" />` : ""}
    <h1>${co.name}</h1>
    ${co.gstin ? `<p>GSTIN: ${co.gstin}</p>` : ""}
    ${co.address ? `<p>${co.address}</p>` : ""}
    ${co.state ? `<p>${co.state}</p>` : ""}
    ${co.phone ? `<p>Phone: ${co.phone}</p>` : ""}
  </div>
  <div class="doc-info">
    <h2>${doc.type}</h2>
    <p class="number">${doc.documentNumber}</p>
    <p class="detail">Date: ${doc.date}</p>
    ${doc.dueDate ? `<p class="detail">Due: ${doc.dueDate}</p>` : ""}
  </div>
</div>
<div class="parties">
  <div class="party">
    <h3>${doc.type.includes("Bill") || doc.type.includes("Purchase") ? "Vendor" : "Bill To"}</h3>
    <p><strong>${doc.partyName}</strong></p>
    ${doc.partyGstin ? `<p>GSTIN: ${doc.partyGstin}</p>` : ""}
    ${doc.partyAddress ? `<p>${doc.partyAddress}</p>` : ""}
    ${doc.partyState ? `<p>${doc.partyState}</p>` : ""}
  </div>
</div>
<table><thead><tr>${buildHeaderRow(headers, "padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb")}</tr></thead><tbody>${rows}</tbody></table>
<div class="totals"><div class="totals-table">
  <div class="row"><span>Subtotal</span><span>₹${doc.subtotal.toLocaleString()}</span></div>
  <div class="row"><span>Tax (GST)</span><span>₹${doc.taxAmount.toLocaleString()}</span></div>
  <div class="row total-row"><span>Total</span><span>₹${doc.total.toLocaleString()}</span></div>
  ${doc.balanceDue !== undefined ? `<div class="row"><span>Balance Due</span><span style="color:#dc2626">₹${doc.balanceDue.toLocaleString()}</span></div>` : ""}
</div></div>
<div class="footer">
  <div class="notes">
    ${doc.notes ? `<strong>Notes</strong><p>${doc.notes}</p>` : ""}
    ${doc.terms ? `<br><strong>Terms</strong><p>${doc.terms}</p>` : ""}
  </div>
  <div class="signature"><div class="line">Authorized Signatory</div></div>
</div>
<div class="footer-msg">${co.footerText}</div>
</div></body></html>`;
}

function corporateTemplate(doc: PdfDocumentData, co: any): string {
  const rows = buildStandardRows(doc);
  const headers = getStandardHeaders(doc);
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;font-size:13px}
.page{width:210mm;min-height:297mm;padding:0;margin:0 auto;background:#fff}
@media print{.page{margin:0}@page{size:A4;margin:0}}
.top-bar{background:${co.accentColor};color:#fff;padding:24px 30px;display:flex;justify-content:space-between;align-items:center}
.top-bar h1{font-size:24px;letter-spacing:1px}
.top-bar .doc-type{font-size:28px;font-weight:700;text-transform:uppercase;letter-spacing:2px}
.content{padding:30px}
.info-grid{display:flex;justify-content:space-between;margin-bottom:30px;gap:20px}
.info-box{background:#f8f9fa;border:1px solid #e9ecef;border-radius:4px;padding:16px;flex:1}
.info-box h3{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6c757d;margin-bottom:8px}
.info-box p{line-height:1.6}
table{width:100%;border-collapse:collapse;margin-bottom:24px}
thead th{background:#343a40;color:#fff;padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase}
tbody td{padding:8px;border-bottom:1px solid #e5e7eb}
.summary{display:flex;justify-content:flex-end}
.summary-box{background:#f8f9fa;border:1px solid #e9ecef;border-radius:4px;padding:20px;width:300px}
.summary-row{display:flex;justify-content:space-between;padding:6px 0}
.summary-total{border-top:2px solid #343a40;padding-top:12px;margin-top:8px;font-size:18px;font-weight:700;color:${co.accentColor}}
.sig{text-align:right;margin-top:60px}
.sig .line{display:inline-block;width:200px;border-top:1px solid #000;padding-top:8px;font-size:12px;color:#6c757d}
.footer-msg{text-align:center;margin-top:30px;padding-top:16px;border-top:1px solid #dee2e6;font-size:11px;color:#adb5bd}
</style></head><body><div class="page">
<div class="top-bar">
  <div><h1>${co.name}</h1>${co.gstin ? `<p style="font-size:12px;opacity:0.8">GSTIN: ${co.gstin}</p>` : ""}</div>
  <div class="doc-type">${doc.type}</div>
</div>
<div class="content">
<div class="info-grid">
  <div class="info-box"><h3>Document</h3><p><strong>${doc.documentNumber}</strong></p><p>Date: ${doc.date}</p>${doc.dueDate ? `<p>Due: ${doc.dueDate}</p>` : ""}</div>
  <div class="info-box"><h3>${doc.type.includes("Bill") || doc.type.includes("Purchase") ? "Vendor" : "Bill To"}</h3><p><strong>${doc.partyName}</strong></p>${doc.partyGstin ? `<p>GSTIN: ${doc.partyGstin}</p>` : ""}${doc.partyAddress ? `<p>${doc.partyAddress}</p>` : ""}</div>
  <div class="info-box"><h3>From</h3><p>${co.name}</p>${co.address ? `<p>${co.address}</p>` : ""}${co.phone ? `<p>${co.phone}</p>` : ""}</div>
</div>
<table><thead><tr>${headers.map((header) => `<th style="${header.style || ""}">${header.label}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>
<div class="summary"><div class="summary-box">
  <div class="summary-row"><span>Subtotal</span><span>₹${doc.subtotal.toLocaleString()}</span></div>
  <div class="summary-row"><span>GST</span><span>₹${doc.taxAmount.toLocaleString()}</span></div>
  <div class="summary-row summary-total"><span>Total</span><span>₹${doc.total.toLocaleString()}</span></div>
  ${doc.balanceDue !== undefined ? `<div class="summary-row"><span>Balance Due</span><span style="color:#dc2626">₹${doc.balanceDue.toLocaleString()}</span></div>` : ""}
</div></div>
${doc.notes ? `<div style="margin-top:20px"><strong>Notes:</strong> ${doc.notes}</div>` : ""}
<div class="sig"><div class="line">Authorized Signatory</div></div>
<div class="footer-msg">${co.footerText}</div>
</div></div></body></html>`;
}

function minimalTemplate(doc: PdfDocumentData, co: any): string {
  const rows = buildStandardRows(doc);
  const headers = getStandardHeaders(doc);
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;color:#000;font-size:12px}
.page{width:210mm;min-height:297mm;padding:25mm;margin:0 auto;background:#fff}
@media print{.page{padding:20mm;margin:0}@page{size:A4;margin:0}}
h1{font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:3px;margin-bottom:4px}
.meta{font-size:11px;color:#666;margin-bottom:30px}
.divider{border:none;border-top:1px solid #000;margin:20px 0}
table{width:100%;border-collapse:collapse;margin:20px 0}
th{text-align:left;padding:8px;font-size:10px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #000}
td{padding:8px;border-bottom:1px solid #eee}
.total-section{text-align:right;margin-top:20px}
.total-line{display:flex;justify-content:flex-end;gap:40px;padding:4px 0}
.grand-total{font-size:16px;font-weight:700;border-top:2px solid #000;padding-top:8px;margin-top:8px}
</style></head><body><div class="page">
<h1>${co.name}</h1>
<div class="meta">${co.gstin ? `GSTIN: ${co.gstin} · ` : ""}${co.address || ""}</div>
<hr class="divider">
<div style="display:flex;justify-content:space-between;margin-bottom:20px">
  <div><strong>${doc.type.toUpperCase()}</strong><br>${doc.documentNumber}<br>Date: ${doc.date}${doc.dueDate ? `<br>Due: ${doc.dueDate}` : ""}</div>
  <div style="text-align:right"><strong>${doc.partyName}</strong>${doc.partyGstin ? `<br>GSTIN: ${doc.partyGstin}` : ""}${doc.partyAddress ? `<br>${doc.partyAddress}` : ""}</div>
</div>
<table><thead><tr>${headers.map((header) => `<th style="${header.style || ""}">${header.label}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>
<div class="total-section">
  <div class="total-line"><span>Subtotal:</span><span>₹${doc.subtotal.toLocaleString()}</span></div>
  <div class="total-line"><span>GST:</span><span>₹${doc.taxAmount.toLocaleString()}</span></div>
  <div class="total-line grand-total"><span>TOTAL:</span><span>₹${doc.total.toLocaleString()}</span></div>
</div>
${doc.notes ? `<hr class="divider"><p style="font-size:11px">${doc.notes}</p>` : ""}
<div style="margin-top:60px;text-align:right;font-size:11px;color:#666">____________________<br>Authorized Signatory</div>
<div style="text-align:center;margin-top:30px;font-size:10px;color:#999">${co.footerText}</div>
</div></body></html>`;
}

function gstDetailedTemplate(doc: PdfDocumentData, co: any): string {
  const rows = buildGstRows(doc);
  const headers = getGstHeaders(doc);
  const halfTax = doc.taxAmount / 2;
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;color:#1f2937;font-size:12px}
.page{width:210mm;min-height:297mm;padding:15mm;margin:0 auto;background:#fff}
@media print{.page{padding:10mm;margin:0}@page{size:A4;margin:0}}
.header{border:2px solid #1f2937;padding:16px;display:flex;justify-content:space-between;margin-bottom:16px}
.header h1{font-size:20px}
.header .right{text-align:right}
.section{border:1px solid #ddd;padding:12px;margin-bottom:12px}
.section h3{font-size:10px;text-transform:uppercase;color:#666;margin-bottom:6px;letter-spacing:1px}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
th,td{border:1px solid #ddd;padding:6px 8px;font-size:11px}
th{background:#f3f4f6;text-transform:uppercase;font-size:10px}
.tax-summary{display:flex;gap:16px;margin-bottom:16px}
.tax-box{flex:1;border:1px solid #ddd;padding:12px;text-align:center}
.tax-box .label{font-size:10px;color:#666;text-transform:uppercase}
.tax-box .value{font-size:16px;font-weight:700;color:#2563eb}
.grand{text-align:right;font-size:20px;font-weight:700;padding:12px;border:2px solid #1f2937;background:#f8f9fa}
</style></head><body><div class="page">
<div class="header">
  <div><h1>${co.name}</h1>${co.gstin ? `<p>GSTIN: ${co.gstin}</p>` : ""}${co.address ? `<p>${co.address}</p>` : ""}</div>
  <div class="right"><h2 style="font-size:16px">${doc.type.toUpperCase()}</h2><p style="font-size:14px;font-weight:700;color:#2563eb">${doc.documentNumber}</p><p>Date: ${doc.date}</p>${doc.dueDate ? `<p>Due: ${doc.dueDate}</p>` : ""}</div>
</div>
<div class="section"><h3>${doc.type.includes("Bill") || doc.type.includes("Purchase") ? "Vendor Details" : "Customer Details"}</h3>
  <p><strong>${doc.partyName}</strong></p>${doc.partyGstin ? `<p>GSTIN: ${doc.partyGstin}</p>` : ""}${doc.partyAddress ? `<p>${doc.partyAddress}</p>` : ""}${doc.partyState ? `<p>State: ${doc.partyState}</p>` : ""}
</div>
<table><thead><tr>${headers.map((header) => `<th>${header.label}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>
<div class="tax-summary">
  <div class="tax-box"><div class="label">Taxable Amount</div><div class="value">₹${doc.subtotal.toLocaleString()}</div></div>
  <div class="tax-box"><div class="label">CGST</div><div class="value">₹${halfTax.toLocaleString()}</div></div>
  <div class="tax-box"><div class="label">SGST</div><div class="value">₹${halfTax.toLocaleString()}</div></div>
  <div class="tax-box"><div class="label">Total Tax</div><div class="value">₹${doc.taxAmount.toLocaleString()}</div></div>
</div>
<div class="grand">Grand Total: ₹${doc.total.toLocaleString()}</div>
${doc.balanceDue !== undefined ? `<p style="text-align:right;color:#dc2626;margin-top:8px;font-weight:700">Balance Due: ₹${doc.balanceDue.toLocaleString()}</p>` : ""}
${doc.notes ? `<div class="section" style="margin-top:16px"><h3>Notes</h3><p>${doc.notes}</p></div>` : ""}
<div style="display:flex;justify-content:space-between;margin-top:40px;padding-top:16px">
  <div style="font-size:11px;color:#666">${co.footerText}</div>
  <div style="text-align:center"><div style="width:180px;border-top:1px solid #000;padding-top:6px;font-size:11px">Authorized Signatory</div></div>
</div>
</div></body></html>`;
}

function compactTemplate(doc: PdfDocumentData, co: any): string {
  const rows = buildCompactRows(doc);
  const headers = [
    ...(!doc.hideItemDetails ? [{ label: "Item" }] : []),
    { label: "Qty" },
    { label: "Rate", style: "text-align:right" },
    { label: "Amt", style: "text-align:right" },
  ];

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;color:#000;font-size:11px}
.page{width:80mm;padding:8mm;margin:0 auto;background:#fff}
@media print{.page{padding:5mm;margin:0}@page{size:80mm auto;margin:0}}
h1{font-size:14px;text-align:center;margin-bottom:2px}
.center{text-align:center}
.divider{border:none;border-top:1px dashed #999;margin:8px 0}
table{width:100%;border-collapse:collapse}
th{text-align:left;padding:4px 6px;font-size:10px;border-bottom:1px solid #000}
.total{font-size:14px;font-weight:700;text-align:right;padding:8px 0}
</style></head><body><div class="page">
<h1>${co.name}</h1>
<p class="center" style="font-size:10px;color:#666">${co.address || ""}</p>
${co.gstin ? `<p class="center" style="font-size:10px">GSTIN: ${co.gstin}</p>` : ""}
<hr class="divider">
<p><strong>${doc.type}</strong>: ${doc.documentNumber}</p>
<p>Date: ${doc.date}</p>
<p>To: ${doc.partyName}</p>
<hr class="divider">
<table><thead><tr>${headers.map((header) => `<th style="${header.style || ""}">${header.label}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>
<hr class="divider">
<div style="text-align:right">
  <div>Subtotal: ₹${doc.subtotal.toLocaleString()}</div>
  <div>Tax: ₹${doc.taxAmount.toLocaleString()}</div>
  <div class="total">TOTAL: ₹${doc.total.toLocaleString()}</div>
</div>
<hr class="divider">
<p class="center" style="font-size:10px;color:#666">${co.footerText}</p>
</div></body></html>`;
}

export async function generatePdfHtml(doc: PdfDocumentData, templateOverride?: TemplateId): Promise<string> {
  const co = await getCompanyInfo();
  const template = templateOverride || co.templateId;

  switch (template) {
    case "corporate": return corporateTemplate(doc, co);
    case "minimal": return minimalTemplate(doc, co);
    case "gst_detailed": return gstDetailedTemplate(doc, co);
    case "compact": return compactTemplate(doc, co);
    case "modern":
    default: return modernTemplate(doc, co);
  }
}

export async function printDocument(doc: PdfDocumentData, templateOverride?: TemplateId) {
  const html = await generatePdfHtml(doc, templateOverride);
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => { printWindow.print(); };
}

export function shareWhatsApp(doc: { documentNumber: string; type: string; total: number; partyName: string }) {
  const msg = encodeURIComponent(
    `${doc.type} ${doc.documentNumber}\nTo: ${doc.partyName}\nAmount: ₹${doc.total.toLocaleString()}\n\nThank you for your business!`
  );
  window.open(`https://wa.me/?text=${msg}`, "_blank");
}

