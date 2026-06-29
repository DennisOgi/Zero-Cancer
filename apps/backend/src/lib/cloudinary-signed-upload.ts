import crypto from "crypto";

type CloudinaryUploadInput = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  fileBase64: string;
  folder: string;
  publicId?: string;
};

type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
};

function isCloudinaryConfigured(input: {
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
}) {
  const { cloudName, apiKey, apiSecret } = input;
  if (!cloudName || !apiKey || !apiSecret) return false;
  if (cloudName === "demo-cloud" || cloudName === "placeholder") return false;
  if (apiKey === "demo-api-key" || apiKey === "placeholder") return false;
  if (apiSecret === "demo-api-secret" || apiSecret === "placeholder") return false;
  return true;
}

function signCloudinaryParams(
  params: Record<string, string>,
  apiSecret: string
) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");
}

export async function uploadBase64ImageToCloudinary(
  input: CloudinaryUploadInput
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured(input)) {
    throw new Error(
      "Photo upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const publicId =
    input.publicId ||
    `patient-${timestamp}-${Math.random().toString(36).slice(2, 10)}`;

  const signatureParams: Record<string, string> = {
    folder: input.folder,
    public_id: publicId,
    timestamp,
  };

  const signature = signCloudinaryParams(signatureParams, input.apiSecret);

  const formData = new FormData();
  formData.append("file", input.fileBase64);
  formData.append("api_key", input.apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", input.folder);
  formData.append("public_id", publicId);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${input.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const payload = (await response.json().catch(() => ({}))) as {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  };

  if (!response.ok || !payload.secure_url) {
    throw new Error(
      payload.error?.message ||
        `Cloudinary upload failed (${response.status})`
    );
  }

  return {
    secure_url: payload.secure_url,
    public_id: payload.public_id || publicId,
  };
}

export { isCloudinaryConfigured };

export function isAllowedPatientPhotoUrl(
  photoUrl: string | undefined | null,
  cloudName: string
) {
  if (!photoUrl) return true;

  try {
    const parsed = new URL(photoUrl);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "res.cloudinary.com" &&
      parsed.pathname.includes(`/${cloudName}/`)
    );
  } catch {
    return false;
  }
}
