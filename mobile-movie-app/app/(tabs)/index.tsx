import {
    View,
    Text,
    ScrollView,
    Image,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
    ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";

import useFetch from "../../services/useFetch";
import {
    fetchMovies,
    fetchNowPlayingMovies,
    fetchTopRatedMovies,
    fetchUpcomingMovies,
} from "@/services/api";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import SearchBar from "@/components/SearchBar";
import MovieCard from "@/components/MovieCard";
import TrendingCard from "@/components/TrendingCard";
import CategoryChip from "@/components/CategoryChip";
import UgandaMovieCard from "@/components/UgandaMovieCard";
import { getTrendingMovies } from "@/services/appwrite";
import { fetchUgandaMovies, type UgandaMovie } from "@/services/ugandaMovies";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Hero Banner Card ────────────────────────────────────────────────────────
const HeroBannerCard = ({ movie }: { movie: Movie }) => {
    const router = useRouter();
    return (
        <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => router.push(`/movies/${movie.id}`)}
            className="mr-4"
            style={{ width: SCREEN_WIDTH * 0.72 }}
        >
            <View className="rounded-2xl overflow-hidden">
                <ImageBackground
                    source={{
                        uri: movie.backdrop_path
                            ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
                            : `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                    }}
                    style={{ width: "100%", height: 210 }}
                    resizeMode="cover"
                >
                    {/* dark gradient overlay */}
                    <View
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: "65%",
                            backgroundColor: "rgba(3,0,20,0.0)",
                        }}
                    />
                    <View className="absolute bottom-0 left-0 right-0 px-3 pb-3"
                        style={{ backgroundColor: "rgba(3,0,20,0.72)" }}>
                        <Text className="text-white font-bold text-base" numberOfLines={1}>
                            {movie.title}
                        </Text>
                        <View className="flex-row items-center gap-x-2 mt-1">
                            <Image source={icons.star} className="size-3" />
                            <Text className="text-accent text-xs font-bold">
                                {movie.vote_average?.toFixed(1)}
                            </Text>
                            <Text className="text-light-300 text-xs">
                                • {movie.release_date?.split("-")[0]}
                            </Text>
                        </View>
                    </View>
                </ImageBackground>
            </View>
        </TouchableOpacity>
    );
};

// ─── Section Row ─────────────────────────────────────────────────────────────
const SectionRow = ({
    title,
    data,
    onSeeAll,
    loading,
}: {
    title: string;
    data: Movie[];
    onSeeAll?: () => void;
    loading?: boolean;
}) => (
    <View className="mt-7">
        <View className="flex-row justify-between items-center mb-3 px-1">
            <Text className="text-white text-lg font-bold">{title}</Text>
            {onSeeAll && (
                <TouchableOpacity onPress={onSeeAll}>
                    <Text className="text-accent text-sm">See All</Text>
                </TouchableOpacity>
            )}
        </View>
        {loading ? (
            <ActivityIndicator size="small" color="#AB8BFF" className="my-4" />
        ) : (
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={data?.slice(0, 10)}
                renderItem={({ item }) => (
                    <View className="mr-3 w-28">
                        <MovieCard {...item} compact />
                    </View>
                )}
                keyExtractor={(item, i) => `${title}_${item.id}_${i}`}
            />
        )}
    </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Index = () => {
    const router = useRouter();
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
    const [ugandaMovies, setUgandaMovies] = useState<UgandaMovie[]>([]);
    const [ugandaLoading, setUgandaLoading] = useState(true);

    const { data: trendingMovies, loading: trendingLoading, refetch: refetchTrending } =
        useFetch(getTrendingMovies);

    const { data: nowPlaying, loading: nowPlayingLoading, refetch: refetchNowPlaying } =
        useFetch(fetchNowPlayingMovies);

    const { data: topRated, loading: topRatedLoading, refetch: refetchTopRated } =
        useFetch(fetchTopRatedMovies);

    const { data: upcoming, loading: upcomingLoading, refetch: refetchUpcoming } =
        useFetch(fetchUpcomingMovies);

    const { data: popular, loading: popularLoading, error: popularError, refetch: refetchPopular } =
        useFetch(() => fetchMovies({ query: "" }));

    // Fetch Uganda movies in background — don't block the main feed
    useEffect(() => {
        fetchUgandaMovies()
            .then((movies) => setUgandaMovies(movies.slice(0, 12)))
            .catch(() => {})
            .finally(() => setUgandaLoading(false));
    }, []);

    const popularGenres = [
        { id: 28, name: "Action" },
        { id: 35, name: "Comedy" },
        { id: 18, name: "Drama" },
        { id: 27, name: "Horror" },
        { id: 10749, name: "Romance" },
        { id: 878, name: "Sci-Fi" },
    ];

    const allLoading =
        nowPlayingLoading && topRatedLoading && upcomingLoading && popularLoading;

    return (
        <View className="flex-1 bg-primary">
            <Image
                source={images.bg}
                className="absolute w-full z-0"
                resizeMode="cover"
            />

            {allLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#AB8BFF" />
                    <Text className="text-light-200 mt-3 text-sm">Loading movies…</Text>
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                >
                    {/* ── Top bar ─────────────────────────────── */}
                    <View className="flex-row items-center justify-between px-5 mt-14 mb-4">
                        <Image source={icons.logo} className="w-10 h-8" />
                        <TouchableOpacity
                            onPress={() => router.push("/categories")}
                            className="bg-dark-100 px-4 py-2 rounded-full"
                        >
                            <Text className="text-light-200 text-xs font-medium">Browse Genres</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── Search bar ──────────────────────────── */}
                    <View className="px-5 mb-2">
                        <SearchBar
                            onPress={() => router.push("/search")}
                            placeholder="Search movies, genres…"
                        />
                    </View>

                    {/* ── Genre chips ─────────────────────────── */}
                    <View className="mt-5 px-5">
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
                        />
                    </View>

                    {/* ── Now Playing hero banner ──────────────── */}
                    {nowPlaying && nowPlaying.length > 0 && (
                        <View className="mt-7">
                            <View className="flex-row justify-between items-center mb-3 px-5">
                                <View className="flex-row items-center gap-x-2">
                                    <View className="w-2 h-5 bg-accent rounded-full" />
                                    <Text className="text-white text-lg font-bold">Now Playing</Text>
                                </View>
                            </View>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
                                data={nowPlaying.slice(0, 8)}
                                renderItem={({ item }) => <HeroBannerCard movie={item} />}
                                keyExtractor={(item, i) => `nowplaying_${item.id}_${i}`}
                            />
                        </View>
                    )}

                    {/* ── Trending (from Appwrite) ─────────────── */}
                    {trendingMovies && trendingMovies.length > 0 && (
                        <View className="mt-7 px-5">
                            <View className="flex-row items-center gap-x-2 mb-3">
                                <View className="w-2 h-5 bg-yellow-400 rounded-full" />
                                <Text className="text-white text-lg font-bold">Trending Searches</Text>
                            </View>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={trendingMovies}
                                renderItem={({ item, index }) => (
                                    <TrendingCard movie={item} index={index} />
                                )}
                                keyExtractor={(item, index) => `trending_${item.movie_id}_${index}`}
                            />
                        </View>
                    )}

                    {/* ── Uganda VJ Movies ────────────────────── */}
                    <View className="mt-7 px-5">
                        <View className="flex-row justify-between items-center mb-3">
                            <View className="flex-row items-center gap-x-2">
                                {/* Uganda flag colours stripe */}
                                <View className="flex-row overflow-hidden rounded-full" style={{ width: 8, height: 20, gap: 0 }}>
                                    <View style={{ flex: 1, backgroundColor: "#000000" }} />
                                    <View style={{ flex: 1, backgroundColor: "#FCDC04" }} />
                                    <View style={{ flex: 1, backgroundColor: "#DE3908" }} />
                                </View>
                                <Text className="text-white text-lg font-bold">🇺🇬 VJ Movies</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => router.push("/uganda")}
                                className="bg-dark-100 px-3 py-1.5 rounded-full"
                            >
                                <Text className="text-accent text-xs font-semibold">See All</Text>
                            </TouchableOpacity>
                        </View>

                        {ugandaLoading ? (
                            <View className="flex-row items-center gap-x-2 py-4">
                                <ActivityIndicator size="small" color="#AB8BFF" />
                                <Text className="text-light-300 text-xs">Loading Luganda movies…</Text>
                            </View>
                        ) : ugandaMovies.length > 0 ? (
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={ugandaMovies}
                                renderItem={({ item }) => (
                                    <View className="mr-3">
                                        <UgandaMovieCard movie={item} compact />
                                    </View>
                                )}
                                keyExtractor={(item) => `ug_home_${item.cbId}`}
                            />
                        ) : (
                            <TouchableOpacity
                                onPress={() => router.push("/uganda")}
                                className="bg-dark-100 rounded-xl p-4 flex-row items-center gap-x-3"
                            >
                                <Text className="text-3xl">🇺🇬</Text>
                                <View className="flex-1">
                                    <Text className="text-white font-bold text-sm">
                                        Uganda VJ Translated Movies
                                    </Text>
                                    <Text className="text-light-300 text-xs mt-0.5">
                                        Browse Luganda-dubbed films from CineBeta
                                    </Text>
                                </View>
                                <Image
                                    source={icons.arrow}
                                    className="size-4"
                                    tintColor="#AB8BFF"
                                />
                            </TouchableOpacity>
                        )}

                        {/* Quick links row — TV Shows + Kulutimbe */}
                        <View className="flex-row gap-x-3 mt-3">
                            <TouchableOpacity
                                onPress={() => router.push("/uganda-tv")}
                                className="flex-1 bg-dark-100 rounded-xl p-3 flex-row items-center gap-x-2"
                                activeOpacity={0.8}
                            >
                                <Text className="text-lg">📺</Text>
                                <View className="flex-1">
                                    <Text className="text-white text-xs font-bold">TV Shows</Text>
                                    <Text className="text-light-300 text-xs">VJ Series</Text>
                                </View>
                                <Image source={icons.arrow} className="size-3" tintColor="#3B82F6" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => router.push("/kulutimbe")}
                                className="flex-1 bg-dark-100 rounded-xl p-3 flex-row items-center gap-x-2"
                                activeOpacity={0.8}
                            >
                                <Text className="text-lg">🎬</Text>
                                <View className="flex-1">
                                    <Text className="text-white text-xs font-bold">Kulutimbe</Text>
                                    <Text className="text-light-300 text-xs">22+ pages</Text>
                                </View>
                                <Image source={icons.arrow} className="size-3" tintColor="#FCDC04" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ── Top Rated ───────────────────────────── */}
                    <View className="px-5">
                        <SectionRow
                            title="Top Rated"
                            data={topRated || []}
                            loading={topRatedLoading}
                            onSeeAll={() => router.push("/genre/all?name=Top Rated")}
                        />
                    </View>

                    {/* ── Upcoming ────────────────────────────── */}
                    <View className="px-5">
                        <SectionRow
                            title="Coming Soon"
                            data={upcoming || []}
                            loading={upcomingLoading}
                        />
                    </View>

                    {/* ── Popular / Discover ──────────────────── */}
                    <View className="px-5 mt-7">
                        <View className="flex-row justify-between items-center mb-3 px-1">
                            <View className="flex-row items-center gap-x-2">
                                <View className="w-2 h-5 bg-blue-400 rounded-full" />
                                <Text className="text-white text-lg font-bold">Popular Now</Text>
                            </View>
                        </View>
                        {popularLoading ? (
                            <ActivityIndicator size="small" color="#AB8BFF" className="my-4" />
                        ) : popular && popular.length > 0 ? (
                            <FlatList
                                data={popular}
                                renderItem={({ item }) => <MovieCard {...item} />}
                                keyExtractor={(item, index) => `popular_${item.id}_${index}`}
                                numColumns={3}
                                columnWrapperStyle={{
                                    justifyContent: "flex-start",
                                    gap: 16,
                                    marginBottom: 12,
                                }}
                                scrollEnabled={false}
                            />
                        ) : null}
                    </View>
                </ScrollView>
            )}
        </View>
    );
};

export default Index;
