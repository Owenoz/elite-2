// Define and export a configuration object for the TMDB API
export const TMDB_CONFIG = {
    // The base URL for all TMDB API v3 requests
    BASE_URL: "https://api.themoviedb.org/3",
    // The API key retrieved from environment variables for authentication
    API_KEY: process.env.EXPO_PUBLIC_MOVIE_API_KEY,
    // Standard headers required for all API requests
    headers: {
        accept: "application/json",
        // The Authorization header includes the API key as a Bearer token
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_MOVIE_API_KEY}`,
    },
};

// Movie genres mapping
export const MOVIE_GENRES = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Science Fiction",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western",
};

// Define and export an asynchronous function to fetch movies
export const fetchMovies = async ({query}: { query: string }) => {
    // Determine the API endpoint based on whether a search query is provided
    const endpoint = query
        // If a query exists, construct a URL for the search endpoint
        ? `${TMDB_CONFIG.BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        // Otherwise, construct a URL to discover the most popular movies
        : `${TMDB_CONFIG.BASE_URL}/discover/movie?sort_by=popularity.desc`;

    // Make the API request using the determined endpoint and configured headers
    const response = await fetch(endpoint, {
        method: "GET",
        headers: TMDB_CONFIG.headers,
    });

    // Check if the response was successful; if not, throw an error
    if (!response.ok) {
        throw new Error(`Failed to fetch movies: ${response.statusText}`);
    }

    // Parse the JSON data from the response
    const data = await response.json();
    // Return the array of movie results
    return data.results;
};

// Fetch movies by genre
export const fetchMoviesByGenre = async (genreId: number) => {
    try {
        const response = await fetch(
            `${TMDB_CONFIG.BASE_URL}/discover/movie?with_genres=${genreId}&sort_by=popularity.desc`,
            {
                method: "GET",
                headers: TMDB_CONFIG.headers,
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch movies by genre: ${response.statusText}`);
        }

        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error("Error fetching movies by genre:", error);
        throw error;
    }
};

export const fetchMovieDetails = async (
    movieId: string
): Promise<MovieDetails> => {
    try {
        const response = await fetch(
            `${TMDB_CONFIG.BASE_URL}/movie/${movieId}?api_key=${TMDB_CONFIG.API_KEY}`,
            {
                method: "GET",
                headers: TMDB_CONFIG.headers,
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch movie details: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching movie details:", error);
        throw error;
    }
};

// Fetch movie cast and crew
export const fetchMovieCredits = async (movieId: string) => {
    try {
        const response = await fetch(
            `${TMDB_CONFIG.BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_CONFIG.API_KEY}`,
            {
                method: "GET",
                headers: TMDB_CONFIG.headers,
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch movie credits: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching movie credits:", error);
        throw error;
    }
};

// Fetch similar movies
export const fetchSimilarMovies = async (movieId: string) => {
    try {
        const response = await fetch(
            `${TMDB_CONFIG.BASE_URL}/movie/${movieId}/similar?api_key=${TMDB_CONFIG.API_KEY}`,
            {
                method: "GET",
                headers: TMDB_CONFIG.headers,
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch similar movies: ${response.statusText}`);
        }

        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error("Error fetching similar movies:", error);
        throw error;
    }
};

// Fetch movie videos (trailers, teasers, etc.)
export const fetchMovieVideos = async (movieId: string) => {
    try {
        const response = await fetch(
            `${TMDB_CONFIG.BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_CONFIG.API_KEY}`,
            {
                method: "GET",
                headers: TMDB_CONFIG.headers,
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch movie videos: ${response.statusText}`);
        }

        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error("Error fetching movie videos:", error);
        throw error;
    }
};
