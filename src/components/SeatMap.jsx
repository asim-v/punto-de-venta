// src/components/SeatMap.jsx
import { useMemo } from "react";
import { useCinePOS, generarMatrizAsientos } from "../state/CinePOSProvider.jsx";

/**
 * SeatMap creativo:
 * - Pantalla curva en la parte superior
 * - Labels de filas (izq/der) y columnas (abajo)
 * - Pasillo central visual
 * - Micro-animaciones en hover/selección
 * - Leyenda de estados
 *
 * Props:
 *  - salaInfo: { filas, columnas, nombre, ... }
 *  - peliculaSel
 *  - asientosElegidos: string[]
 *  - setAsientosElegidos: (fn) => void
 *  - salaKey?: 'infantil' | 'estandar' | '3d' (opcional; si no llega, se deriva del nombre)
 */
export default function SeatMap({
  salaInfo,
  peliculaSel,
  asientosElegidos,
  setAsientosElegidos,
  salaKey: salaKeyProp,
}) {
  const { getOcupados } = useCinePOS();

  // Deriva salaKey si no viene como prop
  const salaKey =
    salaKeyProp ??
    (salaInfo?.nombre === "Sala Infantil"
      ? "infantil"
      : salaInfo?.nombre === "Sala Estándar"
      ? "estandar"
      : "3d");

  const matriz = useMemo(
    () => generarMatrizAsientos(salaInfo.filas, salaInfo.columnas),
    [salaInfo]
  );

  const ocupadosSet = peliculaSel ? getOcupados(salaKey, peliculaSel.id) : new Set();

  // Helpers para labels (suponiendo ids tipo "A1", "B12", etc.)
  const rows = useMemo(() => {
    const set = new Set(
      matriz.map((a) => a.id.replace(/\d+$/g, "")) // quita dígitos al final
    );
    return Array.from(set);
  }, [matriz]);

  const cols = useMemo(() => {
    const set = new Set(
      matriz.map((a) => parseInt(a.id.replace(/\D+/g, ""), 10)).filter(Boolean)
    );
    return Array.from(set).sort((a, b) => a - b);
  }, [matriz]);

  // Pasillo central visual
  const aisleCol = Math.ceil(salaInfo.columnas / 2);

  function toggleAsiento(aid) {
    if (!peliculaSel) return;
    if (ocupadosSet.has(aid)) return;
    setAsientosElegidos((prev) =>
      prev.includes(aid) ? prev.filter((x) => x !== aid) : [...prev, aid]
    );
  }

  return (
    <div className="w-full">
      {/* Pantalla curva */}
      <div className="mb-4">
        <div className="mx-auto w-[80%] max-w-[720px]">
          <div className="h-1.5 rounded-b-[2rem] bg-gradient-to-b from-neutral-200 to-neutral-300" />
          <div className="text-center text-[10px] tracking-[0.25em] text-neutral-500 mt-1">
            PANTALLA
          </div>
        </div>
      </div>

      {/* Contenedor con labels laterales y grilla de asientos */}
      <div className="grid grid-cols-[auto_1fr_auto] gap-x-2">
        {/* Labels de fila (izquierda) */}
        <div className="hidden sm:flex flex-col items-end justify-center gap-1 pr-1">
          {rows.map((r) => (
            <div key={`L-${r}`} className="h-8 flex items-center text-[11px] text-neutral-500">
              {r}
            </div>
          ))}
        </div>

        {/* Grilla de asientos con pasillo */}
        <div
          className="bg-white/60 rounded-2xl border border-neutral-200 p-3 shadow-sm"
          role="grid"
          aria-label="Mapa de asientos"
        >
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${salaInfo.columnas + 1}, minmax(28px, 1fr))`, // +1 para reservar el "espacio" del pasillo
            }}
          >
            {matriz.map((a) => {
              const colNum = parseInt(a.id.replace(/\D+/g, ""), 10);
              const isAisleBefore = colNum === aisleCol + 1; // inserta pasillo antes de esta col
              const ocupado = ocupadosSet.has(a.id);
              const elegido = asientosElegidos.includes(a.id);

              return (
                <FragmentSeat
                  key={a.id}
                  isAisleBefore={isAisleBefore}
                  seatId={a.id}
                  ocupado={ocupado}
                  elegido={elegido}
                  onClick={() => toggleAsiento(a.id)}
                />
              );
            })}
          </div>

          {/* Pasillo leyenda sutil */}
          <div className="mt-2 text-center text-[10px] text-neutral-400">
            Pasillo central
          </div>
        </div>

        {/* Labels de fila (derecha) */}
        <div className="hidden sm:flex flex-col items-start justify-center gap-1 pl-1">
          {rows.map((r) => (
            <div key={`R-${r}`} className="h-8 flex items-center text-[11px] text-neutral-500">
              {r}
            </div>
          ))}
        </div>
      </div>

      {/* Labels de columnas (abajo) */}
      <div className="mt-2 flex justify-center gap-1 text-[10px] text-neutral-500">
        {cols.map((c) => {
          // deja un “hueco” visual donde pasa el pasillo
          const hole = c === aisleCol + 1;
          return hole ? (
            <div key={`C-hole-${c}`} className="w-7" aria-hidden />
          ) : (
            <div key={`C-${c}`} className="w-7 text-center select-none">
              {c}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-neutral-600">
        <LegendSwatch className="bg-white border-neutral-300" label="Disponible" />
        <LegendSwatch className="bg-[#42b72a]/10 border-[#42b72a]" label="Seleccionado" />
        <LegendSwatch className="bg-neutral-300 border-neutral-300" label="Ocupado" />
      </div>
    </div>
  );
}

/** Fragmento de asiento + posible “hueco” de pasillo antes del asiento */
function FragmentSeat({ isAisleBefore, seatId, ocupado, elegido, onClick }) {
  return (
    <>
      {isAisleBefore && (
        <div
          aria-hidden
          className="w-full h-full"
          style={{
            // pista visual del pasillo: línea vertical suave
            boxShadow: "inset -1px 0 0 0 rgba(0,0,0,0.05)",
          }}
        />
      )}
      <button
        role="gridcell"
        title={ocupado ? `${seatId} (ocupado)` : seatId}
        disabled={ocupado}
        onClick={onClick}
        className={[
          "relative h-8 rounded-lg border flex items-center justify-center select-none",
          "transition transform will-change-transform",
          "focus:outline-none focus:ring-2 focus:ring-[#1877f2]/40",
          ocupado
            ? "bg-neutral-300 border-neutral-300 text-neutral-500 cursor-not-allowed"
            : elegido
            ? "bg-[#42b72a]/10 border-[#42b72a] text-[#1877f2] font-semibold shadow-[inset_0_0_0_1px_rgba(66,183,42,0.2)]"
            : "bg-white border-neutral-300 hover:-translate-y-[1px] hover:shadow-sm hover:border-neutral-400",
        ].join(" ")}
      >
        {/* “Respaldo” del asiento */}
        <div
          className={[
            "absolute -top-1 left-1/2 -translate-x-1/2 h-1.5 w-5 rounded-b-md",
            ocupado
              ? "bg-neutral-400"
              : elegido
              ? "bg-[#1877f2]"
              : "bg-neutral-200 group-hover:bg-neutral-300",
          ].join(" ")}
        />
        <span className="text-[10px] leading-none">{seatId}</span>

        {/* Glow sutil cuando está seleccionado */}
        {elegido && (
          <span className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-[#1877f2]/30 animate-pulse" />
        )}
      </button>
    </>
  );
}

function LegendSwatch({ className = "", label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-4 w-6 rounded border ${className}`} />
      <span>{label}</span>
    </div>
  );
}
