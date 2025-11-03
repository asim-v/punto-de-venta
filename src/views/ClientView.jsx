// src/views/ClientView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { tmdbFetch } from "../lib/tmdb.js";
import {
  useCinePOS,
  SALAS,
  CLASIFS,
  PELICULAS,
  calcularEdadDesdeFecha,
  puedeEntrar,
  generarMatrizAsientos,
  precioPorSala,
} from "../state/CinePOSProvider.jsx";
import ClasifFilter from "../components/ClasifFilter.jsx";
import MovieGrid from "../components/MovieGrid.jsx";
import AgeGate from "../components/AgeGate.jsx";
import SeatMap from "../components/SeatMap.jsx";
import OrderSummary from "../components/OrderSummary.jsx";
import TicketModal from "../components/TicketModal.jsx";

function PricesCard() {
  return (
    <div className="sticky top-16 space-y-3">
      <div className="bg-white rounded-2xl shadow p-4">
        <h4 className="font-semibold mb-2">Precios por sala</h4>
        <ul className="text-sm space-y-1">
          <li>Infantil: ${SALAS.infantil.precio.toFixed(2)}</li>
          <li>Estándar: ${SALAS.estandar.precio.toFixed(2)}</li>
          <li>3D: ${SALAS["3d"].precio.toFixed(2)}</li>
        </ul>
      </div>
    </div>
  );
}

