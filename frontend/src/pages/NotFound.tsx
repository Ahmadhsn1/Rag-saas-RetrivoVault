import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6 text-center">
      <Logo />
      <div>
        <p className="font-serif text-7xl text-brand">404</p>
        <h1 className="mt-4 text-2xl">That page isn&rsquo;t in the vault</h1>
        <p className="mt-2 text-muted-foreground">
          The link may be old, or the page may have moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link to="/">Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/app">Your vault</Link>
        </Button>
      </div>
    </div>
  );
}
