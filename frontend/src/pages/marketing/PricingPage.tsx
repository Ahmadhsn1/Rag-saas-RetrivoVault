import { Pricing } from "@/components/marketing/Pricing";
import { FAQ } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";

export default function PricingPage() {
  return (
    <>
      <Pricing standalone />
      <FAQ />
      <CTASection />
    </>
  );
}
