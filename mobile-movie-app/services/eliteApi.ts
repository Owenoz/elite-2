// ─── Elite Movies API Service ─────────────────────────────────────────────────
// Backend: https://elitemovies.duckdns.org/api

const BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  "https://elitemovies.duckdns.org/api"
).replace(/\/$/, "");

// Timeout for all API requests (ms)
const API_TIMEOUT = 15000;

// Browser-like UA to bypass Cloudflare bot protection on shared hosting
const REQUEST_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  "X-Requested-With": "EliteMoviesApp",
};

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

export interface PaymentCreateResult {
  reference: string;
  email_sent: boolean;
  message: string;
}

export interface PaymentVerifyResult {
  verified: boolean;
  movie_id: number;
  movie_title: string;
  archive_url: string | null;
  archive_identifier: string | null;
  message: string;
}

export interface AccessResult {
  has_access: boolean;
  archive_url: string | null;
  archive_identifier: string | null;
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

export interface DownloadedMovie {
  id: number;
  email: string;
  movie_id: number;
  movie_title: string;
  archive_url: string;
  archive_identifier: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  vote_average: number | null;
  runtime: number | null;
  downloaded_at: string;
}

export interface TrendingSearch {
  search_term: string;
  movie_id: number;
  title: string;
  poster_url: string;
  count: number;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    // AbortController gives us a request timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT);

