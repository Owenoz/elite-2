/**
 * Elite Movies — Supabase API Service
 * All data operations go directly to Supabase — no PHP server needed.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = "https://ooptltgrxpcluvjbhfbd.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcHRsdGdyeHBjbHV2amJoZmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MDAyMTgsImV4cCI6MjEwNTA3NjIxOH0.dtqzoYwMEfuYHo4c3O89boLP6vAbUJn0r0uo0xO1n0A";
const TMDB_KEY      = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0NzJkOWQyMTczM2Q3YWMzMDVkOWI2NGIwMTNmYjkwZiIsIm5iZiI6MTc1MTkwNDI1OS4yMzMsInN1YiI6IjY4NmJmMDAzZTkwOTFiMjlkYTlhNDFmNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.3yujtwat5S53QuiMkaHfFrj6gJZSvUKPu5S_qZp_dnA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EliteMovie {
  id: number;
  tmdb_id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_year: number;
  vote_average: number;
  runtime: number;
  archive_identifier: string | null;
  archive_url: string | null;
  is_available: boolean;
  created_at: string;
}

export interface PaymentVerifyResult {
  verified: boolean;
  movie_id: number;
  movie_title: string;
  archive_url: string | null;
  archive_identifier: string | null;
  message: string;
}

export interface FavoriteMovie {
  id: number;
  user_email: string;
  movie_id: number;
  title: string;
  poster_url: string;
  vote_average: number;
  release_year: number;
  created_at: string;
}

export interface TrendingSearch {
  search_term: string;
  movie_id: number;
  title: string;
  poster_url: string;
  count: number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateReference(): string {
  return "ELITE-" + Math.random().toString(36).slice(2, 10).toUpperCase() + "-" + Date.now();
}

// ─── Movies ───────────────────────────────────────────────────────────────────

export const getAvailableMovies = async (
  page = 1,
  limit = 50
): Promise<EliteMovie[]> => {
  const from = (page - 1) * limit;
  const to   = from + limit - 1;
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .eq("is_available", true)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) { console.error("getAvailableMovies:", error.message); return []; }
  return (data as EliteMovie[]) || [];
};

export const getMovieByTmdbId = async (tmdbId: number): Promise<EliteMovie | null> => {
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .eq("tmdb_id", tmdbId)
    .maybeSingle();
  if (error) return null;
  return data as EliteMovie | null;
};

export const searchCatalogue = async (query: string): Promise<EliteMovie[]> => {
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .ilike("title", `%${query}%`)
    .eq("is_available", true)
    .limit(30);
  if (error) return [];
  return (data as EliteMovie[]) || [];
};

// ─── Payments + OTP ───────────────────────────────────────────────────────────

/**
 * Step 1 of payment: creates a pending record + generates OTP.
 * NOTE: OTP is returned in the response for demo mode.
 * In production wire up Supabase Edge Function / Resend to email it.
 */
export const createPayment = async (
  email: string,
  movieId: number,
  movieTitle: string
): Promise<{ reference: string; email_sent: boolean; message: string; already_paid?: boolean } | null> => {
  // Check if already paid
  const { data: existing } = await supabase
    .from("downloads")
    .select("id")
    .eq("email", email.toLowerCase())
    .eq("movie_id", movieId)
    .maybeSingle();

  if (existing) {
    return { reference: "", email_sent: false, message: "Already paid", already_paid: true };
  }

  const reference = generateReference();
  const otp       = generateOtp();
  const expires   = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Insert pending payment
  const { error: payErr } = await supabase.from("payments").insert({
    email: email.toLowerCase(),
    movie_id: movieId,
    movie_title: movieTitle,
    amount: 5000,
    currency: "UGX",
    status: "pending",
    reference,
  });
  if (payErr) { console.error("createPayment:", payErr.message); return null; }

  // Delete old unused OTPs for this email
  await supabase.from("otp_codes")
    .delete()
    .eq("email", email.toLowerCase())
    .eq("purpose", "payment")
    .eq("used", false);

  // Insert new OTP
  await supabase.from("otp_codes").insert({
    email: email.toLowerCase(),
    code: otp,
    purpose: "payment",
    used: false,
    expires_at: expires,
  });

  // TODO: send real email via Supabase Edge Function
  // For now: OTP shown in message (demo mode)
  const message = `[Demo] Your code is: ${otp}`;

  return { reference, email_sent: false, message };
};

/**
 * Step 2: verify OTP → complete payment → unlock movie.
 */
