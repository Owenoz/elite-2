/**
 * Uganda VJ Translated Movies Service
 *
 * Uses the CineBeta Uganda WordPress REST API directly:
 *   https://luganda.cinebeta.net/wp-json/wp/v2/movies
 *
 * The site runs DooPlay on WordPress and exposes full movie data:
 *  - title, slug, link (direct watch URL), content (VJ hashtags), date
 *  - genres taxonomy (term IDs + names), dtyear taxonomy (year)
 *  - class_list contains slugs like "genres-action", "dtyear-2024"
 *
 * We cross-reference each title against TMDB to get poster images.
 * Watch URL = the cinebeta link opened directly in the WebView player.
 */

import { TMDB_CONFIG } from "./api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UgandaMovie {
    /** CineBeta WordPress post ID */
    cbId: number;
    /** TMDB movie ID (null if not found) */
    tmdbId: number | null;
    title: string;
    year: string;
    genres: string[];           // human-readable genre names
    genreIds: number[];         // CineBeta genre term IDs
    rating: number;             // from TMDB (0–10 scale)
    poster_path: string | null; // TMDB path — prepend https://image.tmdb.org/t/p/w500
    backdrop_path: string | null;
    overview: string;
    /** Direct CineBeta watch page URL */
    watchUrl: string;
    /** VJ name(s) extracted from content hashtags */
    vjs: string[];
    slug: string;
}

export interface CineBetaGenre {
    id: number;
    name: string;
    slug: string;
    count: number;
}

// ─── Genre map cache ──────────────────────────────────────────────────────────
// Loaded once then reused. Maps term ID → name.
let _genreMap: Record<number, string> = {};
let _genreList: CineBetaGenre[] = [];
let _genresFetched = false;

// ─── Movie page cache ─────────────────────────────────────────────────────────
interface PageCache {
    movies: UgandaMovie[];
    totalMovies: number;
    totalPages: number;
    fetchedAt: number;
}
const _pageCache = new Map<string, PageCache>();
const CACHE_TTL = 15 * 60 * 1000; // 15 min

const BASE = "https://luganda.cinebeta.net/wp-json/wp/v2";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract VJ names from WP post content (they appear as #vjjunior etc.) */
function extractVJs(content: string): string[] {
    const matches = content.match(/#vj([a-z0-9]+)/gi) ?? [];
    return [
        ...new Set(
            matches.map((m) => {
                const name = m.slice(3); // strip #vj
                return name.charAt(0).toUpperCase() + name.slice(1);
            })
        ),
    ].slice(0, 5);
}

/** Extract year from class_list array e.g. ["dtyear-2024", "genres-action"] */
function extractYear(classList: string[]): string {
    const cls = classList.find((c) => c.startsWith("dtyear-"));
    if (!cls) return "";
    const raw = cls.replace("dtyear-", "");
    return /^\d{4}$/.test(raw) ? raw : "";
}

/** Map genre term IDs to names using the cached genre map */
function mapGenreIds(ids: number[]): string[] {
    return ids
        .map((id) => _genreMap[id])
        .filter(Boolean)
        .slice(0, 4);
}

// ─── Fetch genre map ──────────────────────────────────────────────────────────

export async function fetchGenres(): Promise<CineBetaGenre[]> {
    if (_genresFetched) return _genreList;
    try {
        const res = await fetch(`${BASE}/genres?per_page=100`, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; MovieApp/1.0)" },
        });
        if (!res.ok) throw new Error("genres fetch failed");
        const data: any[] = await res.json();
        _genreList = data.map((g) => ({
            id: g.id,
            name: g.name,
            slug: g.slug,
            count: g.count,
        }));
        _genreMap = {};
        _genreList.forEach((g) => (_genreMap[g.id] = g.name));
        _genresFetched = true;
    } catch (e) {
        console.warn("CineBeta genre fetch failed:", e);
    }
    return _genreList;
}

// ─── Enrich one movie with TMDB poster ───────────────────────────────────────

