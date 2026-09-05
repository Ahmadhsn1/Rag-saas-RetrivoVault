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
  onDone?: (data: { title: string }) => void;
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
    try {
      const body = (await res.json()) as ApiErrorBody;
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    onError?.(new Error(message));
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

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
      const data = JSON.parse(dataMatch[1]);

      if (event === "sources") onSources?.(data.sources);
      else if (event === "token") onToken?.(data.delta);
      else if (event === "done") onDone?.(data);
      else if (event === "error") onError?.(new Error(data.message));
    }
  }
}
