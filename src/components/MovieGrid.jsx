// src/components/MovieGrid.jsx
export default function MovieGrid({ peliculas, peliculaSel, onSelect }) {
  return (
    <div className="grid xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {peliculas.map((p) => {
        const selected = peliculaSel?.id === p.id;
        const poster = p.poster || null;
        const title = p.titulo || "Sin título";
        const clasif = p.clasif || "—";
        const dur = p.dur ? `${p.dur} min` : "—";
        const rating = p.rating ?? null;

        return (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className={[
              "group relative rounded-2xl border bg-white overflow-hidden text-left",
              "transition hover:shadow-md",
              selected
                ? "border-[#1877f2] ring-2 ring-[#1877f2]/40"
                : "border-neutral-200 hover:border-neutral-300"
            ].join(" ")}
            title={title}
          >
            {/* Poster */}
            <div className="aspect-[2/3] w-full overflow-hidden bg-neutral-100">
              {poster ? (
                <img
                  src={poster}
                  alt={`Póster de ${title}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="h-full w-full grid place-items-center bg-gradient-to-br from-neutral-200 to-neutral-100 px-3">
                  <span className="text-neutral-600 text-sm text-center">{title}</span>
                </div>
              )}
            </div>

            {/* Detalles (ya no overlay) */}
            <div className="p-3 space-y-2">
              {/* Título: 2 líneas máximo, reserva altura para evitar saltos */}
              <div className="font-semibold text-sm leading-snug line-clamp-2 min-h-[2.75rem]">
                {title}
              </div>

              {/* Metadatos en chips bien espaciados */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-600">
                <span className="px-2 py-1 rounded-full border border-neutral-200 bg-neutral-50">
                  Clasif. {clasif}
                </span>
                <span className="px-2 py-1 rounded-full border border-neutral-200 bg-neutral-50">
                  {dur}
                </span>
                {rating && (
                  <span className="px-2 py-1 rounded-full border border-amber-300 bg-amber-50 text-amber-700">
                    ★ {rating}
                  </span>
                )}
              </div>
            </div>

            {/* Realce de selección */}
            <div
              className={[
                "pointer-events-none absolute inset-0 rounded-2xl ring-0 transition",
                selected ? "ring-2 ring-[#1877f2]/60" : "group-hover:ring-1 group-hover:ring-neutral-300"
              ].join(" ")}
            />
          </button>
        );
      })}
    </div>
  );
}
