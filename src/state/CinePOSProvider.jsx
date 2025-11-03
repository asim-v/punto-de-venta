import React, { createContext, useContext, useMemo, useState } from "react";

/**
 * CinePOSProvider — almacén global de dominio (ocupación, resumen, catálogos y utilidades)
 *
 * Objetivo: separar la lógica de negocio del UI. Los componentes (Navbar, SeatMap, Order, Ticket, etc.)
 * consumirán este contexto y así App.jsx queda delgado.
 *
 * Uso:
 * 1) Coloca este archivo en: src/state/CinePOSProvider.jsx
 * 2) En src/main.jsx o src/App.jsx, envuelve tu árbol con <CinePOSProvider>...
 * 3) Dentro de tus componentes, usa el hook `useCinePOS()` para acceder a estado/acciones.
 */

// ======= Catálogos (exportables para facilidad en tests y componentes) =======
export const SALAS = {
  infantil: { nombre: "Sala Infantil", filas: 5, columnas: 8, precio: 20.5 },
  estandar: { nombre: "Sala Estándar", filas: 6, columnas: 10, precio: 45.0 },
  "3d": { nombre: "Sala 3D", filas: 8, columnas: 12, precio: 85.0 },
};

export const CLASIFS = ["AA", "B15", "C"]; // MX: AA, B15 (15+), C (18+)

export const PELICULAS = [
  // AA
  { id: "aa1", titulo: "Exploradores del Bosque", clasif: "AA", dur: 92 },
  { id: "aa2", titulo: "Robotín y la Chispa", clasif: "AA", dur: 88 },
  { id: "aa3", titulo: "La Carrera Imposible", clasif: "AA", dur: 95 },
  // B15
  { id: "b151", titulo: "Ciudad en Sombras", clasif: "B15", dur: 112 },
  { id: "b152", titulo: "Crónicas del Extremo", clasif: "B15", dur: 104 },
  { id: "b153", titulo: "El Efecto Marfil", clasif: "B15", dur: 120 },
  // C
  { id: "c1", titulo: "La Noche Más Larga", clasif: "C", dur: 118 },
  { id: "c2", titulo: "Silencio de Acero", clasif: "C", dur: 101 },
  { id: "c3", titulo: "Bajo Cero", clasif: "C", dur: 110 },
];

const DENOMINACIONES = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

