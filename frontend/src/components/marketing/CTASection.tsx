import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PipelineStrip } from "@/components/rag/PipelineStrip";

export function CTASection() {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <div className="glow-hero relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-lg">
          <h2 className="mx-auto max-w-xl text-3xl sm:text-4xl">
            Stop re-reading. Start asking.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Add your first few documents and ask a real question in the next two
            minutes. Free plan, or a 14-day Pro trial with no card.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild variant="brand" size="lg">
              <Link to="/signup">
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/pricing">See plans</Link>
            </Button>
          </div>
          <div className="mt-12">
            <PipelineStrip compact />
          </div>
        </div>
      </div>
    </section>
  );
}
