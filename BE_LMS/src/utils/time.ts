import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import appAssert from "./appAssert";
import { BAD_REQUEST } from "../constants/http";
import AppErrorCode from "../constants/appErrorCode";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TZ = "Asia/Ho_Chi_Minh";
const DEFAULT_FORMAT = "YYYY-MM-DDTHH:mm:ssZ";

/**
 * Thời gian hiện tại (UTC)
 * @returns string
 */
export const nowUTC = (): string => dayjs().utc().format(DEFAULT_FORMAT);

/**
 * Thời gian hiện tại ở Việt Nam
 * @returns string
 */
export const nowVN = (): string =>
  dayjs().tz(DEFAULT_TZ).format(DEFAULT_FORMAT);

/**
 * Lấy timezone hiện tại của người dùng (hoặc máy chủ)
 * @returns string
 */
export const nowTZone = (): string => dayjs.tz.guess();

/**
 * Thời gian hiện tại theo timezone của người dùng
 * ⚠️ Ở backend, lấy timezone của server
 * @returns string
 */
export const nowLocal = (): string =>
  dayjs().tz(nowTZone()).format(DEFAULT_FORMAT);

/**
 * UTC → Giờ VN
 * @param utcTime
 * @returns string
 */
export const toVNTime = (utcTime: string | number): string =>
  dayjs(utcTime).tz(DEFAULT_TZ).format(DEFAULT_FORMAT);

/**
 * UTC → Giờ địa phương
 * @param utcTime
 * @returns string
 */
export const toLocalTime = (utcTime: string | number): string =>
  dayjs(utcTime).tz(nowTZone()).format(DEFAULT_FORMAT);

/**
 * Chuyển múi giờ
 * @param time
 * @param fromTz
 * @param toTz
 * @param format
 * @returns string
 * @throws
 */
export const convertTime = (
  time: string | number,
  fromTz: string,
  toTz: string
): string => {
  const parsed = dayjs.tz(time, fromTz);
  appAssert(
    parsed.isValid(),
    BAD_REQUEST,
    "Invalid time",
    AppErrorCode.InvalidDateTime
  );
  return parsed.tz(toTz).format(DEFAULT_FORMAT);
};

/**
 * Format thời gian linh hoạt
 * @param date
 * @param format
 * @returns string
 * @throws
 */
export const formatDate = (date: string | number): string => {
  const parsed = dayjs(date);
  appAssert(
    parsed.isValid(),
    BAD_REQUEST,
    "Invalid time",
    AppErrorCode.InvalidDateTime
  );
  return parsed.format(DEFAULT_FORMAT);
};

/**
 * Convert từ múi giờ (VN/local) sang UTC Date để lưu DB
 */
export const parseToUTC = (
  time: string | number,
  fromTz = DEFAULT_TZ
): Date => {
  const parsed = dayjs.tz(time, fromTz);
  appAssert(
    parsed.isValid(),
    BAD_REQUEST,
    "Invalid time",
    AppErrorCode.InvalidDateTime
  );
  return parsed.utc().toDate();
};
