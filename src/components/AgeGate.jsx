import { puedeEntrar } from "../state/CinePOSProvider.jsx";


export default function AgeGate({ peliculaSel, nacimiento, setNacimiento, edadCalc }) {
    return (
        <div>
            <h3 className="font-semibold mb-2">Verificación de edad</h3>
            <div className="grid sm:grid-cols-2 gap-3 items-end">
                <div>
                    <label className="text-sm text-neutral-600">Fecha de nacimiento</label>
                    <input
                        type="date"
                        value={nacimiento}
                        onChange={(e) => setNacimiento(e.target.value)}
                        className="w-full mt-1 rounded-lg border border-neutral-200 px-3 py-2"
                    />
                </div>
                <div className="text-sm">
                    <div className="text-neutral-500">Edad calculada:</div>
                    <div className="text-lg font-semibold">{edadCalc ?? "—"}</div>
                    {peliculaSel && (
                        <div className="mt-1 text-neutral-600">
                            {edadCalc == null
                                ? "Ingresa fecha para validar."
                                : puedeEntrar(edadCalc, peliculaSel.clasif)
                                    ? <span className="text-green-600">Autorizado para {peliculaSel.clasif}</span>
                                    : <span className="text-red-600">No autorizado para {peliculaSel.clasif}</span>
                            }
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}