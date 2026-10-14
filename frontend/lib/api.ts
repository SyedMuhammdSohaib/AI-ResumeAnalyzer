// Base URL of the backend API.
// Configure it per environment with NEXT_PUBLIC_API_URL
// (e.g. your Render URL in production). Falls back to local dev.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export const MAX_FILE_SIZE_MB = 5;

export const OFFLINE_ERROR = `Could not reach the API at ${API_BASE}. Is the backend running?`;

export function fileSizeError(file: File): string | null {
  if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
    return "Only PDF files are supported.";
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `File is too large (max ${MAX_FILE_SIZE_MB} MB).`;
  }
  return null;
}

export async function readError(response: Response): Promise<string> {
  let detail = `Request failed (${response.status}).`;
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") detail = body.detail;
    else if (Array.isArray(body?.detail) && typeof body.detail[0]?.msg === "string") {
      detail = body.detail[0].msg;
    }
  } catch {
    /* non-JSON error body */
  }
  return detail;
}

/** POST to the API and return parsed JSON, or throw an Error with a readable message. */
export async function postApi<T>(path: string, body: FormData | object): Promise<T> {
  const isForm = body instanceof FormData;
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      body: isForm ? body : JSON.stringify(body),
      headers: isForm ? undefined : { "Content-Type": "application/json" },
    });
  } catch {
    throw new Error(OFFLINE_ERROR);
  }
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as T;
}
