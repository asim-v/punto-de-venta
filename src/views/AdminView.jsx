// src/views/AdminView.jsx
import React, { useMemo } from "react";
import { useCinePOS, PELICULAS, SALAS } from "../state/CinePOSProvider.jsx";

function Bar({ value = 0 }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full bg-neutral-200 rounded-full overflow-hidden">
      <div className="h-full bg-[#1877f2] rounded-full" style={{ width: `${v}%` }} />
    </div>
  );
}

export default function AdminView() {
  const { resumen } = useCinePOS();

  const totalBoletos = resumen.totalBoletos || 0;
  const porPeliculaEntries = useMemo(() => {
    return PELICULAS.map((p) => {
      const count = resumen.porPelicula?.[p.id] || 0;
      const pct = totalBoletos > 0 ? (count / totalBoletos) * 100 : 0;
      return { id: p.id, titulo: p.titulo, count, pct };
    }).sort((a, b) => b.count - a.count);
  }, [resumen, totalBoletos]);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="text-lg font-semibold">Panel administrativo</h2>
        <p className="text-sm text-neutral-600">Resumen del día y métricas por película.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="text-neutral-500 text-sm">Ventas realizadas</div>
          <div className="text-3xl font-bold">{resumen.ventasRealizadas}</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="text-neutral-500 text-sm">Total de boletos</div>
          <div className="text-3xl font-bold">{totalBoletos}</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="text-neutral-500 text-sm">Monto total</div>
          <div className="text-3xl font-bold">${resumen.totalMonto}</div>
        </div>
      </div>

      {/* <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="font-semibold mb-3">Boletos por película</h3>
        <div className="space-y-3">
          {porPeliculaEntries.map((row) => (
            <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate" title={row.titulo}>{row.titulo}</span>
                  <span className="text-sm text-neutral-500">{row.count} ({row.pct.toFixed(0)}%)</span>
                </div>
                <Bar value={row.pct} />
              </div>
            </div>
          ))}
          {porPeliculaEntries.length === 0 && (
            <div className="text-sm text-neutral-500">Sin datos todavía.</div>
          )}
        </div>
      </div> */}

      <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="font-semibold mb-2">Precios por sala (referencia)</h3>
        <ul className="text-sm space-y-1">
          <li>Infantil: ${SALAS.infantil.precio.toFixed(2)}</li>
          <li>Estándar: ${SALAS.estandar.precio.toFixed(2)}</li>
          <li>3D: ${SALAS["3d"].precio.toFixed(2)}</li>
        </ul>
      </div>



      <div className="bg-white rounded-2xl shadow p-4 flex items-center justify-end">
        <button
          onClick={() =>
            alert(
              `VENTAS DEL DÍA\n\nTotal boletos: ${resumen.totalBoletos}\nTotal monto: $${resumen.totalMonto}\nVentas realizadas: ${resumen.ventasRealizadas}`
            )
          }
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
        >
          Terminar jornada
        </button>
      </div>
    </div>
  );
}
