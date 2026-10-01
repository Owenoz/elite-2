import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    RefreshControl,
    ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    fetchUgandaMoviesPage,
    fetchUgandaTVShows,
    getUgandaGenres,
    clearUgandaCache,
    type UgandaMovie,
    type UgandaTVShow,
    type CineBetaGenre,
    type FetchResult,
} from "@/services/ugandaMovies";
import UgandaMovieCard from "@/components/UgandaMovieCard";
import UgandaTVCard from "@/components/UgandaTVCard";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";

// ── Chip ──────────────────────────────────────────────────────────────────────
const Chip = ({
    label,
    count,
    selected,
    onPress,
}: {
    label: string;
    count?: number;
    selected: boolean;
    onPress: () => void;
}) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        className="mr-2 mb-2 flex-row items-center rounded-full px-3 py-1.5"
        style={{ backgroundColor: selected ? "#AB8BFF" : "#221F3D" }}
    >
        <Text
            className="text-xs font-semibold"
            style={{ color: selected ? "#fff" : "#A8B5DB" }}
        >
            {label}
        </Text>
        {count !== undefined && (
            <Text
                className="text-xs ml-1"
                style={{ color: selected ? "rgba(255,255,255,0.7)" : "#6B7280" }}
            >
                {count}
            </Text>
        )}
    </TouchableOpacity>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
