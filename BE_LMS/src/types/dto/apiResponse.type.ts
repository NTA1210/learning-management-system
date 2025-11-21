export interface IApiError {
  code?: string;
  details?: any;
}

export interface IApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T | null;
  error?: IApiError | null;
  meta?: {
    timestamp: string;
    timezone: string;
    [key: string]: any;
  };
}
