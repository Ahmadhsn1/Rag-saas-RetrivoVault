import { useSeo } from "@/hooks/useSeo";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { AnswerAnatomy } from "@/components/marketing/AnswerAnatomy";
import { WhoItsFor } from "@/components/marketing/WhoItsFor";
import { Comparison } from "@/components/marketing/Comparison";
import { SecurityPanel } from "@/components/marketing/SecurityPanel";
import { Pricing } from "@/components/marketing/Pricing";
import { FAQ } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";

export default function Landing() {
  useSeo(
    "",
    "Add your contracts, papers and notes to a private vault. Ask in plain language and get a sourced answer in seconds — with the exact passage it came from.",
  );

  return (
    <>
      <Hero />
      <HowItWorks />
      <AnswerAnatomy />
      <SecurityPanel />
      <WhoItsFor />
      <Comparison />
      <Pricing />
      <FAQ />
      <CTASection />
    </>
  );
}
