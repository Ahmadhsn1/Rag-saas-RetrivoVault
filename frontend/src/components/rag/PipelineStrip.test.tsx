import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PipelineStrip } from "./PipelineStrip";

describe("PipelineStrip", () => {
  it("renders every pipeline stage with an accessible label", () => {
    render(<PipelineStrip />);
    for (const stage of [
      "Upload",
      "Extract",
      "Chunk",
      "Embed",
      "Retrieve",
      "Answer",
    ]) {
      expect(screen.getByText(stage)).toBeInTheDocument();
    }
    expect(
      screen.getByRole("img", { name: /retrieval pipeline/i }),
    ).toBeInTheDocument();
  });
});
