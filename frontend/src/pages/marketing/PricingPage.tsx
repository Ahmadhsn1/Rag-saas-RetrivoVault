import { useSeo } from "@/hooks/useSeo";
import { Pricing } from "@/components/marketing/Pricing";
import { FAQ } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";

export default function PricingPage() {
  useSeo("Pricing", "Free, Pro and Max plans for one person. Start free, upgrade when your vault outgrows it.");
  return (
    <>
      <Pricing standalone />
      <FAQ />
      <CTASection />
    </>
  );
}
