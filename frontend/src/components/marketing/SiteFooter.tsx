import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

const COLS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how" },
      { label: "Pricing", href: "/pricing" },
      { label: "Watch it retrieve", href: "/#demo" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/signup" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "FAQ", href: "/#faq" },
      { label: "Security", href: "/#security" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            A private, cited RAG knowledge base for one person. Open source.
          </p>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <p className="font-mono text-2xs uppercase tracking-wide text-muted-foreground">
              {col.title}
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  {l.href.startsWith("/#") ? (
                    <a
                      href={l.href}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      to={l.href}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 sm:flex-row">
          <p className="font-mono text-2xs text-muted-foreground">
            Retrivo Vault — portfolio project. No warranty.
          </p>
          <p className="font-mono text-2xs text-muted-foreground">
            Built with React · MongoDB Atlas · Gemini
          </p>
        </div>
      </div>
    </footer>
  );
}
