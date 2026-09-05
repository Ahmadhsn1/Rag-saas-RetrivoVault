import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "./Login";
import { renderWithProviders, fakeUser } from "@/test/utils";
import { mockApi } from "@/test/setup";

describe("Login page", () => {
  it("submits credentials and calls the login endpoint", async () => {
    mockApi.post.mockImplementation((url: string) => {
      if (url === "/auth/refresh") return Promise.reject(new Error("no session"));
      if (url === "/auth/login")
        return Promise.resolve({ data: { user: fakeUser, accessToken: "t" } });
      return Promise.reject(new Error(`unstubbed ${url}`));
    });

    renderWithProviders(<Login />, { route: "/login" });
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "supersecret");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(mockApi.post).toHaveBeenCalledWith("/auth/login", {
        email: "ada@example.com",
        password: "supersecret",
      }),
    );
  });

  it("shows a focused error summary on failure", async () => {
    mockApi.post.mockImplementation((url: string) => {
      if (url === "/auth/refresh") return Promise.reject(new Error("no session"));
      return Promise.reject(
        Object.assign(new Error("Invalid credentials"), {
          response: { data: { error: "Invalid credentials" } },
          isAxiosError: true,
        }),
      );
    });

    renderWithProviders(<Login />, { route: "/login" });
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrongpass1");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/invalid credentials/i);
  });
});
