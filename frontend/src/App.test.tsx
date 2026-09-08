import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import App from "./App";
import { renderWithProviders, fakeUser } from "@/test/utils";
import { mockApi } from "@/test/setup";

function signedIn() {
  mockApi.post.mockImplementation((url: string) =>
    url === "/auth/refresh"
      ? Promise.resolve({ data: { user: fakeUser, accessToken: "t" } })
      : Promise.reject(new Error("not stubbed")),
  );
  mockApi.get.mockImplementation((url: string) => {
    if (url === "/collections") return Promise.resolve({ data: { collections: [] } });
    if (url === "/chat") return Promise.resolve({ data: { sessions: [] } });
    if (url === "/documents") return Promise.resolve({ data: { documents: [] } });
    if (url === "/usage")
      return Promise.resolve({
        data: {
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
        },
      });
    if (url === "/auth/me") return Promise.resolve({ data: { user: fakeUser } });
    return Promise.reject(new Error(`unstubbed GET ${url}`));
  });
}

describe("App routing", () => {
  it("renders the marketing landing at /", async () => {
    renderWithProviders(<App />, { route: "/" });
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /your documents,\s*answerable/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /start your vault/i })[0],
    ).toBeInTheDocument();
  });

  it("renders the login page at /login", async () => {
    renderWithProviders(<App />, { route: "/login" });
    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("renders the pricing page at /pricing", async () => {
    renderWithProviders(<App />, { route: "/pricing" });
    expect(
      await screen.findByRole("heading", { name: /priced for one person/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Max")).toBeInTheDocument();
  });

  it("renders the signup page at /signup", async () => {
    renderWithProviders(<App />, { route: "/signup" });
    expect(
      await screen.findByRole("heading", { name: /create your vault/i }),
    ).toBeInTheDocument();
  });

  it("shows a 404 page for an unknown route", async () => {
    renderWithProviders(<App />, { route: "/definitely-not-a-route" });
    expect(await screen.findByText("404")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /home/i }),
    ).toBeInTheDocument();
  });

  it("redirects an unauthenticated visitor away from /app", async () => {
    renderWithProviders(<App />, { route: "/app" });
    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
  });

  it("renders the app shell + chat onboarding when signed in", async () => {
    signedIn();
    renderWithProviders(<App />, { route: "/app" });
    expect(
      await screen.findByText(/get set up in three steps/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Main" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/ask a question/i)).toBeInTheDocument();
  });

  it("renders the documents page when signed in", async () => {
    signedIn();
    renderWithProviders(<App />, { route: "/app/documents" });
    expect(
      await screen.findByText(/no documents yet/i),
    ).toBeInTheDocument();
  });
});
