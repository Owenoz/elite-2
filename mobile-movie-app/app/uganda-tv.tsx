import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    fetchTVShowsPage,
    getUgandaGenres,
    clearAllUgandaCache,
    type UgandaTVShow,
    type CineBetaGenre,
    type TVFetchResult,
} from "@/services/ugandaMovies";
import UgandaTVCard from "@/components/UgandaTVCard";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";

const Chip = ({
    label, count, selected, onPress,
}: { label: string; count?: number; selected: boolean; onPress: () => void }) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        className="mr-2 mb-2 flex-row items-center rounded-full px-3 py-1.5"
        style={{ backgroundColor: selected ? "#3B82F6" : "#221F3D" }}
    >
        <Text className="text-xs font-semibold" style={{ color: selected ? "#fff" : "#A8B5DB" }}>
            {label}
        </Text>
        {count !== undefined && (
            <Text className="text-xs ml-1" style={{ color: selected ? "rgba(255,255,255,0.7)" : "#6B7280" }}>
                {count}
            </Text>
        )}
    </TouchableOpacity>
);

const UgandaTVScreen = () => {
    const router = useRouter();

    const [shows, setShows] = useState<UgandaTVShow[]>([]);
    const [genres, setGenres] = useState<CineBetaGenre[]>([]);
    const [totalShows, setTotalShows] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [completedOnly, setCompletedOnly] = useState(false);

    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        getUgandaGenres()
            .then((g) => setGenres(g.filter((x) => x.count > 0).sort((a, b) => b.count - a.count)))
            .catch(() => {});
    }, []);

    const load = useCallback(
        async (page = 1, genreId: number | null = selectedGenreId, isRefresh = false) => {
            try {
                if (page === 1 && !isRefresh) setLoading(true);
                setError(null);
                const result: TVFetchResult = await fetchTVShowsPage({ page, perPage: 20, genreId });
                setShows((prev) => page === 1 ? result.shows : [...prev, ...result.shows]);
                setTotalShows(result.totalShows);
                setTotalPages(result.totalPages);
                setCurrentPage(page);
            } catch (e: any) {
                setError(e?.message ?? "Failed to load TV shows");
            } finally {
                setLoading(false);
                setRefreshing(false);
                setLoadingMore(false);
            }
        },
        [selectedGenreId]
    );

    useEffect(() => { load(1, selectedGenreId); }, [selectedGenreId]);

    const onRefresh = () => {
        clearAllUgandaCache();
        setRefreshing(true);
        load(1, selectedGenreId, true);
    };

    const loadMore = () => {
        if (loadingMore || currentPage >= totalPages) return;
        setLoadingMore(true);
        load(currentPage + 1, selectedGenreId);
    };

    const displayed = shows.filter((s) => {
        if (completedOnly && !s.completed) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            s.title.toLowerCase().includes(q) ||
            s.vjs.some((v) => v.toLowerCase().includes(q)) ||
            s.genres.some((g) => g.toLowerCase().includes(q)) ||
            s.networks.some((n) => n.toLowerCase().includes(q))
        );
    });

    if (loading && shows.length === 0) {
        return (
            <View className="flex-1 bg-primary items-center justify-center">
                <Image source={images.bg} className="absolute w-full h-full" resizeMode="cover" />
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-light-200 mt-3 text-sm text-center px-8">
                    Loading Uganda TV Shows…
                </Text>
                <Text className="text-light-300 text-xs mt-1 text-center px-12">
                    Fetching from CineBeta & enriching with TMDB posters
                </Text>
            </View>
        );
    }

    if (error && shows.length === 0) {
        return (
            <View className="flex-1 bg-primary items-center justify-center px-8">
                <Image source={images.bg} className="absolute w-full h-full" resizeMode="cover" />
                <Text className="text-4xl mb-4">📺</Text>
                <Text className="text-white font-bold text-lg text-center mb-2">Could not load TV shows</Text>
                <Text className="text-light-200 text-sm text-center mb-6 leading-5">{error}</Text>
                <TouchableOpacity onPress={() => load(1)} className="bg-blue-500 px-6 py-3 rounded-xl mb-3">
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
                    keyExtractor={(item) => `tv_${item.cbId}`}
                    contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
                    columnWrapperStyle={{ justifyContent: "flex-start", gap: 12, marginBottom: 16 }}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.4}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
                    }
                    renderItem={({ item }) => <UgandaTVCard show={item} />}
                    ListHeaderComponent={
                        <>
                            {/* Header */}
                            <View className="flex-row items-center gap-x-3 mt-4 mb-3">
                                <TouchableOpacity onPress={router.back} className="bg-dark-100 p-2 rounded-full">
                                    <Image
                                        source={icons.arrow} className="size-5"
                                        style={{ transform: [{ rotate: "180deg" }] }}
                                        tintColor="#fff"
                                    />
                                </TouchableOpacity>
                                <View className="flex-1">
                                    <Text className="text-white text-xl font-bold">📺 Uganda TV Shows</Text>
                                    <Text className="text-light-300 text-xs mt-0.5">
                                        Luganda translated series · CineBeta Uganda
                                    </Text>
                                </View>
                            </View>

                            {/* Stats */}
                            <View className="flex-row gap-x-2 mb-4">
                                {[
                                    { label: "Total", val: totalShows.toLocaleString() },
                                    { label: "Pages", val: totalPages.toString() },
                                    { label: "Genres", val: genres.length.toString() },
                                ].map((s) => (
                                    <View key={s.label} className="flex-1 bg-dark-100 rounded-xl p-3 items-center">
                                        <Text className="font-bold text-lg" style={{ color: "#3B82F6" }}>{s.val}</Text>
                                        <Text className="text-light-300 text-xs mt-0.5">{s.label}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Search */}
                            <View className="flex-row items-center bg-dark-100 rounded-xl px-4 py-3 gap-x-3 mb-3">
                                <Image source={icons.search} className="size-4" tintColor="#A8B5DB" />
                                <TextInput
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholder="Search title, VJ, genre, network…"
                                    placeholderTextColor="#9CA4AB"
                                    className="flex-1 text-white text-sm"
                                    returnKeyType="search"
                                    autoCorrect={false}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                                        <Text className="text-blue-400 text-xs font-semibold">Clear</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Completed toggle */}
                            <TouchableOpacity
                                onPress={() => setCompletedOnly(!completedOnly)}
                                className="flex-row items-center gap-x-2 mb-4 self-start"
                            >
                                <View
                                    className="w-4 h-4 rounded-full border-2"
                                    style={{
                                        backgroundColor: completedOnly ? "#22C55E" : "transparent",
                                        borderColor: completedOnly ? "#22C55E" : "#A8B5DB",
                                    }}
                                />
                                <Text className="text-light-200 text-xs font-medium">Completed series only</Text>
                            </TouchableOpacity>

                            {/* Genre chips */}
                            {genres.length > 0 && (
                                <View className="mb-3">
                                    <Text className="text-light-200 text-xs font-semibold mb-2 uppercase tracking-wide">
                                        Filter by Genre
                                    </Text>
                                    <View className="flex-row flex-wrap">
                                        <Chip label="All" count={totalShows} selected={selectedGenreId === null}
                                            onPress={() => setSelectedGenreId(null)} />
                                        {genres.slice(0, 18).map((g) => (
                                            <Chip key={g.id} label={g.name} count={g.count}
                                                selected={selectedGenreId === g.id}
                                                onPress={() => setSelectedGenreId(selectedGenreId === g.id ? null : g.id)} />
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Count */}
                            <View className="flex-row items-center justify-between mb-3">
                                <Text className="text-white font-bold text-sm">
                                    {selectedGenreId
                                        ? (genres.find((g) => g.id === selectedGenreId)?.name ?? "Shows")
                                        : "All Shows"}
                                </Text>
                                <View className="bg-dark-100 px-2 py-1 rounded-lg">
                                    <Text className="text-light-300 text-xs">
                                        {searchQuery ? `${displayed.length} of ` : ""}{shows.length} loaded
                                    </Text>
                                </View>
                            </View>
                        </>
                    }
                    ListFooterComponent={
                        loadingMore ? (
                            <View className="py-6 items-center">
                                <ActivityIndicator size="small" color="#3B82F6" />
                                <Text className="text-light-300 text-xs mt-2">Loading more…</Text>
                            </View>
                        ) : currentPage < totalPages && !searchQuery ? (
                            <TouchableOpacity
                                onPress={loadMore}
                                className="mx-auto mt-4 mb-2 bg-dark-100 px-8 py-3 rounded-xl"
                            >
                                <Text className="text-blue-400 font-semibold text-sm">Load More Shows</Text>
                            </TouchableOpacity>
                        ) : null
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <View className="items-center justify-center mt-12 px-8">
                                <Text className="text-5xl mb-4">📺</Text>
                                <Text className="text-white font-bold text-lg text-center mb-2">No shows found</Text>
                                <Text className="text-light-200 text-sm text-center leading-5">
                                    {searchQuery
                                        ? `Nothing matched "${searchQuery}".`
                                        : completedOnly
                                        ? "No completed series in this genre yet."
                                        : "No shows in this genre yet."}
                                </Text>
                            </View>
                        ) : null
                    }
                />

                {/* Attribution */}
                <View className="absolute bottom-0 left-0 right-0 px-4 py-3"
                    style={{ backgroundColor: "rgba(3,0,20,0.9)" }}>
                    <Text className="text-light-300 text-xs text-center">
                        📺 Powered by <Text style={{ color: "#3B82F6" }}>CineBeta Uganda</Text>
                        {" · "}luganda.cinebeta.net
                    </Text>
                </View>
            </SafeAreaView>
        </View>
    );
};

export default UgandaTVScreen;
