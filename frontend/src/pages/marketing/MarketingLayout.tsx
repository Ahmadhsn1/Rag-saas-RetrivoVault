import { Outlet } from "react-router-dom";
import { SiteNav } from "@/components/marketing/SiteNav";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { HashScroll } from "@/components/marketing/HashScroll";

export default function MarketingLayout() {
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <HashScroll />
      <SiteNav />
      <main id="main">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
