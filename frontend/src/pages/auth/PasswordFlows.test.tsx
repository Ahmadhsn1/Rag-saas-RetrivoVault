import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import { renderWithProviders } from "@/test/utils";
import { mockApi } from "@/test/setup";

describe("ForgotPassword", () => {
  it("posts the email and shows a neutral confirmation", async () => {
    mockApi.post.mockImplementation((url: string) =>
      url === "/auth/forgot-password"
        ? Promise.resolve({ data: { ok: true } })
        : Promise.reject(new Error("no session")),
    );

    renderWithProviders(<ForgotPassword />, { route: "/forgot-password" });
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() =>
      expect(mockApi.post).toHaveBeenCalledWith("/auth/forgot-password", {
        email: "ada@example.com",
      }),
    );
    expect(await screen.findByText(/a reset link is on its way/i)).toBeInTheDocument();
  });
});

describe("ResetPassword", () => {
  it("rejects mismatched passwords before calling the API", async () => {
    renderWithProviders(<ResetPassword />, {
      route: "/reset-password?token=abc",
    });
    await userEvent.type(screen.getByLabelText("New password"), "longenough1");
    await userEvent.type(screen.getByLabelText("Confirm password"), "different99");
    await userEvent.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/don't match/i);
    expect(mockApi.post).not.toHaveBeenCalledWith(
      "/auth/reset-password",
      expect.anything(),
    );
  });

  it("submits a valid new password with the token", async () => {
    mockApi.post.mockImplementation((url: string) =>
      url === "/auth/reset-password"
        ? Promise.resolve({ data: { ok: true } })
        : Promise.reject(new Error("no session")),
    );

    renderWithProviders(<ResetPassword />, {
      route: "/reset-password?token=abc123",
    });
    await userEvent.type(screen.getByLabelText("New password"), "brandnewpass9");
    await userEvent.type(screen.getByLabelText("Confirm password"), "brandnewpass9");
    await userEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() =>
      expect(mockApi.post).toHaveBeenCalledWith("/auth/reset-password", {
        token: "abc123",
        password: "brandnewpass9",
      }),
    );
  });
});
