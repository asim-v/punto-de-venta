import { CLASIFS } from "../state/CinePOSProvider.jsx";


export default function ClasifFilter({ clasifSel, onChange }) {
    return (
        <div className="flex gap-2 flex-wrap">
            {CLASIFS.map((c) => (
                <button
                    key={c}
                    onClick={() => onChange(c)}
                    className={`px-3 py-1 rounded-full text-sm border ${clasifSel === c
                            ? "bg-[#1877f2] text-white border-transparent"
                            : "bg-white hover:bg-neutral-50 border-neutral-200"
                        }`}
                >
                    {c}
                </button>
            ))}
        </div>
    );
}