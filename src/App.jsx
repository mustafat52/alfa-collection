import React, { useState, useEffect } from "react";
import CustomerApp from "./CustomerApp.jsx";
import AdminApp from "./AdminApp.jsx";

// Shared responsive rules for both the admin and customer apps.
// On larger screens the app still shows as a centered "phone card" (handy
// for demoing on a laptop). Below 480px — i.e. on an actual phone — it goes
// edge-to-edge, drops the floating-card look, lets inner lists scroll with
// the page instead of in their own little boxes, and stops iOS from
// zooming in every time an input is focused.
const GLOBAL_STYLES = `
  html, body, #root { height: 100%; }

  .alfa-app-bg {
    min-height: 100vh;
    min-height: 100dvh;
    background: #F1E8DF;
    padding: 16px 0;
  }

  .alfa-shell {
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
    background: #FDF4F8;
    border-radius: 22px;
    overflow: hidden;
    position: relative;
    font-family: 'Jost', sans-serif;
    box-shadow: 0 0 0 1px #F0DCE6;
    min-height: 640px;
  }

  /* Inner lists: capped height + their own scrollbar on desktop, but on a
     phone they should just flow with the rest of the page. */
  .alfa-scroll,
  .alfa-catalog-grid {
    max-height: 360px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .alfa-shell input,
  .alfa-shell select,
  .alfa-shell textarea {
    font-size: 16px; /* stops iOS Safari auto-zooming on focus */
  }

  .alfa-shell button {
    touch-action: manipulation; /* removes the 300ms tap delay */
  }

  @media (max-width: 480px) {
    .alfa-app-bg {
      padding: 0;
      background: #FDF4F8;
    }
    .alfa-shell {
      max-width: 100%;
      min-height: 100vh;
      min-height: 100dvh;
      border-radius: 0;
      box-shadow: none;
      padding-bottom: env(safe-area-inset-bottom);
    }
    .alfa-scroll,
    .alfa-catalog-grid {
      max-height: none;
      overflow-y: visible;
    }
  }
`;

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const isAdmin = path.startsWith("/admin");

  return (
    <div className="alfa-app-bg">
      <style>{GLOBAL_STYLES}</style>
      {isAdmin ? <AdminApp /> : <CustomerApp />}
    </div>
  );
}