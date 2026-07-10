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
  const resultTone = resultBadgeColors(data.resultText, accent);
  const adviseLines = data.advise
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");

  const logoBlock = data.logoUrl
    ? `<img class="center-logo" src="${escapeHtml(data.logoUrl)}" alt="${escapeHtml(data.centerName)} logo" crossorigin="anonymous" />`
    : `<div class="center-mark" style="background:${accent}">${escapeHtml(
        initials(data.centerName)
      )}</div>`;

  const footerBrand =
    data.reportFooterText?.trim() ||
    `${data.centerName} · Confidential screening report`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.title)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Calibri, 'Helvetica Neue', Arial, sans-serif;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .page { padding: 36px 40px 28px; }
    .top-bar { height: 6px; background: ${accent}; margin: 0; }
    .letterhead {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 28px;
      padding: 22px 0 18px;
      border-bottom: 1px solid #d8e0e8;
      margin-bottom: 22px;
    }
    .center-block { display: flex; gap: 14px; align-items: flex-start; min-width: 0; flex: 1; }
    .center-logo { max-height: 64px; max-width: 140px; object-fit: contain; display: block; }
    .center-mark {
      width: 56px; height: 56px; border-radius: 10px; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 18px; letter-spacing: 0.04em; flex-shrink: 0;
    }
    .center-text h1 {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 20px; margin: 0 0 6px; color: ${accent}; font-weight: 700; line-height: 1.25;
    }
    .center-text p { margin: 2px 0; font-size: 12.5px; color: #555; line-height: 1.45; }
    .brand { text-align: right; flex-shrink: 0; max-width: 160px; }
    .brand-label {
      font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
      color: #8a939c; margin: 0 0 8px; font-weight: 600;
    }
    .brand svg { display: block; margin-left: auto; width: 130px; height: auto; }
    .meta {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px;
      background: #f6f8fa; border: 1px solid #e6ebf0; border-radius: 8px;
      padding: 14px 16px; margin-bottom: 22px;
    }
    .meta-item label {
      display: block; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
      color: #7a8490; margin-bottom: 4px; font-weight: 600;
    }
    .meta-item span { font-size: 14px; color: #1a1a1a; font-weight: 600; }
    .doc-title {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 15px; color: #222; margin: 0 0 18px; line-height: 1.45; font-weight: 700;
    }
    .section { margin: 0 0 16px; padding-left: 12px; border-left: 3px solid ${accent}22; }
    .section h3 {
      font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
      color: #7a8490; margin: 0 0 6px; font-weight: 700;
    }
    .section p, .section ul {
      font-size: 13.5px; line-height: 1.65; margin: 0; color: #2a2a2a; white-space: pre-wrap;
    }
    .section ul { padding-left: 18px; }
    .section li { margin: 3px 0; }
    .result-badge {
      display: inline-block; padding: 5px 14px; border-radius: 6px;
      font-weight: 700; font-size: 13px; letter-spacing: 0.02em;
      background: ${resultTone.bg}; color: ${resultTone.fg}; border: 1px solid ${resultTone.border};
    }
    .signature {
      margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
      padding-top: 8px;
    }
    .sig-line {
      border-top: 1px solid #c5ced6; padding-top: 8px; font-size: 12.5px; color: #444;
    }
    .sig-line strong { display: block; color: #1a1a1a; margin-bottom: 2px; font-size: 13px; }
    .report-footer {
      margin-top: 28px; background: ${accent}; color: #fff; border-radius: 8px;
      padding: 14px 16px; display: flex; justify-content: space-between; gap: 16px;
      align-items: flex-start; font-size: 11.5px;
    }
    .report-footer .footer-main strong {
      display: block; margin-bottom: 4px; font-size: 12.5px; font-weight: 700;
    }
    .report-footer .footer-meta { margin: 2px 0; opacity: 0.92; }
    .report-footer .powered { text-align: right; flex-shrink: 0; opacity: 0.9; font-size: 11px; }
  </style>
</head>
<body>
  <div class="top-bar"></div>
  <div class="page">
    <div class="letterhead">
      <div class="center-block">
        ${logoBlock}
        <div class="center-text">
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

    <div class="meta">
      <div class="meta-item">
        <label>Patient</label>
        <span>${escapeHtml(data.patientName)}</span>
      </div>
      <div class="meta-item">
        <label>Report date</label>
        <span>${escapeHtml(data.reportDate)}</span>
      </div>
    </div>

    <p class="doc-title">${escapeHtml(data.title)}</p>

    <div class="section"><h3>Sample</h3><p>${escapeHtml(data.sampleType)}</p></div>
    <div class="section"><h3>Result</h3><p><span class="result-badge">${escapeHtml(data.resultText)}</span></p></div>
    <div class="section"><h3>Interpretation</h3><p>${escapeHtml(data.interpretation)}</p></div>
    <div class="section"><h3>Advise</h3><ul>${adviseLines}</ul></div>
    ${
      data.conclusion?.trim()
        ? `<div class="section"><h3>Conclusion</h3><p>${escapeHtml(data.conclusion)}</p></div>`
        : ""
    }
    <div class="section"><h3>Remarks</h3><p>${escapeHtml(data.remarks)}</p></div>
    <div class="section"><h3>Disclaimer</h3><p>${escapeHtml(data.disclaimer)}</p></div>

    <div class="signature">
      <div class="sig-line">
        <strong>${escapeHtml(data.signedByName || "Authorized staff")}</strong>
        Authorized signatory
      </div>
      <div class="sig-line">
        <strong>${escapeHtml(data.reportDate)}</strong>
        Date signed
      </div>
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
  </div>
</body>
</html>`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function resultBadgeColors(
  resultText: string,
  accent: string
): { bg: string; fg: string; border: string } {
  const value = resultText.toLowerCase();
  if (value.includes("positive") || value.includes("detected")) {
    return { bg: "#fef2f2", fg: "#b91c1c", border: "#fecaca" };
  }
  if (value.includes("negative") || value.includes("not detected")) {
    return { bg: "#f0fdf4", fg: "#15803d", border: "#bbf7d0" };
  }
  return { bg: `${accent}14`, fg: accent, border: `${accent}44` };
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
