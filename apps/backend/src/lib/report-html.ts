import { ZERO_CANCER_LOGO_SVG } from "./report-brand";

export type ReportLetterhead = {
  centerName: string;
  centerAddress: string;
  centerPhone?: string | null;
  centerWhatsapp?: string | null;
  /** Center brand logo URL (Cloudinary or HTTPS). Falls back to name-only letterhead. */
  logoUrl?: string | null;
  /** Optional custom footer line under the signature block. */
  reportFooterText?: string | null;
  /** Optional hex accent for letterhead/footer rules, e.g. #1f5b8c */
  brandColor?: string | null;
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
  const accent = sanitizeBrandColor(data.brandColor) || "#1f5b8c";
  const adviseLines = data.advise
    .split("\n")
    .map((line) => `<li>${escapeHtml(line.trim())}</li>`)
    .join("");

  const logoBlock = data.logoUrl
    ? `<img class="center-logo" src="${escapeHtml(data.logoUrl)}" alt="${escapeHtml(data.centerName)} logo" crossorigin="anonymous" />`
    : "";

  const footerBrand =
    data.reportFooterText?.trim() ||
    `${data.centerName} · Confidential screening report`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.title)}</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; color: #111; margin: 0; padding: 32px; }
    .letterhead { border-bottom: 3px solid ${accent}; padding-bottom: 16px; margin-bottom: 24px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
    .center-block { display: flex; gap: 16px; align-items: flex-start; min-width: 0; }
    .center-logo { max-height: 72px; max-width: 160px; object-fit: contain; display: block; }
    .center-block h1 { font-size: 18px; margin: 0 0 8px; color: ${accent}; }
    .center-block p { margin: 2px 0; font-size: 13px; color: #444; }
    .brand { text-align: right; flex-shrink: 0; }
    .brand-label { font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: #888; margin: 0 0 6px; }
    .brand svg { display: block; margin-left: auto; }
    .patient { margin-bottom: 20px; font-size: 14px; }
    .section { margin: 18px 0; }
    .section h3 { font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: #666; margin-bottom: 6px; }
    .section p, .section ul { font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap; }
    .result-badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-weight: bold; background: #f3f4f6; }
    .signature { margin-top: 32px; font-size: 13px; }
    .report-footer {
      margin-top: 36px;
      border-top: 3px solid ${accent};
      padding-top: 14px;
      font-size: 12px;
      color: #444;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
    }
    .report-footer .footer-main { flex: 1; min-width: 0; }
    .report-footer .footer-main strong { color: ${accent}; display: block; margin-bottom: 4px; font-size: 13px; }
    .report-footer .footer-meta { margin: 2px 0; }
    .report-footer .powered { text-align: right; flex-shrink: 0; color: #888; font-size: 11px; }
  </style>
</head>
<body>
  <div class="letterhead">
    <div class="header">
      <div class="center-block">
        ${logoBlock}
        <div>
          <h1>${escapeHtml(data.centerName)}</h1>
          <p>${escapeHtml(data.centerAddress)}</p>
          ${data.centerPhone ? `<p>Tel: ${escapeHtml(data.centerPhone)}</p>` : ""}
          ${data.centerWhatsapp ? `<p>WhatsApp: ${escapeHtml(data.centerWhatsapp)}</p>` : ""}
        </div>
      </div>
      <div class="brand">
        <p class="brand-label">In partnership with</p>
        ${ZERO_CANCER_LOGO_SVG}
      </div>
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

  <div class="signature">
    <p><strong>Signed:</strong> ${escapeHtml(data.signedByName || "Authorized staff")}</p>
    <p><strong>Date:</strong> ${escapeHtml(data.reportDate)}</p>
  </div>

  <div class="report-footer">
    <div class="footer-main">
      <strong>${escapeHtml(footerBrand)}</strong>
      <p class="footer-meta">${escapeHtml(data.centerName)}</p>
      ${data.centerPhone ? `<p class="footer-meta">Tel: ${escapeHtml(data.centerPhone)}</p>` : ""}
      ${data.centerWhatsapp ? `<p class="footer-meta">WhatsApp: ${escapeHtml(data.centerWhatsapp)}</p>` : ""}
    </div>
    <div class="powered">Powered by ZeroCancer</div>
  </div>
</body>
</html>`;
}

function sanitizeBrandColor(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return /^#[0-9A-Fa-f]{6}$/.test(trimmed) ? trimmed : null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
