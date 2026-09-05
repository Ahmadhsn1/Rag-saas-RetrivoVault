import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE || "/api";

export const api = axios.create({
  baseURL,
  withCredentials: true, // send the httpOnly refresh cookie
});

let accessToken = null;
let onAuthLost = null;

export function setAccessToken(token) {
  accessToken = token;
}
export function registerAuthLostHandler(fn) {
  onAuthLost = fn;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// On 401, try one silent refresh, then replay the original request.
let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && !original._retried && !original.url.includes("/auth/")) {
      original._retried = true;
      try {
        refreshing =
          refreshing ||
          api.post("/auth/refresh").finally(() => {
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
  }
);

// Helper for the SSE chat stream (fetch, not axios, for ReadableStream support).
export async function streamChat({ sessionId, content, collectionId, onSources, onToken, onDone, onError }) {
  const res = await fetch(`${baseURL}/chat/${sessionId}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify({ content, collectionId }),
  });

  if (!res.ok || !res.body) {
    onError?.(new Error(`Chat request failed (${res.status})`));
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
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
