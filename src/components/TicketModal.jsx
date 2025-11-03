export default function TicketModal({ ticket, onClose }) {
    if (!ticket) return null;
    const fecha = new Date();
    const encabezado = "═".repeat(40);
    const linea = "─".repeat(40);
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
            <div className="bg-white w-[min(720px,96vw)] rounded-2xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Ticket de compra</h3>
                    <button onClick={onClose} className="px-3 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200">Cerrar</button>
                </div>
                <pre className="bg-black text-green-300 p-4 rounded-lg text-sm overflow-auto leading-6">
                    {` CINEPOS — CINE CURIO
${encabezado}
PELÍCULA : ${ticket.pelicula.titulo}
CLASIF. : ${ticket.pelicula.clasif}
SALA : ${ticket.salaNombre}
ASIENTOS : ${ticket.asientos.join(", ")}
BOLETOS : ${ticket.boletos}
${linea}
SUBTOTAL : $${ticket.subtotalExacto.toFixed(2)}
TOTAL (↑) : $${ticket.totalRedondeado.toFixed(0)}
PAGO : $${ticket.pago.toFixed(0)}
CAMBIO : $${(ticket.pago - ticket.totalRedondeado).toFixed(0)}
${linea}
DESGLOSE CAMBIO:`}
                    {ticket.cambio.map((x) => `\n $${x.denom} × ${x.cantidad}`).join("")}
                    {`\n${linea}
FECHA/HORA : ${fecha.toLocaleString()}
FOLIO : ${ticket.folio}
${encabezado}
GRACIAS POR SU COMPRA — DISFRUTE LA FUNCIÓN
`}
                </pre>
            </div>
        </div>
    );
}