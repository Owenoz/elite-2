import { Client, Databases, ID, Query, Account } from "react-native-appwrite";

// Environment variables for Appwrite configuration
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ID!;
const USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;
const FAVORITES_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_FAVORITES_COLLECTION_ID!;
const DOWNLOADS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_DOWNLOADS_COLLECTION_ID!;

// Initialize the Appwrite client
const client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

// Initialize the Appwrite database service
const database = new Databases(client);
// Initialize the Appwrite account service for authentication
export const account = new Account(client);

// Updates the search count for a movie or creates a new entry if it doesn't exist
export const updateSearchCount = async (query: string, movie: Movie) => {
    try {
        // Check if a document with the same search term already exists
        const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.equal("searchTerm", query),
        ]);

        if (result.documents.length > 0) {
            // If the document exists, increment its count
            const existingMovie = result.documents[0];
            await database.updateDocument(
                DATABASE_ID,
                COLLECTION_ID,
                existingMovie.$id,
                {
                    count: existingMovie.count + 1,
                }
            );
        } else {
            // If the document does not exist, create a new one
            await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
                searchTerm: query,
                movie_id: movie.id,
                title: movie.title,
                count: 1,
                poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
            });
        }
    } catch (error) {
        console.error("Error updating search count:", error);
        throw error;
    }
};

// Fetches the top 5 trending movies based on search count
export const getTrendingMovies = async (): Promise<
    TrendingMovie[] | undefined
> => {
    try {
        const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
            // Limit the results to 5
            Query.limit(5),
            // Order the results by the 'count' field in descending order
            Query.orderDesc("count"),
        ]);

        return result.documents as unknown as TrendingMovie[];
    } catch (error) {
        console.error(error);
        return undefined;
    }
};

// ============== AUTHENTICATION SERVICES ==============

// Register a new user with email and password
export const registerUser = async (email: string, password: string, name: string) => {
    try {
        const newUser = await account.create(
            ID.unique(),
            email,
            password,
            name
        );

        // Create user profile in database
        await database.createDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            ID.unique(),
            {
                userId: newUser.$id,
                email: newUser.email,
                name: newUser.name,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=AB8BFF&color=fff`,
            }
        );

        // Automatically sign in after registration
        await account.createEmailPasswordSession(email, password);
        
        return newUser;
    } catch (error: any) {
        console.error("Error registering user:", error);
        throw new Error(error.message || "Failed to register user");
    }
};

// Sign in user with email and password
export const signIn = async (email: string, password: string) => {
    try {
        const session = await account.createEmailPasswordSession(email, password);
        return session;
    } catch (error: any) {
        console.error("Error signing in:", error);
        throw new Error(error.message || "Failed to sign in");
    }
};

// Get current logged-in user
export const getCurrentUser = async () => {
    try {
        const currentUser = await account.get();
        return currentUser;
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
};

// Sign out the current user
export const signOut = async () => {
    try {
        await account.deleteSession("current");
    } catch (error) {
        console.error("Error signing out:", error);
        throw error;
    }
};

// Get user profile from database
export const getUserProfile = async (userId: string) => {
    try {
        const result = await database.listDocuments(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            [Query.equal("userId", userId)]
        );
        
        if (result.documents.length > 0) {
            return result.documents[0];
        }
        return null;
    } catch (error) {
        console.error("Error getting user profile:", error);
        return null;
    }
};

// ============== FAVORITES SERVICES ==============

// Add movie to favorites
export const addToFavorites = async (userId: string, movie: Movie) => {
    try {
        await database.createDocument(
            DATABASE_ID,
            FAVORITES_COLLECTION_ID,
            ID.unique(),
            {
                userId,
                movieId: movie.id,
                title: movie.title,
                posterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                releaseDate: movie.release_date,
                voteAverage: movie.vote_average,
            }
        );
    } catch (error) {
        console.error("Error adding to favorites:", error);
        throw error;
    }
};

// Remove movie from favorites
export const removeFromFavorites = async (userId: string, movieId: number) => {
    try {
        const result = await database.listDocuments(
            DATABASE_ID,
            FAVORITES_COLLECTION_ID,
            [
                Query.equal("userId", userId),
                Query.equal("movieId", movieId)
            ]
        );

        if (result.documents.length > 0) {
            await database.deleteDocument(
                DATABASE_ID,
                FAVORITES_COLLECTION_ID,
                result.documents[0].$id
            );
        }
    } catch (error) {
        console.error("Error removing from favorites:", error);
        throw error;
    }
};

// Get user's favorite movies
export const getFavorites = async (userId: string) => {
    try {
        const result = await database.listDocuments(
            DATABASE_ID,
            FAVORITES_COLLECTION_ID,
            [Query.equal("userId", userId)]
        );
        
        return result.documents;
    } catch (error) {
        console.error("Error getting favorites:", error);
        return [];
    }
};

// Check if movie is in favorites
export const isMovieFavorited = async (userId: string, movieId: number) => {
    try {
        const result = await database.listDocuments(
            DATABASE_ID,
            FAVORITES_COLLECTION_ID,
            [
                Query.equal("userId", userId),
                Query.equal("movieId", movieId)
            ]
        );
        
        return result.documents.length > 0;
    } catch (error) {
        console.error("Error checking favorite status:", error);
        return false;
    }
};


// ============== DOWNLOADS SERVICES ==============

// Add movie to downloads
export const addToDownloads = async (userId: string, movie: Movie, downloadUri: string) => {
    try {
        await database.createDocument(
            DATABASE_ID,
            DOWNLOADS_COLLECTION_ID,
            ID.unique(),
            {
                userId,
                movieId: movie.id,
                title: movie.title,
                posterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                downloadUri,
                downloadedAt: new Date().toISOString(),
            }
        );
    } catch (error) {
        console.error("Error adding to downloads:", error);
        throw error;
    }
};

// Get user's downloaded movies
export const getDownloads = async (userId: string) => {
    try {
        const result = await database.listDocuments(
            DATABASE_ID,
            DOWNLOADS_COLLECTION_ID,
            [Query.equal("userId", userId)]
        );
        
        return result.documents;
    } catch (error) {
        console.error("Error getting downloads:", error);
        return [];
    }
};

// Check if movie is downloaded
export const isMovieDownloaded = async (userId: string, movieId: number) => {
    try {
        const result = await database.listDocuments(
            DATABASE_ID,
            DOWNLOADS_COLLECTION_ID,
            [
                Query.equal("userId", userId),
                Query.equal("movieId", movieId)
            ]
        );
        
        return result.documents.length > 0;
    } catch (error) {
        console.error("Error checking download status:", error);
        return false;
    }
};
