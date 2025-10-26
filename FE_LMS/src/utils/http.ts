import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type Method,
} from "axios";

// ===============================
// 1️⃣ Cấu hình Axios gốc
// ===============================
export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_BASE_API,
  timeout: 10000,
  withCredentials: true, // Enable cookies for authentication
});

// ===============================
// 2️⃣ Định nghĩa kiểu dữ liệu API
// ===============================
export interface ApiResponse<T = unknown> {
  success: boolean;
  status?: number | null;
  message?: string;
  data?: T;
}

// ===============================
// 3️⃣ Interceptors
// ===============================
httpClient.interceptors.request.use(
  (config) => {
    // Debug: Check if cookies will be sent
    console.log("Request to:", config.url);
    console.log("With credentials:", config.withCredentials);
    
    // Ví dụ: thêm token nếu cần
    // const token = localStorage.getItem("token");
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

httpClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

// ===============================
// 4️⃣ Hàm gửi request tổng quát
// ===============================
const _send = async <T = unknown>(
  method: Method,
  pathname: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<{ data: T; message?: string }> => {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await httpClient.request({
      method,
      url: pathname,
      data,
      withCredentials: true, // Ensure credentials are always sent
      ...config,
    });

    const { success, data: payload, message } = response.data;

    // Nếu success=false → coi là lỗi logic từ backend
    if (!success) {
      throw new Error(message || "Request failed");
    }

    // ✅ Trả về cả data và message
    return { data: payload as T, message };
  } catch (err) {
    const error = err as AxiosError<ApiResponse>;
    console.error("HTTP Error:", error);

    // Trả về lỗi chuẩn
    throw {
      success: false,
      status: error.response?.status || null,
      message:
        error.response?.data?.message ||
        error.message ||
        "Unknown error occurred",
    } as ApiResponse;
  }
};

// ===============================
// 5️⃣ Hàm tiện ích cho từng method
// ===============================
const get = <T = unknown>(pathname: string, config?: AxiosRequestConfig) =>
  _send<T>("GET", pathname, undefined, config);

const post = <T = unknown>(
  pathname: string,
  data?: unknown,
  config?: AxiosRequestConfig
) => _send<T>("POST", pathname, data, config);

const put = <T = unknown>(
  pathname: string,
  data?: unknown,
  config?: AxiosRequestConfig
) => _send<T>("PUT", pathname, data, config);

const del = <T = unknown>(pathname: string, config?: AxiosRequestConfig) =>
  _send<T>("DELETE", pathname, undefined, config);

const patch = <T = unknown>(
  pathname: string,
  data?: unknown,
  config?: AxiosRequestConfig
) => _send<T>("PATCH", pathname, data, config);

// ===============================
// 6️⃣ Export object dùng chung
// ===============================
const http = { get, post, put, del, patch };
export default http;
