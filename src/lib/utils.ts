import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Download a file from an API endpoint
 * @param url - The API endpoint URL
 * @param filename - The filename to save as
 * @param params - Optional query parameters
 * @returns Promise that resolves when download starts
 */
export async function downloadExport(
  url: string,
  filename: string,
  params?: Record<string, string>
): Promise<void> {
  try {
    // Build query string if params provided
    const queryString = params 
      ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => v)).toString()
      : '';

    // Get auth token from localStorage (adjust key if needed)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    // Make request
    const response = await fetch(`${url}${queryString}`, {
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    // Create blob from response
    const blob = await response.blob();
    
    // Create download link and trigger
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}
