export async function tmdbFetch(path, params = {}) {
  const base = "https://api.themoviedb.org/3";
  const bearer = import.meta.env.VITE_TMDB_BEARER;
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;

  const url = new URL(base + path);
  if (!bearer && apiKey) url.searchParams.set("api_key", apiKey);
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(k, String(v));
  }

  const headers = {};
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${await res.text()}`);
  return res.json();
}