async function enrichWithTMDB(
    cbId: number,
    title: string,
    year: string,
    genres: string[],
    genreIds: number[],
    watchUrl: string,
    vjs: string[],
    slug: string
): Promise<UgandaMovie> {
    const base: UgandaMovie = {
        cbId,
        tmdbId: null,
        title,
        year,
        genres,
        genreIds,
        rating: 0,
        poster_path: null,
        backdrop_path: null,
        overview: "",
        watchUrl,
        vjs,
        slug,
    };

    try {
        const q = encodeURIComponent(title);
        // Try with year first, fall back without
        const urls = year
            ? [
                  `${TMDB_CONFIG.BASE_URL}/search/movie?query=${q}&year=${year}&language=en-US&page=1`,
                  `${TMDB_CONFIG.BASE_URL}/search/movie?query=${q}&language=en-US&page=1`,
              ]
            : [`${TMDB_CONFIG.BASE_URL}/search/movie?query=${q}&language=en-US&page=1`];

        for (const url of urls) {
            const res = await fetch(url, {
                method: "GET",
                headers: TMDB_CONFIG.headers,
            });
            if (!res.ok) continue;
            const data = await res.json();
            const hit = data.results?.[0];
            if (!hit) continue;

            return {
                ...base,
                tmdbId: hit.id,
                poster_path: hit.poster_path ?? null,
                backdrop_path: hit.backdrop_path ?? null,
                overview: hit.overview ?? "",
                rating: hit.vote_average ?? 0,
            };
        }
    } catch {
        // silently return base record
    }
    return base;
}

// ─── Core fetch function ──────────────────────────────────────────────────────

export interface FetchOptions {
    page?: number;
    perPage?: number;
    genreId?: number | null;
}

export interface FetchResult {
    movies: UgandaMovie[];
    totalMovies: number;
    totalPages: number;
    page: number;
}

/**
 * Fetch one page of Uganda VJ movies from the CineBeta WP REST API.
 * Enriches each movie with TMDB poster data.
 */
export async function fetchUgandaMoviesPage({
    page = 1,
    perPage = 20,
    genreId = null,
}: FetchOptions = {}): Promise<FetchResult> {
    // Ensure genre map is loaded
    await fetchGenres();

    const cacheKey = `${page}_${perPage}_${genreId ?? "all"}`;
    const cached = _pageCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
        return {
            movies: cached.movies,
            totalMovies: cached.totalMovies,
            totalPages: cached.totalPages,
            page,
        };
    }

    // Build API URL
    let url = `${BASE}/movies?per_page=${perPage}&page=${page}&_fields=id,title,slug,link,content,class_list,genres,dtyear&orderby=date&order=desc`;
    if (genreId) url += `&genres=${genreId}`;

    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (compatible; MovieApp/1.0)",
            Accept: "application/json",
        },
    });

    if (!res.ok) throw new Error(`CineBeta API error: ${res.status}`);

    const totalMovies = parseInt(res.headers.get("X-WP-Total") ?? "0", 10);
    const totalPages = parseInt(res.headers.get("X-WP-TotalPages") ?? "1", 10);

    const raw: any[] = await res.json();

    // Parse raw WP posts into structured records
    const parsed = raw.map((post) => {
        const title = post.title?.rendered
            ? post.title.rendered.replace(/&#[0-9]+;/g, (m: string) =>
                  String.fromCharCode(parseInt(m.slice(2, -1), 10))
              )
            : "Untitled";

        const classList: string[] = post.class_list ?? [];
        const year = extractYear(classList);
        const genreIds: number[] = post.genres ?? [];
        const genres = mapGenreIds(genreIds);
        const content = post.content?.rendered ?? "";
        const vjs = extractVJs(content);
        const watchUrl = post.link ?? "";
        const slug = post.slug ?? "";

        return { id: post.id, title, year, genres, genreIds, vjs, watchUrl, slug };
    });

    // Enrich with TMDB in batches of 8
    const enriched: UgandaMovie[] = [];
    for (let i = 0; i < parsed.length; i += 8) {
        const batch = parsed.slice(i, i + 8);
        const results = await Promise.all(
            batch.map((p) =>
                enrichWithTMDB(
                    p.id,
                    p.title,
                    p.year,
                    p.genres,
                    p.genreIds,
                    p.watchUrl,
                    p.vjs,
                    p.slug
                )
            )
        );
        enriched.push(...results);
    }

    _pageCache.set(cacheKey, {
        movies: enriched,
        totalMovies,
        totalPages,
        fetchedAt: Date.now(),
    });

    return { movies: enriched, totalMovies, totalPages, page };
}

