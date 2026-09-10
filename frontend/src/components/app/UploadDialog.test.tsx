import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UploadDialog } from "./UploadDialog";
import { AppProvider } from "@/context/AppContext";
import { renderWithProviders, fakeUser } from "@/test/utils";
import { mockApi } from "@/test/setup";

beforeEach(() => {
  mockApi.post.mockImplementation((url: string) => {
    if (url === "/auth/refresh")
      return Promise.resolve({ data: { user: fakeUser, accessToken: "t" } });
    if (url === "/collections")
      return Promise.resolve({
        data: { collection: { _id: "c_new", name: "Research", userId: "u", createdAt: "" } },
      });
    return Promise.reject(new Error(`unstubbed ${url}`));
  });
  mockApi.get.mockImplementation((url: string) => {
    if (url === "/collections") return Promise.resolve({ data: { collections: [] } });
    if (url === "/usage") return Promise.reject(new Error("skip"));
    return Promise.reject(new Error(`unstubbed ${url}`));
  });
});

describe("UploadDialog", () => {
  it("creates a new collection inline", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AppProvider>
        <UploadDialog onUploaded={vi.fn()} trigger={<button>Upload</button>} />
      </AppProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Upload" }));
    await user.click(await screen.findByRole("button", { name: /new collection/i }));

    const input = await screen.findByPlaceholderText("Collection name");
    await user.type(input, "Research");
    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() =>
      expect(mockApi.post).toHaveBeenCalledWith("/collections", { name: "Research" }),
    );
  });
});
