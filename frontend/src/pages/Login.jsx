import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-vault-border bg-vault-panel p-6"
      >
        <h1 className="text-xl font-semibold text-white">Retrivo Vault</h1>
        <p className="text-sm text-gray-400">Sign in to your knowledge base.</p>

        {error && (
          <div className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-vault-border bg-vault-bg px-3 py-2 text-sm outline-none focus:border-vault-accent"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-vault-border bg-vault-bg px-3 py-2 text-sm outline-none focus:border-vault-accent"
        />

        <button
          disabled={busy}
          className="w-full rounded-md bg-vault-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-center text-sm text-gray-400">
          No account?{" "}
          <Link to="/signup" className="text-vault-accent hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
