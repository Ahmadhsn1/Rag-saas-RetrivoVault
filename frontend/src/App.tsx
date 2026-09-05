import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";

const Landing = lazy(() => import("@/pages/marketing/Landing"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Signup = lazy(() => import("@/pages/auth/Signup"));
const AppShell = lazy(() =>
  import("@/components/app/AppShell").then((m) => ({ default: m.AppShell })),
);
const Chat = lazy(() => import("@/pages/app/Chat"));
const Documents = lazy(() => import("@/pages/app/Documents"));
const Collections = lazy(() => import("@/pages/app/Collections"));
const Settings = lazy(() => import("@/pages/app/Settings"));

function FullScreenLoader() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3">
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
        <Route path="/" element={<Landing />} />
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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
