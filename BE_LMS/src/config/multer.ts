import AppErrorCode from "@/constants/appErrorCode";
import AppError from "@/utils/AppError";
import multer from "multer";

const FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/zip",
  "application/x-rar-compressed",
  "image/jpeg",
  "image/png",
  "video/mp4",
  "audio/mpeg",
];

const storage = multer.memoryStorage();
const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  try {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new Error("File type not allowed!");
    }
    cb(null, true);
  } catch (err: any) {
    cb(new AppError(err.message, 400, AppErrorCode.InvalidFileType));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: FILE_SIZE },
});

export default upload;
