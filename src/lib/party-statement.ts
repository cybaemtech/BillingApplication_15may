import { companyApi, gstSettingsApi, invoiceSettingsApi } from "@/lib/api";

export interface StatementRow {
  date: string;
  type: string;
  reference: string;
  details?: string;
  debit?: number;
  credit?: number;
  balance?: number;
}

export interface PartyStatementData {
  title: string;
  statementNumber: string;
  asOfDate: string;
  partyLabel: string;
  partyName: string;
  partyGstin?: string;
  partyAddress?: string;
  partyState?: string;
  summaries: { label: string; value: string }[];
  rows: StatementRow[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

async function getBranding() {
  let company: any = {};
  let gst: any = {};
  let settings: any = {};

  try {
    [company, gst, settings] = await Promise.all([
      companyApi.get(),
      gstSettingsApi.get(),
      invoiceSettingsApi.get(),
    ]);
  } catch {}

  return {
    name: company?.company_name || gst?.legal_name || gst?.trade_name || "Your Company",
    gstin: company?.gstin || gst?.gstin || "",
    address: company?.address || "",
    state: company?.state || gst?.state || "",
    phone: company?.phone || "",
    accentColor: settings?.accent_color || "#2563eb",
    footerText: settings?.footer_text || "Generated from your billing application.",
  };
}

export async function generatePartyStatementHtml(data: PartyStatementData) {
  const branding = await getBranding();
  const summaryHtml = data.summaries
    .map((entry) => `<div class="summary-card"><div class="summary-label">${entry.label}</div><div class="summary-value">${entry.value}</div></div>`)
    .join("");

  const rowsHtml = data.rows.length
    ? data.rows
        .map(
          (row) => `
            <tr>
              <td>${row.date || "-"}</td>
              <td>${row.type || "-"}</td>
              <td>${row.reference || "-"}</td>
              <td>${row.details || "-"}</td>
              <td class="num">${formatCurrency(row.debit || 0)}</td>
              <td class="num">${formatCurrency(row.credit || 0)}</td>
              <td class="num balance">${formatCurrency(row.balance || 0)}</td>
            </tr>`,
        )
        .join("")
    : '<tr><td colspan="7" class="empty">No statement entries available.</td></tr>';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${data.title}</title>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:Arial,sans-serif;background:#f5f7fb;color:#0f172a}
.page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;padding:18mm}
.header{display:flex;justify-content:space-between;gap:24px;padding-bottom:16px;border-bottom:3px solid ${branding.accentColor}}
.brand h1{margin:0 0 6px;font-size:24px;color:${branding.accentColor}}
.brand p,.meta p,.party p{margin:2px 0;font-size:12px;color:#475569}
.meta{text-align:right}
.meta h2{margin:0 0 6px;font-size:20px;text-transform:uppercase}
.meta .number{font-size:15px;font-weight:700;color:${branding.accentColor}}
.party-wrap{display:grid;grid-template-columns:1.1fr 0.9fr;gap:20px;margin:22px 0}
.party,.statement-note{border:1px solid #dbe4f0;border-radius:16px;padding:16px;background:#f8fbff}
.section-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:8px}
.summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:0 0 22px}
.summary-card{border:1px solid #dbe4f0;border-radius:16px;padding:14px;background:linear-gradient(180deg,#ffffff,#f8fbff)}
.summary-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:8px}
.summary-value{font-size:20px;font-weight:700;color:#0f172a}
table{width:100%;border-collapse:collapse;border:1px solid #dbe4f0;border-radius:16px;overflow:hidden}
thead th{background:#eff6ff;color:#334155;padding:12px 10px;font-size:11px;text-transform:uppercase;text-align:left}
tbody td{padding:12px 10px;border-top:1px solid #e2e8f0;font-size:12px}
.num{text-align:right;white-space:nowrap}
.balance{font-weight:700;color:${branding.accentColor}}
.empty{text-align:center;color:#64748b;padding:20px}
.footer{display:flex;justify-content:space-between;align-items:flex-end;margin-top:28px;padding-top:18px;border-top:1px solid #dbe4f0}
.signature{width:220px;text-align:center;font-size:12px;color:#64748b}
.signature .line{border-top:1px solid #0f172a;padding-top:8px;margin-top:48px}
.small{font-size:11px;color:#64748b}
@media print{body{background:#fff}.page{margin:0;padding:14mm}@page{size:A4;margin:0}}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand">
      <h1>${branding.name}</h1>
      ${branding.gstin ? `<p>GSTIN: ${branding.gstin}</p>` : ""}
      ${branding.address ? `<p>${branding.address}</p>` : ""}
      ${branding.state ? `<p>${branding.state}</p>` : ""}
      ${branding.phone ? `<p>Phone: ${branding.phone}</p>` : ""}
    </div>
    <div class="meta">
      <h2>${data.title}</h2>
      <p class="number">${data.statementNumber}</p>
      <p>As of: ${data.asOfDate}</p>
    </div>
  </div>

  <div class="party-wrap">
    <div class="party">
      <div class="section-label">${data.partyLabel}</div>
      <p><strong>${data.partyName}</strong></p>
      ${data.partyGstin ? `<p>GSTIN: ${data.partyGstin}</p>` : ""}
      ${data.partyAddress ? `<p>${data.partyAddress}</p>` : ""}
      ${data.partyState ? `<p>${data.partyState}</p>` : ""}
    </div>
    <div class="statement-note">
      <div class="section-label">Statement Scope</div>
      <p>This statement summarizes document history and running balance for this party up to the selected date.</p>
    </div>
  </div>

  <div class="summary-grid">${summaryHtml}</div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Type</th>
        <th>Reference</th>
        <th>Details</th>
        <th class="num">Debit</th>
        <th class="num">Credit</th>
        <th class="num">Balance</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <div class="footer">
    <div class="small">${branding.footerText}</div>
    <div class="signature"><div class="line">Authorized Signatory</div></div>
  </div>
</div>
</body>
</html>`;
}

async function openStatementDocument(data: PartyStatementData, shouldPrint: boolean) {
  const html = await generatePartyStatementHtml(data);
  const popup = window.open("", "_blank");
  if (!popup) return;
  popup.document.write(html);
  popup.document.close();
  if (shouldPrint) {
    popup.onload = () => popup.print();
  }
}

export async function previewPartyStatement(data: PartyStatementData) {
  await openStatementDocument(data, false);
}

export async function printPartyStatement(data: PartyStatementData) {
  await openStatementDocument(data, true);
}