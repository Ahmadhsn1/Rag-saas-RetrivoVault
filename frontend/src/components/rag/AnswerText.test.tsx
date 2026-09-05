import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnswerText } from "./AnswerText";
import type { RetrievedSource } from "@/types/api";

const sources: RetrievedSource[] = [
  {
    index: 1,
    chunkId: "c1",
    documentId: "d1",
    score: 0.812,
    preview: "The contract renews annually.",
  },
];

describe("AnswerText", () => {
  it("renders plain text without citations", () => {
    render(<AnswerText content="No citations here." />);
    expect(screen.getByText("No citations here.")).toBeInTheDocument();
  });

  it("turns [n] markers into citation buttons and fires onSelectSource", async () => {
    const onSelect = vi.fn();
    render(
      <TooltipProvider>
        <AnswerText
          content="It renews annually [1]."
          sources={sources}
          onSelectSource={onSelect}
        />
      </TooltipProvider>,
    );

    const badge = screen.getByRole("button", { name: "Source 1" });
    expect(badge).toHaveTextContent("1");
    await userEvent.click(badge);
    expect(onSelect).toHaveBeenCalledWith(sources[0]);
  });
});
