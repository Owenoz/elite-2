import { useState, useEffect } from "react";
import {
    View, Text, ActivityIndicator, FlatList, Image,
    TouchableOpacity, StyleSheet, TextInput,
} from "react-native";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import { useRouter } from "expo-router";
import { getAvailableMovies, searchCatalogue, type EliteMovie } from "@/services/eliteApi";

const GOLD = "#D4AF37";
const BG   = "#09090F";
const CARD = "#1C1B2E";

// ── Movie card for search results ─────────────────────────────────────────────
const SearchMovieCard = ({ movie }: { movie: EliteMovie }) => {
    const router = useRouter();
    const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
        : "https://placehold.co/342x513/1C1B2E/D4AF37.png";

    return (
        <TouchableOpacity
            style={MC.card}
            activeOpacity={0.85}
            onPress={() => router.push(`/movies/${movie.tmdb_id}`)}
        >
            <View style={MC.posterWrap}>
                <Image source={{ uri: posterUrl }} style={MC.poster} resizeMode="cover" />
                <View style={MC.ratingBadge}>
                    <Text style={MC.ratingText}>⭐ {movie.vote_average?.toFixed(1)}</Text>
                </View>
            </View>
            <Text style={MC.title} numberOfLines={2}>{movie.title}</Text>
            <Text style={MC.year}>{movie.release_year}</Text>
        </TouchableOpacity>
    );
};

const MC = StyleSheet.create({
    card: { width: "30%", marginBottom: 4 },
    posterWrap: { position: "relative", borderRadius: 12, overflow: "hidden" },
    poster: { width: "100%", height: 160, borderRadius: 12 },
    ratingBadge: {
        position: "absolute", top: 6, left: 6,
        backgroundColor: "rgba(0,0,0,0.75)", paddingHorizontal: 6, paddingVertical: 2,
        borderRadius: 8, borderWidth: 1, borderColor: "rgba(212,175,55,0.3)",
    },
    ratingText: { color: GOLD, fontSize: 9, fontWeight: "700" },
    title: { color: "#E5E5E5", fontSize: 11, fontWeight: "600", marginTop: 6, lineHeight: 15 },
    year: { color: "#555", fontSize: 10, marginTop: 2 },
});

const Search = () => {
    const [searchQuery, setSearchQuery]   = useState("");
    const [results, setResults]           = useState<EliteMovie[]>([]);
    const [allMovies, setAllMovies]       = useState<EliteMovie[]>([]);
    const [loading, setLoading]           = useState(false);
    const [loadingAll, setLoadingAll]     = useState(true);

    // Load all movies on mount (shown when search is empty)
    useEffect(() => {
        getAvailableMovies(1, 100).then(data => {
            setAllMovies((data as EliteMovie[]) || []);
            setLoadingAll(false);
        }).catch(() => setLoadingAll(false));
    }, []);

    // Search your catalogue with debounce
    useEffect(() => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await searchCatalogue(searchQuery.trim());
                setResults((data as EliteMovie[]) || []);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 400);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const displayMovies = searchQuery.trim() ? results : allMovies;
    const isSearching   = searchQuery.trim().length > 0;

    return (
        <View style={S.root}>
            <Image source={images.bg} style={S.bgAbs} resizeMode="cover" />

            <FlatList
                data={displayMovies}
                keyExtractor={(item) => `s_${item.id}`}
                renderItem={({ item }) => <SearchMovieCard movie={item} />}
                numColumns={3}
                columnWrapperStyle={S.gridRow}
                contentContainerStyle={S.gridContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View>
                        {/* Header */}
                        <View style={S.header}>
                            <View style={S.titleRow}>
                                <View style={S.goldBar} />
                                <Text style={S.screenTitle}>
                                    {isSearching ? "Search Results" : "All Movies"}
                                </Text>
                            </View>
                            <Image source={icons.logo} style={S.logo} resizeMode="contain" />
                        </View>

                        {/* Search box */}
                        <View style={S.searchBox}>
                            <Image source={icons.search} style={S.searchIcon} tintColor={GOLD} />
                            <TextInput
                                style={S.searchInput}
                                placeholder="Search your movies..."
                                placeholderTextColor="#555"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                returnKeyType="search"
                                autoCorrect={false}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery("")}>
                                    <Text style={S.clearBtn}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Status */}
                        {(loading || loadingAll) && (
                            <View style={S.statusRow}>
                                <ActivityIndicator color={GOLD} size="small" />
                                <Text style={S.statusText}>
                                    {loadingAll ? "Loading movies..." : "Searching..."}
                                </Text>
                            </View>
                        )}

                        {isSearching && !loading && displayMovies.length > 0 && (
                            <View style={S.resultsHeader}>
                                <Text style={S.resultsTitle}>
                                    Results for <Text style={S.resultsQuery}>"{searchQuery}"</Text>
                                </Text>
                                <View style={S.countBadge}>
                                    <Text style={S.countText}>{displayMovies.length}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    !loading && !loadingAll ? (
                        <View style={S.emptyState}>
                            <Text style={S.emptyIcon}>
                                {isSearching ? "😕" : "🎬"}
                            </Text>
                            <Text style={S.emptyTitle}>
                                {isSearching ? "No movies found" : "No movies yet"}
                            </Text>
                            <Text style={S.emptySubtitle}>
                                {isSearching
                                    ? `No results for "${searchQuery}" in your catalogue`
                                    : "Movies added by the admin will appear here"}
                            </Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
};

const S = StyleSheet.create({
    root:          { flex: 1, backgroundColor: BG },
    bgAbs:         { position: "absolute", width: "100%", height: "100%", opacity: 0.12 },
    header:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
    titleRow:      { flexDirection: "row", alignItems: "center", gap: 8 },
    goldBar:       { width: 3, height: 22, backgroundColor: GOLD, borderRadius: 2 },
    screenTitle:   { color: "#fff", fontSize: 22, fontWeight: "800" },
    logo:          { width: 32, height: 32 },
    searchBox:     { flexDirection: "row", alignItems: "center", backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: "#2a2840", marginHorizontal: 20, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 12, gap: 10 },
    searchIcon:    { width: 18, height: 18 },
    searchInput:   { flex: 1, color: "#fff", fontSize: 15 },
    clearBtn:      { color: "#666", fontSize: 16, paddingLeft: 6 },
    statusRow:     { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, marginVertical: 10 },
    statusText:    { color: "#888", fontSize: 13 },
    resultsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 8 },
    resultsTitle:  { color: "#A8B5DB", fontSize: 14 },
    resultsQuery:  { color: "#fff", fontWeight: "700" },
    countBadge:    { backgroundColor: GOLD, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
    countText:     { color: "#000", fontSize: 11, fontWeight: "800" },
    gridRow:       { justifyContent: "flex-start", gap: 12, marginBottom: 14 },
    gridContent:   { paddingHorizontal: 20, paddingBottom: 100 },
    emptyState:    { alignItems: "center", paddingTop: 60, paddingHorizontal: 40 },
    emptyIcon:     { fontSize: 52, marginBottom: 16 },
    emptyTitle:    { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" },
    emptySubtitle: { color: "#666", fontSize: 14, textAlign: "center", lineHeight: 20 },
});

export default Search;
