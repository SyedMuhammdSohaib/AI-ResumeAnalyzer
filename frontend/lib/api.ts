// Base URL of the backend API.
// Configure it per environment with NEXT_PUBLIC_API_URL
// (e.g. your Render URL in production). Falls back to local dev.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export const MAX_FILE_SIZE_MB = 5;

export function fileSizeError(file: File): string | null {
  if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
    return "Only PDF files are supported.";
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `File is too large (max ${MAX_FILE_SIZE_MB} MB).`;
  }
  return null;
}
