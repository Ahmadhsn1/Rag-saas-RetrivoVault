import { useEffect } from "react";

const BASE_TITLE = "Retrivo Vault";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Sets the document title + description/OG tags for the current route. */
export function useSeo(title: string, description?: string) {
  useEffect(() => {
    const full = title ? `${title} · ${BASE_TITLE}` : `${BASE_TITLE} — your documents, answerable`;
    document.title = full;
    setMeta("property", "og:title", full);
    if (description) {
      setMeta("name", "description", description);
      setMeta("property", "og:description", description);
    }
    return () => {
      document.title = `${BASE_TITLE} — your documents, answerable`;
    };
  }, [title, description]);
}