export const verifyPayment = async (
  email: string,
  otp: string,
  reference: string
): Promise<PaymentVerifyResult> => {
  const lc = email.toLowerCase();

  // Find OTP
  const { data: otpRow } = await supabase
    .from("otp_codes")
    .select("*")
    .eq("email", lc)
    .eq("code", otp)
    .eq("purpose", "payment")
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otpRow) throw new Error("Invalid or expired code. Try again.");

  // Find pending payment
  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("reference", reference)
    .eq("email", lc)
    .eq("status", "pending")
    .maybeSingle();

  if (!payment) throw new Error("Payment record not found.");

  // Mark OTP used
  await supabase.from("otp_codes").update({ used: true }).eq("id", otpRow.id);

  // Mark payment completed
  await supabase.from("payments").update({ status: "completed" }).eq("id", payment.id);

  // Get movie archive info
  const { data: movie } = await supabase
    .from("movies")
    .select("archive_identifier, archive_url")
    .eq("tmdb_id", payment.movie_id)
    .maybeSingle();

  const archiveUrl        = movie?.archive_url || null;
  const archiveIdentifier = movie?.archive_identifier || null;

  // Record download access (upsert — safe to call multiple times)
  await supabase.from("downloads").upsert(
    { email: lc, movie_id: payment.movie_id, movie_title: payment.movie_title, archive_url: archiveUrl },
    { onConflict: "email,movie_id" }
  );

  return {
    verified: true,
    movie_id: payment.movie_id,
    movie_title: payment.movie_title,
    archive_url: archiveUrl,
    archive_identifier: archiveIdentifier,
    message: "Payment verified! You now have access.",
  };
};

export const resendOtp = async (
  email: string,
  reference: string
): Promise<{ message: string } | null> => {
  const lc = email.toLowerCase();

  // Verify payment exists
  const { data: payment } = await supabase
    .from("payments")
    .select("movie_title")
    .eq("reference", reference)
    .eq("email", lc)
    .maybeSingle();
  if (!payment) return null;

  const otp     = generateOtp();
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await supabase.from("otp_codes")
    .delete().eq("email", lc).eq("purpose", "payment").eq("used", false);

  await supabase.from("otp_codes").insert({
    email: lc, code: otp, purpose: "payment", used: false, expires_at: expires,
  });

  return { message: `[Demo] New code: ${otp}` };
};

export const checkAccess = async (
  email: string,
  movieId: number
): Promise<{ has_access: boolean; archive_url: string | null; archive_identifier: string | null }> => {
  const { data } = await supabase
    .from("downloads")
    .select("archive_url, movies(archive_identifier)")
    .eq("email", email.toLowerCase())
    .eq("movie_id", movieId)
    .maybeSingle();

  return {
    has_access: !!data,
    archive_url: (data as any)?.archive_url || null,
    archive_identifier: (data as any)?.movies?.archive_identifier || null,
  };
};

// ─── Downloads ────────────────────────────────────────────────────────────────

export const getDownloads = async (email: string) => {
  const { data } = await supabase
    .from("downloads")
    .select("*, movies(archive_identifier, poster_path, backdrop_path, overview, vote_average, runtime)")
    .eq("email", email.toLowerCase())
    .order("downloaded_at", { ascending: false });
  return data || [];
};

export const getMovieAccess = async (email: string, movieId: number) => {
  const { data } = await supabase
    .from("downloads")
    .select("archive_url, movies(archive_identifier)")
    .eq("email", email.toLowerCase())
    .eq("movie_id", movieId)
    .maybeSingle();
  return {
    has_access: !!data,
    archive_url: (data as any)?.archive_url || null,
    archive_identifier: (data as any)?.movies?.archive_identifier || null,
  };
};

// ─── Favorites ────────────────────────────────────────────────────────────────

export const getFavorites = async (email: string): Promise<FavoriteMovie[]> => {
  const { data } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_email", email.toLowerCase())
    .order("created_at", { ascending: false });
  return (data as FavoriteMovie[]) || [];
};

export const checkFavorite = async (email: string, movieId: number): Promise<boolean> => {
  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_email", email.toLowerCase())
    .eq("movie_id", movieId)
    .maybeSingle();
  return !!data;
};

export const addFavorite = async (
  email: string, movieId: number, title: string,
  posterUrl: string, voteAverage: number, releaseYear: number
): Promise<boolean> => {
  const { error } = await supabase.from("favorites").upsert(
    { user_email: email.toLowerCase(), movie_id: movieId, title, poster_url: posterUrl, vote_average: voteAverage, release_year: releaseYear },
    { onConflict: "user_email,movie_id" }
  );
  return !error;
};

export const removeFavorite = async (email: string, movieId: number): Promise<boolean> => {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_email", email.toLowerCase())
    .eq("movie_id", movieId);
  return !error;
};

// ─── Search / Trending ────────────────────────────────────────────────────────