// ======= Utilidades de dominio =======
export function calcularEdadDesdeFecha(fechaStr) {
  if (!fechaStr) return null;
  const hoy = new Date();
  const nac = new Date(fechaStr);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

export function puedeEntrar(edad, clasif) {
  if (clasif === "AA") return true;
  if (clasif === "B15") return edad >= 15;
  if (clasif === "C") return edad >= 18;
  return false;
}

export function generarMatrizAsientos(filas, columnas) {
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const asientos = [];
  for (let f = 0; f < filas; f++) {
    for (let c = 1; c <= columnas; c++) {
      asientos.push({ id: `${letras[f]}${c}`, fila: letras[f], col: c });
    }
  }
  return asientos;
}

export function desgloseCambio(pago, total) {
  let restante = Math.max(0, Math.floor(pago) - Math.floor(total));
  const resultado = [];
  for (const d of DENOMINACIONES) {
    if (restante <= 0) break;
    const n = Math.floor(restante / d);
    if (n > 0) {
      resultado.push({ denom: d, cantidad: n });
      restante -= n * d;
    }
  }
  return resultado;
}

export function precioPorSala(tipoSala) {
  switch (tipoSala) {
    case "infantil":
      return SALAS.infantil.precio;
    case "estandar":
      return SALAS.estandar.precio;
    case "3d":
      return SALAS["3d"].precio;
    default:
      return 0;
  }
}

// ======= Contexto =======
const CinePOSContext = createContext(null);

export function useCinePOS() {
  const ctx = useContext(CinePOSContext);
  if (!ctx) throw new Error("useCinePOS debe usarse dentro de <CinePOSProvider>");
  return ctx;
}

function crearOcupacionInicial() {
  const base = { infantil: {}, estandar: {}, "3d": {} };
  for (const p of PELICULAS) {
    base.infantil[p.id] = new Set();
    base.estandar[p.id] = new Set();
    base["3d"][p.id] = new Set();
  }
  return base;
}

export function CinePOSProvider({ children }) {
  // Estado global de jornada
  const [ocupacion, setOcupacion] = useState(() => crearOcupacionInicial());
  const [resumen, setResumen] = useState({
    totalBoletos: 0,
    totalMonto: 0,
    porPelicula: {},
    ventasRealizadas: 0,
  });

  // ===== Acciones de dominio =====
  function getOcupados(salaKey, peliculaId) {
    return ocupacion?.[salaKey]?.[peliculaId] ?? new Set();
  }

  function hayDisponibles(salaKey, peliculaId, cantidad) {
    const sInfo = SALAS[salaKey];
    const total = sInfo.filas * sInfo.columnas;
    const ocupados = getOcupados(salaKey, peliculaId).size;
    return total - ocupados >= cantidad;
  }

  /** Marca asientos como ocupados; devuelve {ok, error} */
  function bookSeats({ salaKey, peliculaId, asientos }) {
    const setActual = getOcupados(salaKey, peliculaId);
    // Validar dobles
    for (const a of asientos) {
      if (setActual.has(a)) {
        return { ok: false, error: `Asiento ${a} ya está ocupado.` };
      }
    }
    setOcupacion((prev) => {
      const nuevo = { ...prev };
      const clone = new Set(nuevo[salaKey][peliculaId]);
      for (const a of asientos) clone.add(a);
      nuevo[salaKey] = { ...nuevo[salaKey], [peliculaId]: clone };
      return nuevo;
    });
    return { ok: true };
  }

  function computeImportes({ salaKey, boletos }) {
    const unit = precioPorSala(salaKey);
    const subtotalExacto = Number(boletos) * unit;
    const totalRedondeado = Math.ceil(subtotalExacto);
    return { unit, subtotalExacto, totalRedondeado };
  }

  /** Registra la venta en el resumen y genera el objeto ticket */
  function recordSale({ pelicula, salaKey, boletos, asientos, pago }) {
    const { subtotalExacto, totalRedondeado } = computeImportes({ salaKey, boletos });
    const cambio = desgloseCambio(Number(pago), totalRedondeado);
    const venta = {
      folio: Math.random().toString(36).slice(2, 10).toUpperCase(),
      pelicula,
      salaNombre: SALAS[salaKey].nombre,
      boletos: Number(boletos),
      asientos: [...asientos],
      subtotalExacto,
      totalRedondeado,
      pago: Number(pago),
      cambio,
    };

    setResumen((r) => ({
      totalBoletos: r.totalBoletos + Number(boletos),
      totalMonto: r.totalMonto + totalRedondeado,
      ventasRealizadas: r.ventasRealizadas + 1,
      porPelicula: {
        ...r.porPelicula,
        [pelicula.id]: (r.porPelicula[pelicula.id] || 0) + Number(boletos),
      },
    }));

    return venta;
  }

  function resetDay(keepCatalogs = true) {
    setOcupacion(crearOcupacionInicial());
    setResumen({ totalBoletos: 0, totalMonto: 0, porPelicula: {}, ventasRealizadas: 0 });
  }

  const value = useMemo(
    () => ({
      // catálogos
      SALAS,
      CLASIFS,
      PELICULAS,
      // estado
      ocupacion,
      resumen,
      // utilidades
      calcularEdadDesdeFecha,
      puedeEntrar,
      generarMatrizAsientos,
      desgloseCambio,
      precioPorSala,
      // selectores y acciones
      getOcupados,
      hayDisponibles,
      bookSeats,
      computeImportes,
      recordSale,
      resetDay,
    }),
    [ocupacion, resumen]
  );

  return <CinePOSContext.Provider value={value}>{children}</CinePOSContext.Provider>;
}

export default CinePOSProvider;
