import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi, type Mock } from "vitest";
import { cleanup, configure } from "@testing-library/react";
import { api, streamChat } from "@/lib/api";

// Lazy route chunks + parallel workers can push a first render past the 1s default.
configure({ asyncUtilTimeout: 5000 });

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
    splitReveal: noop,
    parallax: noop,
    countUp: (el: HTMLElement, to: number) => {
      el.textContent = String(to);
    },
    prefersReducedMotion: () => true,
  };
});

// Framer Motion drives layout/transform APIs jsdom doesn't implement and gates
// reveals on IntersectionObserver. Render motion elements as plain DOM and make
// every hook inert so components take their reduced-motion (final-state) path.
vi.mock("framer-motion", async () => {
  const React = await import("react");

  const STRIP = new Set([
    "initial", "animate", "exit", "variants", "transition", "whileHover",
    "whileTap", "whileFocus", "whileInView", "whileDrag", "viewport", "layout",
    "layoutId", "layoutScroll", "drag", "dragConstraints", "dragElastic",
    "onViewportEnter", "onViewportLeave", "onAnimationComplete", "custom",
  ]);

  const clean = (props: Record<string, unknown>) => {
    const out: Record<string, unknown> = {};
    for (const k in props) if (!STRIP.has(k)) out[k] = props[k];
    return out;
  };

  const make = (tag: unknown) =>
    React.forwardRef(
      ({ children, ...props }: Record<string, unknown>, ref: unknown) =>
        React.createElement(
          (typeof tag === "string" ? tag : tag) as string,
          { ...clean(props), ref },
          children as React.ReactNode,
        ),
    );

  const base: Record<string, unknown> = { create: (tag: unknown) => make(tag) };
  const motion = new Proxy(base, {
    get: (target, key: string) => (key in target ? target[key] : make(key)),
  });

  const mv = (initial: unknown) => {
    let v = initial;
    return {
      get: () => v,
      set: (n: unknown) => { v = n; },
      on: () => () => {},
      destroy: () => {},
    };
  };

  return {
    motion,
    m: motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    MotionConfig: ({ children }: { children: React.ReactNode }) => children,
    LazyMotion: ({ children }: { children: React.ReactNode }) => children,
    domAnimation: {},
    domMax: {},
    useReducedMotion: () => true,
    useInView: () => true,
    useAnimationControls: () => ({ start: () => Promise.resolve(), set: () => {} }),
    useMotionValue: (v: unknown) => mv(v),
    useSpring: (v: unknown) => (v && typeof v === "object" ? v : mv(v)),
    useTransform: () => mv(0),
    useMotionTemplate: () => "",
    useScroll: () => ({ scrollY: mv(0), scrollYProgress: mv(0) }),
    useMotionValueEvent: () => {},
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

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
window.HTMLElement.prototype.scrollTo = vi.fn();
window.HTMLElement.prototype.scrollIntoView = vi.fn();
Element.prototype.hasPointerCapture = vi.fn();
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();
