import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Replace these with your real Supabase credentials ───────────────────────
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "YOUR_ANON_KEY";
// ─────────────────────────────────────────────────────────────────────────────

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SupabaseMovie {
  id: string;
  tmdb_id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_year: number;
  genre_ids: number[];
  vote_average: number;
  runtime: number;
  archive_identifier: string | null;  // Internet Archive item ID
  archive_url: string | null;          // Direct streaming/download URL
  is_available: boolean;
  created_at: string;
}

export interface ArchiveFile {
  name: string;
  format: string;
  size: string;
  url: string;
}

// ─── Archive.org helpers ─────────────────────────────────────────────────────

const ARCHIVE_BASE = "https://archive.org";

/**
 * Search Internet Archive for a movie by title.
 * Returns the best matching item identifier.
 */
export const searchArchive = async (title: string): Promise<string | null> => {
  try {
    const query = encodeURIComponent(`title:(${title}) AND mediatype:movies`);
    const url = `${ARCHIVE_BASE}/advancedsearch.php?q=${query}&fl[]=identifier,title,year&rows=5&output=json`;
    const res = await fetch(url);
    const data = await res.json();
    const docs = data?.response?.docs;
    if (!docs || docs.length === 0) return null;
    // Return the most relevant result
    return docs[0].identifier;
  } catch (e) {
    console.error("Archive search error:", e);
    return null;
  }
};

/**
 * Get streamable/downloadable video files for an Archive.org item.
 * Returns the best quality MP4 file URL.
 */
export const getArchiveFiles = async (identifier: string): Promise<ArchiveFile[]> => {
  try {
    const url = `${ARCHIVE_BASE}/metadata/${identifier}/files`;
    const res = await fetch(url);
    const data = await res.json();
    const files: any[] = data?.result || [];
    // Filter for video files only, prefer MP4
    const videos = files
      .filter(f => f.format && (
        f.format.toLowerCase().includes("mp4") ||
        f.format.toLowerCase().includes("mpeg4") ||
        f.format.toLowerCase().includes("h.264")
      ))
      .map(f => ({
        name: f.name,
        format: f.format,
        size: f.size,
        url: `https://archive.org/download/${identifier}/${f.name}`,
      }));
    return videos;
  } catch (e) {
    console.error("Archive files error:", e);
    return [];
  }
};

/**
 * Get the best streaming URL for an Archive.org item.
 * Returns the direct MP4 URL for the best quality file.
 */
export const getArchiveStreamUrl = async (identifier: string): Promise<string | null> => {
  try {
    const files = await getArchiveFiles(identifier);
    if (files.length === 0) return null;
    // Prefer 512kb or 256kb quality for mobile streaming
    const mobile = files.find(f =>
      f.name.includes("512kb") || f.name.includes("256kb") || f.name.includes("_512")
    );
    return mobile ? mobile.url : files[0].url;
  } catch (e) {
    return null;
  }
};

/**
 * Get the Internet Archive embed player URL for a movie.
 * This is the most reliable way to stream — IA's own player.
 */
export const getArchiveEmbedUrl = (identifier: string): string =>
  `https://archive.org/embed/${identifier}?autoplay=1`;

// ─── Supabase Movie Operations ────────────────────────────────────────────────

/**
 * Get all available movies from Supabase.
 */
export const getAvailableMovies = async (): Promise<SupabaseMovie[]> => {
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  if (error) { console.error("getAvailableMovies:", error); return []; }
  return data || [];
};

/**
 * Get a single movie by TMDB ID.
 */
export const getMovieByTmdbId = async (tmdbId: number): Promise<SupabaseMovie | null> => {
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .eq("tmdb_id", tmdbId)
    .single();

  if (error) return null;
  return data;
};

/**
 * Upsert a movie into Supabase (add or update).
 * Called when an admin adds a new movie to the catalogue.
 */
export const upsertMovie = async (movie: Partial<SupabaseMovie>): Promise<SupabaseMovie | null> => {
  const { data, error } = await supabase
    .from("movies")
    .upsert(movie, { onConflict: "tmdb_id" })
    .select()
    .single();

  if (error) { console.error("upsertMovie:", error); return null; }
  return data;
};

