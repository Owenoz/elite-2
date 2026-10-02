import { Client, Databases, ID, Query, Account } from "react-native-appwrite";

// ─── Config ───────────────────────────────────────────────────────────────────
const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
const APPWRITE_PLATFORM = "com.genzcorner.app";
const APPWRITE_PROJECT  = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID   ?? "686aeb1b003344a33beb";
const DATABASE_ID       = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID  ?? "686c3f460005c8471e94";
const COLLECTION_ID     = process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ID             ?? "686c3f81001fba212ce7";
const USERS_COLLECTION_ID      = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID     ?? "686c3f81001fba212ce8";
const FAVORITES_COLLECTION_ID  = process.env.EXPO_PUBLIC_APPWRITE_FAVORITES_COLLECTION_ID ?? "686c3f81001fba212ce9";
const DOWNLOADS_COLLECTION_ID  = process.env.EXPO_PUBLIC_APPWRITE_DOWNLOADS_COLLECTION_ID ?? "686c3f81001fba212c10";

// ─── Lazy singleton ───────────────────────────────────────────────────────────
// The Appwrite SDK calls into native modules. Initializing at module scope
// (before React mounts) can crash on Android if native modules aren't ready.
// Using lazy getters ensures init happens on first actual use, not at import time.

let _client: Client | null = null;
let _database: Databases | null = null;
let _account: Account | null = null;

function getClient(): Client {
    if (!_client) {
        _client = new Client()
            .setEndpoint(APPWRITE_ENDPOINT)
            .setProject(APPWRITE_PROJECT)
            .setPlatform(APPWRITE_PLATFORM);
    }
    return _client;
}

function getDatabase(): Databases {
    if (!_database) _database = new Databases(getClient());
    return _database;
}

function getAccount(): Account {
    if (!_account) _account = new Account(getClient());
    return _account;
}

// Keep a named export for account so existing code that imports it still works
export { getAccount as account };

// ─── Search / Trending ────────────────────────────────────────────────────────

export const updateSearchCount = async (query: string, movie: Movie) => {
    try {
        const db = getDatabase();
        const result = await db.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.equal("searchTerm", query),
        ]);
        if (result.documents.length > 0) {
            const existing = result.documents[0];
            await db.updateDocument(DATABASE_ID, COLLECTION_ID, existing.$id, {
                count: existing.count + 1,
            });
        } else {
            await db.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
                searchTerm: query,
                movie_id: movie.id,
                title: movie.title,
                count: 1,
                poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
            });
        }
    } catch (error) {
        console.error("Error updating search count:", error);
    }
};

export const getTrendingMovies = async (): Promise<TrendingMovie[] | undefined> => {
    try {
        const result = await getDatabase().listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.limit(5),
            Query.orderDesc("count"),
        ]);
        return result.documents as unknown as TrendingMovie[];
    } catch (error) {
        console.error(error);
        return undefined;
    }
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerUser = async (email: string, password: string, name: string) => {
    try {
        const acc = getAccount();
        const newUser = await acc.create(ID.unique(), email, password, name);
        await getDatabase().createDocument(DATABASE_ID, USERS_COLLECTION_ID, ID.unique(), {
            userId: newUser.$id,
            email: newUser.email,
            name: newUser.name,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=AB8BFF&color=fff`,
        });
        await acc.createEmailPasswordSession(email, password);
        return newUser;
    } catch (error: any) {
        throw new Error(error.message || "Failed to register user");
    }
};

export const signIn = async (email: string, password: string) => {
    try {
        return await getAccount().createEmailPasswordSession(email, password);
    } catch (error: any) {
        throw new Error(error.message || "Failed to sign in");
    }
};

export const getCurrentUser = async () => {
    try {
        return await getAccount().get();
    } catch {
        return null;
    }
};

export const signOut = async () => {
    try {
        await getAccount().deleteSession("current");
    } catch (error) {
        console.error("Error signing out:", error);
    }
};

export const getUserProfile = async (userId: string) => {
    try {
        const result = await getDatabase().listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
            Query.equal("userId", userId),
        ]);
        return result.documents.length > 0 ? result.documents[0] : null;
    } catch {
        return null;
    }
};

// ─── Favorites ────────────────────────────────────────────────────────────────

export const addToFavorites = async (userId: string, movie: Movie) => {
    try {
        await getDatabase().createDocument(DATABASE_ID, FAVORITES_COLLECTION_ID, ID.unique(), {
            userId,
            movieId: movie.id,
            title: movie.title,
            posterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
            releaseDate: movie.release_date,
            voteAverage: movie.vote_average,
        });
    } catch (error) {
        console.error("Error adding to favorites:", error);
        throw error;
    }
};

export const removeFromFavorites = async (userId: string, movieId: number) => {
    try {
        const result = await getDatabase().listDocuments(DATABASE_ID, FAVORITES_COLLECTION_ID, [
            Query.equal("userId", userId),
            Query.equal("movieId", movieId),
        ]);
        if (result.documents.length > 0) {
            await getDatabase().deleteDocument(DATABASE_ID, FAVORITES_COLLECTION_ID, result.documents[0].$id);
        }
    } catch (error) {
        console.error("Error removing from favorites:", error);
        throw error;
    }
};

export const getFavorites = async (userId: string) => {
    try {
        const result = await getDatabase().listDocuments(DATABASE_ID, FAVORITES_COLLECTION_ID, [
            Query.equal("userId", userId),
        ]);
        return result.documents;
    } catch {
        return [];
    }
};

export const isMovieFavorited = async (userId: string, movieId: number): Promise<boolean> => {
    try {
        const result = await getDatabase().listDocuments(DATABASE_ID, FAVORITES_COLLECTION_ID, [
            Query.equal("userId", userId),
            Query.equal("movieId", movieId),
        ]);
        return result.documents.length > 0;
    } catch {
        return false;
    }
};

// ─── Downloads ────────────────────────────────────────────────────────────────

export const addToDownloads = async (userId: string, movie: Movie, downloadUri: string) => {
    try {
        await getDatabase().createDocument(DATABASE_ID, DOWNLOADS_COLLECTION_ID, ID.unique(), {
            userId,
            movieId: movie.id,
            title: movie.title,
            posterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
            downloadUri,
            downloadedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error adding to downloads:", error);
        throw error;
    }
};

export const getDownloads = async (userId: string) => {
    try {
        const result = await getDatabase().listDocuments(DATABASE_ID, DOWNLOADS_COLLECTION_ID, [
            Query.equal("userId", userId),
        ]);
        return result.documents;
    } catch {
        return [];
    }
};

export const isMovieDownloaded = async (userId: string, movieId: number): Promise<boolean> => {
    try {
        const result = await getDatabase().listDocuments(DATABASE_ID, DOWNLOADS_COLLECTION_ID, [
            Query.equal("userId", userId),
            Query.equal("movieId", movieId),
        ]);
        return result.documents.length > 0;
    } catch {
        return false;
    }
};