const UgandaScreen = () => {
    const router = useRouter();

    const [movies, setMovies] = useState<UgandaMovie[]>([]);
    const [tvShows, setTvShows] = useState<UgandaTVShow[]>([]);
    const [tvLoading, setTvLoading] = useState(true);
    const [genres, setGenres] = useState<CineBetaGenre[]>([]);
    const [totalMovies, setTotalMovies] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Load genres once on mount
    useEffect(() => {
        getUgandaGenres()
            .then((g) =>
                setGenres(g.filter((x) => x.count > 0).sort((a, b) => b.count - a.count))
            )
            .catch(() => {});
        // Load TV shows preview in background
        fetchUgandaTVShows()
            .then((shows) => setTvShows(shows.slice(0, 10)))
            .catch(() => {})
            .finally(() => setTvLoading(false));
    }, []);

    // Load movies whenever genre changes
    const load = useCallback(
        async (page = 1, genreId: number | null = selectedGenreId, isRefresh = false) => {
            try {
                if (page === 1) {
                    if (!isRefresh) setLoading(true);
                    setError(null);
                }
                const result: FetchResult = await fetchUgandaMoviesPage({
                    page,
                    perPage: 20,
                    genreId,
                });
                if (page === 1) {
                    setMovies(result.movies);
                } else {
                    setMovies((prev) => [...prev, ...result.movies]);
                }
                setTotalMovies(result.totalMovies);
                setTotalPages(result.totalPages);
                setCurrentPage(page);
            } catch (e: any) {
                setError(e?.message ?? "Failed to load Uganda movies");
            } finally {
                setLoading(false);
                setRefreshing(false);
                setLoadingMore(false);
            }
        },
        [selectedGenreId]
    );

    useEffect(() => {
        load(1, selectedGenreId);
    }, [selectedGenreId]);

    const onRefresh = () => {
        clearUgandaCache();
        setRefreshing(true);
        load(1, selectedGenreId, true);
    };

    const loadMore = () => {
        if (loadingMore || currentPage >= totalPages) return;
        setLoadingMore(true);
        load(currentPage + 1, selectedGenreId);
    };

    // Client-side search filter
    const displayed = searchQuery.trim()
        ? movies.filter(
              (m) =>
                  m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  m.vjs.some((v) => v.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  m.genres.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        : movies;

    // ── Render ────────────────────────────────────────────────────────────────

    if (loading && movies.length === 0) {
        return (
            <View className="flex-1 bg-primary items-center justify-center">
                <Image source={images.bg} className="absolute w-full h-full" resizeMode="cover" />
                <ActivityIndicator size="large" color="#AB8BFF" />
                <Text className="text-light-200 mt-3 text-sm text-center px-8">
                    Loading Uganda VJ movies…
                </Text>
                <Text className="text-light-300 text-xs mt-1 text-center px-12">
                    Fetching from CineBeta & enriching with TMDB posters
                </Text>
            </View>
        );
    }

    if (error && movies.length === 0) {
        return (
            <View className="flex-1 bg-primary items-center justify-center px-8">
                <Image source={images.bg} className="absolute w-full h-full" resizeMode="cover" />
                <Text className="text-4xl mb-4">🇺🇬</Text>
                <Text className="text-white font-bold text-lg text-center mb-2">
                    Could not load movies
                </Text>
                <Text className="text-light-200 text-sm text-center mb-6 leading-5">{error}</Text>
                <TouchableOpacity
                    onPress={() => load(1)}
                    className="bg-accent px-6 py-3 rounded-xl mb-3"
                >
                    <Text className="text-white font-bold">Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={router.back}>
                    <Text className="text-light-300 text-sm">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-primary">
            <Image source={images.bg} className="absolute w-full h-full" resizeMode="cover" />
            <SafeAreaView edges={["top"]} className="flex-1">
                <FlatList
                    data={displayed}
                    numColumns={3}
                    keyExtractor={(item) => `ug_${item.cbId}`}
                    contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
                    columnWrapperStyle={{
                        justifyContent: "flex-start",
                        gap: 12,
                        marginBottom: 16,
                    }}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.4}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#AB8BFF"
                        />
                    }
                    renderItem={({ item }) => <UgandaMovieCard movie={item} />}
                    ListHeaderComponent={
                        <>
                            {/* ── Header bar ───────────────── */}
                            <View className="flex-row items-center gap-x-3 mt-4 mb-3">
                                <TouchableOpacity
                                    onPress={router.back}
                                    className="bg-dark-100 p-2 rounded-full"
                                >
                                    <Image
                                        source={icons.arrow}
                                        className="size-5"
                                        style={{ transform: [{ rotate: "180deg" }] }}
                                        tintColor="#fff"
                                    />
                                </TouchableOpacity>
                                <View className="flex-1">
                                    <Text className="text-white text-xl font-bold">
                                        🇺🇬 Uganda VJ Movies
                                    </Text>
                                    <Text className="text-light-300 text-xs mt-0.5">
                                        Luganda translated · CineBeta Uganda
                                    </Text>
                                </View>
                            </View>

                            {/* ── Stats row ────────────────── */}
                            <View className="flex-row gap-x-2 mb-4">
                                <View className="flex-1 bg-dark-100 rounded-xl p-3 items-center">
                                    <Text className="text-accent font-bold text-lg">
                                        {totalMovies.toLocaleString()}
                                    </Text>
                                    <Text className="text-light-300 text-xs mt-0.5">Total</Text>
                                </View>
                                <View className="flex-1 bg-dark-100 rounded-xl p-3 items-center">
                                    <Text className="text-accent font-bold text-lg">
                                        {totalPages}
                                    </Text>
                                    <Text className="text-light-300 text-xs mt-0.5">Pages</Text>
                                </View>
                                <View className="flex-1 bg-dark-100 rounded-xl p-3 items-center">
                                    <Text className="text-accent font-bold text-lg">
                                        {genres.length}
                                    </Text>
                                    <Text className="text-light-300 text-xs mt-0.5">Genres</Text>
                                </View>
                            </View>

                            {/* ── TV Shows preview row ─────── */}
                            <View className="mb-4">
                                <View className="flex-row items-center justify-between mb-2">
                                    <View className="flex-row items-center gap-x-2">
                                        <View className="w-1.5 h-5 rounded-full" style={{ backgroundColor: "#3B82F6" }} />
                                        <Text className="text-white font-bold text-base">📺 TV Shows</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => router.push("/uganda-tv")}
                                        className="bg-dark-100 px-3 py-1.5 rounded-full">
                                        <Text className="text-xs font-semibold" style={{ color: "#3B82F6" }}>See All</Text>
                                    </TouchableOpacity>
                                </View>
                                {tvLoading ? (
                                    <View className="flex-row items-center gap-x-2 py-3">
                                        <ActivityIndicator size="small" color="#3B82F6" />
                                        <Text className="text-light-300 text-xs">Loading TV shows…</Text>
                                    </View>
                                ) : tvShows.length > 0 ? (
                                    <FlatList
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        data={tvShows}
                                        renderItem={({ item }) => (
                                            <View className="mr-3">
                                                <UgandaTVCard show={item} compact />
                                            </View>
                                        )}
                                        keyExtractor={(item) => `tv_prev_${item.cbId}`}
                                    />
                                ) : (
                                    <TouchableOpacity onPress={() => router.push("/uganda-tv")}
                                        className="bg-dark-100 rounded-xl p-4 flex-row items-center gap-x-3">
                                        <Text className="text-3xl">📺</Text>
                                        <View className="flex-1">
                                            <Text className="text-white font-bold text-sm">Uganda VJ TV Series</Text>
                                            <Text className="text-light-300 text-xs mt-0.5">Browse Luganda-dubbed TV shows</Text>
                                        </View>
                                        <Image source={icons.arrow} className="size-4" tintColor="#3B82F6" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* ── Kulutimbe entry ───────────── */}
                            <TouchableOpacity
                                onPress={() => router.push("/kulutimbe")}
                                className="bg-dark-100 rounded-xl p-4 flex-row items-center gap-x-3 mb-4"
                                activeOpacity={0.8}
                            >
                                <View className="w-10 h-10 rounded-xl items-center justify-center"
                                    style={{ backgroundColor: "#221F3D" }}>
                                    <Text className="text-xl">🎬</Text>
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row items-center gap-x-2">
                                        <Text className="text-white font-bold text-sm">Kulutimbe</Text>
                                        <View className="flex-row overflow-hidden rounded-sm" style={{ width: 18, height: 10 }}>
                                            <View style={{ flex: 1, backgroundColor: "#000" }} />
                                            <View style={{ flex: 1, backgroundColor: "#FCDC04" }} />
                                            <View style={{ flex: 1, backgroundColor: "#DE3908" }} />
                                        </View>
                                    </View>
                                    <Text className="text-light-300 text-xs mt-0.5">
                                        22+ pages · VJ Junior, VJ Emmy &amp; more
                                    </Text>
                                </View>
                                <Image source={icons.arrow} className="size-4" tintColor="#FCDC04" />
                            </TouchableOpacity>

                            {/* ── Search ───────────────────── */}
                            <View className="flex-row items-center bg-dark-100 rounded-xl px-4 py-3 gap-x-3 mb-4">
                                <Image source={icons.search} className="size-4" tintColor="#A8B5DB" />
                                <TextInput
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholder="Search title, VJ, genre…"
                                    placeholderTextColor="#9CA4AB"
                                    className="flex-1 text-white text-sm"
                                    returnKeyType="search"
                                    autoCorrect={false}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                                        <Text className="text-accent text-xs font-semibold">Clear</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* ── Genre chips ──────────────── */}
                            {genres.length > 0 && (
                                <View className="mb-2">
                                    <Text className="text-light-200 text-xs font-semibold mb-2 uppercase tracking-wide">
                                        Filter by Genre
                                    </Text>
                                    <View className="flex-row flex-wrap">
                                        <Chip
                                            label="All"
                                            count={totalMovies}
                                            selected={selectedGenreId === null}
                                            onPress={() => setSelectedGenreId(null)}
                                        />
                                        {genres.slice(0, 18).map((g) => (
                                            <Chip
                                                key={g.id}
                                                label={g.name}
                                                count={g.count}
                                                selected={selectedGenreId === g.id}
                                                onPress={() =>
                                                    setSelectedGenreId(
                                                        selectedGenreId === g.id ? null : g.id
                                                    )
                                                }
                                            />
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* ── Results count ─────────────── */}
                            <View className="flex-row items-center justify-between mb-3 mt-1">
                                <Text className="text-white font-bold text-sm">
                                    {selectedGenreId
                                        ? genres.find((g) => g.id === selectedGenreId)?.name ?? "Movies"
                                        : "All Movies"}
                                </Text>
                                <View className="bg-dark-100 px-2 py-1 rounded-lg">
                                    <Text className="text-light-300 text-xs">
                                        {searchQuery ? `${displayed.length} of ` : ""}
                                        {movies.length} loaded
                                    </Text>
                                </View>
                            </View>
                        </>
                    }
                    ListFooterComponent={
                        loadingMore ? (
                            <View className="py-6 items-center">
                                <ActivityIndicator size="small" color="#AB8BFF" />
                                <Text className="text-light-300 text-xs mt-2">
                                    Loading more movies…
                                </Text>
                            </View>
                        ) : currentPage < totalPages && !searchQuery ? (
                            <TouchableOpacity
                                onPress={loadMore}
                                className="mx-auto mt-4 mb-2 bg-dark-100 px-8 py-3 rounded-xl"
                            >
                                <Text className="text-accent font-semibold text-sm">
                                    Load More Movies
                                </Text>
                            </TouchableOpacity>
                        ) : null
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <View className="items-center justify-center mt-12 px-8">
                                <Text className="text-5xl mb-4">🎬</Text>
                                <Text className="text-white font-bold text-lg text-center mb-2">
                                    No movies found
                                </Text>
                                <Text className="text-light-200 text-sm text-center leading-5">
                                    {searchQuery
                                        ? `Nothing matched "${searchQuery}". Try a different search.`
                                        : "No movies in this genre yet."}
                                </Text>
                            </View>
                        ) : null
                    }
                />

                {/* ── Source attribution ────────────────── */}
                <View
                    className="absolute bottom-0 left-0 right-0 px-4 py-3"
                    style={{ backgroundColor: "rgba(3,0,20,0.9)" }}
                >
                    <Text className="text-light-300 text-xs text-center">
                        🇺🇬 Powered by{" "}
                        <Text className="text-accent">CineBeta Uganda</Text>
                        {" · "}luganda.cinebeta.net
                    </Text>
                </View>
            </SafeAreaView>
        </View>
    );
};

export default UgandaScreen;
