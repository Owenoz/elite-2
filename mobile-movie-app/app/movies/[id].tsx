import {
    View,
    Text,
    Image,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Alert,
    Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";

import { icons } from "@/constants/icons";
import useFetch from "../../services/useFetch";
import {
    fetchMovieDetails,
    fetchMovieCredits,
    fetchSimilarMovies,
    fetchMovieVideos,
} from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import {
    addToFavorites,
    removeFromFavorites,
    isMovieFavorited,
    addToDownloads,
    isMovieDownloaded,
} from "@/services/appwrite";
import CastCard from "@/components/CastCard";
import MovieCard from "@/components/MovieCard";

// Defines the props for the reusable MovieInfo component.
interface MovieInfoProps {
    label: string;
    value?: string | number | null;
}

// A reusable component to display a label and its corresponding value.
const MovieInfo = ({ label, value }: MovieInfoProps) => (
    <View className="flex-col items-start justify-center mt-5">
        <Text className="text-light-200 font-normal text-sm">{label}</Text>
        <Text className="text-light-100 font-bold text-sm mt-2">
            {value || "N/A"}
        </Text>
    </View>
);

const Details = () => {
    const router = useRouter();
    const { user } = useAuth();
    const { id } = useLocalSearchParams();
    const [isFavorite, setIsFavorite] = useState(false);
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);

    // Fetch movie details, credits, similar movies, and videos
    const { data: movie, loading: movieLoading } = useFetch(() =>
        fetchMovieDetails(id as string)
    );
    const { data: credits, loading: creditsLoading } = useFetch(() =>
        fetchMovieCredits(id as string)
    );
    const { data: similarMovies, loading: similarLoading } = useFetch(() =>
        fetchSimilarMovies(id as string)
    );
    const { data: videos, loading: videosLoading } = useFetch(() =>
        fetchMovieVideos(id as string)
    );

    // Check if movie is favorited and downloaded
    useEffect(() => {
        const checkStatuses = async () => {
            if (user && movie) {
                const favorited = await isMovieFavorited(user.$id, movie.id);
                setIsFavorite(favorited);
                
                const downloaded = await isMovieDownloaded(user.$id, movie.id);
                setIsDownloaded(downloaded);
            }
        };
        checkStatuses();
    }, [user, movie]);

    const handleFavoriteToggle = async () => {
        if (!user) {
            Alert.alert("Login Required", "Please login to save favorites");
            return;
        }

        if (!movie) return;

        setFavoriteLoading(true);
        try {
            if (isFavorite) {
                await removeFromFavorites(user.$id, movie.id);
                setIsFavorite(false);
                Alert.alert("Success", "Removed from favorites");
            } else {
                await addToFavorites(user.$id, {
                    id: movie.id,
                    title: movie.title,
                    poster_path: movie.poster_path,
                    release_date: movie.release_date,
                    vote_average: movie.vote_average,
                } as Movie);
                setIsFavorite(true);
                Alert.alert("Success", "Added to favorites");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to update favorites");
        } finally {
            setFavoriteLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!user) {
            Alert.alert("Login Required", "Please login to download movies");
            return;
        }

        if (!movie) return;

        if (isDownloaded) {
            Alert.alert("Already Downloaded", "This movie is already in your downloads");
            return;
        }

        Alert.alert(
            "Download Movie",
            "This feature simulates downloading. In a real app, you would need proper licensing and download infrastructure.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Download",
                    onPress: async () => {
                        setDownloadLoading(true);
                        try {
                            // Simulate download process
                            await new Promise((resolve) => setTimeout(resolve, 2000));
                            
                            await addToDownloads(
                                user.$id,
                                {
                                    id: movie.id,
                                    title: movie.title,
                                    poster_path: movie.poster_path,
                                    release_date: movie.release_date,
                                    vote_average: movie.vote_average,
                                } as Movie,
                                "downloaded://movie/" + movie.id
                            );
                            
                            setIsDownloaded(true);
                            Alert.alert("Success", "Movie downloaded successfully!");
                        } catch (error) {
                            Alert.alert("Error", "Failed to download movie");
                        } finally {
                            setDownloadLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const handlePlayTrailer = async () => {
        if (!videos || videos.length === 0) {
            Alert.alert("No Trailer", "No trailer available for this movie");
            return;
        }

        // Find the first trailer or teaser
        const trailer = videos.find(
            (v: any) => v.type === "Trailer" || v.type === "Teaser"
        );

        if (!trailer) {
            Alert.alert("No Trailer", "No trailer available for this movie");
            return;
        }

        const youtubeUrl = `https://www.youtube.com/watch?v=${trailer.key}`;

        try {
            const supported = await Linking.canOpenURL(youtubeUrl);

            if (supported) {
                await Linking.openURL(youtubeUrl);
            } else {
                Alert.alert("Error", "Cannot open YouTube video");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to open trailer");
        }
    };

    const loading = movieLoading || creditsLoading || similarLoading || videosLoading;

    if (loading && !movie) {
        return (
            <SafeAreaView className="bg-primary flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#AB8BFF" />
            </SafeAreaView>
        );
    }

    return (
        <View className="bg-primary flex-1">
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header Image with Gradient Overlay */}
                <View className="relative">
                    <Image
                        source={{
                            uri: `https://image.tmdb.org/t/p/w500${movie?.backdrop_path || movie?.poster_path}`,
                        }}
                        className="w-full h-[400px]"
                        resizeMode="cover"
                    />
                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={router.back}
                        className="absolute top-12 left-5 bg-dark-100/80 p-2 rounded-full"
                    >
                        <Image
                            source={icons.arrow}
                            className="size-6 rotate-180"
                            tintColor="#fff"
                        />
                    </TouchableOpacity>

                    {/* Favorite Button */}
                    <TouchableOpacity
                        onPress={handleFavoriteToggle}
                        disabled={favoriteLoading}
                        className="absolute top-12 right-5 bg-dark-100/80 p-2 rounded-full"
                    >
                        <Image
                            source={icons.save}
                            className="size-6"
                            tintColor={isFavorite ? "#AB8BFF" : "#fff"}
                        />
                    </TouchableOpacity>
                </View>

                {/* Main content area for movie details */}
                <View className="flex-col items-start justify-center mt-5 px-5">
                    <Text className="text-white font-bold text-2xl">{movie?.title}</Text>

                    {movie?.tagline && (
                        <Text className="text-light-200 text-sm italic mt-2">
                            "{movie.tagline}"
                        </Text>
                    )}

                    <View className="flex-row items-center gap-x-1 mt-3">
                        <Text className="text-light-200 text-sm">
                            {movie?.release_date?.split("-")[0]} •
                        </Text>
                        <Text className="text-light-200 text-sm">{movie?.runtime}m •</Text>
                        <Text className="text-light-200 text-sm">{movie?.status}</Text>
                    </View>

                    {/* Rating and vote count section */}
                    <View className="flex-row items-center bg-dark-100 px-3 py-2 rounded-lg gap-x-2 mt-3">
                        <Image source={icons.star} className="size-5" />
                        <Text className="text-white font-bold text-base">
                            {movie?.vote_average?.toFixed(1)}/10
                        </Text>
                        <Text className="text-light-200 text-sm">
                            ({movie?.vote_count?.toLocaleString()} votes)
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row gap-3 mt-4 w-full">
                        {/* Play Trailer Button */}
                        {videos && videos.length > 0 && (
                            <TouchableOpacity
                                onPress={handlePlayTrailer}
                                className="flex-1 bg-accent rounded-lg py-3 flex-row items-center justify-center"
                            >
                                <Image
                                    source={icons.play}
                                    className="size-5 mr-2"
                                    tintColor="#fff"
                                />
                                <Text className="text-white font-semibold">Watch Trailer</Text>
                            </TouchableOpacity>
                        )}

                        {/* Download Button */}
                        <TouchableOpacity
                            onPress={handleDownload}
                            disabled={downloadLoading || isDownloaded}
                            className={`flex-1 ${
                                isDownloaded ? "bg-dark-100" : "bg-dark-100"
                            } rounded-lg py-3 flex-row items-center justify-center ${
                                downloadLoading ? "opacity-50" : ""
                            }`}
                        >
                            {downloadLoading ? (
                                <ActivityIndicator color="#AB8BFF" />
                            ) : (
                                <>
                                    <Image
                                        source={icons.arrow}
                                        className={`size-5 mr-2 ${
                                            isDownloaded ? "" : "rotate-90"
                                        }`}
                                        tintColor={isDownloaded ? "#AB8BFF" : "#fff"}
                                    />
                                    <Text
                                        className={`font-semibold ${
                                            isDownloaded ? "text-accent" : "text-white"
                                        }`}
                                    >
                                        {isDownloaded ? "Downloaded" : "Download"}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Genres */}
                    <View className="flex-row flex-wrap gap-2 mt-4">
                        {movie?.genres?.map((genre) => (
                            <View
                                key={genre.id}
                                className="bg-dark-100 px-3 py-1 rounded-full"
                            >
                                <Text className="text-light-100 text-xs">{genre.name}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Overview */}
                    <MovieInfo label="Overview" value={movie?.overview} />

                    {/* Cast Section */}
                    {credits?.cast && credits.cast.length > 0 && (
                        <View className="mt-6">
                            <Text className="text-white text-lg font-bold mb-3">
                                Top Cast
                            </Text>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={credits.cast.slice(0, 10)}
                                renderItem={({ item }) => <CastCard cast={item} />}
                                keyExtractor={(item) => item.cast_id.toString()}
                            />
                        </View>
                    )}

                    {/* Production Info */}
                    <View className="flex flex-row justify-between w-full mt-6">
                        <MovieInfo
                            label="Budget"
                            value={
                                movie?.budget
                                    ? `$${(movie.budget / 1_000_000).toFixed(1)}M`
                                    : "N/A"
                            }
                        />
                        <MovieInfo
                            label="Revenue"
                            value={
                                movie?.revenue
                                    ? `$${(movie.revenue / 1_000_000).toFixed(1)}M`
                                    : "N/A"
                            }
                        />
                        <MovieInfo
                            label="Language"
                            value={movie?.original_language?.toUpperCase()}
                        />
                    </View>

                    <MovieInfo
                        label="Production Companies"
                        value={
                            movie?.production_companies?.map((c) => c.name).join(" • ") ||
                            "N/A"
                        }
                    />

                    {/* Similar Movies Section */}
                    {similarMovies && similarMovies.length > 0 && (
                        <View className="mt-8">
                            <Text className="text-white text-lg font-bold mb-3">
                                Similar Movies
                            </Text>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={similarMovies.slice(0, 10)}
                                renderItem={({ item }) => (
                                    <View className="mr-4 w-32">
                                        <MovieCard {...item} />
                                    </View>
                                )}
                                keyExtractor={(item) => item.id.toString()}
                            />
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* "Go Back" button positioned at the bottom of the screen */}
            <View className="absolute bottom-0 left-0 right-0 bg-primary/95 px-5 py-4">
                <TouchableOpacity
                    className="bg-accent rounded-lg py-3.5 flex flex-row items-center justify-center"
                    onPress={router.back}
                >
                    <Image
                        source={icons.arrow}
                        className="size-5 mr-1 mt-0.5 rotate-180"
                        tintColor="#fff"
                    />
                    <Text className="text-white font-semibold text-base">Go Back</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default Details;