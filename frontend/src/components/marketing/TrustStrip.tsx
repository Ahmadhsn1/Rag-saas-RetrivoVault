import { FileText, Target, ShieldOff } from "lucide-react";
import { Reveal, Stagger, RevealItem } from "@/components/motion/Reveal";

const POINTS = [
  {
    icon: FileText,
    label: "The passage it came from",
    hint: "click any [1] to read the source",
  },
  {
    icon: Target,
    label: "A similarity score",
    hint: "how close the match actually was",
  },
  {
    icon: ShieldOff,
    label: "Nothing invented",
    hint: "if it's not in your docs, Retrivo says so",
  },
];

export function TrustStrip() {
  return (
    <section className="border-y border-border bg-surface/40 py-8">
      <div className="container">
        <Reveal
          as="p"
          className="text-center font-mono text-2xs uppercase tracking-[0.2em] text-muted-foreground"
        >
          Every answer comes with
        </Reveal>
        <Stagger
          as="ul"
          wrapChildren={false}
          stagger={0.1}
          className="mt-5 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-10"
        >
          {POINTS.map(({ icon: Icon, label, hint }) => (
            <RevealItem
              as="li"
              key={label}
              className="group flex items-center gap-2.5 text-center sm:text-left"
            >
              <Icon
                className="h-4 w-4 shrink-0 text-primary transition-transform duration-200 group-hover:scale-110"
                aria-hidden="true"
              />
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="block font-mono text-2xs text-muted-foreground">
                  {hint}
                </span>
              </span>
            </RevealItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
