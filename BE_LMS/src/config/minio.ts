import {
  BUCKET_NAME,
  MINIO_ACCESS_KEY,
  MINIO_ENDPOINT,
  MINIO_PORT,
  MINIO_SECRET_KEY,
  MINIO_USE_SSL,
} from "@/constants/env";
import { Client } from "minio";
import cron from "node-cron";

export const minioClient = new Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

/**
 * Ensure MinIO bucket exists and set policy to public read
 * Throws an error if the setup fails
 */
export async function ensureBucket() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, "us-east-1");
      console.log(`✅ Created bucket: ${BUCKET_NAME}`);
    }

    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
        },
      ],
    };

    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    console.log(`✅ Bucket policy set to public for ${BUCKET_NAME}`);
  } catch (err: any) {
    console.error("🚨 MinIO setup failed:", err.message);
    throw err; // Ném lỗi ra ngoài để biết app chưa sẵn sàng
  }
}

/**
 * Clean up incomplete uploads in the given bucket
 * @param {string} bucketName - the name of the bucket to clean up
 */
async function cleanupIncompleteUploads(bucketName: string) {
  const stream = minioClient.listIncompleteUploads(bucketName, "", true);
  stream.on("data", async (upload) => {
    try {
      await minioClient.removeIncompleteUpload(bucketName, upload.key);
      console.log(`🧹 Removed incomplete: ${upload.key}`);
    } catch (err: any) {
      console.error(err.message);
    }
  });

  stream.on("end", () => {
    console.log("🚀 Completed daily MinIO cleanup task.");
  });

  stream.on("error", (err: any) => {
    console.error(" 🚨 Error in daily MinIO cleanup task:", err.message);
  });
}

cron.schedule("0 0 2 * * *", () => {
  console.log("🚀 Running daily MinIO cleanup task...");
  cleanupIncompleteUploads(BUCKET_NAME);
});
