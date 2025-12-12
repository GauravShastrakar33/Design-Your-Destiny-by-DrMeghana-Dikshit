import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

interface R2Config {
  accountId: string | undefined;
  accessKeyId: string | undefined;
  secretAccessKey: string | undefined;
  bucketName: string | undefined;
  publicBaseUrl: string | undefined;
  signedUrlTtl: number;
}

const r2Config: R2Config = {
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucketName: process.env.R2_BUCKET_NAME,
  publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
  signedUrlTtl: parseInt(process.env.SIGNED_URL_TTL_SEC || "1800", 10),
};

export function checkR2Credentials(): { valid: boolean; error?: string } {
  if (!r2Config.accountId) {
    return { valid: false, error: "R2_ACCOUNT_ID is not configured" };
  }
  if (!r2Config.accessKeyId) {
    return { valid: false, error: "R2_ACCESS_KEY_ID is not configured" };
  }
  if (!r2Config.secretAccessKey) {
    return { valid: false, error: "R2_SECRET_ACCESS_KEY is not configured" };
  }
  if (!r2Config.bucketName) {
    return { valid: false, error: "R2_BUCKET_NAME is not configured" };
  }
  return { valid: true };
}

let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  const credCheck = checkR2Credentials();
  if (!credCheck.valid) {
    throw new Error(credCheck.error);
  }

  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2Config.accessKeyId!,
        secretAccessKey: r2Config.secretAccessKey!,
      },
    });
  }

  return r2Client;
}

function sanitizeFileName(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function generateCourseThumnailKey(courseId: number, filename: string): string {
  const timestamp = Date.now();
  const safeName = sanitizeFileName(filename);
  return `courses/${courseId}/thumbnail/${timestamp}-${safeName}`;
}

// Generate public URL from a key - useful for fixing legacy URLs stored in the database
export function getPublicUrlFromKey(key: string | null | undefined): string | null {
  if (!key) return null;
  
  if (r2Config.publicBaseUrl) {
    return `${r2Config.publicBaseUrl}/${key}`;
  }
  
  // Fallback to direct R2 URL (requires authentication)
  if (r2Config.accountId && r2Config.bucketName) {
    return `https://${r2Config.accountId}.r2.cloudflarestorage.com/${r2Config.bucketName}/${key}`;
  }
  
  return null;
}

// Extract key from a private R2 URL - useful for fixing legacy data
export function extractKeyFromPrivateUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Match pattern: https://{accountId}.r2.cloudflarestorage.com/{bucketName}/{key}
  const privateUrlPattern = /https:\/\/[a-f0-9]+\.r2\.cloudflarestorage\.com\/[^\/]+\/(.+)/;
  const match = url.match(privateUrlPattern);
  
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
}

// Fix a thumbnail URL - uses key if available, otherwise tries to extract from private URL
export function fixThumbnailUrl(
  thumbnailKey: string | null | undefined, 
  thumbnailUrl: string | null | undefined
): string | null {
  // If we have a key, generate the correct public URL
  if (thumbnailKey) {
    return getPublicUrlFromKey(thumbnailKey);
  }
  
  // If no key but URL exists, try to extract key from private URL and regenerate
  if (thumbnailUrl) {
    const extractedKey = extractKeyFromPrivateUrl(thumbnailUrl);
    if (extractedKey) {
      return getPublicUrlFromKey(extractedKey);
    }
    // If it's not a private R2 URL, return the original URL
    return thumbnailUrl;
  }
  
  return null;
}

export function generateLessonFileKey(lessonId: number, fileType: string, filename: string): string {
  const timestamp = Date.now();
  const safeName = sanitizeFileName(filename);
  return `lessons/${lessonId}/${fileType}/${timestamp}-${safeName}`;
}

export interface GetUploadUrlResult {
  success: boolean;
  uploadUrl?: string;
  key?: string;
  publicUrl?: string;
  error?: string;
}

export async function getSignedPutUrl(
  key: string,
  contentType: string,
  ttlSeconds?: number
): Promise<GetUploadUrlResult> {
  try {
    const credCheck = checkR2Credentials();
    if (!credCheck.valid) {
      return { success: false, error: credCheck.error };
    }

    const client = getR2Client();
    const ttl = ttlSeconds || r2Config.signedUrlTtl;

    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName!,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: ttl });
    
    const publicUrl = r2Config.publicBaseUrl 
      ? `${r2Config.publicBaseUrl}/${key}`
      : `https://${r2Config.accountId}.r2.cloudflarestorage.com/${r2Config.bucketName}/${key}`;

    return {
      success: true,
      uploadUrl,
      key,
      publicUrl,
    };
  } catch (error) {
    console.error("R2 signed PUT URL error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export interface GetSignedGetUrlResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function getSignedGetUrl(
  key: string,
  ttlSeconds?: number
): Promise<GetSignedGetUrlResult> {
  try {
    const credCheck = checkR2Credentials();
    if (!credCheck.valid) {
      return { success: false, error: credCheck.error };
    }

    const client = getR2Client();
    const ttl = ttlSeconds || r2Config.signedUrlTtl;

    const command = new GetObjectCommand({
      Bucket: r2Config.bucketName!,
      Key: key,
    });

    const url = await getSignedUrl(client, command, { expiresIn: ttl });

    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error("R2 signed GET URL error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function deleteR2Object(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const credCheck = checkR2Credentials();
    if (!credCheck.valid) {
      return { success: false, error: credCheck.error };
    }

    const client = getR2Client();

    const command = new DeleteObjectCommand({
      Bucket: r2Config.bucketName!,
      Key: key,
    });

    await client.send(command);

    return { success: true };
  } catch (error) {
    console.error("R2 delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export interface UploadToR2Result {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface DownloadR2ObjectResult {
  success: boolean;
  data?: Buffer;
  error?: string;
}

export async function downloadR2Object(key: string): Promise<DownloadR2ObjectResult> {
  try {
    const credCheck = checkR2Credentials();
    if (!credCheck.valid) {
      return { success: false, error: credCheck.error };
    }

    const client = getR2Client();

    const command = new GetObjectCommand({
      Bucket: r2Config.bucketName!,
      Key: key,
    });

    const response = await client.send(command);
    
    if (!response.Body) {
      return { success: false, error: "No body in response" };
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    const data = Buffer.concat(chunks);

    return { success: true, data };
  } catch (error) {
    console.error("R2 download error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function uploadBufferToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<UploadToR2Result> {
  try {
    const credCheck = checkR2Credentials();
    if (!credCheck.valid) {
      return { success: false, error: credCheck.error };
    }

    const client = getR2Client();

    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await client.send(command);

    const publicUrl = r2Config.publicBaseUrl 
      ? `${r2Config.publicBaseUrl}/${key}`
      : `https://${r2Config.accountId}.r2.cloudflarestorage.com/${r2Config.bucketName}/${key}`;

    return {
      success: true,
      url: publicUrl,
      key,
    };
  } catch (error) {
    console.error("R2 upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
