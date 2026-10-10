import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { renderWithProviders, fakeUser } from "@/test/utils";
import { mockApi } from "@/test/setup";

const STATS = {
  users: 5,
  documents: 12,
  chats: 3,
  queriesLast30d: 40,
  newUsersLast30d: 2,
  planCounts: { free: 4, pro: 1 },
  estimatedMrr: 12,
  plans: ["free", "pro", "max"],
  onlineNow: 2,
  activeToday: 3,
  active7d: 4,
  compedUsers: 1,
  suspendedUsers: 0,
  admins: 1,
  pushSubscribers: 0,
  health: {
    db: "up",
    queue: {},
    features: { billing: false, mail: false, push: false, gemini: true },
  },
};

function signedInAdmin() {
  mockApi.post.mockImplementation((url: string) =>
    url === "/auth/refresh"
      ? Promise.resolve({
          data: { user: { ...fakeUser, role: "admin", isRootAdmin: true }, accessToken: "t" },
        })
      : Promise.reject(new Error("no")),
  );
  mockApi.get.mockImplementation((url: string) => {
    const ok = (data: unknown) => Promise.resolve({ data });
    if (url === "/collections") return ok({ collections: [] });
    if (url === "/chat") return ok({ sessions: [] });
    if (url === "/documents") return ok({ documents: [], total: 0, page: 1, pages: 1 });
    if (url === "/notifications") return ok({ items: [], unread: 0 });
    if (url === "/usage")
      return ok({
        plan: "free",
        limits: { documents: 20, storageBytes: 1, queriesPerMonth: 100, collections: 3, apiKeys: 0 },
        current: { documents: 0, storageBytes: 0, collections: 0, queries: 0 },
        remaining: { documents: 20, storageBytes: 1, collections: 3, queries: 100 },
        periodStart: new Date().toISOString(),
      });
    if (url === "/auth/me") return ok({ user: { ...fakeUser, role: "admin", isRootAdmin: true } });
    if (url === "/admin/stats") return ok(STATS);
    if (url === "/admin/timeseries")
      return ok({ days: 30, series: Array.from({ length: 30 }, (_, i) => ({ date: `d${i}`, signups: i, queries: i * 2, ingests: 0 })) });
    if (url === "/admin/presence")
      return ok({
        count: 1,
        windowMs: 120000,
        online: [
          {
            userId: "u9",
            name: "Nadia Online",
            email: "nadia@x.com",
            plan: "pro",
            role: "user",
            device: "Chrome on macOS",
            ip: "1.2.3.4",
            since: new Date().toISOString(),
            lastSeenAt: new Date().toISOString(),
          },
        ],
      });
    if (url === "/admin/sessions")
      return ok({
        items: [
          {
            id: "s1",
            userId: "u9",
            user: { name: "Nadia Online", email: "nadia@x.com" },
            device: "Chrome on macOS",
            ip: "1.2.3.4",
            startedAt: new Date(Date.now() - 3600_000).toISOString(),
            lastSeenAt: new Date().toISOString(),
            endedAt: null,
            endReason: null,
            durationMs: 3600_000,
            online: true,
          },
        ],
      });
    if (url === "/admin/broadcasts") return ok({ items: [] });
    if (url === "/admin/audiences")
      return ok({ audiences: { all: "Everyone" }, pushEnabled: false });
    if (url === "/admin/audience-count") return ok({ audience: "all", count: 5 });
    if (url === "/admin/audit") return ok({ items: [] });
    return Promise.reject(new Error(`unstubbed ${url}`));
  });
}

beforeEach(signedInAdmin);

describe("admin console", () => {
  it("shows live presence on the Presence tab", async () => {
    renderWithProviders(<App />, { route: "/app/admin?tab=presence" });
    expect((await screen.findAllByText("nadia@x.com")).length).toBeGreaterThan(0);
    expect(screen.getByText(/online now/i)).toBeInTheDocument();
  });

  it("previews the audience count on the Broadcasts tab", async () => {
    renderWithProviders(<App />, { route: "/app/admin?tab=broadcasts" });
    expect(await screen.findByText(/5 recipients/i)).toBeInTheDocument();
  });

  it("sends a broadcast", async () => {
    mockApi.post.mockImplementation((url: string) => {
      if (url === "/auth/refresh")
        return Promise.resolve({
          data: { user: { ...fakeUser, role: "admin" }, accessToken: "t" },
        });
      if (url === "/admin/broadcasts") return Promise.resolve({ data: { broadcast: {} } });
      return Promise.reject(new Error("no"));
    });
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: "/app/admin?tab=broadcasts" });

    const title = await screen.findByLabelText("Title");
    await user.type(title, "Heads up");
    await user.click(screen.getByRole("button", { name: /send broadcast/i }));

    await waitFor(() =>
      expect(mockApi.post).toHaveBeenCalledWith(
        "/admin/broadcasts",
        expect.objectContaining({ title: "Heads up", audience: "all" }),
      ),
    );
  });
});
