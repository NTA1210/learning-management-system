/**
 * Get current date in UTC+7 timezone in YYYY-MM-DD format
 */
export const getCurrentDateUTC7 = (): string => {
  const now = new Date();
  // Convert to UTC+7 (7 hours ahead of UTC)
  const utc7Time = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  return utc7Time.toISOString().split("T")[0];
};

/**
 * Check if a date string is today in UTC+7
 */
export const isTodayUTC7 = (date: string): boolean => {
  return date === getCurrentDateUTC7();
};

/**
 * Format date to UTC+7 timezone string
 */
export const formatDateUTC7 = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const utc7Time = new Date(d.getTime() + (7 * 60 * 60 * 1000));
  return utc7Time.toISOString().split("T")[0];
};

/**
 * Calculate percentage of days passed between start and end date
 */
export const calculateProgressPercentage = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  // Adjust to UTC+7
  const nowUTC7 = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const daysPassed = Math.ceil((nowUTC7.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  if (totalDays <= 0) return 0;
  if (daysPassed < 0) return 0;
  if (daysPassed > totalDays) return 100;
  
  return Math.round((daysPassed / totalDays) * 100);
};

/**
 * Calculate total days between two dates
 */
export const calculateTotalDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