/**
 * Convenience: fetch first page (no genre filter).
 * Used by the Home tab preview row.
 */
export async function fetchUgandaMovies(): Promise<UgandaMovie[]> {
    const result = await fetchUgandaMoviesPage({ page: 1, perPage: 20 });
    return result.movies;
}

/**
 * Fetch movies for a specific CineBeta genre.
 */
export async function fetchUgandaMoviesByGenre(
    genreId: number,
    page = 1
): Promise<FetchResult> {
    return fetchUgandaMoviesPage({ page, perPage: 20, genreId });
}

/**
 * Get genre list (loads from API if needed).
 */
export async function getUgandaGenres(): Promise<CineBetaGenre[]> {
    return fetchGenres();
}

/** Clear all caches (e.g. on pull-to-refresh) */
export function clearUgandaCache() {
    _pageCache.clear();
    _genresFetched = false;
    _genreList = [];
    _genreMap = {};
}

// ═══════════════════════════════════════════════════════════════════════════
// TV SHOWS — CineBeta /wp-json/wp/v2/tvshows
// ═══════════════════════════════════════════════════════════════════════════

export interface UgandaTVShow {
    cbId: number;
    tmdbId: number | null;
    title: string;
    year: string;
    genres: string[];
    genreIds: number[];
    rating: number;
    poster_path: string | null;
    backdrop_path: string | null;
    /** Extracted from content (first paragraph before the hashtag block) */
    overview: string;
    watchUrl: string;
    vjs: string[];
    slug: string;
    /** true when class_list contains "tag-completed" */
    completed: boolean;
    /** Networks e.g. Netflix, JTBC */
    networks: string[];
}

export interface TVFetchResult {
    shows: UgandaTVShow[];
    totalShows: number;
    totalPages: number;
    page: number;
}

const _tvCache = new Map<string, { shows: UgandaTVShow[]; totalShows: number; totalPages: number; fetchedAt: number }>();

/** Extract the plot overview from DooPlay WP content — it sits between the
 *  first line (title) and the hashtag block. */
function extractOverview(html: string): string {
    // Strip HTML tags
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();
    // Drop everything from the first #hashtag onwards
    const hashIdx = text.indexOf("#");
    const clean = hashIdx > 0 ? text.slice(0, hashIdx).trim() : text;
    // Drop the "Watch X (YEAR) TV Show..." opener line
    const lines = clean.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    // First line is typically "Watch Title (year) TV Show with all episodes..."
    const overview = lines.slice(1).join(" ").trim();
    return overview.slice(0, 400);
}

/** Extract network names from class_list e.g. "dtnetworks-netflix" → "Netflix" */
function extractNetworks(classList: string[]): string[] {
    return classList
        .filter((c) => c.startsWith("dtnetworks-"))
        .map((c) => {
            const raw = c.replace("dtnetworks-", "").replace(/-/g, " ");
            return raw.replace(/\b\w/g, (l) => l.toUpperCase());
        })
        .slice(0, 3);
}

