import { BUCKET_NAME, MINIO_ENDPOINT } from "@/constants/env";
import { minioClient } from "../config/minio";
import { v4 } from "uuid";
import mime from "mime-types";
<<<<<<< HEAD

=======
import { nowLocal } from "./time";
>>>>>>> develop
/**
 * Upload 1 file, trả về public URL
 * @param file
 * @param prefix - Optional prefix string, defaults to prefixLessonMaterial with dummy ObjectIds
 * @returns
 */
<<<<<<< HEAD
export const uploadFile = async (
  file: Express.Multer.File,
  prefix: string
) => {
=======
export const uploadFile = async (file: Express.Multer.File, prefix: string) => {
>>>>>>> develop
  const key = `${prefix}/${v4()}/${file.originalname}`;
  await minioClient.putObject(BUCKET_NAME, key, file.buffer, file.size, {
    "Content-Type":
      mime.lookup(file.originalname) || "application/octet-stream",
  });

  // URL public
  const publicUrl = `https://${MINIO_ENDPOINT}/${BUCKET_NAME}/${key}`;

  return {
    publicUrl,
    key,
    originalName: file.originalname,
    mimeType: mime.lookup(file.originalname),
    size: file.size,
  };
};

/**
 * Upload nhiều file, trả về public URLs
 * @param files
 * @returns
 */
export const uploadFiles = async (
  files: Express.Multer.File[],
  prefix: string
) => {
  const uploaded = [];
  for (const file of files) {
    const res = await uploadFile(file, prefix);
    uploaded.push(res);
  }
  return uploaded;
};

/**
 * Trả về stream để download (proxy)
 * @param key
 * @returns
 */
export const getFile = async (key: string) => {
  return await minioClient.getObject(BUCKET_NAME, key);
<<<<<<< HEAD
};

/**
 *
 * @param key
 * @returns
 */
export const getPublicUrl = (key: string) =>
  `https://${MINIO_ENDPOINT}/${BUCKET_NAME}/${key}`;

/**
 * method to get signed url
 * @param key
 * @param expiresIn
 * @param filename
 * @returns
 */
export const getSignedUrl = async (
  key: string,
  expiresIn?: number,
  filename?: string
): Promise<string> => {
  const expiry = expiresIn ?? 24 * 60 * 60;
  const responseDisposition = filename
    ? `attachment; filename="${encodeURIComponent(filename)}"`
    : undefined;
  
  return await minioClient.presignedGetObject(
    BUCKET_NAME,
    key,
    expiry,
    responseDisposition ? { "response-content-disposition": responseDisposition } : undefined
  );
};

/**
 * Xóa file
 * @param key
 * @returns
 */
=======
};

/**
 *
 * @param key
 * @returns
 */
export const getPublicUrl = (key: string) =>
  `https://${MINIO_ENDPOINT}/${BUCKET_NAME}/${key}`;

/**
 * method to get signed url
 * @param key
 * @param expiresIn
 * @returns
 */
export const getSignedUrl = (
  key: string,
  expiresIn = 24 * 60 * 60,
  filename: string
) =>
  minioClient.presignedGetObject(BUCKET_NAME, key, expiresIn, {
    "response-content-disposition": `attachment; filename="${encodeURIComponent(
      `${nowLocal()}_${v4()}_${filename ? filename : ""}`
    )}"`,
  });

/**
 * Xóa file
 * @param key
 * @returns
 */
>>>>>>> develop
export const removeFile = async (key: string) => {
  return await minioClient.removeObject(BUCKET_NAME, key);
};

/**
 * Xóa nhiều file
 * @param keys
 * @returns
 */
export const removeFiles = async (key: string[]) => {
  return await minioClient.removeObjects(BUCKET_NAME, key);
};

/**
 * Thông tin file
 * @param key
 * @returns
 */
export const getStatFile = async (key: string) => {
  return await minioClient.statObject(BUCKET_NAME, key);
};

