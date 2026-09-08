import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Stagger, RevealItem } from "@/components/motion/Reveal";

const COLS = [
  {
    title: "Product",
    links: [
      { label: "Who it's for", href: "/#who" },
      { label: "How it works", href: "/#how" },
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/pricing" },
      { label: "API docs", href: "/docs" },
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
      { label: "The project", href: "/about" },
      { label: "FAQ", href: "/#faq" },
      { label: "Security", href: "/#security" },
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <Stagger
        wrapChildren={false}
        stagger={0.06}
        className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]"
      >
        <RevealItem>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            The research assistant that only knows what you've read. Ask your
            documents anything, get a sourced answer in seconds — privately.
          </p>
        </RevealItem>
        {COLS.map((col) => (
          <RevealItem key={col.title}>
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
          </RevealItem>
        ))}
      </Stagger>
      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 sm:flex-row">
          <p className="font-mono text-2xs text-muted-foreground">
            © {new Date().getFullYear()} Retrivo Vault · Your documents stay
            yours.
          </p>
          <p className="font-mono text-2xs text-muted-foreground">
            Open source · built by one person
          </p>
        </div>
      </div>
    </footer>
  );
}
