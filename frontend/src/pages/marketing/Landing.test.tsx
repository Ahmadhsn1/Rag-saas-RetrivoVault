import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Landing from "./Landing";
import { renderWithProviders } from "@/test/utils";

describe("Landing page", () => {
  it("renders every major section without runtime errors", async () => {
    renderWithProviders(<Landing />, { route: "/" });

    expect(
      await screen.findByRole("heading", { level: 1, name: /your documents/i }),
    ).toBeInTheDocument();

    // section headings across the composed marketing sections
    for (const re of [
      /if your work leaves you with a pile of documents/i,
      /an answer is only useful if you can check it/i,
      /three steps to a sourced answer/i,
      /the tools you.d reach for first/i,
      /what.s in your vault stays in your vault/i,
      /priced for one person/i,
      /questions, answered/i,
    ]) {
      expect(screen.getByRole("heading", { name: re })).toBeInTheDocument();
    }

    // pricing tiers
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Max")).toBeInTheDocument();
  });

  it("toggles annual / monthly pricing", async () => {
    renderWithProviders(<Landing />, { route: "/" });
    const monthly = await screen.findByRole("button", { name: "Monthly" });
    await userEvent.click(monthly);
    // Pro monthly price is $12
    expect(screen.getByText("$12")).toBeInTheDocument();
  });
});
