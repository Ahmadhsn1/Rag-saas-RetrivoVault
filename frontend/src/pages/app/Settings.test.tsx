import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import Settings from "./Settings";
import { AppProvider } from "@/context/AppContext";
import { renderWithProviders, fakeUser } from "@/test/utils";
import { mockApi } from "@/test/setup";

function stubApp() {
  mockApi.post.mockImplementation((url: string) =>
    url === "/auth/refresh"
      ? Promise.resolve({ data: { user: fakeUser, accessToken: "t" } })
      : Promise.reject(new Error("no")),
  );
  mockApi.get.mockImplementation((url: string) => {
    if (url === "/collections") return Promise.resolve({ data: { collections: [] } });
    if (url === "/usage")
      return Promise.resolve({
        data: {
          plan: "free",
          limits: {
            documents: 20,
            storageBytes: 52428800,
            queriesPerMonth: 100,
            collections: 3,
            apiKeys: 0,
          },
          current: { documents: 2, storageBytes: 1000, collections: 1, queries: 5 },
          remaining: { documents: 18, storageBytes: 0, collections: 2, queries: 95 },
          periodStart: new Date().toISOString(),
        },
      });
    if (url === "/billing")
      return Promise.resolve({
        data: {
          billingEnabled: false,
          plan: { id: "free", name: "Free", limits: {}, features: {} },
          subscriptionStatus: "none",
          planRenewsAt: null,
          hasBillingAccount: false,
          catalog: [],
        },
      });
    if (url === "/keys") return Promise.resolve({ data: { keys: [] } });
    return Promise.reject(new Error(`unstubbed ${url}`));
  });
}

describe("Settings", () => {
  it("shows the profile tab with the user's email and verified badge", async () => {
    stubApp();
    renderWithProviders(
      <AppProvider>
        <Settings />
      </AppProvider>,
      { route: "/app/settings" },
    );
    expect(await screen.findByDisplayValue("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("verified")).toBeInTheDocument();
  });

  it("switches to the plan & usage tab and renders usage bars", async () => {
    stubApp();
    renderWithProviders(
      <AppProvider>
        <Settings />
      </AppProvider>,
      { route: "/app/settings?tab=billing" },
    );
    expect(
      await screen.findByText(/questions this month/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/stripe isn't configured/i),
    ).toBeInTheDocument();
  });

  it("locks API keys behind the Max plan for a free user", async () => {
    stubApp();
    renderWithProviders(
      <AppProvider>
        <Settings />
      </AppProvider>,
      { route: "/app/settings?tab=keys" },
    );
    expect(
      await screen.findByText(/api keys are a max feature/i),
    ).toBeInTheDocument();
  });
});
