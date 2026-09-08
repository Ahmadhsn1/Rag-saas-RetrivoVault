import { useEffect, useState } from "react";
import axios from "axios";
import { useSeo } from "@/hooks/useSeo";
import { Badge } from "@/components/ui/badge";

const base = import.meta.env.VITE_API_BASE || "/api";

interface Spec {
  info: { title: string; version: string; description: string };
  servers: { url: string }[];
  paths: Record<
    string,
    Record<string, { summary?: string; description?: string }>
  >;
  "x-webhooks"?: Record<string, { description: string }>;
}

const METHOD_COLOR: Record<string, "ok" | "primary" | "warn" | "error"> = {
  get: "ok",
  post: "primary",
  patch: "warn",
  put: "warn",
  delete: "error",
};

export default function DocsPage() {
  useSeo("API", "The Retrivo Vault REST API — authenticate with a personal API key.");
  const [spec, setSpec] = useState<Spec | null>(null);

  useEffect(() => {
    axios
      .get<Spec>(`${base}/openapi.json`)
      .then(({ data }) => setSpec(data))
      .catch(() => {});
  }, []);

  return (
    <div className="pt-32 pb-24">
      <div className="container max-w-3xl">
        <p className="font-mono text-2xs uppercase tracking-[0.2em] text-primary">
          Developers
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl">API reference</h1>
        <p className="mt-4 text-muted-foreground">
          A small REST API over your vault. Authenticate with a personal API key
          (Max plan) in the <code className="text-foreground">x-api-key</code>{" "}
          header. Webhooks are HMAC-signed with your endpoint secret.
        </p>

        {spec && (
          <>
            <div className="mt-8 rounded-lg border border-border bg-card p-4 font-mono text-xs">
              <p className="text-muted-foreground">base url</p>
              <p className="mt-1 text-foreground">{spec.servers[0]?.url}</p>
              <p className="mt-3 text-muted-foreground">machine-readable</p>
              <a
                href={`${base}/openapi.json`}
                className="mt-1 block text-primary hover:underline"
              >
                {base}/openapi.json
              </a>
            </div>

            <div className="mt-8 space-y-2">
              {Object.entries(spec.paths).map(([path, methods]) =>
                Object.entries(methods).map(([method, op]) => (
                  <div
                    key={`${method}-${path}`}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={METHOD_COLOR[method] ?? "default"}>
                        {method}
                      </Badge>
                      <code className="font-mono text-sm text-foreground">
                        {path}
                      </code>
                    </div>
                    {op.summary && (
                      <p className="mt-2 text-sm">{op.summary}</p>
                    )}
                    {op.description && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {op.description}
                      </p>
                    )}
                  </div>
                )),
              )}
            </div>

            {spec["x-webhooks"] && (
              <>
                <h2 className="mt-12 text-2xl">Webhook events</h2>
                <div className="mt-4 space-y-2">
                  {Object.entries(spec["x-webhooks"]).map(([evt, w]) => (
                    <div
                      key={evt}
                      className="rounded-lg border border-border bg-card p-4"
                    >
                      <code className="font-mono text-sm text-brand">{evt}</code>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {w.description}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
