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
    Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ── Helpers ───────────────────────────────────────────────────────────────────
interface MovieInfoProps {
    label: string;
    value?: string | number | null;
}
const MovieInfo = ({ label, value }: MovieInfoProps) => (
    <View className="flex-col items-start justify-center mt-5">
        <Text className="text-light-200 font-normal text-sm">{label}</Text>
        <Text className="text-light-100 font-bold text-sm mt-2">{value || "N/A"}</Text>
    </View>
);

// ── Component ─────────────────────────────────────────────────────────────────
const Details = () => {
    const router = useRouter();
    const { user } = useAuth();
    const { id } = useLocalSearchParams();

    const [isFavorite, setIsFavorite] = useState(false);
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);

    const { data: movie, loading: movieLoading } = useFetch(() =>
        fetchMovieDetails(id as string)
    );
    const { data: credits } = useFetch(() => fetchMovieCredits(id as string));
    const { data: similarMovies } = useFetch(() => fetchSimilarMovies(id as string));
    const { data: videos } = useFetch(() => fetchMovieVideos(id as string));

    useEffect(() => {
        const checkStatuses = async () => {
            if (user && movie) {
                const [favorited, downloaded] = await Promise.all([
                    isMovieFavorited(user.$id, movie.id),
                    isMovieDownloaded(user.$id, movie.id),
                ]);
                setIsFavorite(favorited);
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
            } else {
                await addToFavorites(user.$id, {
                    id: movie.id,
                    title: movie.title,
                    poster_path: movie.poster_path,
                    release_date: movie.release_date,
                    vote_average: movie.vote_average,
                } as Movie);
                setIsFavorite(true);
            }
        } catch {
            Alert.alert("Error", "Failed to update favorites");
        } finally {
            setFavoriteLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!user) { Alert.alert("Login Required", "Please login to download movies"); return; }
        if (!movie) return;
        if (isDownloaded) { Alert.alert("Already Downloaded", "This movie is already in your downloads"); return; }
        Alert.alert(
            "Download Movie",
            "This simulates downloading. Real downloads require proper licensing.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Download",
                    onPress: async () => {
                        setDownloadLoading(true);
                        try {
                            await new Promise((r) => setTimeout(r, 2000));
                            await addToDownloads(
                                user.$id,
                                { id: movie.id, title: movie.title, poster_path: movie.poster_path, release_date: movie.release_date, vote_average: movie.vote_average } as Movie,
                                "downloaded://movie/" + movie.id
                            );
                            setIsDownloaded(true);
                            Alert.alert("Success", "Movie saved to downloads!");
                        } catch {
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
        const trailer = videos?.find((v: any) => v.type === "Trailer" || v.type === "Teaser");
        if (!trailer) { Alert.alert("No Trailer", "No trailer available for this movie"); return; }
        const url = `https://www.youtube.com/watch?v=${trailer.key}`;
        const supported = await Linking.canOpenURL(url);
        if (supported) await Linking.openURL(url);
        else Alert.alert("Error", "Cannot open YouTube");
    };

    const handleWatchNow = () => {
        if (!movie) return;
        router.push(`/watch/${movie.id}?title=${encodeURIComponent(movie.title)}`);
    };

    if (movieLoading && !movie) {
        return (
            <View className="bg-primary flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#AB8BFF" />
            </View>
        );
    }

    return (
        <View className="bg-primary flex-1">
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                {/* ── Hero image ─────────────────────────────────── */}
                <View style={{ position: "relative" }}>
                    <Image
                        source={{
                            uri: `https://image.tmdb.org/t/p/w780${
                                movie?.backdrop_path || movie?.poster_path
                            }`,
                        }}
                        style={{ width: "100%", height: 340 }}
                        resizeMode="cover"
                    />

                    {/* Gradient scrim at bottom of hero */}
                    <View
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 160,
                            backgroundColor: "rgba(3,0,20,0.0)",
                        }}
                        pointerEvents="none"
                    />
                    {/* Strong bottom fade */}
                    <View
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 80,
                            backgroundColor: "#030014",
                            opacity: 0.9,
                        }}
                        pointerEvents="none"
                    />

                    {/* Back button */}
                    <TouchableOpacity
                        onPress={router.back}
                        className="absolute top-12 left-5 bg-dark-100/80 p-2 rounded-full"
                    >
                        <Image
                            source={icons.arrow}
                            className="size-6"
                            style={{ transform: [{ rotate: "180deg" }] }}
                            tintColor="#fff"
                        />
                    </TouchableOpacity>

                    {/* Favourite button */}
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

                {/* ── Content ────────────────────────────────────── */}
                <View className="px-5 mt-4">
                    {/* Title + tagline */}
                    <Text className="text-white font-bold text-2xl leading-tight">
                        {movie?.title}
                    </Text>
                    {movie?.tagline ? (
                        <Text className="text-light-200 text-sm italic mt-1">
                            "{movie.tagline}"
                        </Text>
                    ) : null}

                    {/* Meta row */}
                    <View className="flex-row items-center flex-wrap gap-x-2 mt-2">
                        <Text className="text-light-300 text-xs">
                            {movie?.release_date?.split("-")[0]}
                        </Text>
                        <Text className="text-light-300 text-xs">•</Text>
                        <Text className="text-light-300 text-xs">
                            {movie?.runtime ? `${movie.runtime}m` : "—"}
                        </Text>
                        <Text className="text-light-300 text-xs">•</Text>
                        <Text className="text-light-300 text-xs">{movie?.status}</Text>
                    </View>

                    {/* Rating pill */}
                    <View className="flex-row items-center bg-dark-100 self-start px-3 py-1.5 rounded-lg gap-x-2 mt-3">
                        <Image source={icons.star} className="size-4" tintColor="#AB8BFF" />
                        <Text className="text-white font-bold text-sm">
                            {movie?.vote_average?.toFixed(1)}/10
                        </Text>
                        <Text className="text-light-300 text-xs">
                            ({movie?.vote_count?.toLocaleString()} votes)
                        </Text>
                    </View>

                    {/* ── Action buttons ─────────────────────── */}
                    <View className="mt-5 gap-y-3">
                        {/* Watch Now — full width, primary CTA */}
                        <TouchableOpacity
                            onPress={handleWatchNow}
                            className="bg-accent rounded-xl py-4 flex-row items-center justify-center gap-x-2"
                            activeOpacity={0.85}
                        >
                            <Image source={icons.play} className="size-5" tintColor="#fff" />
                            <Text className="text-white font-bold text-base">Watch Now</Text>
                        </TouchableOpacity>

                        {/* Trailer + Download row */}
                        <View className="flex-row gap-x-3">
                            {videos && videos.length > 0 && (
                                <TouchableOpacity
                                    onPress={handlePlayTrailer}
                                    className="flex-1 bg-dark-100 rounded-xl py-3 flex-row items-center justify-center gap-x-2"
                                >
                                    <Image source={icons.play} className="size-4" tintColor="#AB8BFF" />
                                    <Text className="text-accent font-semibold text-sm">Trailer</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                onPress={handleDownload}
                                disabled={downloadLoading || isDownloaded}
                                className="flex-1 bg-dark-100 rounded-xl py-3 flex-row items-center justify-center gap-x-2"
                                style={{ opacity: downloadLoading ? 0.5 : 1 }}
                            >
                                {downloadLoading ? (
                                    <ActivityIndicator size="small" color="#AB8BFF" />
                                ) : (
                                    <>
                                        <Image
                                            source={icons.save}
                                            className="size-4"
                                            tintColor={isDownloaded ? "#AB8BFF" : "#fff"}
                                        />
                                        <Text
                                            className="font-semibold text-sm"
                                            style={{ color: isDownloaded ? "#AB8BFF" : "#fff" }}
                                        >
                                            {isDownloaded ? "Saved" : "Download"}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Genre pills */}
                    <View className="flex-row flex-wrap gap-2 mt-5">
                        {movie?.genres?.map((g) => (
                            <View key={g.id} className="bg-dark-100 px-3 py-1 rounded-full">
                                <Text className="text-light-100 text-xs">{g.name}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Overview */}
                    <MovieInfo label="Overview" value={movie?.overview} />

                    {/* Cast */}
                    {credits?.cast && credits.cast.length > 0 && (
                        <View className="mt-6">
                            <Text className="text-white text-lg font-bold mb-3">Top Cast</Text>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={credits.cast.slice(0, 12)}
                                renderItem={({ item }) => <CastCard cast={item} />}
                                keyExtractor={(item) => item.cast_id?.toString() ?? item.id?.toString()}
                            />
                        </View>
                    )}

                    {/* Production stats */}
                    <View className="flex-row justify-between w-full mt-6">
                        <MovieInfo
                            label="Budget"
                            value={movie?.budget ? `$${(movie.budget / 1_000_000).toFixed(1)}M` : null}
                        />
                        <MovieInfo
                            label="Revenue"
                            value={movie?.revenue ? `$${(movie.revenue / 1_000_000).toFixed(1)}M` : null}
                        />
                        <MovieInfo
                            label="Language"
                            value={movie?.original_language?.toUpperCase()}
                        />
                    </View>

                    <MovieInfo
                        label="Production Companies"
                        value={movie?.production_companies?.map((c) => c.name).join(" • ") || null}
                    />

                    {/* Similar movies */}
                    {similarMovies && similarMovies.length > 0 && (
                        <View className="mt-8">
                            <Text className="text-white text-lg font-bold mb-3">
                                More Like This
                            </Text>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={similarMovies.slice(0, 12)}
                                renderItem={({ item }) => (
                                    <View className="mr-3 w-28">
                                        <MovieCard {...item} compact />
                                    </View>
                                )}
                                keyExtractor={(item) => item.id.toString()}
                            />
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* ── Sticky bottom bar ──────────────────────── */}
            <View
                className="absolute bottom-0 left-0 right-0 px-5 py-4"
                style={{ backgroundColor: "rgba(3,0,20,0.96)" }}
            >
                <TouchableOpacity
                    className="bg-accent rounded-xl py-3.5 flex-row items-center justify-center gap-x-2"
                    onPress={handleWatchNow}
                    activeOpacity={0.85}
                >
                    <Image source={icons.play} className="size-5" tintColor="#fff" />
                    <Text className="text-white font-bold text-base">Watch Now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default Details;
