import { v2 as cloudinary } from "cloudinary";
import { UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/**
 * Upload a single file to a specific folder in Cloudinary
 */
export async function uploadSingleToCloudinary(
  filePath: string,
  folder: string,
  publicId?: string
): Promise<UploadApiResponse> {
  try {
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      folder,
      public_id: publicId,
      resource_type: "auto",
    });
    return uploadResult;
  } catch (err) {
    console.error(`Upload failed for ${filePath}:`, err);
    throw err;
  }
}

/**
 * Upload multiple files to a specific folder in Cloudinary
 */
export async function uploadMultipleToCloudinary(
  filePaths: string[],
  folder: string
): Promise<UploadApiResponse[]> {
  const results: UploadApiResponse[] = [];

  for (const filePath of filePaths) {
    const result = await uploadSingleToCloudinary(filePath, folder);
    results.push(result);
  }

  return results;
}

export async function uploadMultipleSafe(
  filePaths: string[],
  folder: string
): Promise<(UploadApiResponse | null)[]> {
  const uploadPromises = filePaths.map(async (filePath) => {
    try {
      return await uploadSingleToCloudinary(filePath, folder);
    } catch (err) {
      console.error(`Failed to upload ${filePath}:`, err);
      return null;
    }
  });

  return Promise.all(uploadPromises);
}
  

/**
 * "Create" a folder in Cloudinary by uploading a transparent image named __init__
 */
export async function createCloudinaryFolder(
  folder: string
): Promise<UploadApiResponse> {
  const transparent1x1 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9W9EsZcAAAAASUVORK5CYII=";

  try {
    const uploadResult = await cloudinary.uploader.upload(transparent1x1, {
      folder,
      public_id: "__init__",
      resource_type: "image",
    });
    return uploadResult;
  } catch (err) {
    console.error("Folder creation error:", err);
    throw err;
  }
}
