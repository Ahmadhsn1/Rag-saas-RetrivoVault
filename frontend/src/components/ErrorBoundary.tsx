import { Component, type ErrorInfo, type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 text-center">
        <Logo withWordmark={false} />
        <div>
          <h1 className="font-mono text-lg font-semibold">Something broke</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            An unexpected error crashed this view. Reloading usually fixes it.
          </p>
          <pre className="mx-auto mt-4 max-w-md overflow-x-auto rounded-md border border-border bg-card p-3 text-left font-mono text-2xs text-muted-foreground">
            {this.state.error.message}
          </pre>
        </div>
        <div className="flex gap-2">
          <Button variant="brand" onClick={() => window.location.reload()}>
            Reload
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Go home
          </Button>
        </div>
      </div>
    );
  }
}
