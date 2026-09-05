import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusChip } from "./StatusChip";

describe("StatusChip", () => {
  it("communicates status with a text label, not color alone", () => {
    const { rerender } = render(<StatusChip status="processing" />);
    expect(screen.getByText("processing")).toBeInTheDocument();

    rerender(<StatusChip status="ready" chunkCount={12} />);
    expect(screen.getByText(/ready · 12/)).toBeInTheDocument();

    rerender(<StatusChip status="failed" />);
    expect(screen.getByText("failed")).toBeInTheDocument();
  });
});
