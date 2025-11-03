import { useRef, useState } from "react";
import { useCinePOS, SALAS, desgloseCambio, puedeEntrar } from "../state/CinePOSProvider.jsx";

export default function OrderSummary({
  peliculaSel,
  salaSel,
  boletos,
  asientosElegidos,
  subtotalExacto,
  totalRedondeado,
  precioUnit,
  pago,
  setPago,
  setErrores,
  setTicket,
  edadCalc,
  errores,
}) {
  const { bookSeats, recordSale } = useCinePOS();

  // Candado e idempotencia
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastSigRef = useRef(null);

  const ready =
    !!peliculaSel &&
    edadCalc != null &&
    puedeEntrar(edadCalc, peliculaSel?.clasif) &&
    asientosElegidos.length === Number(boletos) &&
    Number(pago) >= totalRedondeado;

  function validar() {
    if (!peliculaSel) { setErrores("Selecciona una película."); return false; }
    if (edadCalc == null) { setErrores("Ingresa tu fecha de nacimiento para verificar edad."); return false; }
    if (!puedeEntrar(edadCalc, peliculaSel.clasif)) { setErrores(`El cliente no tiene la edad permitida para ${peliculaSel.clasif}.`); return false; }
    if (asientosElegidos.length !== Number(boletos)) { setErrores(`Selecciona exactamente ${boletos} asiento(s).`); return false; }
    if (Number(pago) < totalRedondeado) { setErrores("El pago es insuficiente."); return false; }
    setErrores("");
    return true;
  }

  function confirmarVenta() {
    if (!validar()) return;
    if (isSubmitting) return; // evita doble clic
    setIsSubmitting(true);

    // Firma para evitar repetir exactamente la misma operación por re-render
    const sig = JSON.stringify({
      pid: peliculaSel.id,
      sala: salaSel,
      asientos: [...asientosElegidos].sort(),
      pago: Number(pago),
      total: totalRedondeado,
    });
    if (lastSigRef.current === sig) { setIsSubmitting(false); return; }

    try {
      const res = bookSeats({
        salaKey: salaSel,
        peliculaId: peliculaSel.id,
        asientos: asientosElegidos,
      });
      if (!res?.ok) {
        setErrores(res?.error || "No se pudo apartar asientos.");
        return;
      }
      const ticket = recordSale({
        pelicula: peliculaSel,
        salaKey: salaSel,
        boletos,
        asientos: asientosElegidos,
        pago: Number(pago),
      });
      lastSigRef.current = sig;
      setErrores("");
      setTicket(ticket); // abre modal
    } catch (e) {
      console.error("[CinePOS] confirmarVenta exception:", e);
      setErrores("Ocurrió un error al confirmar la venta.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3 h-fit">
      <h4 className="font-semibold mb-2">Orden</h4>

      {!!errores && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
          {errores}
        </div>
      )}

      <div className="text-sm space-y-1">
        <div><span className="text-neutral-500">Película:</span> {peliculaSel ? peliculaSel.titulo : "—"}</div>
        <div><span className="text-neutral-500">Clasif.:</span> {peliculaSel ? peliculaSel.clasif : "—"}</div>
        <div><span className="text-neutral-500">Sala:</span> {SALAS[salaSel].nombre}</div>
        <div><span className="text-neutral-500">Precio unit.:</span> ${precioUnit.toFixed(2)}</div>
        <div><span className="text-neutral-500">Boletos:</span> {boletos}</div>
        <div><span className="text-neutral-500">Asientos:</span> {asientosElegidos.length ? asientosElegidos.join(", ") : "—"}</div>
        <div className="pt-2 border-t border-neutral-200" />
        <div className="flex justify-between"><span>Subtotal exacto</span><span>${subtotalExacto.toFixed(2)}</span></div>
        <div className="flex justify-between font-semibold"><span>Total a pagar (redondeado ↑)</span><span>${totalRedondeado.toFixed(0)}</span></div>
      </div>

      <div className="mt-3">
        <label className="text-sm text-neutral-600">Pago del cliente (pesos)</label>
        <input
          type="number"
          min={0}
          value={pago}
          onChange={(e) => setPago(Number(e.target.value))}
          className="w-full mt-1 rounded-lg border border-neutral-200 px-3 py-2"
        />
        {Number(pago) >= totalRedondeado && (
          <div className="text-sm mt-2">
            <div className="text-neutral-500">Cambio a entregar:</div>
            <div className="text-lg font-semibold">${(Number(pago) - totalRedondeado).toFixed(0)}</div>
            <div className="text-neutral-500 mt-1">Desglose mínimo:</div>
            <ul className="text-sm list-disc ml-5">
              {desgloseCambio(Number(pago), totalRedondeado).map((x) => (
                <li key={x.denom}>${x.denom} × {x.cantidad}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={confirmarVenta}
          disabled={!ready || isSubmitting}
          className={`flex-1 px-4 py-2 rounded-lg ${
            !ready || isSubmitting
              ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
              : "bg-[#1877f2] text-white hover:bg-[#0f67db]"
          }`}
          title={!ready ? "Completa los pasos" : isSubmitting ? "Procesando..." : ""}
        >
          {isSubmitting ? "Procesando…" : "Confirmar venta"}
        </button>
      </div>
    </div>
  );
}
