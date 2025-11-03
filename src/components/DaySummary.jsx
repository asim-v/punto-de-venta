import { useCinePOS, PELICULAS, SALAS } from "../state/CinePOSProvider.jsx";


export default function DaySummary() {
    const { resumen } = useCinePOS();
    return (
        <div className="sticky top-16 space-y-3">
            <div className="bg-white rounded-2xl shadow p-4">
                <h4 className="font-semibold mb-2">Resumen del día</h4>
                <div className="text-sm space-y-1">
                    <div><span className="text-neutral-500">Ventas realizadas:</span> {resumen.ventasRealizadas}</div>
                    <div><span className="text-neutral-500">Total boletos:</span> {resumen.totalBoletos}</div>
                    <div><span className="text-neutral-500">Monto total:</span> ${resumen.totalMonto}</div>
                </div>
            </div>


            <div className="bg-white rounded-2xl shadow p-4">
                <h4 className="font-semibold mb-2">Boletos por película</h4>
                <div className="text-sm space-y-1">
                    {PELICULAS.map((p) => (
                        <div key={p.id} className="flex justify-between">
                            <span className="truncate max-w-[70%]" title={p.titulo}>{p.titulo}</span>
                            <span className="text-neutral-500">{resumen.porPelicula[p.id] || 0}</span>
                        </div>
                    ))}
                </div>
            </div>


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