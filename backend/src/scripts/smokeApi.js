/**
 * Full user flow against a running API: sign up, upload a document, wait for
 * ingestion, ask two questions and check the cited answers, the saved
 * conversation, the stored original and the usage counter.
 * Creates one throwaway account (e2e-<timestamp>@example.com) on that server.
 *
 *   npm run smoke:api -- http://localhost:5000/api
 */
const API = (process.argv[2] || "http://localhost:5000/api").replace(/\/$/, "");
const creds = {
  name: "E2E Reader",
  email: `e2e-${Date.now()}@example.com`,
  password: `local-${Math.random().toString(36).slice(2)}-A1`,
};
let failures = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
};
const json = async (path, opts = {}) => {
  const res = await fetch(API + path, opts);
  return { status: res.status, body: await res.json().catch(() => ({})) };
};

const signup = await json("/auth/signup", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(creds),
});
check("signup", signup.status === 201);
const auth = { Authorization: `Bearer ${signup.body.accessToken}` };

const contract = [
  "MASTER SERVICES AGREEMENT between Acme Corp and Northwind Ltd.",
  "The agreement renews automatically for one year unless either party gives sixty days written notice before the term ends.",
  "Clause 14.3 sets the indemnity cap at 250000 dollars for all claims arising under this agreement.",
  "Either party may terminate for convenience with ninety days notice after the first anniversary.",
].join("\n\n");
const form = new FormData();
form.append("file", new Blob([contract], { type: "text/plain" }), "acme-msa.txt");
const up = await json("/documents", { method: "POST", headers: auth, body: form });
check("upload accepted", up.status === 202);
const docId = up.body.document?._id;

let doc;
for (let i = 0; i < 40; i++) {
  doc = (await json(`/documents/${docId}`, { headers: auth })).body.document;
  if (doc?.status !== "processing") break;
  await new Promise((r) => setTimeout(r, 1000));
}
check("document ingested", doc?.status === "ready", `${doc?.status}, ${doc?.chunkCount} chunks ${doc?.error ?? ""}`);

// A freshly inserted chunk takes a moment to appear in the vector index.
await new Promise((r) => setTimeout(r, 5000));

const session = await json("/chat", {
  method: "POST",
  headers: { ...auth, "content-type": "application/json" },
  body: "{}",
});
const ask = async (content) => {
  const res = await fetch(`${API}/chat/${session.body.session._id}/message`, {
    method: "POST",
    headers: { ...auth, "content-type": "application/json" },
    body: JSON.stringify({ content }),
  });
  const events = (await res.text())
    .split("\n\n")
    .filter(Boolean)
    .map((f) => ({ event: f.match(/^event: (.+)$/m)?.[1], data: JSON.parse(f.match(/^data: (.+)$/m)?.[1] ?? "{}") }));
  return {
    status: res.status,
    sources: events.find((e) => e.event === "sources")?.data.sources ?? [],
    answer: events.filter((e) => e.event === "token").map((e) => e.data.delta).join(""),
    done: events.some((e) => e.event === "done"),
  };
};

const a1 = await ask("When does the agreement renew?");
check("answer streamed to completion", a1.status === 200 && a1.done);
check("top source is the uploaded contract", a1.sources[0]?.filename === "acme-msa.txt", `score ${a1.sources[0]?.score?.toFixed(3)}`);
check("vector search produced the match", a1.sources[0]?.score > 0);
const cited = [...a1.answer.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
check(
  "answer cites passages that were actually retrieved",
  cited.length > 0 && cited.every((n) => a1.sources.some((s) => s.index === n)),
  a1.answer.slice(0, 70)
);

const a2 = await ask("What is the indemnity cap in clause 14.3?");
check("exact-term question finds the clause", /indemnity cap/.test(a2.sources[0]?.text ?? ""));

const saved = await json(`/chat/${session.body.session._id}`, { headers: auth });
check("conversation persisted with cited chunks", saved.body.session?.messages?.length === 4 && saved.body.session.messages[1].citedChunkIds.length === 1);

const file = await fetch(`${API}/documents/${docId}/file`, { headers: auth });
check("original file downloads", file.status === 200 && (await file.text()).includes("MASTER SERVICES AGREEMENT"));

const usage = await json("/usage", { headers: auth });
check("usage counted both questions", usage.body.current?.queries === 2);

console.log(failures ? `\n${failures} check(s) failed` : "\nAll API checks passed");
process.exit(failures ? 1 : 0);
