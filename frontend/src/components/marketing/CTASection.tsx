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
            Turn your documents into answers
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Free to run. Bring a Gemini API key and a MongoDB Atlas cluster.
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild variant="brand" size="lg">
              <Link to="/signup">
                Start your vault
                <ArrowRight className="h-4 w-4" />
              </Link>
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
