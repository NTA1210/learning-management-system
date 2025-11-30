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
  paramsSerializer: (params: Record<string, any>) => {
    // Custom serializer to ensure all params are strings
    // This is critical for endpoints like /courses/:courseId/quizzes that require string params
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Convert all values to string (number, boolean, string all become string)
        searchParams.append(key, String(value));
      }
    });
    return searchParams.toString();
  },
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

// Extend AxiosRequestConfig to track retry flag
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

httpClient.interceptors.request.use(
  (config) => {
    // Debug: Check if cookies will be sent
    console.log("Request to:", config.url);
    console.log("With credentials:", config.withCredentials);
    
    // Convert all query params to strings for endpoints that require string params
    // This is especially important for /courses/:courseId/quizzes endpoint
    // Backend expects ALL params as strings, so we convert everything to string
    if (config.params) {
      const originalParams = config.params;
      console.log("Original params:", originalParams, "Type:", typeof originalParams);
      
      if (config.params instanceof URLSearchParams) {
        // If it's already URLSearchParams, convert each value to string
        const newParams = new URLSearchParams();
        config.params.forEach((value, key) => {
          // Ensure value is always a string
          const stringValue = String(value);
          console.log(`Converting param ${key}: ${value} (${typeof value}) -> ${stringValue} (string)`);
          newParams.append(key, stringValue);
        });
        config.params = newParams;
      } else if (typeof config.params === 'object' && !Array.isArray(config.params)) {
        // If it's a plain object, convert all values to strings
        // This ensures numbers, booleans, and strings are all converted to strings
        const stringParams: Record<string, string> = {};
        Object.entries(config.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // Convert all values to string
            // If already a string (including strings with quotes like "5"), keep as-is
            // If number or boolean, convert to string
            const stringValue = typeof value === 'string' ? value : String(value);
            console.log(`Converting param ${key}: ${value} (${typeof value}) -> ${stringValue} (string)`);
            stringParams[key] = stringValue;
          }
        });
        config.params = stringParams;
        console.log("Converted params:", config.params);
      }
    }
    
    // Ví dụ: thêm token nếu cần
    // const token = localStorage.getItem("token");
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalConfig = error.config as ExtendedAxiosRequestConfig | undefined;
    const status = error.response?.status;

    // Check if user is on login/auth pages
    const isOnAuthPage = typeof window !== "undefined" && 
      (window.location.pathname === "/login" || 
       window.location.pathname === "/register" ||
       window.location.pathname === "/forgot-password" ||
       window.location.pathname.startsWith("/reset-password") ||
       window.location.pathname.startsWith("/auth/verify-email"));

    if (
      status === 401 &&
      originalConfig &&
      !originalConfig._retry &&
      originalConfig.url !== "/auth/refresh" &&
      !isOnAuthPage
    ) {
      originalConfig._retry = true;
      try {
        await httpClient.get("/auth/refresh", { withCredentials: true });
        return httpClient.request(originalConfig);
      } catch (refreshError) {
        try {
          localStorage.removeItem("isAuthenticated");
          localStorage.removeItem("userData");
          localStorage.removeItem("lms:user");
        } catch {
          // ignore storage errors
        }
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ===============================
// 4️⃣ Hàm gửi request tổng quát
// ===============================
const _send = async <T = unknown>(
  method: Method,
  pathname: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<any> => {
  try {
    const response: AxiosResponse<any> = await httpClient.request({
      method,
      url: pathname,
      data,
      withCredentials: true, // Ensure credentials are always sent
      ...config,
    });
    const responseData = response.data;
    if (!responseData.success) {
      throw new Error(responseData.message || "Request failed");
    }
    // Return fully structured response
    return responseData;
  } catch (err) {
    const error = err as AxiosError<any>;
    console.error("HTTP Error:", error);
    throw {
      success: false,
      status: error.response?.status || null,
      message:
        error.response?.data?.message ||
        error.message ||
        "Unknown error occurred",
    };
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
