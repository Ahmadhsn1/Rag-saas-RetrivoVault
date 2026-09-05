import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useCollections } from "@/hooks/useCollections";
import { useUsage } from "@/hooks/useUsage";
import type { Collection, UsageSnapshot } from "@/types/api";

interface AppContextValue {
  collections: Collection[];
  collectionsLoading: boolean;
  refetchCollections: () => Promise<void>;
  activeCollectionId: string | null;
  setActiveCollectionId: (id: string | null) => void;
  activeCollection: Collection | null;
  usage: UsageSnapshot | null;
  refetchUsage: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const {
    collections,
    loading: collectionsLoading,
    refetch: refetchCollections,
  } = useCollections();
  const { usage, refetch: refetchUsage } = useUsage();
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(
    null,
  );

  const activeCollection = useMemo(
    () => collections.find((c) => c._id === activeCollectionId) ?? null,
    [collections, activeCollectionId],
  );

  const value = useMemo(
    () => ({
      collections,
      collectionsLoading,
      refetchCollections,
      activeCollectionId,
      setActiveCollectionId,
      activeCollection,
      usage,
      refetchUsage,
    }),
    [
      collections,
      collectionsLoading,
      refetchCollections,
      activeCollectionId,
      activeCollection,
      usage,
      refetchUsage,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
}