async function enrichTVWithTMDB(
    cbId: number,
    title: string,
    year: string,
    genres: string[],
    genreIds: number[],
    watchUrl: string,
    vjs: string[],
    slug: string,
    completed: boolean,
    networks: string[],
    overview: string,
): Promise<UgandaTVShow> {
    const base: UgandaTVShow = {
        cbId, tmdbId: null, title, year, genres, genreIds,
        rating: 0, poster_path: null, backdrop_path: null,
        overview, watchUrl, vjs, slug, completed, networks,
    };
    try {
        const q = encodeURIComponent(title);
        const urls = year
            ? [
                `${TMDB_CONFIG.BASE_URL}/search/tv?query=${q}&first_air_date_year=${year}&language=en-US&page=1`,
                `${TMDB_CONFIG.BASE_URL}/search/tv?query=${q}&language=en-US&page=1`,
              ]
            : [`${TMDB_CONFIG.BASE_URL}/search/tv?query=${q}&language=en-US&page=1`];
        for (const url of urls) {
            const res = await fetch(url, { method: "GET", headers: TMDB_CONFIG.headers });
            if (!res.ok) continue;
            const data = await res.json();
            const hit = data.results?.[0];
            if (!hit) continue;
            return {
                ...base,
                tmdbId: hit.id,
                poster_path: hit.poster_path ?? null,
                backdrop_path: hit.backdrop_path ?? null,
                overview: overview || hit.overview || "",
                rating: hit.vote_average ?? 0,
            };
        }
    } catch { /* fall through */ }
    return base;
}

export async function fetchTVShowsPage({
    page = 1,
    perPage = 20,
    genreId = null,
}: FetchOptions = {}): Promise<TVFetchResult> {
    await fetchGenres();

    const cacheKey = `tv_${page}_${perPage}_${genreId ?? "all"}`;
    const cached = _tvCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
        return { shows: cached.shows, totalShows: cached.totalShows, totalPages: cached.totalPages, page };
    }

    let url = `${BASE}/tvshows?per_page=${perPage}&page=${page}&_fields=id,title,slug,link,content,class_list,genres,dtyear,tags&orderby=date&order=desc`;
    if (genreId) url += `&genres=${genreId}`;

    const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MovieApp/1.0)", Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`CineBeta TV API error: ${res.status}`);

    const totalShows = parseInt(res.headers.get("X-WP-Total") ?? "0", 10);
    const totalPages  = parseInt(res.headers.get("X-WP-TotalPages") ?? "1", 10);
    const raw: any[]  = await res.json();

    const parsed = raw.map((post) => {
        const title = (post.title?.rendered ?? "Untitled")
            .replace(/&#[0-9]+;/g, (m: string) => String.fromCharCode(parseInt(m.slice(2, -1), 10)));
        const classList: string[] = post.class_list ?? [];
        const year      = extractYear(classList);
        const genreIds  = post.genres ?? [];
        const genres    = mapGenreIds(genreIds);
        const content   = post.content?.rendered ?? "";
        const vjs       = extractVJs(content);
        const overview  = extractOverview(content);
        const networks  = extractNetworks(classList);
        const completed = classList.includes("tag-completed");
        return { id: post.id, title, year, genres, genreIds, vjs, watchUrl: post.link ?? "", slug: post.slug ?? "", completed, networks, overview };
    });

    const enriched: UgandaTVShow[] = [];
    for (let i = 0; i < parsed.length; i += 8) {
        const batch = parsed.slice(i, i + 8);
        const results = await Promise.all(
            batch.map((p) => enrichTVWithTMDB(
                p.id, p.title, p.year, p.genres, p.genreIds,
                p.watchUrl, p.vjs, p.slug, p.completed, p.networks, p.overview,
            ))
        );
        enriched.push(...results);
    }

    _tvCache.set(cacheKey, { shows: enriched, totalShows, totalPages, fetchedAt: Date.now() });
    return { shows: enriched, totalShows, totalPages, page };
}

/** Convenience: first page of TV shows — used by home tab preview */
export async function fetchUgandaTVShows(): Promise<UgandaTVShow[]> {
    const result = await fetchTVShowsPage({ page: 1, perPage: 20 });
    return result.shows;
}

/** Clear TV show cache too */
const _origClearCache = clearUgandaCache;
export function clearAllUgandaCache() {
    _origClearCache();
    _tvCache.clear();
}
