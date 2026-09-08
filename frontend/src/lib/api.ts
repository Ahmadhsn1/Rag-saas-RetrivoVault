import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiErrorBody, AuthResponse, RetrievedSource } from "@/types/api";

const baseURL = import.meta.env.VITE_API_BASE || "/api";

export const api = axios.create({
  baseURL,
  withCredentials: true, // send the httpOnly refresh cookie
});

let accessToken: string | null = null;
let onAuthLost: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}
export function registerAuthLostHandler(fn: () => void) {
  onAuthLost = fn;
}

export function apiErrorMessage(err: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiErrorBody | undefined;
    return body?.error || err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

/** Machine-readable error code the API attaches (e.g. "quota_exceeded"). */
export function apiErrorCode(err: unknown): string | null {
  if (axios.isAxiosError(err)) {
    const details = (err.response?.data as ApiErrorBody | undefined)?.details as
      | { code?: string }
      | undefined;
    return details?.code ?? null;
  }
  return null;
}

export function apiErrorStatus(err: unknown): number | null {
  return axios.isAxiosError(err) ? (err.response?.status ?? null) : null;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshing: Promise<{ data: AuthResponse }> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      original &&
      !original._retried &&
      !original.url?.includes("/auth/")
    ) {
      original._retried = true;
      try {
        refreshing =
          refreshing ||
          api.post<AuthResponse>("/auth/refresh").finally(() => {
            refreshing = null;
          });
        const { data } = await refreshing;
        setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        onAuthLost?.();
      }
    }
    return Promise.reject(error);
  },
);

export interface StreamChatArgs {
  sessionId: string;
  content: string;
  collectionId?: string | null;
  onSources?: (sources: RetrievedSource[]) => void;
  onToken?: (delta: string) => void;
  onDone?: (data: { title: string; messageId?: string }) => void;
  onError?: (err: Error) => void;
  signal?: AbortSignal;
}

// SSE stream for the chat answer. Uses fetch for ReadableStream support.
export async function streamChat({
  sessionId,
  content,
  collectionId,
  onSources,
  onToken,
  onDone,
  onError,
  signal,
}: StreamChatArgs) {
  let res: Response;
  try {
    res = await fetch(`${baseURL}/chat/${sessionId}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      credentials: "include",
      body: JSON.stringify({ content, collectionId }),
      signal,
    });
  } catch (err) {
    onError?.(err instanceof Error ? err : new Error("Network error"));
    return;
  }

  if (!res.ok || !res.body) {
    let message = `Chat request failed (${res.status})`;
    let code: string | null = null;
    try {
      const body = (await res.json()) as ApiErrorBody & {
        details?: { code?: string };
      };
      if (body?.error) message = body.error;
      code = body?.details?.code ?? null;
    } catch {
      /* ignore */
    }
    const err = new Error(message) as Error & { code?: string | null };
    err.code = code;
    onError?.(err);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const frames = buffer.split("\n\n");
      buffer = frames.pop() || "";

      for (const frame of frames) {
        const eventMatch = frame.match(/^event: (.+)$/m);
        const dataMatch = frame.match(/^data: (.+)$/m);
        if (!eventMatch || !dataMatch) continue;
        const event = eventMatch[1].trim();
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(dataMatch[1]);
        } catch {
          continue; // ignore a malformed frame rather than aborting the stream
        }

        if (event === "sources")
          onSources?.((data.sources as RetrievedSource[]) ?? []);
        else if (event === "token") onToken?.(String(data.delta ?? ""));
        else if (event === "done")
          onDone?.(data as { title: string; messageId?: string });
        else if (event === "error")
          onError?.(new Error(String(data.message ?? "Generation failed")));
      }
    }
  } catch (err) {
    // AbortError is expected when the user hits Stop.
    if ((err as Error)?.name !== "AbortError") {
      onError?.(err instanceof Error ? err : new Error("Stream interrupted"));
    }
  }
}
