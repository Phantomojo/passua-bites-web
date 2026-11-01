import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect, useRef, lazy, Suspense, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Analytics } from "@vercel/analytics/react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Checkout from "./pages/Checkout";
import OrderTracking from "./pages/OrderTracking";
import Contact from "./pages/Contact";
import Reviews from "./pages/Reviews";
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NairobiFoodFest from "./pages/NairobiFoodFest";

function SpaPageviewTracker() {
  const [location] = useLocation();
  const prev = useRef(location);
  const hasMounted = useRef(false);
  const record = trpc.analytics.recordPageview.useMutation();
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    if (hasMounted.current && prev.current === location) return;
    hasMounted.current = true;
    prev.current = location;

    record.mutate({
      page: location,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent || null,
    });

    trackPageView(location);
  }, [location, record, trackPageView]);

  return null;
}

function CookieBanner() {
  const [show, setShow] = useState(() => {
    try { return localStorage.getItem("pb_cookie_consent") !== "1"; } catch { return false; }
  });
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: "var(--pb-bg2)", borderTop: "1px solid var(--pb-rule)",
      padding: "0.85rem 1.25rem", display: "flex", gap: "1rem",
      alignItems: "center", justifyContent: "space-between", flexWrap: "wrap",
      fontFamily: "'DM Sans',sans-serif", fontSize: "0.82rem", color: "var(--pb-ivory2)",
    }}>
      <span>
        We use essential cookies only (no tracking). See our{" "}
        <a href="/privacy" style={{ color: "var(--pb-ember)" }}>Privacy Policy</a>.
      </span>
      <button
        onClick={() => { try { localStorage.setItem("pb_cookie_consent", "1"); } catch {} setShow(false); }}
        className="pb-btn-primary"
        style={{ padding: "0.4rem 1rem", fontSize: "0.65rem", minHeight: 36, cursor: "pointer" }}
      >
        Got it
      </button>
    </div>
  );
}

function Router() {
  return (
    <>
      <SpaPageviewTracker />
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/menu"} component={Menu} />
        <Route path={"/checkout"} component={Checkout} />
        <Route path={"/orders"} component={OrderTracking} />
        <Route path={"/contact"} component={Contact} />
        <Route path={"/reviews"} component={Reviews} />
        <Route path="/admin" component={() => <Suspense fallback={<div style={{padding:"2rem",color:"var(--pb-ivory3)"}}>Loading…</div>}><AdminDashboard /></Suspense>} />
        <Route path="/about" component={About} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={TermsOfService} />
        <Route path="/nairobi-food-fest" component={NairobiFoodFest} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
      <CookieBanner />
    </>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
          <Analytics />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;