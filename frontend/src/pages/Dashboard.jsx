import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/axiosClient.js";
import CollectionSidebar from "../components/CollectionSidebar.jsx";
import UploadPanel from "../components/UploadPanel.jsx";
import ChatWindow from "../components/ChatWindow.jsx";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [collections, setCollections] = useState([]);
  const [activeCollectionId, setActiveCollectionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  const loadCollections = useCallback(async () => {
    const { data } = await api.get("/collections");
    setCollections(data.collections);
  }, []);

  const loadSessions = useCallback(async () => {
    const { data } = await api.get("/chat");
    setSessions(data.sessions);
  }, []);

  useEffect(() => {
    loadCollections();
    loadSessions();
  }, [loadCollections, loadSessions]);

  const newSession = async () => {
    const { data } = await api.post("/chat", {});
    await loadSessions();
    setActiveSessionId(data.session._id);
  };

  return (
    <div className="flex h-full">
      <CollectionSidebar
        collections={collections}
        activeCollectionId={activeCollectionId}
        onSelect={setActiveCollectionId}
        onChanged={loadCollections}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewSession={newSession}
        user={user}
        onLogout={logout}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <UploadPanel collectionId={activeCollectionId} />
        <ChatWindow
          sessionId={activeSessionId}
          collectionId={activeCollectionId}
          onSessionMutated={loadSessions}
        />
      </main>
    </div>
  );
}
