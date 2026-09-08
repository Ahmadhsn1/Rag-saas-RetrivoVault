import { ArrowRight } from "lucide-react";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { Reveal } from "@/components/motion/Reveal";
import { PipelineStrip } from "@/components/rag/PipelineStrip";

export function CTASection() {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <Reveal className="glow-hero relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-lg">
          <h2 className="mx-auto max-w-xl text-3xl sm:text-4xl">
            Stop re-reading. Start asking.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Add your first few documents and ask a real question in the next two
            minutes. Free plan, or a 14-day Pro trial with no card.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <MagneticButton to="/signup" variant="brand" size="lg">
              Start free
              <ArrowRight className="h-4 w-4" />
            </MagneticButton>
            <MagneticButton to="/pricing" variant="outline" size="lg" strength={0.18}>
              See plans
            </MagneticButton>
          </div>
          <div className="mt-12">
            <PipelineStrip compact />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
