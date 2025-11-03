// src/App.jsx
import React, { useEffect, useState } from "react";
import { CinePOSProvider } from "./state/CinePOSProvider.jsx";
import Navbar from "./components/Navbar.jsx";
import ClientView from "./views/ClientView.jsx";
import AdminView from "./views/AdminView.jsx";

export default function App() {
  const [view, setView] = useState(() => {
    try { return localStorage.getItem("cinepos_view") || "client"; }
    catch { return "client"; }
  });

  useEffect(() => {
    localStorage.setItem("cinepos_view", view);
  }, [view]);

  return (
    <CinePOSProvider>
      <div className="min-h-screen bg-neutral-100 text-neutral-900">
        <Navbar view={view} onChangeView={setView} />
        {view === "client" ? <ClientView /> : <AdminView />}
      </div>
    </CinePOSProvider>
  );
}
