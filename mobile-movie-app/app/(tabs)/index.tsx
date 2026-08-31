import {
    View,
    Text,
    ScrollView,
    Image,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import useFetch from "../../services/useFetch";
import { fetchMovies, MOVIE_GENRES } from "@/services/api";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import SearchBar from "@/components/SearchBar";
import MovieCard from "@/components/MovieCard";
import TrendingCard from "@/components/TrendingCard";
import CategoryChip from "@/components/CategoryChip";
import { getTrendingMovies } from "@/services/appwrite";
import { useState } from "react";
import ErrorMessage from "@/components/ErrorMessage";

const Index = () => {
    const router = useRouter();
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null);

    // Fetch trending movies from Appwrite
    const {
        data: trendingMovies,
        loading: trendingLoading,
        error: trendingError,
        refetch: refetchTrending,
    } = useFetch(getTrendingMovies);

    // Fetch latest movies from the API
    const {
        data: movies,
        loading: moviesLoading,
        error: moviesError,
        refetch: refetchMovies,
    } = useFetch(() => fetchMovies({ query: "" }));

    // Get top 6 genres for quick access
    const popularGenres = [
        { id: 28, name: "Action" },
        { id: 35, name: "Comedy" },
        { id: 18, name: "Drama" },
        { id: 27, name: "Horror" },
        { id: 10749, name: "Romance" },
        { id: 878, name: "Sci-Fi" },
    ];

    const handleRetry = () => {
        refetchTrending();
        refetchMovies();
    };

    // Show error state if both fetch operations fail
    if ((moviesError && trendingError) && !moviesLoading && !trendingLoading) {
        return (
            <View className="flex-1 bg-primary">
                <Image
                    source={images.bg}
                    className="absolute w-full z-0"
                    resizeMode="cover"
                />
                <ErrorMessage
                    message="Failed to load movies. Please check your connection and try again."
                    onRetry={handleRetry}
                />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-primary">
            <Image
                source={images.bg}
                className="absolute w-full z-0"
                resizeMode="cover"
            />
            <ScrollView
                className="flex-1 px-5"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ minHeight: "100%", paddingBottom: 10 }}
            >
                <Image source={icons.logo} className="w-12 h-10 mt-20 mb-5 mx-auto" />
                
                {/* Display loading indicator if either fetch is in progress */}
                {(moviesLoading || trendingLoading) && !movies && !trendingMovies ? (
                    <ActivityIndicator size="large" color="#AB8BFF" className="mt-10 self-center" />
                ) : (
                    <View className="flex-1 mt-5">
                        <SearchBar
                            onPress={() => router.push("/search")}
                            placeholder="Search for a movie"
                        />

                        {/* Categories Section */}
                        <View className="mt-8">
                            <View className="flex-row justify-between items-center mb-3">
                                <Text className="text-lg text-white font-bold">
                                    Categories
                                </Text>
                                <TouchableOpacity onPress={() => router.push("/categories")}>
                                    <Text className="text-accent text-sm">
                                        See All
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={popularGenres}
                                renderItem={({ item }) => (
                                    <CategoryChip
                                        label={item.name}
                                        selected={selectedGenre === item.id}
                                        onPress={() => {
                                            setSelectedGenre(item.id);
                                            router.push(`/genre/${item.id}?name=${item.name}`);
                                        }}
                                    />
                                )}
                                keyExtractor={(item) => item.id.toString()}
                                className="mb-4"
                            />
                        </View>

                        {/* Trending Movies Section */}
                        {!trendingError && trendingMovies && trendingMovies.length > 0 && (
                            <View className="mt-6">
                                <Text className="text-lg text-white font-bold mb-3">Trending Movies</Text>
                                <FlatList
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    className="mb-4 mt-3"
                                    data={trendingMovies}
                                    renderItem={({ item, index }) => (
                                        <TrendingCard movie={item} index={index} />
                                    )}
                                    keyExtractor={(item, index) => `trending_${item.movie_id}_${index}`}
                                />
                            </View>
                        )}

                        {/* Latest Movies Section */}
                        {moviesError ? (
                            <View className="mt-10">
                                <Text className="text-red-400 text-center mb-4">
                                    Failed to load latest movies
                                </Text>
                                <TouchableOpacity
                                    onPress={refetchMovies}
                                    className="bg-accent self-center px-6 py-2 rounded-lg"
                                >
                                    <Text className="text-white font-semibold">Retry</Text>
                                </TouchableOpacity>
                            </View>
                        ) : movies && movies.length > 0 ? (
                            <>
                                <Text className="text-lg text-white font-bold mt-5 mb-3">Latest Movies</Text>
                                <FlatList
                                    data={movies}
                                    renderItem={({ item }) => <MovieCard {...item} />}
                                    keyExtractor={(item, index) => `latest_${item.id}_${index}`}
                                    numColumns={3}
                                    columnWrapperStyle={{
                                        justifyContent: "flex-start",
                                        gap: 20,
                                        paddingRight: 5,
                                        marginBottom: 10,
                                    }}
                                    className="mt-2 pb-32"
                                    scrollEnabled={false}
                                />
                            </>
                        ) : null}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default Index;