export default function ClientView() {
  const { resumen } = useCinePOS();

  // Wizard: 1 = película, 2 = edad, 3 = asientos+pago
  const [step, setStep] = useState(1);

  // Catálogo en vivo (TMDB) con persistencia y feedback
  const [useLive, setUseLive] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cinepos_useLive") ?? "true"); }
    catch { return true; }
  });
  useEffect(() => {
    localStorage.setItem("cinepos_useLive", JSON.stringify(useLive));
  }, [useLive]);

  const [pelisLive, setPelisLive] = useState([]);
  const [lastLiveAt, setLastLiveAt] = useState(null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [liveError, setLiveError] = useState("");

  // Estado de la venta actual
  const [clasifSel, setClasifSel] = useState("AA");
  const [peliculaSel, setPeliculaSel] = useState(null);
  const [salaSel, setSalaSel] = useState("infantil");
  const [boletos, setBoletos] = useState(1);
  const [nacimiento, setNacimiento] = useState("");
  const edadCalc = useMemo(() => calcularEdadDesdeFecha(nacimiento), [nacimiento]);
  const [asientosElegidos, setAsientosElegidos] = useState([]);
  const [pago, setPago] = useState(0);
  const [ticket, setTicket] = useState(null);
  const [errores, setErrores] = useState("");

  // Catálogo (TMDB o local)
  useEffect(() => {
    if (!useLive) return;
    if (!import.meta.env.VITE_TMDB_BEARER && !import.meta.env.VITE_TMDB_API_KEY) {
      setLiveError("Faltan credenciales TMDB (VITE_TMDB_BEARER o VITE_TMDB_API_KEY).");
      return;
    }
    setLoadingLive(true);
    setLiveError("");
    tmdbFetch("/movie/now_playing", { language: "es-MX", page: 1 })
      .then((data) => {
        const mapped = (data?.results ?? []).slice(0, 12).map((m) => ({
          id: String(m.id),
          titulo: m.title || m.original_title,
          clasif: m.adult ? "C" : "B15",
          dur: 100,
          poster: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null,
          rating: typeof m.vote_average === "number" ? m.vote_average.toFixed(1) : null,
        }));
        setPelisLive(mapped);
        setLastLiveAt(Date.now());
      })
      .catch((err) => {
        setLiveError(`TMDB error: ${String(err)}`);
      })
      .finally(() => setLoadingLive(false));
  }, [useLive]);

  // Runtime real al elegir película (si viene de TMDB: id numérico)
  useEffect(() => {
    if (!peliculaSel || !(import.meta.env.VITE_TMDB_BEARER || import.meta.env.VITE_TMDB_API_KEY)) return;
    if (!/^\d+$/.test(String(peliculaSel.id))) return;
    tmdbFetch(`/movie/${peliculaSel.id}`, { language: "es-MX" })
      .then((m) => {
        if (m?.runtime) {
          setPeliculaSel((prev) => (prev ? { ...prev, dur: m.runtime } : prev));
        }
      })
      .catch(() => { });
  }, [peliculaSel]);

  const peliculasBase = useLive ? pelisLive : PELICULAS;
  const peliculasFiltradas = useMemo(() => {
    const list = peliculasBase.filter((p) => p.clasif === clasifSel);
    return list.length === 0 && useLive && clasifSel === "AA"
      ? PELICULAS.filter((p) => p.clasif === "AA")
      : list;
  }, [peliculasBase, clasifSel, useLive]);

  const salaInfo = SALAS[salaSel];
  useMemo(() => generarMatrizAsientos(salaInfo.filas, salaInfo.columnas), [salaInfo.filas, salaInfo.columnas]);
  const precioUnit = precioPorSala(salaSel);
  const subtotalExacto = useMemo(() => boletos * precioUnit, [boletos, precioUnit]);
  const totalRedondeado = Math.ceil(subtotalExacto);

  function limpiarFlujo() {
    setStep(1);
    setClasifSel("AA");
    setPeliculaSel(null);
    setSalaSel("infantil");
    setBoletos(1);
    setNacimiento("");
    setAsientosElegidos([]);
    setPago(0);
    setErrores("");
  }

  // Al cerrar el modal de ticket, regresamos al inicio
  function handleCloseTicket() {
    setTicket(null);
    limpiarFlujo();
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { }
  }

  const puedeAvanzarPaso2 = Boolean(peliculaSel);
  const puedeAvanzarPaso3 = peliculaSel && edadCalc != null && puedeEntrar(edadCalc, peliculaSel.clasif);

  return (
    <>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px] gap-4 p-4">
        <main className="space-y-4">
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Punto de venta (Cliente)</h2>

              <div className="flex items-center gap-3 ml-auto">
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${useLive
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-neutral-300 bg-neutral-50 text-neutral-700"
                    }`}
                >
                  Fuente: {useLive ? "TMDB" : "Local"}
                  {useLive && lastLiveAt && ` • ${pelisLive.length} pelis • ${new Date(lastLiveAt).toLocaleTimeString()}`}
                </span>

                <label className="text-sm text-neutral-600 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={useLive}
                    disabled={loadingLive}
                    onChange={(e) => setUseLive(e.target.checked)}
                  />
                  Películas reales (TMDB)
                </label>
              </div>
            </div>
            <p className="text-sm mt-2 text-neutral-600">
              Selecciona película, valida edad, elige asientos, registra pago y emite ticket.
            </p>
            {useLive && loadingLive && <p className="text-xs text-blue-600 mt-2">Cargando estrenos…</p>}
            {useLive && liveError && <p className="text-xs text-red-600 mt-2">Error TMDB: {liveError}</p>}
          </div>

          {/* Paso 1 */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm text-neutral-500">Clasificación:</span>
                <ClasifFilter
                  clasifSel={clasifSel}
                  onChange={(c) => {
                    setClasifSel(c);
                    setPeliculaSel(null);
                  }}
                />
              </div>
              <MovieGrid peliculas={peliculasFiltradas} peliculaSel={peliculaSel} onSelect={setPeliculaSel} />
              <div className="mt-4 flex justify-end">
                <button
                  disabled={!puedeAvanzarPaso2}
                  onClick={() => setStep(2)}
                  className={`px-4 py-2 rounded-lg ${puedeAvanzarPaso2 ? "bg-[#1877f2] text-white" : "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                    }`}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* Paso 2 */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow p-4">
              <AgeGate
                peliculaSel={peliculaSel}
                nacimiento={nacimiento}
                setNacimiento={setNacimiento}
                edadCalc={edadCalc}
              />
              <div className="mt-4 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50"
                >
                  Atrás
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!puedeAvanzarPaso3}
                  className={`px-4 py-2 rounded-lg ${puedeAvanzarPaso3 ? "bg-[#1877f2] text-white" : "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                    }`}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* Paso 3 */}
          {step === 3 && (
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="grid md:grid-cols-[1fr_280px] gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-sm text-neutral-500">Sala:</span>
                    {Object.keys(SALAS).map((key) => (
                      <button
                        key={key}
                        onClick={() => setSalaSel(key)}
                        className={`px-3 py-1 rounded-full text-sm border ${salaSel === key
                            ? "bg-[#1877f2] text-white border-transparent"
                            : "bg-white hover:bg-neutral-50 border-neutral-200"
                          }`}
                      >
                        {SALAS[key].nombre}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <label className="text-sm text-neutral-600">Número de boletos</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={boletos}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(20, Number(e.target.value)));
                        setBoletos(val);
                        setAsientosElegidos((prev) => prev.slice(0, val));
                      }}
                      className="w-24 rounded-lg border border-neutral-200 px-3 py-1.5"
                    />
                  </div>

                  <SeatMap
                    salaKey={salaSel}
                    salaInfo={salaInfo}
                    peliculaSel={peliculaSel}
                    asientosElegidos={asientosElegidos}
                    setAsientosElegidos={setAsientosElegidos}
                  />
                </div>

                <OrderSummary
                  peliculaSel={peliculaSel}
                  salaSel={salaSel}
                  boletos={boletos}
                  asientosElegidos={asientosElegidos}
                  subtotalExacto={subtotalExacto}
                  totalRedondeado={totalRedondeado}
                  precioUnit={precioUnit}
                  pago={pago}
                  setPago={setPago}
                  setErrores={setErrores}
                  setTicket={setTicket}
                  edadCalc={edadCalc}
                  errores={errores}
                />
              </div>

              <div className="mt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50"
                >
                  Atrás
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow p-4 flex items-center gap-2">
            <button
              onClick={limpiarFlujo}
              className="px-4 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50"
            >
              Cancelar
            </button>

          </div>
        </main>

        {/* Sidebar derecha: precios por sala */}
        <aside className="hidden md:block">
          <PricesCard />
        </aside>
      </div>

      <footer className="py-8 text-center text-xs text-neutral-500">
        Todos los derechos reservados (ʘ‿ʘ)╯
      </footer>

      <TicketModal ticket={ticket} onClose={handleCloseTicket} />
    </>
  );
}
