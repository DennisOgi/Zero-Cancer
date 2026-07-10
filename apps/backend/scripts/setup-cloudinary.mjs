/**
 * One-time Cloudinary setup for ZeroCancer report/PDF uploads.
 * Reads credentials from env — does not print secrets.
 */
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const presetName = process.env.CLOUDINARY_UPLOAD_PRESET || "zerocancer_uploads";

if (!cloudName || !apiKey || !apiSecret) {
  console.error("Missing CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET");
  process.exit(1);
}

const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

const listRes = await fetch(
  `https://api.cloudinary.com/v1_1/${cloudName}/upload_presets/${presetName}`,
  { headers: { Authorization: `Basic ${auth}` } },
);

if (listRes.ok) {
  console.log(`Preset already exists: ${presetName}`);
} else {
  const createRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/upload_presets`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: presetName,
        unsigned: true,
        folder: "zerocancer",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      }),
    },
  );
  const body = await createRes.json();
  if (!createRes.ok) {
    console.error("Failed to create preset:", body?.error?.message || body);
    process.exit(1);
  }
  console.log(`Created unsigned preset: ${presetName}`);
}

// Smoke-test: upload a tiny PDF as image (Cloudinary accepts PDF as image)
const tinyPdfBase64 =
  "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQo+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjQgMDAwMDAgbiAKMDAwMDAwMDEyMSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDQKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjE5MAolJUVPRgo=";

const form = new FormData();
form.append("file", tinyPdfBase64);
form.append("upload_preset", presetName);
form.append("public_id", `zerocancer/smoke-test-${Date.now()}`);

const uploadRes = await fetch(
  `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
  { method: "POST", body: form },
);
const uploaded = await uploadRes.json();
if (!uploadRes.ok) {
  console.error("Smoke upload failed:", uploaded?.error?.message || uploaded);
  process.exit(1);
}
console.log("Smoke upload OK:", uploaded.secure_url ? "got secure_url" : "missing url");
console.log("resource_type:", uploaded.resource_type, "format:", uploaded.format);