export const getTrending = async (limit = 5): Promise<TrendingSearch[]> => {
  const { data } = await supabase
    .from("search_counts")
    .select("*")
    .order("count", { ascending: false })
    .limit(limit);
  return (data as TrendingSearch[]) || [];
};

export const trackSearch = async (
  term: string, movieId: number, title: string, posterUrl: string
): Promise<void> => {
  const lc = term.toLowerCase();
  const { data: existing } = await supabase
    .from("search_counts")
    .select("id, count")
    .eq("search_term", lc)
    .maybeSingle();

  if (existing) {
    await supabase.from("search_counts")
      .update({ count: existing.count + 1 })
      .eq("id", existing.id);
  } else {
    await supabase.from("search_counts").insert({
      search_term: lc, movie_id: movieId, title, poster_url: posterUrl, count: 1,
    });
  }
};

// ─── Archive.org helpers (client-side) ───────────────────────────────────────

export const getArchiveEmbedUrl   = (id: string) => `https://archive.org/embed/${id}?autoplay=1`;
export const getArchiveDetailsUrl = (id: string) => `https://archive.org/details/${id}`;

// ─── Archive.org search (used by admin) ──────────────────────────────────────

export const searchArchive = async (query: string): Promise<any[]> => {
  try {
    const q   = encodeURIComponent(`title:(${query}) AND mediatype:movies`);
    const url = `https://archive.org/advancedsearch.php?q=${q}&fl[]=identifier&fl[]=title&fl[]=year&rows=8&output=json`;
    const res = await fetch(url);
    const d   = await res.json();
    return d?.response?.docs || [];
  } catch { return []; }
};

export const getArchiveMetadata = async (identifier: string): Promise<any> => {
  try {
    const res   = await fetch(`https://archive.org/metadata/${identifier}/files`);
    const d     = await res.json();
    const files = (d?.result || []).filter((f: any) =>
      f.format && (f.format.toLowerCase().includes("mp4") ||
                   f.format.toLowerCase().includes("mpeg4"))
    ).map((f: any) => ({
      name: f.name,
      format: f.format,
      size: f.size ? (f.size / 1024 / 1024).toFixed(1) + " MB" : "?",
      url: `https://archive.org/download/${identifier}/${f.name}`,
    }));
    const best = files.find((f: any) => f.name.includes("512") || f.name.includes("256")) || files[0] || null;
    return { files, best_file: best, embed_url: getArchiveEmbedUrl(identifier), identifier };
  } catch { return { files: [], best_file: null }; }
};

// ─── Admin: upsert movie ──────────────────────────────────────────────────────

export const adminUpsertMovie = async (movie: Partial<EliteMovie>): Promise<EliteMovie | null> => {
  const { data, error } = await supabase
    .from("movies")
    .upsert(movie, { onConflict: "tmdb_id" })
    .select()
    .single();
  if (error) { console.error("adminUpsertMovie:", error.message); return null; }
  return data as EliteMovie;
};

export const adminToggleAvailable = async (id: number): Promise<void> => {
  const { data } = await supabase.from("movies").select("is_available").eq("id", id).single();
  if (data) await supabase.from("movies").update({ is_available: !data.is_available }).eq("id", id);
};

export const adminDeleteMovie = async (id: number): Promise<void> => {
  await supabase.from("movies").delete().eq("id", id);
};

export const adminGetStats = async () => {
  const [movies, payments, downloads, pending, today] = await Promise.all([
    supabase.from("movies").select("id", { count: "exact", head: true }).eq("is_available", true),
    supabase.from("payments").select("amount").eq("status", "completed"),
    supabase.from("downloads").select("id", { count: "exact", head: true }),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("payments").select("amount").eq("status", "completed")
      .gte("created_at", new Date(new Date().setHours(0,0,0,0)).toISOString()),
  ]);

  const totalRevenue = (payments.data || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const todayRevenue = (today.data || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);

  const recent = await supabase
    .from("payments")
    .select("email, movie_title, amount, created_at")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    movies_available: movies.count || 0,
    revenue_ugx: totalRevenue,
    today_revenue: todayRevenue,
    downloads: downloads.count || 0,
    pending_payments: pending.count || 0,
    recent_payments: recent.data || [],
  };
};

// ─── TMDB auto-fetch (used by admin) ─────────────────────────────────────────

export const tmdbFetch = async (tmdbId: number): Promise<any> => {
  const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}`, {
    headers: { Authorization: `Bearer ${TMDB_KEY}`, Accept: "application/json" },
  });
  return res.ok ? res.json() : null;
};

export const tmdbSearch = async (query: string): Promise<any[]> => {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&page=1`,
    { headers: { Authorization: `Bearer ${TMDB_KEY}`, Accept: "application/json" } }
  );
  const d = res.ok ? await res.json() : null;
  return d?.results || [];
};
