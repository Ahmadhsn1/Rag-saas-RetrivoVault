import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";

const MarketingLayout = lazy(() => import("@/pages/marketing/MarketingLayout"));
const Landing = lazy(() => import("@/pages/marketing/Landing"));
const PricingPage = lazy(() => import("@/pages/marketing/PricingPage"));
const DocsPage = lazy(() => import("@/pages/marketing/DocsPage"));
const AboutPage = lazy(() => import("@/pages/marketing/AboutPage"));
const TermsPage = lazy(() =>
  import("@/pages/marketing/LegalPage").then((m) => ({
    default: () => <m.LegalPage kind="terms" />,
  })),
);
const PrivacyPage = lazy(() =>
  import("@/pages/marketing/LegalPage").then((m) => ({
    default: () => <m.LegalPage kind="privacy" />,
  })),
);
const SharedChat = lazy(() => import("@/pages/SharedChat"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Signup = lazy(() => import("@/pages/auth/Signup"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));
const VerifyEmail = lazy(() => import("@/pages/auth/VerifyEmail"));
const AppShell = lazy(() =>
  import("@/components/app/AppShell").then((m) => ({ default: m.AppShell })),
);
const Chat = lazy(() => import("@/pages/app/Chat"));
const Documents = lazy(() => import("@/pages/app/Documents"));
const Collections = lazy(() => import("@/pages/app/Collections"));
const Settings = lazy(() => import("@/pages/app/Settings"));
const Admin = lazy(() => import("@/pages/app/Admin"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function FullScreenLoader() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background">
      <Logo withWordmark={false} />
      <p className="font-mono text-2xs uppercase tracking-widest text-muted-foreground">
        loading
      </p>
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  return user ? <Navigate to="/app" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
        </Route>

        <Route path="/s/:shareId" element={<SharedChat />} />

        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <Login />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/signup"
          element={
            <RedirectIfAuthed>
              <Signup />
            </RedirectIfAuthed>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Chat />} />
          <Route path="documents" element={<Documents />} />
          <Route path="collections" element={<Collections />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin" element={<Admin />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
