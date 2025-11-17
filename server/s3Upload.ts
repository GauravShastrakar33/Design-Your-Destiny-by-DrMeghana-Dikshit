import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";

interface S3Config {
  accessKeyId: string | undefined;
  secretAccessKey: string | undefined;
  region: string | undefined;
  bucket: string | undefined;
}

const s3Config: S3Config = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "ap-south-1",
  bucket: process.env.AWS_BUCKET_NAME,
};

export function checkS3Credentials(): { valid: boolean; error?: string } {
  if (!s3Config.accessKeyId) {
    return { valid: false, error: "AWS_ACCESS_KEY_ID is not configured" };
  }
  if (!s3Config.secretAccessKey) {
    return { valid: false, error: "AWS_SECRET_ACCESS_KEY is not configured" };
  }
  if (!s3Config.bucket) {
    return { valid: false, error: "AWS_BUCKET_NAME is not configured" };
  }
  return { valid: true };
}

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  const credCheck = checkS3Credentials();
  if (!credCheck.valid) {
    throw new Error(credCheck.error);
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: s3Config.region!,
      credentials: {
        accessKeyId: s3Config.accessKeyId!,
        secretAccessKey: s3Config.secretAccessKey!,
      },
    });
  }

  return s3Client;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadToS3(
  file: Express.Multer.File,
  folder: string
): Promise<UploadResult> {
  try {
    const credCheck = checkS3Credentials();
    if (!credCheck.valid) {
      return {
        success: false,
        error: credCheck.error,
      };
    }

    const client = getS3Client();
    const timestamp = Date.now();
    const fileExt = path.extname(file.originalname);
    const fileName = `${timestamp}${fileExt}`;
    const key = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: s3Config.bucket!,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await client.send(command);

    const url = `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;

    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error("S3 upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
