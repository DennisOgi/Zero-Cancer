export const utility = () => {
  // This is a placeholder for shared utility functions.
  // You can add any utility functions that are used across the application here.
  console.log("Shared utility function called");
};
export const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0]; // Returns date in YYYY-MM-DD format
};
export const formatPhoneNumber = (phone: string): string => {
  // Simple phone number formatting (e.g., remove non-numeric characters)
  return phone.replace(/\D/g, "");
};

/**
 * Formats currency amounts in Nigerian Naira for display in logs and reports.
 *
 * @param amount - Numeric amount to format
 * @returns Formatted currency string (e.g., "₦50,000")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats duration in milliseconds to human-readable format.
 * Used for performance monitoring and logging.
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string (e.g., "1.5s", "2.3m")
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}
