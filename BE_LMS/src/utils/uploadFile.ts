import { BUCKET_NAME, MINIO_ENDPOINT } from "@/constants/env";
import { minioClient } from "../config/minio";
import { v4 } from "uuid";
/**
 * Upload 1 file, trả về public URL
 * @param file
 * @returns
 */
export const uploadFile = async (file: Express.Multer.File) => {
  const fileName = `${v4()}-${file.originalname}`;
  await minioClient.putObject(BUCKET_NAME, fileName, file.buffer);

  // URL public
  const url = `https://${MINIO_ENDPOINT}/${BUCKET_NAME}/${fileName}`;
  return { fileName, url };
};

/**
 * Upload nhiều file, trả về public URLs
 * @param files
 * @returns
 */
export const uploadFiles = async (files: Express.Multer.File[]) => {
  const uploaded = [];
  for (const file of files) {
    const res = await uploadFile(file);
    uploaded.push(res);
  }
  return uploaded;
};

/**
 * Trả về stream để download (proxy)
 * @param fileName
 * @returns
 */
export const getFile = async (fileName: string) => {
  return await minioClient.getObject(BUCKET_NAME, fileName);
};

/**
 * Xóa file
 * @param fileName
 * @returns
 */
export const removeFile = async (fileName: string) => {
  return await minioClient.removeObject(BUCKET_NAME, fileName);
};

/**
 * Xóa nhiều file
 * @param fileNames
 * @returns
 */
export const removeFiles = async (fileNames: string[]) => {
  return await minioClient.removeObjects(BUCKET_NAME, fileNames);
};

/**
 * Thông tin file
 * @param fileName
 * @returns
 */
export const getStatFile = async (fileName: string) => {
  return await minioClient.statObject(BUCKET_NAME, fileName);
};
