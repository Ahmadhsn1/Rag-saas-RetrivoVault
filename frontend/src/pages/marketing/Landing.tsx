import { useEffect } from "react";
import { SiteNav } from "@/components/marketing/SiteNav";
import { Hero } from "@/components/marketing/Hero";
import { TrustStrip } from "@/components/marketing/TrustStrip";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { SecurityPanel } from "@/components/marketing/SecurityPanel";
import { CTASection } from "@/components/marketing/CTASection";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { ScrollTrigger } from "@/lib/motion";

export default function Landing() {
  useEffect(() => {
    // Recalculate trigger positions once fonts/layout settle.
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <SiteNav />
      <main id="main">
        <Hero />
        <TrustStrip />
        <FeatureGrid />
        <HowItWorks />
        <SecurityPanel />
        <CTASection />
      </main>
      <SiteFooter />
    </div>
  );
}