/**
 * Xóa nhiều file by prefix
 * @param keys
 * @returns
 */
export async function deleteFilesByPrefix(prefix: string) {
<<<<<<< HEAD
  const objectsList: string[] = [];

  try {
    // ✅ Bọc toàn bộ trong try/catch để tránh crash
    await new Promise<void>((resolve, reject) => {
      const stream = minioClient.listObjectsV2(BUCKET_NAME, prefix, true);

      stream.on("data", (obj) => {
        if (obj.name) objectsList.push(obj.name);
      });

      stream.on("end", () => resolve());
      stream.on("error", (err) => {
        console.error("❌ Error when listing objects:", err);
        reject(err);
      });
    });

    // Không có file nào để xóa
    if (objectsList.length === 0) {
      console.log(`⚠️ There is no file to delete in prefix "${prefix}"`);
      return;
    }

    // ✅ Xóa từng file thay vì xóa toàn bộ 1 lần — tránh lỗi dừng giữa chừng
    const failed: string[] = [];

    for (const fileKey of objectsList) {
      try {
        await minioClient.removeObject(BUCKET_NAME, fileKey);
        console.log(`🗑️ Deleted: ${fileKey}`);
      } catch (err) {
        console.error(`❌ Error when deleting ${fileKey}:`, err);
        failed.push(fileKey);
      }
    }

    if (failed.length > 0) {
      console.warn(
        `⚠️ Failed to delete ${failed.length} file:\n${failed.join(",\n")}`
      );
    } else {
      console.log(
        `✅ Deleted ${objectsList.length} files in prefix "${prefix}"`
      );
    }
  } catch (err) {
    // ✅ Nếu toàn bộ stream bị lỗi, không để crash
=======
  console.log(`🧹 Starting deletion in prefix "${prefix}"...`);
  let totalDeleted = 0;
  const failed: string[] = [];

  try {
    let startAfter: string | undefined = undefined;

    while (true) {
      const objectsList: string[] = [];

      // ✅ 1. Lấy 1 batch file (tối đa ~1000)
      await new Promise<void>((resolve, reject) => {
        const stream = minioClient.listObjectsV2(
          BUCKET_NAME,
          prefix,
          true,
          startAfter
        );

        stream.on("data", (obj) => {
          if (obj.name) {
            objectsList.push(obj.name);
            startAfter = obj.name; // lưu lại để phân trang batch kế tiếp
          }
        });

        stream.on("end", () => resolve());
        stream.on("error", (err) => {
          console.error("❌ Error when listing objects:", err);
          reject(err);
        });
      });

      // ✅ 2. Nếu không còn file nào → dừng
      if (objectsList.length === 0) {
        console.log(`✅ No more files found in prefix "${prefix}".`);
        break;
      }

      console.log(`📦 Found ${objectsList.length} files, deleting...`);

      // ✅ 3. Xóa từng file trong batch
      for (const fileKey of objectsList) {
        try {
          await minioClient.removeObject(BUCKET_NAME, fileKey);
          console.log(`🗑️ Deleted: ${fileKey}`);
          totalDeleted++;
        } catch (err) {
          console.error(`❌ Error deleting ${fileKey}:`, err);
          failed.push(fileKey);
        }
      }

      // ✅ 4. Nếu < 1000 file thì không cần lặp tiếp
      if (objectsList.length < 1000) break;
    }

    // ✅ 5. Kết quả cuối cùng
    console.log(
      `✅ Finished! Deleted ${totalDeleted} file(s) from prefix "${prefix}".`
    );
    if (failed.length > 0) {
      console.warn(
        `⚠️ Failed to delete ${failed.length} files:\n${failed.join("\n")}`
      );
    }
  } catch (err) {
>>>>>>> develop
    console.error(`🚨 Fatal error while deleting prefix "${prefix}":`, err);
  }
}
