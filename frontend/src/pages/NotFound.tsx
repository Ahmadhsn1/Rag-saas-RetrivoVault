import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { PipelineStrip } from "@/components/rag/PipelineStrip";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <Logo />
      <div>
        <p className="font-mono text-5xl font-semibold text-brand">404</p>
        <p className="mt-2 text-sm text-muted-foreground">
          That page isn't in the vault.
        </p>
      </div>
      <PipelineStrip compact />
      <div className="flex gap-2">
        <Button asChild variant="brand">
          <Link to="/">Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/app">Your vault</Link>
        </Button>
      </div>
    </div>
  );
}
