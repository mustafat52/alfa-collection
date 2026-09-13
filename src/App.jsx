import React, { useState, useEffect } from "react";
import CustomerApp from "./CustomerApp.jsx";
import AdminApp from "./AdminApp.jsx";

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const isAdmin = path.startsWith("/admin");

  return (
    <div style={{ minHeight: "100vh", background: "#F1E8DF", padding: "16px 0" }}>
      {isAdmin ? <AdminApp /> : <CustomerApp />}
    </div>
  );
}
