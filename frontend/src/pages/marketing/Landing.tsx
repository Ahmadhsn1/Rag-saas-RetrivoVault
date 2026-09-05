import { useEffect } from "react";
import { Hero } from "@/components/marketing/Hero";
import { TrustStrip } from "@/components/marketing/TrustStrip";
import { StatsBand } from "@/components/marketing/StatsBand";
import { BentoFeatures } from "@/components/marketing/BentoFeatures";
import { RetrievalDemo } from "@/components/marketing/RetrievalDemo";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { SecurityPanel } from "@/components/marketing/SecurityPanel";
import { Pricing } from "@/components/marketing/Pricing";
import { FAQ } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { ScrollTrigger } from "@/lib/motion";

export default function Landing() {
  useEffect(() => {
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      <Hero />
      <TrustStrip />
      <StatsBand />
      <BentoFeatures />
      <RetrievalDemo />
      <HowItWorks />
      <SecurityPanel />
      <Pricing />
      <FAQ />
      <CTASection />
    </>
  );
}
