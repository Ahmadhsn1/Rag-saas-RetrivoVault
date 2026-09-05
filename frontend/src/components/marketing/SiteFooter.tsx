import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
        <Logo />
        <p className="font-mono text-2xs text-muted-foreground">
          Retrivo Vault — a portfolio RAG platform. No warranty.
        </p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link to="/login" className="transition-colors hover:text-foreground">
            Sign in
          </Link>
          <a
            href="#features"
            className="transition-colors hover:text-foreground"
          >
            Features
          </a>
        </div>
      </div>
    </footer>
  );
}
