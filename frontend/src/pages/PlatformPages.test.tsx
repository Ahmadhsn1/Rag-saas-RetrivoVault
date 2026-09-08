import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import axios from "axios";
import App from "@/App";
import { renderWithProviders, fakeUser } from "@/test/utils";
import { mockApi } from "@/test/setup";

vi.mock("axios", () => ({
  default: { get: vi.fn(), isAxiosError: () => false },
}));

const mockedAxios = axios as unknown as { get: ReturnType<typeof vi.fn> };

const OPENAPI = {
  data: {
    info: { title: "Retrivo Vault API", version: "1.0.0", description: "x" },
    servers: [{ url: "http://localhost/api" }],
    paths: { "/documents": { get: { summary: "List documents" } } },
    "x-webhooks": { "document.ready": { description: "fires" } },
  },
};

beforeEach(() => {
  mockedAxios.get.mockResolvedValue(OPENAPI);
});

function signedIn(role: "user" | "admin" = "user") {
  mockApi.post.mockImplementation((url: string) =>
    url === "/auth/refresh"
      ? Promise.resolve({
          data: { user: { ...fakeUser, role }, accessToken: "t" },
        })
      : Promise.reject(new Error("no")),
  );
  mockApi.get.mockImplementation((url: string) => {
    const ok = (data: unknown) => Promise.resolve({ data });
    if (url === "/collections") return ok({ collections: [] });
    if (url === "/chat") return ok({ sessions: [] });
    if (url === "/documents")
      return ok({ documents: [], total: 0, page: 1, pages: 1 });
    if (url === "/notifications") return ok({ items: [], unread: 0 });
    if (url === "/usage")
      return ok({
        plan: "free",
        limits: {
          documents: 20,
          storageBytes: 1,
          queriesPerMonth: 100,
          collections: 3,
          apiKeys: 0,
        },
        current: { documents: 0, storageBytes: 0, collections: 0, queries: 0 },
        remaining: {
          documents: 20,
          storageBytes: 1,
          collections: 3,
          queries: 100,
        },
        periodStart: new Date().toISOString(),
      });
    if (url === "/auth/me") return ok({ user: { ...fakeUser, role } });
    if (url === "/admin/stats")
      return ok({
        users: 5,
        documents: 12,
        chats: 3,
        queriesLast30d: 40,
        newUsersLast30d: 2,
        planCounts: { free: 4, pro: 1 },
        estimatedMrr: 12,
        plans: ["free", "pro", "max"],
      });
    if (url === "/admin/users")
      return ok({
        users: [
          {
            _id: "u1",
            name: "Bob",
            email: "bob@x.com",
            plan: "free",
            role: "user",
            subscriptionStatus: "none",
            emailVerified: true,
            lockedUntil: null,
            trialEndsAt: null,
            createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        pages: 1,
      });
    return Promise.reject(new Error(`unstubbed ${url}`));
  });
}

describe("platform pages render without runtime errors", () => {
  it("/docs shows the API reference from the OpenAPI spec", async () => {
    mockedAxios.get.mockResolvedValue(OPENAPI);
    renderWithProviders(<App />, { route: "/docs" });
    expect(
      await screen.findByRole("heading", { name: /api reference/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText("/documents")).toBeInTheDocument();
    expect(screen.getByText("document.ready")).toBeInTheDocument();
  });

  it("/s/:shareId shows the shared conversation", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        session: {
          title: "Shared thread",
          sharedAt: new Date().toISOString(),
          messages: [{ role: "assistant", content: "public answer" }],
        },
      },
    });
    renderWithProviders(<App />, { route: "/s/abc123" });
    expect(await screen.findByText("Shared thread")).toBeInTheDocument();
    expect(screen.getByText("public answer")).toBeInTheDocument();
  });

  it("/app/admin renders the dashboard for an admin", async () => {
    signedIn("admin");
    renderWithProviders(<App />, { route: "/app/admin" });
    expect(await screen.findByText(/est\. mrr/i)).toBeInTheDocument();
    expect(screen.getByText("bob@x.com")).toBeInTheDocument();
  });

  it("/app/settings?tab=notifications renders the preferences", async () => {
    signedIn();
    renderWithProviders(<App />, { route: "/app/settings?tab=notifications" });
    expect(
      await screen.findByText(/document processed/i),
    ).toBeInTheDocument();
  });
});
