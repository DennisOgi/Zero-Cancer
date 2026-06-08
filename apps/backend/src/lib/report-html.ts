import { ZERO_CANCER_LOGO_SVG } from "./report-brand";

export type ReportLetterhead = {
  centerName: string;
  centerAddress: string;
  centerPhone?: string | null;
  centerWhatsapp?: string | null;
  patientName: string;
  signedByName?: string | null;
  reportDate: string;
  title: string;
  sampleType: string;
  resultText: string;
  interpretation: string;
  advise: string;
  conclusion?: string | null;
  remarks: string;
  disclaimer: string;
};

export function buildReportHtml(data: ReportLetterhead): string {
  const adviseLines = data.advise
    .split("\n")
    .map((line) => `<li>${escapeHtml(line.trim())}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.title)}</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; color: #111; margin: 0; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1f5b8c; padding-bottom: 16px; margin-bottom: 24px; gap: 24px; }
    .center-block h1 { font-size: 18px; margin: 0 0 8px; color: #1f5b8c; }
    .center-block p { margin: 2px 0; font-size: 13px; color: #444; }
    .brand { text-align: right; flex-shrink: 0; }
    .brand svg { display: block; margin-left: auto; }
    .patient { margin-bottom: 20px; font-size: 14px; }
    .section { margin: 18px 0; }
    .section h3 { font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: #666; margin-bottom: 6px; }
    .section p, .section ul { font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap; }
    .result-badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-weight: bold; background: #f3f4f6; }
    .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 16px; font-size: 13px; }
    .signature { margin-top: 24px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="center-block">
      <h1>${escapeHtml(data.centerName)}</h1>
      <p>${escapeHtml(data.centerAddress)}</p>
      ${data.centerPhone ? `<p>Tel: ${escapeHtml(data.centerPhone)}</p>` : ""}
      ${data.centerWhatsapp ? `<p>WhatsApp: ${escapeHtml(data.centerWhatsapp)}</p>` : ""}
    </div>
    <div class="brand">
      ${ZERO_CANCER_LOGO_SVG}
    </div>
  </div>

  <div class="patient"><strong>Patient:</strong> ${escapeHtml(data.patientName)}</div>
  <div class="patient"><strong>Date:</strong> ${escapeHtml(data.reportDate)}</div>

  <div class="section"><h3>Title</h3><p>${escapeHtml(data.title)}</p></div>
  <div class="section"><h3>Sample</h3><p>${escapeHtml(data.sampleType)}</p></div>
  <div class="section"><h3>Result</h3><p><span class="result-badge">${escapeHtml(data.resultText)}</span></p></div>
  <div class="section"><h3>Interpretation</h3><p>${escapeHtml(data.interpretation)}</p></div>
  <div class="section"><h3>Advise</h3><ul>${adviseLines}</ul></div>
  <div class="section"><h3>Conclusion</h3><p>${escapeHtml(data.conclusion || "")}</p></div>
  <div class="section"><h3>Remarks</h3><p>${escapeHtml(data.remarks)}</p></div>
  <div class="section"><h3>Disclaimer</h3><p>${escapeHtml(data.disclaimer)}</p></div>

  <div class="footer signature">
    <p><strong>Signed:</strong> ${escapeHtml(data.signedByName || "Authorized staff")}</p>
    <p><strong>Date:</strong> ${escapeHtml(data.reportDate)}</p>
  </div>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