// ─── Payments ─────────────────────────────────────────────────────────────────

/**
 * Record a new pending payment.
 */
export const createPayment = async (
  email: string,
  movieId: number,
  movieTitle: string
): Promise<string | null> => {
  const reference = `ELITE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const { data, error } = await supabase
    .from("payments")
    .insert({
      email,
      movie_id: movieId,
      movie_title: movieTitle,
      amount: 5000,
      currency: "UGX",
      status: "pending",
      reference,
    })
    .select("reference")
    .single();

  if (error) { console.error("createPayment:", error); return null; }
  return data.reference;
};

/**
 * Mark a payment as completed and record the download.
 */
export const completePayment = async (
  reference: string,
  email: string,
  movieId: number,
  movieTitle: string,
  archiveUrl: string
): Promise<boolean> => {
  // Update payment status
  const { error: payErr } = await supabase
    .from("payments")
    .update({ status: "completed" })
    .eq("reference", reference);

  if (payErr) { console.error("completePayment:", payErr); return false; }

  // Record download access
  const { error: dlErr } = await supabase
    .from("downloads")
    .upsert({ email, movie_id: movieId, movie_title: movieTitle, archive_url: archiveUrl },
      { onConflict: "email,movie_id" });

  if (dlErr) console.error("downloads insert:", dlErr);
  return true;
};

/**
 * Check if an email has already paid for a movie.
 */
export const hasAccessToMovie = async (email: string, movieId: number): Promise<boolean> => {
  const { data, error } = await supabase
    .from("downloads")
    .select("id")
    .eq("email", email.toLowerCase())
    .eq("movie_id", movieId)
    .maybeSingle();

  if (error) return false;
  return !!data;
};

/**
 * Get all downloads for an email.
 */
export const getDownloadsForEmail = async (email: string) => {
  const { data, error } = await supabase
    .from("downloads")
    .select("*")
    .eq("email", email.toLowerCase())
    .order("downloaded_at", { ascending: false });

  if (error) return [];
  return data || [];
};

// ─── Favorites ────────────────────────────────────────────────────────────────

export const addFavorite = async (
  email: string,
  movieId: number,
  title: string,
  posterUrl: string,
  voteAverage: number,
  releaseYear: number
): Promise<boolean> => {
  const { error } = await supabase
    .from("favorites")
    .upsert({ user_email: email.toLowerCase(), movie_id: movieId, title, poster_url: posterUrl, vote_average: voteAverage, release_year: releaseYear },
      { onConflict: "user_email,movie_id" });
  if (error) { console.error("addFavorite:", error); return false; }
  return true;
};

export const removeFavorite = async (email: string, movieId: number): Promise<boolean> => {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_email", email.toLowerCase())
    .eq("movie_id", movieId);
  if (error) { console.error("removeFavorite:", error); return false; }
  return true;
};

export const getFavoritesForEmail = async (email: string) => {
  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_email", email.toLowerCase())
    .order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
};

export const isFavorited = async (email: string, movieId: number): Promise<boolean> => {
  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_email", email.toLowerCase())
    .eq("movie_id", movieId)
    .maybeSingle();
  return !!data;
};

// ─── Search Counts (trending) ─────────────────────────────────────────────────

export const trackSearch = async (term: string, movieId: number, title: string, posterUrl: string) => {
  try {
    // Try increment if exists
    const { data: existing } = await supabase
      .from("search_counts")
      .select("id, count")
      .eq("search_term", term.toLowerCase())
      .maybeSingle();

    if (existing) {
      await supabase
        .from("search_counts")
        .update({ count: existing.count + 1 })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("search_counts")
        .insert({ search_term: term.toLowerCase(), movie_id: movieId, title, poster_url: posterUrl, count: 1 });
    }
  } catch (e) {
    // Non-critical — don't throw
  }
};

export const getTrending = async (limit = 5) => {
  const { data } = await supabase
    .from("search_counts")
    .select("*")
    .order("count", { ascending: false })
    .limit(limit);
  return data || [];
};
