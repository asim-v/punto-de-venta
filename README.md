# CinePOS (React + Vite + Tailwind + Firebase Hosting)

Sistema de punto de venta para cine con flujo de venta modular, vista de cliente y vista de administración. Soporta catálogo **en vivo** desde TMDB o **local** de respaldo.

---

## Features

- Cartelera filtrable por **clasificación** (AA, B15, C…)
- **AgeGate**: validación de edad vs. clasificación
- Selección de **sala** (infantil/estándar/3D) y **asientos** con bloqueo de ocupados
- Cálculo de **subtotal**, **redondeo** al entero superior y **cambio mínimo**
- **Ticket** con folio y desglose de cambio
- **Resumen del día** y **panel admin** con boletos por película
- Toggle **TMDB Live** ↔ **Catálogo local** (persistido en `localStorage`)

---

## Arquitectura (alto nivel)

- **Estado global**: `CinePOSProvider` expone:
  - `getOcupados(salaKey, peliculaId): Set<string>`
  - `bookSeats({ salaKey, peliculaId, asientos }) -> { ok, error? }`
  - `recordSale({ pelicula, salaKey, boletos, asientos, pago }) -> ticket`
  - `resumen`: `{ totalMonto, totalBoletos, ventasRealizadas, porPelicula }`
- **Vistas**:
  - `ClientView`: flujo de venta (selección, edad, asientos, pago, ticket)
  - `AdminView`: métricas por película y totales del día (y botón “Terminar jornada”)
- **Integraciones**:
  - `tmdbFetch`: util para consumir **TMDB** cuando hay credenciales
  - **Firebase Hosting** para despliegue

---

## Estructura de carpetas

```
.
├─ src/
│  ├─ App.jsx
│  ├─ lib/
│  │  └─ tmdb.js
│  ├─ state/
│  │  └─ CinePOSProvider.jsx
│  ├─ components/
│  │  ├─ Navbar.jsx
│  │  ├─ ClasifFilter.jsx
│  │  ├─ MovieGrid.jsx
│  │  ├─ AgeGate.jsx
│  │  ├─ SeatMap.jsx
│  │  ├─ OrderSummary.jsx
│  │  ├─ TicketModal.jsx
│  │  └─ DaySummary.jsx
│  └─ views/
│     ├─ ClientView.jsx
│     └─ AdminView.jsx
├─ index.html
├─ package.json
└─ README.md
```

---

## Componentes (qué hace cada uno)

- **Navbar**: barra superior; búsqueda placeholder.
- **ClasifFilter**: chips de clasificación; actualiza `clasifSel`.
- **MovieGrid**: grilla de películas. `onSelect(pelicula)` fija `peliculaSel`.
- **AgeGate**: entrada de fecha de nacimiento, calcula `edadCalc` y evalúa autorización con `puedeEntrar`.
- **SeatMap**: mapa creativo de asientos (pantalla curva, pasillo central, labels). Usa `getOcupados` y permite togglear selección.  
  - **Nota**: si estás usando la variante “auto-count”, el número de boletos se deriva de `asientosElegidos.length`. Si mantienes el input externo de “número de boletos”, debe coincidir con los asientos seleccionados.
- **OrderSummary**: muestra totales, entrada de pago, validaciones y `Confirmar venta` → llama `bookSeats` y `recordSale`, luego abre `TicketModal`.
- **TicketModal**: imprime un ticket tipo recibo con cambio desglosado.
- **DaySummary**: panel lateral con totales del día y conteo por película.
- **ClientView**: orquesta el flujo de venta y el toggle TMDB Live.
- **AdminView**: panel con indicadores, barras por película y **“Terminar jornada”** (opcionalmente puedes cablearlo para resetear estado).

---

## Store (API útil)

- `getOcupados(salaKey, peliculaId): Set<string>`
- `bookSeats({ salaKey, peliculaId, asientos })`
  - Falla si algún asiento ya está ocupado para esa `{ sala, película }`.
- `recordSale({ pelicula, salaKey, boletos, asientos, pago })`
  - Calcula total (redondeado ↑), construye `ticket`, actualiza `resumen`.

---

## Variables de entorno

Crea `.env` en la raíz (junto a `package.json`):

```bash
# Usa uno de los dos (Bearer recomendado)
VITE_TMDB_BEARER=eyJhbGciOi...   # Token "v4 auth" de TMDB
# o bien:
VITE_TMDB_API_KEY=xxxxxxxxxxxxxxxx # API Key v3 de TMDB
```

Si no hay credenciales, el toggle “Películas reales (TMDB)” mostrará catálogo local de respaldo.

---

## Requisitos

- **Node.js** 18+ (recomendado 20 LTS)
- **npm** 9+ (o pnpm/yarn si prefieres)

---

## Correr en local

```bash
# 1) Instala dependencias
npm install

# 2) Arranca en dev
npm run dev
# Vite mostrará la URL (por defecto http://localhost:5173)
```

> Si configuraste `.env` con TMDB, habilita el toggle “Películas reales (TMDB)” en la UI para ver cartelera viva.

---

## Build de producción

```bash
npm run build
npm run preview   # opcional, para probar el build localmente
```

El build se genera en `dist/`.

---

## Despliegue en Firebase Hosting

> Debes estar en la **raíz del proyecto** (donde está `package.json`).

```bash
npm install -g firebase-tools          # si aún no lo tienes
firebase login

# Inicializa Hosting (una sola vez por proyecto)
firebase init hosting
# ? Select a default Firebase project → tu-proyecto
# ? What do you want to use as your public directory? → dist
# ? Configure as a single-page app (rewrite all urls to /index.html)? → Yes
# ? Set up automatic builds and deploys with GitHub? → (opcional)
```

Luego:

```bash
npm run build
firebase deploy
```

**Notas importantes**
- El directorio `public` debe ser `dist`.
- Marca **Single Page App** (rewrite a `/index.html`) para que el enrutado del front funcione.
- Si usas múltiples entornos, considera `firebase use` y `firebase target`.

---

## Flujo de venta (resumen)

1. Selecciona **clasificación** y **película**.
2. Ingresa **fecha de nacimiento**. Debe cumplir la clasificación.
3. Elige **sala** y **asientos** disponibles (no puedes tomar ocupados).
4. Ingresa **pago**. Se calcula **total (redondeado ↑)** y **cambio mínimo**.
5. `Confirmar venta` → `bookSeats` → `recordSale` → **Ticket** → asientos quedan bloqueados.

---

## Casos de prueba sugeridos

- **AA, 10 años**: 2 boletos en infantil, pago suficiente → ticket emitido, cambio correcto.
- **B15, 14 años**: bloqueo por edad.
- **C, 22 años**: intentar asiento ocupado → error, reintentar selección.
- **B15, 17 años**: pago justo vs. redondeo → solicitud de monto adicional si falta.

---

## Troubleshooting

- **No veo películas en TMDB**: revisa `.env` y el toggle “Películas reales (TMDB)”. Verifica que el token/clave sea válido. Abre la consola por si `tmdbFetch` reporta un error de red.
- **No me deja confirmar venta**:
  - Verifica que: `peliculaSel` exista, edad válida para su clasificación, **# asientos == # boletos**, y `pago >= totalRedondeado`.
- **Rutas rotas tras deploy**: asegúrate de haber marcado **SPA rewrite** a `/index.html` en `firebase init hosting`.

---

## Créditos / Licencias

- Catálogo en vivo vía **TMDB API** — developer.themoviedb.org
- Build tooling **Vite** — vitejs.dev
- Hosting **Firebase** — firebase.google.com/docs/hosting

---
