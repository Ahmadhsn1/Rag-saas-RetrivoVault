import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Signup() {
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      await signup(form.name, form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
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
        <h1 className="text-xl font-semibold text-white">Create your vault</h1>

        {error && (
          <div className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <input
          required
          placeholder="Name"
          value={form.name}
          onChange={update("name")}
          className="w-full rounded-md border border-vault-border bg-vault-bg px-3 py-2 text-sm outline-none focus:border-vault-accent"
        />
        <input
          type="email"
          required
          placeholder="Email"
          value={form.email}
          onChange={update("email")}
          className="w-full rounded-md border border-vault-border bg-vault-bg px-3 py-2 text-sm outline-none focus:border-vault-accent"
        />
        <input
          type="password"
          required
          placeholder="Password (min 8 chars)"
          value={form.password}
          onChange={update("password")}
          className="w-full rounded-md border border-vault-border bg-vault-bg px-3 py-2 text-sm outline-none focus:border-vault-accent"
        />

        <button
          disabled={busy}
          className="w-full rounded-md bg-vault-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create account"}
        </button>

        <p className="text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-vault-accent hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
