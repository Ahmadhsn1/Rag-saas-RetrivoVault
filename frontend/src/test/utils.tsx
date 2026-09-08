import { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import type { User } from "@/types/api";

export const fakeUser: User = {
  _id: "u_test",
  name: "Ada Lovelace",
  email: "ada@example.com",
  emailVerified: true,
  role: "user",
  plan: "free",
  trialPlan: null,
  trialEndsAt: null,
  subscriptionStatus: "none",
  planRenewsAt: null,
  hasGeminiKey: false,
  notificationPrefs: {
    ingestComplete: true,
    quotaWarnings: true,
    weeklyDigest: false,
    productUpdates: true,
  },
  createdAt: new Date("2026-01-01").toISOString(),
};

export function renderWithProviders(
  ui: ReactElement,
  { route = "/", ...options }: { route?: string } & RenderOptions = {},
) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <TooltipProvider>{ui}</TooltipProvider>
      </AuthProvider>
    </MemoryRouter>,
    options,
  );
}

export * from "@testing-library/react";
