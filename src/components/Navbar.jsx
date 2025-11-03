// src/components/Navbar.jsx
export default function Navbar({ view = "client", onChangeView = () => {} }) {
  return (
    <nav className="sticky top-0 z-40 bg-[#1877f2] text-white shadow">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        <div className="font-extrabold tracking-wide">Punto de Venta</div>

        <div className="flex-1">
          <input
            className="w-full max-w-md bg-white/90 text-neutral-800 rounded-full px-4 py-1.5 outline-none placeholder:text-neutral-500"
            placeholder="Buscar película, sala…"
            onChange={() => {}}
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onChangeView("client")}
            className={`px-3 py-1.5 rounded-full text-sm transition ${
              view === "client"
                ? "bg-white text-[#1877f2]"
                : "bg-white/15 hover:bg-white/25 text-white"
            }`}
          >
            Cliente
          </button>
          <button
            onClick={() => onChangeView("admin")}
            className={`px-3 py-1.5 rounded-full text-sm transition ${
              view === "admin"
                ? "bg-white text-[#1877f2]"
                : "bg-white/15 hover:bg-white/25 text-white"
            }`}
          >
            Admin
          </button>
        </div>
      </div>
    </nav>
  );
}
