import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Chat from "./Chat";
import { AppProvider } from "@/context/AppContext";
import { renderWithProviders } from "@/test/utils";
import { mockApi, mockStreamChat } from "@/test/setup";
import type { StreamChatArgs } from "@/lib/api";

function ui() {
  return (
    <AppProvider>
      <Chat />
    </AppProvider>
  );
}

describe("Chat", () => {
  it("creates a session then streams an answer with sources", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/collections") return Promise.resolve({ data: { collections: [] } });
      if (url === "/usage") return Promise.reject(new Error("no usage"));
      if (url === "/documents")
        return Promise.resolve({ data: { documents: [], total: 0, page: 1, pages: 1 } });
      if (url === "/chat") return Promise.resolve({ data: { sessions: [] } });
      if (url.startsWith("/chat/"))
        return Promise.resolve({
          data: { session: { _id: "s1", title: "New chat", messages: [] } },
        });
      return Promise.reject(new Error(`unstubbed GET ${url}`));
    });
    mockApi.post.mockImplementation((url: string) => {
      if (url === "/chat")
        return Promise.resolve({
          data: { session: { _id: "s1", title: "New chat", messages: [] } },
        });
      return Promise.reject(new Error(`unstubbed POST ${url}`));
    });

    mockStreamChat.mockImplementation(
      async ({ onSources, onToken, onDone }: StreamChatArgs) => {
        onSources?.([
          { index: 1, chunkId: "c1", documentId: "d1", score: 0.8, preview: "ctx" },
        ]);
        onToken?.("It renews annually [1].");
        onDone?.({ title: "Renewal terms" });
      },
    );

    renderWithProviders(ui(), { route: "/app" });

    const composer = await screen.findByLabelText(/ask a question/i);
    await userEvent.type(composer, "When does it renew?");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(mockApi.post).toHaveBeenCalledWith("/chat", {
        collectionId: null,
      }),
    );
    expect(await screen.findByText(/it renews annually/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Source 1" }),
    ).toBeInTheDocument();
  });
});