    const res = await fetch(`${BASE_URL}/${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...REQUEST_HEADERS,
        ...(options.headers || {}),
      },
    });

    clearTimeout(timer);

    // Cloudflare challenge page — not JSON, handle gracefully
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      console.warn(`[EliteAPI] Non-JSON response from ${path} (status ${res.status})`);
      return {
        success: false,
        error: res.status === 403
          ? "API blocked by Cloudflare. See setup instructions."
          : `Server error ${res.status}`,
      };
    }

    const json = await res.json();
    return json;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.error(`[EliteAPI] Timeout on ${path}`);
      return { success: false, error: "Request timed out. Check your connection." };
    }
    console.error(`[EliteAPI] ${path}:`, err.message);
    return { success: false, error: err.message || "Network error" };
  }
}

// ─── Movies ───────────────────────────────────────────────────────────────────

/** Get all available movies in the catalogue */
export const getAvailableMovies = async (
  page = 1,
  limit = 20
): Promise<EliteMovie[]> => {
  const r = await api<{ movies: EliteMovie[] }>(
    `movies?page=${page}&limit=${limit}`
  );
  return r.data?.movies ?? [];
};

/** Get a movie from the catalogue by its TMDB id (returns null if not added yet) */
export const getMovieByTmdbId = async (
  tmdbId: number
): Promise<EliteMovie | null> => {
  const r = await api<EliteMovie>(`movies?tmdb_id=${tmdbId}`);
  return r.success && r.data ? r.data : null;
};

/** Search catalogue by title */
export const searchCatalogue = async (
  query: string
): Promise<EliteMovie[]> => {
  const r = await api<EliteMovie[]>(
    `movies?search=${encodeURIComponent(query)}`
  );
  return r.data ?? [];
};

// ─── Payments ─────────────────────────────────────────────────────────────────

/**
 * Start a payment — creates a pending record and sends OTP to email.
 * Returns the payment reference needed for verification.
 */
export const createPayment = async (
  email: string,
  movieId: number,
  movieTitle: string
): Promise<PaymentCreateResult | null> => {
  const r = await api<PaymentCreateResult>("payments?action=create", {
    method: "POST",
    body: JSON.stringify({ email, movie_id: movieId, movie_title: movieTitle }),
  });
  if (!r.success) {
    console.error("[EliteAPI] createPayment:", r.error);
    return null;
  }
  return r.data ?? null;
};

/**
 * Verify OTP → completes payment → returns archive stream info.
 */
export const verifyPayment = async (
  email: string,
  otp: string,
  reference: string
): Promise<PaymentVerifyResult | null> => {
  const r = await api<PaymentVerifyResult>("payments?action=verify", {
    method: "POST",
    body: JSON.stringify({ email, otp, reference }),
  });
  if (!r.success) {
    throw new Error(r.error || "Verification failed");
  }
  return r.data ?? null;
};

/**
 * Resend OTP for an existing pending payment.
 */
export const resendOtp = async (
  email: string,
  reference: string
): Promise<{ message: string } | null> => {
  const r = await api<{ message: string }>("payments?action=resend", {
    method: "POST",
    body: JSON.stringify({ email, reference }),
  });
  return r.data ?? null;
};

/**
 * Check if an email already has paid access to a movie.
 */
export const checkAccess = async (
  email: string,
  movieId: number
): Promise<AccessResult> => {
  const r = await api<AccessResult>(
    `payments?email=${encodeURIComponent(email)}&movie_id=${movieId}`
  );
  return r.data ?? { has_access: false, archive_url: null, archive_identifier: null };
};

// ─── Downloads ────────────────────────────────────────────────────────────────

/** Get all movies an email has paid for */
export const getDownloads = async (
  email: string
): Promise<DownloadedMovie[]> => {
  const r = await api<DownloadedMovie[]>(
    `downloads?email=${encodeURIComponent(email)}`
  );
  return r.data ?? [];
};

/** Check access to a single movie + get its stream URL */
export const getMovieAccess = async (
  email: string,
  movieId: number
): Promise<AccessResult> => {
  const r = await api<AccessResult>(
    `downloads?email=${encodeURIComponent(email)}&movie_id=${movieId}`
  );
  return r.data ?? { has_access: false, archive_url: null, archive_identifier: null };
};

// ─── Favorites ────────────────────────────────────────────────────────────────

export const getFavorites = async (
  email: string
): Promise<FavoriteMovie[]> => {
  const r = await api<FavoriteMovie[]>(
    `favorites?email=${encodeURIComponent(email)}`
  );
  return r.data ?? [];
};

export const checkFavorite = async (
  email: string,
  movieId: number
): Promise<boolean> => {
  const r = await api<{ is_favorited: boolean }>(
    `favorites?email=${encodeURIComponent(email)}&movie_id=${movieId}`
  );
  return r.data?.is_favorited ?? false;
};

export const addFavorite = async (
  email: string,
  movieId: number,
  title: string,
  posterUrl: string,
  voteAverage: number,
  releaseYear: number
): Promise<boolean> => {
  const r = await api("favorites", {
    method: "POST",
    body: JSON.stringify({
      email,
      movie_id: movieId,
      title,
      poster_url: posterUrl,
      vote_average: voteAverage,
      release_year: releaseYear,
    }),
  });
  return r.success;
};

export const removeFavorite = async (
  email: string,
  movieId: number
): Promise<boolean> => {
  const r = await api("favorites", {
    method: "DELETE",
    body: JSON.stringify({ email, movie_id: movieId }),
  });
  return r.success;
};

// ─── Search / Trending ────────────────────────────────────────────────────────

export const getTrending = async (limit = 5): Promise<TrendingSearch[]> => {
  const r = await api<TrendingSearch[]>(`search?limit=${limit}`);
  return r.data ?? [];
};

export const trackSearch = async (
  term: string,
  movieId: number,
  title: string,
  posterUrl: string
): Promise<void> => {
  await api("search", {
    method: "POST",
    body: JSON.stringify({
      search_term: term,
      movie_id: movieId,
      title,
      poster_url: posterUrl,
    }),
  });
};

// ─── Internet Archive helpers (client-side, no backend needed) ────────────────

export const getArchiveEmbedUrl = (identifier: string): string =>
  `https://archive.org/embed/${identifier}?autoplay=1`;

export const getArchiveDetailsUrl = (identifier: string): string =>
  `https://archive.org/details/${identifier}`;
