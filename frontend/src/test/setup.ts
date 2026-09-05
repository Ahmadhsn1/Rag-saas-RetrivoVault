import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi, type Mock } from "vitest";
import { cleanup } from "@testing-library/react";
import { api, streamChat } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  streamChat: vi.fn(),
  setAccessToken: vi.fn(),
  getAccessToken: vi.fn(() => null),
  registerAuthLostHandler: vi.fn(),
  apiErrorMessage: (err: unknown, fallback = "Something went wrong") =>
    err instanceof Error ? err.message : fallback,
}));

// GSAP touches layout APIs jsdom lacks — stub the whole module.
vi.mock("@/lib/motion", () => {
  const noop = () => undefined;
  return {
    gsap: {
      registerPlugin: noop,
      context: () => ({ revert: noop }),
      from: noop,
      to: noop,
      set: noop,
      utils: { toArray: () => [] },
    },
    ScrollTrigger: { refresh: noop },
    revealOnScroll: noop,
    prefersReducedMotion: () => true,
  };
});

export const mockApi = api as unknown as {
  get: Mock;
  post: Mock;
  patch: Mock;
  delete: Mock;
};
export const mockStreamChat = streamChat as unknown as Mock;

beforeEach(() => {
  // Default: not signed in.
  mockApi.get.mockRejectedValue(new Error("unauthorized"));
  mockApi.post.mockRejectedValue(new Error("unauthorized"));
  mockApi.patch.mockResolvedValue({ data: {} });
  mockApi.delete.mockResolvedValue({ data: {} });
  mockStreamChat.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// --- jsdom gaps ---
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

class Observer {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}
const w = window as unknown as Record<string, unknown>;
w.IntersectionObserver = Observer;
w.ResizeObserver = Observer;

window.HTMLElement.prototype.scrollTo = vi.fn();
window.HTMLElement.prototype.scrollIntoView = vi.fn();
Element.prototype.hasPointerCapture = vi.fn();
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();
