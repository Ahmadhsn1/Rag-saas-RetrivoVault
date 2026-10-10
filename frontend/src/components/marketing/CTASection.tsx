import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/Reveal";

export function CTASection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <Reveal className="rounded-2xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12">
          <h2 className="mx-auto max-w-2xl text-3xl sm:text-5xl">
            Stop re-reading. <em className="font-normal">Start asking.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-primary-foreground/75">
            Add a few documents and ask a real question in the next two
            minutes. Free plan, or fourteen days of Pro with no card.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary">
              <Link to="/signup">
                Start free
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/pricing">See plans</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
