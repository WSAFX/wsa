'use client';

import { api } from './api';

export interface UploadResult {
  url: string;
  publicId: string;
  width: number | null;
  height: number | null;
}

/**
 * 1. Ask the backend for a Cloudinary signature (keeps the API secret server-side)
 * 2. Upload the file straight to Cloudinary from the browser
 * 3. Return the secure URL + public_id to store in Postgres via the backend
 */
export async function uploadToCloudinary(file: File, folder?: string): Promise<UploadResult> {
  const sign = await api.post<{
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    folder: string;
  }>('/media/sign', { folder });

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sign.apiKey);
  form.append('timestamp', String(sign.timestamp));
  form.append('signature', sign.signature);
  form.append('folder', sign.folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) throw new Error('Cloudinary upload failed');
  const data = await res.json();
  return {
    url: data.secure_url as string,
    publicId: data.public_id as string,
    width: typeof data.width === 'number' ? data.width : null,
    height: typeof data.height === 'number' ? data.height : null,
  };
}

/**
 * Uploads several files one after another (keeps the signature rate limit happy)
 * and reports progress. Failed files are skipped and returned in `failed`.
 */
export async function uploadMany(
  files: File[],
  folder: string,
  onProgress?: (done: number, total: number) => void,
): Promise<{ uploaded: UploadResult[]; failed: string[] }> {
  const uploaded: UploadResult[] = [];
  const failed: string[] = [];
  for (let i = 0; i < files.length; i++) {
    try {
      uploaded.push(await uploadToCloudinary(files[i], folder));
    } catch {
      failed.push(files[i].name);
    }
    onProgress?.(i + 1, files.length);
  }
  return { uploaded, failed };
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!publicId) return;
  await api.del('/media', { public_id: publicId });
}
