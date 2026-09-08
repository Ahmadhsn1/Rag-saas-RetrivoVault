import { useEffect } from "react";
import { useSeo } from "@/hooks/useSeo";
import { Hero } from "@/components/marketing/Hero";
import { TrustStrip } from "@/components/marketing/TrustStrip";
import { WhoItsFor } from "@/components/marketing/WhoItsFor";
import { MissingOut } from "@/components/marketing/MissingOut";
import { StatsBand } from "@/components/marketing/StatsBand";
import { BentoFeatures } from "@/components/marketing/BentoFeatures";
import { RetrievalDemo } from "@/components/marketing/RetrievalDemo";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Comparison } from "@/components/marketing/Comparison";
import { SecurityPanel } from "@/components/marketing/SecurityPanel";
import { Pricing } from "@/components/marketing/Pricing";
import { FAQ } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { ScrollTrigger } from "@/lib/motion";

export default function Landing() {
  useSeo(
    "",
    "Add your contracts, papers and notes to a private vault. Ask in plain language and get a sourced answer in seconds — the research assistant that only knows what you've read.",
  );
  useEffect(() => {
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      <Hero />
      <TrustStrip />
      <WhoItsFor />
      <MissingOut />
      <StatsBand />
      <BentoFeatures />
      <RetrievalDemo />
      <HowItWorks />
      <Comparison />
      <SecurityPanel />
      <Pricing />
      <FAQ />
      <CTASection />
    </>
  );
}
